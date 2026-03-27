USE masters;
DROP PROCEDURE IF EXISTS sp_add_customer_se;
DELIMITER $$
CREATE PROCEDURE `sp_add_customer_se`(
    IN p_customer_id INT,
    IN p_se_number VARCHAR(255),
    IN p_kva VARCHAR(255),
    IN p_edc_circle VARCHAR(255),
    IN p_status VARCHAR(50),
    IN p_remarks TEXT,
    IN p_is_submitted TINYINT,
    IN p_created_by VARCHAR(255),
    IN p_per_cost_unit DECIMAL(10,2)
)
BEGIN
    INSERT INTO customer_service
    (customer_id, service_number, kva_id, edc_circle_id, status, remarks,
     is_submitted, created_by, created_at, per_cost_unit)
    VALUES (p_customer_id, p_se_number, p_kva, p_edc_circle, p_status, p_remarks,
     p_is_submitted, p_created_by, NOW(), p_per_cost_unit);
END$$

DROP PROCEDURE IF EXISTS sp_update_customer_se$$
CREATE PROCEDURE `sp_update_customer_se`(
    IN p_customer_id INT,
    IN p_se_id INT,
    IN p_service_number VARCHAR(100),
    IN p_kva_id INT,
    IN p_edc_circle_id INT,
    IN p_status TINYINT,
    IN p_remarks TEXT,
    IN p_is_submitted TINYINT,
    IN p_modified_by INT,
    IN p_per_cost_unit DECIMAL(10,2)
)
BEGIN
    UPDATE customer_service
    SET service_number = p_service_number,
        kva_id = p_kva_id,
        edc_circle_id = p_edc_circle_id,
        status = p_status,
        remarks = p_remarks,
        is_submitted = p_is_submitted,
        modified_by = p_modified_by,
        modified_at = NOW(),
        per_cost_unit = p_per_cost_unit
    WHERE id = p_se_id AND customer_id = p_customer_id;
END$$
DELIMITER ;
