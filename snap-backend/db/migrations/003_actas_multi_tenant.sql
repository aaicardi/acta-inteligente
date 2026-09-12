-- Añade el aislamiento por empresa a las actas.
--
-- Las actas que ya existen no tienen empresa. El orden importa: primero la
-- columna nullable, luego el backfill contra una empresa por defecto, y solo
-- entonces el NOT NULL. Al reves la migracion falla en cualquier base con datos.

-- Empresa a la que se asignan las actas que ya existian. Si la tabla ya tiene
-- alguna empresa (base recien creada por otra via), no se crea una segunda:
-- el LEFT JOIN sobre una subconsulta agregada da exactamente cero o una fila.
INSERT INTO empresas (nombre, nit)
SELECT 'Empresa inicial', ''
FROM (SELECT COUNT(*) AS n FROM empresas) AS conteo
WHERE conteo.n = 0;

ALTER TABLE actas
  ADD COLUMN empresa_id INT UNSIGNED NULL AFTER id,
  ADD COLUMN creada_por INT UNSIGNED NULL AFTER empresa_id;

UPDATE actas
SET empresa_id = (SELECT MIN(id) FROM empresas)
WHERE empresa_id IS NULL;

ALTER TABLE actas
  MODIFY COLUMN empresa_id INT UNSIGNED NOT NULL;

ALTER TABLE actas
  ADD CONSTRAINT fk_actas_empresa FOREIGN KEY (empresa_id) REFERENCES empresas(id),
  ADD CONSTRAINT fk_actas_usuario FOREIGN KEY (creada_por) REFERENCES usuarios(id);

-- Sustituye a idx_actas_estado: toda consulta filtra ya por empresa, asi que
-- el indice util es el compuesto. `obtenerEnCurso` ademas filtra por usuario.
ALTER TABLE actas
  ADD INDEX idx_actas_empresa_estado (empresa_id, estado),
  ADD INDEX idx_actas_empresa_usuario (empresa_id, creada_por, estado);

ALTER TABLE actas
  DROP INDEX idx_actas_estado;
