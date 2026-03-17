from app.utils.auth_utils import get_current_user
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from app.database import get_connection
import pymysql
import os
from uuid import uuid4
from app.schemas.windmill_schema import WindmillCreate, WindmillResponse, WindmillMessage
from app.utils.validation import validate_windmill

router = APIRouter(
    prefix="/windmills",
    tags=["Windmills"]
)

UPLOAD_DIR = "uploads/windmills"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Ensure the windmill table has an AE Name column (used by the UI as 'AE Name').
# If the column currently exists as `am_name`, rename it to `ae_name`.
try:
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("SHOW COLUMNS FROM master_windmill LIKE 'ae_name'")
    has_ae_name = cursor.rowcount > 0
    cursor.execute("SHOW COLUMNS FROM master_windmill LIKE 'am_name'")
    has_am_name = cursor.rowcount > 0

    # If only am_name exists, rename it to ae_name.
    if has_am_name and not has_ae_name:
        cursor.execute("ALTER TABLE master_windmill CHANGE COLUMN am_name ae_name VARCHAR(100) NULL")
        conn.commit()
        has_ae_name = True
        has_am_name = False

    # If both exist, migrate any data from am_name into ae_name (when empty), then drop am_name.
    if has_am_name and has_ae_name:
        cursor.execute(
            "UPDATE master_windmill SET ae_name = am_name "
            "WHERE (ae_name IS NULL OR ae_name = '') AND (am_name IS NOT NULL AND am_name <> '')"
        )
        conn.commit()
        cursor.execute("ALTER TABLE master_windmill DROP COLUMN am_name")
        conn.commit()
        has_am_name = False

    # Ensure ae_name exists even if neither column did.
    if not has_ae_name:
        cursor.execute("ALTER TABLE master_windmill ADD COLUMN ae_name VARCHAR(100) NULL")
        conn.commit()

    # Ensure contact_number exists (added later in the UI/DTOs)
    cursor.execute("SHOW COLUMNS FROM master_windmill LIKE 'contact_number'")
    has_contact_number = cursor.rowcount > 0
    if not has_contact_number:
        cursor.execute("ALTER TABLE master_windmill ADD COLUMN contact_number VARCHAR(20) NULL")
        conn.commit()

    cursor.close()
    conn.close()
except Exception:
    # If this fails (e.g., insufficient permissions), we silently continue.
    pass

# -------------------------------------------------------
# CREATE WINDMILL
# -------------------------------------------------------
@router.post("/", response_model=WindmillMessage)
async def create_windmill(data: WindmillCreate, user: dict = Depends(get_current_user)):
    try:
        conn = get_connection()
        cursor = conn.cursor(pymysql.cursors.DictCursor)

        # 🔹 fetch transmission loss from transmission_loss_master using kva_id
        cursor.execute(
            "SELECT loss_percentage FROM transmission_loss_master WHERE id=%s",
            (data.kva_id,)
        )
        kva_row = cursor.fetchone()

        if not kva_row:
            raise HTTPException(status_code=400, detail="Invalid KVA ID")

        transmission_loss = kva_row["loss_percentage"]

        # NOTE: Stored procedures (sp_add_windmill) do not exist in this database.
        # Use direct INSERT to master_windmill instead.
        # Support legacy payloads that still send `am_name` by treating it as `ae_name`.
        ae_name_value = data.ae_name or getattr(data, "am_name", None)

        # Guard against empty strings for numeric DB fields (MySQL rejects "" for INT/BIGINT).
        insurance_phone_value = (
            data.insurance_person_phone
            if data.insurance_person_phone not in (None, "")
            else None
        )

        # Provide compatibility for both old and new payload property names.
        database_portal_url = data.portal_url or getattr(data, "open_access_portal", None)
        database_portal_username = data.username or getattr(data, "portal_username", None)
        database_portal_password = data.password or getattr(data, "portal_password", None)

        database_insurance_name = data.insurance_person_name or getattr(data, "insurance_company_name", None)
        database_insurance_phone = data.insurance_person_phone or getattr(data, "insurance_company_number", None)

        cursor.execute(
            """
            INSERT INTO master_windmill (
                type, windmill_number, windmill_name, status,
                kva_id, transmission_loss, capacity_mw_id, edc_circle_id,
                ae_name, ae_number, operator_name, operator_number, contact_number,
                amc_type, amc_head, amc_head_contact, amc_from_date, amc_to_date,
                insurance_policy_number, insurance_company_name, insurance_company_number,
                insurance_from_date, insurance_to_date,
                minimum_level_generation, units_expiring,
                open_access_portal, portal_username, portal_password,
                is_submitted, created_by, created_at
            ) VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,NOW())
            """,
            (
                data.type or "Windmill",
                data.windmill_number,
                data.windmill_name,
                data.status or "Active",
                data.kva_id,
                transmission_loss,
                data.capacity_id,
                data.edc_circle_id,
                ae_name_value,
                data.ae_number,
                data.operator_name,
                data.operator_number,
                data.contact_number,
                data.amc_type,
                data.amc_head,
                data.amc_head_contact,
                data.amc_from_date,
                data.amc_to_date,
                data.insurance_policy_number,
                database_insurance_name,
                database_insurance_phone,
                data.insurance_from_date,
                data.insurance_to_date,
                data.minimum_level_generation,
                data.units_expiring,
                database_portal_url,
                database_portal_username,
                database_portal_password,
                data.is_submitted,
                user["id"],
            )
        )

        conn.commit()
        # get the id of the row we just inserted so the front end can upload
        # documents immediately if needed.
        cursor.execute("SELECT LAST_INSERT_ID() AS id")
        new_id = cursor.fetchone().get("id")
        return {"message": "Windmill created successfully", "id": new_id}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()
        conn.close()

