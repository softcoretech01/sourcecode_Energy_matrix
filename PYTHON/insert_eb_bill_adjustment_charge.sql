CREATE DEFINER=`root`@`localhost` PROCEDURE `insert_eb_bill_adjustment_charge`(
    IN p_eb_bill_header_id INT,
    IN p_energy_number VARCHAR(50),
    IN p_c001 DECIMAL(12,2),
    IN p_c002 DECIMAL(12,2),
    IN p_c003 DECIMAL(12,2),
    IN p_c004 DECIMAL(12,2),
    IN p_c005 DECIMAL(12,2),
    IN p_c006 DECIMAL(12,2),
    IN p_c007 DECIMAL(12,2),
    IN p_c008 DECIMAL(12,2),
    IN p_c010 DECIMAL(12,2),
    IN p_wheeling_charges DECIMAL(12,2),
    IN p_created_by INT,
    IN p_modified_by INT
)
BEGIN
    INSERT INTO eb_bill_adjustment_charges(
        eb_bill_header_id,
        energy_number,
        c001,
        c002,
        c003,
        c004,
        c005,
        c006,
        c007,
        c008,
        c010,
        wheeling_charges,
        created_by,
        created_at,
        modified_by,
        modified_at
    ) VALUES (
        p_eb_bill_header_id,
        p_energy_number,
        COALESCE(p_c001,0),
        COALESCE(p_c002,0),
        COALESCE(p_c003,0),
        COALESCE(p_c004,0),
        COALESCE(p_c005,0),
        COALESCE(p_c006,0),
        COALESCE(p_c007,0),
        COALESCE(p_c008,0),
        COALESCE(p_c010,0),
        COALESCE(p_wheeling_charges,0),
        p_created_by,
        NOW(),
        p_modified_by,
        NOW()
    );

    SELECT LAST_INSERT_ID() AS inserted_id;
END