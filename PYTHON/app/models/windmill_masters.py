from sqlalchemy import Column, Integer, String, Date, Float, DateTime, ForeignKey, Text, func, SmallInteger, BigInteger, DECIMAL, Enum
from sqlalchemy.orm import relationship
from app.database import BaseMasters as Base

# =====================================================
# 🔵 WINDMILL MASTER TABLE (master_windmill)
# =====================================================
class Windmill(Base):
    __tablename__ = "master_windmill"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    type = Column(String(50)) # enum('Windmill', 'Solar', ...)
    windmill_number = Column(String(50))
    windmill_name = Column(String(100))
    status = Column(String(50)) # enum('Active', 'Inactive', ...)
    kva_id = Column(Integer)
    transmission_loss = Column(DECIMAL(5,2))
    capacity_mw_id = Column(Integer)
    edc_circle_id = Column(Integer)
    ae_name = Column(String(100))
    ae_number = Column(String(20))
    operator_name = Column(String(100))
    operator_number = Column(String(20))
    amc_type = Column(String(50)) # enum('Comprehensive', 'Non-Comprehensive')
    amc_head = Column(String(100))
    amc_head_contact = Column(String(20))
    amc_from_date = Column(Date)
    amc_to_date = Column(Date)
    insurance_policy_number = Column(String(100))
    insurance_company_name = Column(String(100))
    insurance_company_number = Column(BigInteger)
    insurance_from_date = Column(Date)
    insurance_to_date = Column(Date)
    minimum_level_generation = Column(DECIMAL(12,2))
    units_expiring = Column(String(50)) # enum('Monthly', 'Yearly', ...)
    open_access_portal = Column(String(250))
    portal_username = Column(String(50))
    portal_password = Column(String(100))
    
    created_by = Column(Integer)
    created_at = Column(DateTime)
    modified_by = Column(Integer)
    modified_at = Column(DateTime)
    is_submitted = Column(SmallInteger)

    @staticmethod
    def get_active_posted_windmills(cursor):
        """
        Fetches windmill numbers from the master table that are 'Windmill' or 'Solar',
        status is 'Active' or '1', and is_submitted (posted).
        """
        # Inline SQL query in the model file as requested by the user.
        sql = "CALL sp_get_active_posted_windmills_for_allotment()"
        cursor.execute(sql)
        return cursor.fetchall()


# =====================================================
# 🔵 WINDMILL UPLOADS TABLE (master_windmill_upload_docs)
# =====================================================
class WindmillUploadDocs(Base):
    __tablename__ = "master_windmill_upload_docs"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    windmill_id = Column(Integer)
    document_type = Column(String(100)) # enum
    file_path = Column(String(255))
    
    created_by = Column(Integer)
    created_at = Column(DateTime)
    modified_by = Column(Integer)
    modified_at = Column(DateTime)
    is_submitted = Column(SmallInteger)