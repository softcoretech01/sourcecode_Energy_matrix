CREATE DEFINER=`root`@`localhost` PROCEDURE `insert_eb_bill_detail`(
    IN p_eb_bill_header_id INT,
    IN p_customer_id INT,
    IN p_customer_service_id INT,
    IN p_self_generation_tax DECIMAL(12,2),
    IN p_created_by INT,
    IN p_modified_by INT
)
BEGIN
    INSERT INTO eb_bill_details(
        eb_bill_header_id,
        customer_id,
        customer_service_id,
        self_generation_tax,
        created_by,
        created_at,
        modified_by,
        modified_at
    ) VALUES (
        p_eb_bill_header_id,
        p_customer_id,
        p_customer_service_id,
        p_self_generation_tax,
        p_created_by,
        NOW(),
        p_modified_by,
        NOW()
    );

    SELECT LAST_INSERT_ID() AS inserted_id;
END