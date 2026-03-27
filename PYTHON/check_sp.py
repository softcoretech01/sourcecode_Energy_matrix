import pymysql

conn = pymysql.connect(host='localhost', user='root', password='bhava3017', database='windmill')
cursor = conn.cursor()

# 1. Fix GetConsumptionDropdownData SP — status='1' not "Active"
cursor.execute("DROP PROCEDURE IF EXISTS GetConsumptionDropdownData")
cursor.execute("""
CREATE PROCEDURE GetConsumptionDropdownData()
BEGIN
    SELECT DISTINCT mc.id AS customer_id, mc.customer_name
    FROM masters.master_customers mc
    JOIN masters.customer_service cs ON mc.id = cs.customer_id
    WHERE mc.is_submitted = 1 
      AND mc.status = '1'
      AND cs.status = '1'
    ORDER BY mc.customer_name;
END
""")

# 2. Create sp_save_consumption_request SP (upsert logic moved from Python inline SQL)
cursor.execute("DROP PROCEDURE IF EXISTS sp_save_consumption_request")
cursor.execute("""
CREATE PROCEDURE sp_save_consumption_request(
    IN p_customer_id INT,
    IN p_service_id INT,
    IN p_c1 DECIMAL(10,2),
    IN p_c2 DECIMAL(10,2),
    IN p_c4 DECIMAL(10,2),
    IN p_c5 DECIMAL(10,2),
    IN p_total DECIMAL(12,2),
    IN p_year INT,
    IN p_month SMALLINT,
    IN p_day SMALLINT,
    IN p_user_id INT
)
BEGIN
    DECLARE v_existing_id INT DEFAULT NULL;

    SELECT id INTO v_existing_id
    FROM windmill.customer_consumption_requests
    WHERE customer_id = p_customer_id
      AND service_id = p_service_id
      AND billing_year = p_year
      AND billing_month = p_month
    LIMIT 1;

    IF v_existing_id IS NOT NULL THEN
        UPDATE windmill.customer_consumption_requests
        SET c1 = p_c1,
            c2 = p_c2,
            c4 = p_c4,
            c5 = p_c5,
            total = p_total,
            billing_day = p_day,
            modified_by = p_user_id
        WHERE id = v_existing_id;
    ELSE
        INSERT INTO windmill.customer_consumption_requests
            (customer_id, service_id, c1, c2, c4, c5, total,
             billing_year, billing_month, billing_day, created_by)
        VALUES
            (p_customer_id, p_service_id, p_c1, p_c2, p_c4, p_c5, p_total,
             p_year, p_month, p_day, p_user_id);
    END IF;
END
""")

conn.commit()
cursor.close()
conn.close()
print("SPs created successfully.")

# Verify GetConsumptionDropdownData
conn2 = pymysql.connect(host='localhost', user='root', password='bhava3017', database='windmill')
cursor2 = conn2.cursor(pymysql.cursors.DictCursor)
cursor2.callproc("GetConsumptionDropdownData")
rows = cursor2.fetchall()
print(f"\nGetConsumptionDropdownData returns {len(rows)} rows:")
for r in rows:
    print(f"  {r}")
cursor2.close()
conn2.close()
