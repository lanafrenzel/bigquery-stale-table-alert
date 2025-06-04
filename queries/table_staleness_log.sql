INSERT INTO `{{PROJECT_ID}}.{{DATASET}}.table_staleness_logs` (
  log_time,
  table_name,
  last_modified
)

SELECT
  CURRENT_TIMESTAMP() AS log_time,
  table_name,
  last_modified
FROM `{{PROJECT_ID}}.{{DATASET}}.current_stale_tables`
WHERE table_name NOT IN (
  SELECT table_name
  FROM `{{PROJECT_ID}}.{{DATASET}}.table_staleness_logs`
)

UNION ALL

-- dummy for table creation (optional)
SELECT
  TIMESTAMP("2000-01-01") AS log_time,
  "__no_data__" AS table_name,
  TIMESTAMP("2000-01-01") AS last_modified
LIMIT 1;
