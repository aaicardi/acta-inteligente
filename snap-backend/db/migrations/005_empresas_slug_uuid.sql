-- 004 dejo un valor temporal ("pendiente-{id}") en las filas que ya existian,
-- solo para poder aplicar NOT NULL + UNIQUE sin fallar. Aqui se reemplaza por
-- UUIDs reales, coherente con lo que genera empresasDb.crear() para las
-- empresas nuevas desde ahora.
UPDATE empresas
SET slug = UUID()
WHERE slug LIKE 'pendiente-%';
