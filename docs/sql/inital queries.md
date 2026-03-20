SELECT
  c.relname AS table_name,
  pg_size_pretty(pg_total_relation_size(c.oid)) AS total_size,
  s.n_live_tup AS estimated_rows,
  c.relrowsecurity AS rls_enabled
FROM pg_class c
LEFT JOIN pg_stat_user_tables s ON c.relname = s.relname
WHERE c.relkind = 'r'
AND c.relnamespace = 'public'::regnamespace
ORDER BY c.relname;

table_name     | total_size | estimated_rows | rls_enabled
---------------|------------|----------------|------------
collections    | 24 kB      | 5              | true
exercises      | 32 kB      | 38             | true
gym_app_state  | 16 kB      | 1              | true