# -------------------------------------------------------
# GET ALL WINDMILLS
# -------------------------------------------------------
@router.get("/")
async def get_windmills(user: dict = Depends(get_current_user)):
    try:
        conn = get_connection()
        cursor = conn.cursor(pymysql.cursors.DictCursor)

        # Include the EDC circle name and capacity value so the frontend can display Region and capacity properly.
        # Filter by type = 'windmill' to show only windmill type records
        cursor.execute(
            "SELECT m.*, c.edc_circle AS edc_name, p.capacity AS windmill_capacity "
            "FROM master_windmill m "
            "LEFT JOIN master_edc_circle c ON m.edc_circle_id = c.id "
            "LEFT JOIN master_capacity p ON m.capacity_mw_id = p.id "
            "WHERE m.type = 'windmill'"
        )
        return cursor.fetchall()

    finally:
        cursor.close()
        conn.close()


# -------------------------------------------------------
# GET WINDMILL BY ID
# -------------------------------------------------------
@router.get("/{windmill_id}")
async def get_windmill(windmill_id: int, user: dict = Depends(get_current_user)):
    try:
        conn = get_connection()
        cursor = conn.cursor(pymysql.cursors.DictCursor)

        cursor.execute(
            "SELECT m.*, p.capacity AS windmill_capacity "
            "FROM master_windmill m "
            "LEFT JOIN master_capacity p ON m.capacity_mw_id = p.id "
            "WHERE m.id=%s",
            (windmill_id,)
        )
        row = cursor.fetchone()

        if not row:
            raise HTTPException(status_code=404, detail="Windmill not found")

        return row

    finally:
        cursor.close()
        conn.close()


