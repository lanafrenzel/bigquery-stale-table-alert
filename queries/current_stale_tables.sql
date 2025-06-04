CREATE OR REPLACE TABLE `{{PROJECT_ID}}.{{DATASET}}.current_stale_tables` AS

WITH stale_tables AS (
  SELECT 
    dataset_name, 
    table_id, 
    TIMESTAMP_MILLIS(last_modified_time) AS last_modified
  FROM (
    SELECT '{{DATASET_1}}' AS dataset_name, table_id, last_modified_time FROM `{{PROJECT_ID}}.{{DATASET_1}}.__TABLES__`
    UNION ALL
    SELECT '{{DATASET_2}}', table_id, last_modified_time FROM `{{PROJECT_ID}}.{{DATASET_2}}.__TABLES__`
    UNION ALL
    SELECT '{{DATASET_3}}', table_id, last_modified_time FROM `{{PROJECT_ID}}.{{DATASET_3}}.__TABLES__`
    -- Add more datasets as needed
  )
  WHERE TIMESTAMP_MILLIS(last_modified_time) < TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 2 DAY)
)

SELECT 
  CONCAT(dataset_name, '.', table_id) AS table_name,
  last_modified
FROM stale_tables;
