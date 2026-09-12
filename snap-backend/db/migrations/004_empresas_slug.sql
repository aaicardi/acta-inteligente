-- Identificador estable para usar fuera de la base de datos (rutas de
-- Cloudinary, logs, soporte). El id autoincremental es un detalle interno de
-- MySQL: esto no cambia si algun dia se migra de motor o se restauran
-- backups con ids distintos. Se llama "slug" por la columna, pero el valor es
-- un UUID (ver empresasDb.crear): no intenta ser legible, la unicidad la
-- garantiza el propio UUID sin normalizar texto ni reintentar por colision.
-- El backfill con un valor temporal (005 lo reemplaza por UUIDs reales) es
-- solo para poder aplicar el NOT NULL + UNIQUE sin fallar sobre filas ya
-- existentes.
ALTER TABLE empresas
  ADD COLUMN slug VARCHAR(80) NULL AFTER nombre;

UPDATE empresas
SET slug = CONCAT('pendiente-', id)
WHERE slug IS NULL;

ALTER TABLE empresas
  MODIFY COLUMN slug VARCHAR(80) NOT NULL,
  ADD UNIQUE KEY uq_empresas_slug (slug);
