-- Limpieza periódica de FormSubmissionLog (anti-spam) vía pg_cron.
-- Borra filas con más de 96h cada 4 días (la ventana de rate limit es 1h,
-- así que cualquier fila vieja ya es inútil).
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- cron.schedule por nombre es idempotente (reemplaza si ya existe).
SELECT cron.schedule(
    'cleanup_form_submission_log',
    '0 3 */4 * *',
    $$DELETE FROM "FormSubmissionLog" WHERE "createdAt" < now() - interval '96 hours'$$
);
