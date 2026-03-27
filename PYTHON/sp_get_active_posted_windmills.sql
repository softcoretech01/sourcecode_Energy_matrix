DROP PROCEDURE IF EXISTS sp_get_active_posted_windmills_for_allotment;

CREATE PROCEDURE sp_get_active_posted_windmills_for_allotment()
BEGIN
    SELECT windmill_number
    FROM master_windmill
    WHERE type IN ('Windmill', 'Solar')
      AND (status = 'Active' OR status = '1')
      AND (is_submitted = 1 OR is_submitted = '1')
    ORDER BY windmill_number;
END;