# -------------------------------------------------------
# UPDATE WINDMILL
# -------------------------------------------------------
@router.put("/{windmill_id}")
async def update_windmill(windmill_id: int, data: WindmillCreate, user: dict = Depends(get_current_user)):
    try:
        conn = get_connection()
        cursor = conn.cursor(pymysql.cursors.DictCursor)

        validate_windmill(cursor, windmill_id)

        # Load existing row so that omitted optional fields (like AMC/insurance)
        # are preserved instead of being overwritten with NULL on update.
        cursor.execute("SELECT * FROM master_windmill WHERE id=%s", (windmill_id,))
        existing = cursor.fetchone()
        if not existing:
            raise HTTPException(status_code=404, detail="Windmill not found")
        cursor.execute(
            "SELECT loss_percentage FROM transmission_loss_master WHERE id=%s",
            (data.kva_id,)
        )
        kva_row = cursor.fetchone()

        if not kva_row:
            raise HTTPException(status_code=400, detail="Invalid KVA ID")

        transmission_loss = kva_row["loss_percentage"]

        # Support legacy payloads that still send `am_name` by treating it as `ae_name`.
        ae_name_value = data.ae_name or getattr(data, "am_name", None) or existing.get("ae_name")

        # For optional AMC / insurance fields, keep the previous DB value when the
        # request omits them (so partial updates don't clear data).
        amc_type = data.amc_type if data.amc_type is not None else existing.get("amc_type")
        amc_head = data.amc_head if data.amc_head is not None else existing.get("amc_head")
        amc_head_contact = (
            data.amc_head_contact
            if data.amc_head_contact is not None
            else existing.get("amc_head_contact")
        )
        amc_from_date = data.amc_from_date if data.amc_from_date is not None else existing.get("amc_from_date")
        amc_to_date = data.amc_to_date if data.amc_to_date is not None else existing.get("amc_to_date")

        insurance_policy_number = (
            data.insurance_policy_number
            if data.insurance_policy_number is not None
            else existing.get("insurance_policy_number")
        )
        insurance_person_name = (
            data.insurance_person_name
            if data.insurance_person_name is not None
            else existing.get("insurance_company_name")
        )

        # Backward compatibility: support old dropped field names from frontend
        if not insurance_person_name:
            insurance_person_name = (
                data.insurance_company_name
                if getattr(data, "insurance_company_name", None) is not None
                else existing.get("insurance_company_name")
            )

        insurance_phone_raw = (
            data.insurance_person_phone
            if data.insurance_person_phone is not None
            else existing.get("insurance_company_number")
        )
        if not insurance_phone_raw:
            insurance_phone_raw = (
                data.insurance_company_number
                if getattr(data, "insurance_company_number", None) is not None
                else existing.get("insurance_company_number")
            )

        insurance_phone_value = insurance_phone_raw if insurance_phone_raw not in ("", None) else None
        insurance_from_date = (
            data.insurance_from_date
            if data.insurance_from_date is not None
            else existing.get("insurance_from_date")
        )
        insurance_to_date = (
            data.insurance_to_date
            if data.insurance_to_date is not None
            else existing.get("insurance_to_date")
        )

        database_portal_url = data.portal_url or getattr(data, "open_access_portal", None)
        database_portal_username = data.username or getattr(data, "portal_username", None)
        database_portal_password = data.password or getattr(data, "portal_password", None)

        cursor.execute(
            """
            UPDATE master_windmill SET
                type=%s,
                windmill_number=%s,
                windmill_name=%s,
                status=%s,
                kva_id=%s,
                transmission_loss=%s,
                capacity_mw_id=%s,
                edc_circle_id=%s,
                ae_name=%s,
                ae_number=%s,
                operator_name=%s,
                operator_number=%s,
                contact_number=%s,
                amc_type=%s,
                amc_head=%s,
                amc_head_contact=%s,
                amc_from_date=%s,
                amc_to_date=%s,
                insurance_policy_number=%s,
                insurance_company_name=%s,
                insurance_company_number=%s,
                insurance_from_date=%s,
                insurance_to_date=%s,
                minimum_level_generation=%s,
                units_expiring=%s,
                open_access_portal=%s,
                portal_username=%s,
                portal_password=%s,
                is_submitted=%s,
                modified_by=%s,
                modified_at=NOW()
            WHERE id=%s
            """,
            (
                data.type or "Windmill",
                data.windmill_number,
                data.windmill_name,
                data.status or "Active",
                data.kva_id,
                transmission_loss,
                data.capacity_id,
                data.edc_circle_id,
                ae_name_value,
                data.ae_number,
                data.operator_name,
                data.operator_number,
                data.contact_number,
                amc_type,
                amc_head,
                amc_head_contact,
                amc_from_date,
                amc_to_date,
                insurance_policy_number,
                insurance_person_name,
                insurance_phone_value,
                insurance_from_date,
                insurance_to_date,
                data.minimum_level_generation,
                data.units_expiring,
                database_portal_url,
                database_portal_username,
                database_portal_password,
                data.is_submitted,
                user["id"],
                windmill_id,
            ),
        )

        conn.commit()

        return {"message": "Windmill updated successfully"}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()
        conn.close()


# -------------------------------------------------------
# DELETE WINDMILL
# -------------------------------------------------------
@router.delete("/{windmill_id}")
async def delete_windmill(windmill_id: int, user: dict = Depends(get_current_user)):
    try:
        conn = get_connection()
        cursor = conn.cursor(pymysql.cursors.DictCursor)

        validate_windmill(cursor, windmill_id)

        cursor.execute("DELETE FROM master_windmill WHERE id=%s", (windmill_id,))
        conn.commit()

        return {"message": "Windmill deleted successfully"}

    finally:
        cursor.close()
        conn.close()


# -------------------------------------------------------
# UPLOAD WINDMILL DOCUMENTS
# -------------------------------------------------------
@router.get("/{windmill_id}/uploads")
async def get_windmill_uploads(windmill_id: int, user: dict = Depends(get_current_user)):
    try:
        conn = get_connection()
        cursor = conn.cursor(pymysql.cursors.DictCursor)

        validate_windmill(cursor, windmill_id)

        cursor.execute(
            "SELECT id, document_type, file_path, created_at FROM master_windmill_upload_docs WHERE windmill_id=%s",
            (windmill_id,)
        )
        rows = list(cursor.fetchall() or [])

        # Ensure we return the latest upload per document type (avoid stale/older files showing).
        rows.sort(key=lambda r: r.get("created_at") or "", reverse=True)
        latest_by_type: dict[str, dict] = {}
        for row in rows:
            doc_type = row.get("document_type")
            if doc_type and doc_type not in latest_by_type:
                latest_by_type[doc_type] = row

        # Provide a friendly file name so the front end can show the original uploaded file name
        def _friendly_file_name(path: str | None) -> str | None:
            if not path:
                return None
            base = os.path.basename(path)
            # If we stored files using a UUID prefix (e.g. <uuid>_original-name.pdf), show the original name.
            if "_" in base:
                prefix, rest = base.split("_", 1)
                if len(prefix) == 32 and all(c in "0123456789abcdef" for c in prefix.lower()):
                    return rest
            return base

        return [
            {**row, "file_name": _friendly_file_name(row.get("file_path"))}
            for row in latest_by_type.values()
        ]

    finally:
        cursor.close()
        conn.close()


@router.post("/{windmill_id}/uploads")
async def upload_windmill_docs(
    windmill_id: int,
    user: dict = Depends(get_current_user),
    commision_certificate_upload: UploadFile | None = File(None),
    name_transfer_document_upload: UploadFile | None = File(None),
    ppa_upload: UploadFile | None = File(None),
    wheeling_agreement_upload: UploadFile | None = File(None),
    amc_document_upload: UploadFile | None = File(None),
    insurance_policy_upload: UploadFile | None = File(None),
):
    try:
        conn = get_connection()
        cursor = conn.cursor()

        validate_windmill(cursor, windmill_id)

        # Prevent uploading docs after posting.
        cursor.execute("SELECT is_submitted FROM master_windmill WHERE id=%s", (windmill_id,))
        current = cursor.fetchone()
        if current and current[0] == 1:
            raise HTTPException(status_code=403, detail="Cannot upload documents for a posted windmill")

        async def save_file(file: UploadFile | None):
            if file is None:
                return None, None

            # Keep the original filename to display it later, but still avoid collisions by prepending a UUID.
            # Example stored filename: "<uuid>_my-document.pdf"
            safe_name = os.path.basename(file.filename)
            unique_name = f"{uuid4().hex}_{safe_name}"
            path = os.path.join(UPLOAD_DIR, unique_name)
            db_path = path.replace("\\", "/")  # normalize for URLs

            content = await file.read()
            with open(path, "wb") as buffer:
                buffer.write(content)

            return file.filename, db_path

        cc_name, cc_path = await save_file(commision_certificate_upload)
        nt_name, nt_path = await save_file(name_transfer_document_upload)
        ppa_name, ppa_path = await save_file(ppa_upload)
        wa_name, wa_path = await save_file(wheeling_agreement_upload)
        amc_name, amc_path = await save_file(amc_document_upload)
        ins_name, ins_path = await save_file(insurance_policy_upload)

        def add_db_upload(doc_type, path):
            if path:
                cursor.execute(
                    "INSERT INTO master_windmill_upload_docs (windmill_id, document_type, file_path, created_by, created_at) VALUES (%s,%s,%s,%s,NOW())",
                    (windmill_id, doc_type, path, user["id"])
                )
        add_db_upload("COMMISSION_CERTIFICATE", cc_path)
        add_db_upload("NAME_TRANSFER_DOCUMENT", nt_path)
        add_db_upload("PPA", ppa_path)
        add_db_upload("WHEELING_AGREEMENT", wa_path)
        add_db_upload("AMC_DOCUMENT", amc_path)
        add_db_upload("INSURANCE_POLICY", ins_path)

        conn.commit()
        return {"message": "Windmill documents uploaded successfully"}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()
        conn.close()
