-- Indices de apoyo basados en el plan de ejecucion real (EXPLAIN), no en
-- suposicion: ver tarea 2.8 del spec.
--
-- 1. obtenerUltimaGenerada() filtra por (empresa_id, estado) —ya cubierto por
--    idx_actas_empresa_estado— pero ordena por generada_en DESC, que ese
--    indice no cubre: EXPLAIN mostraba "Using filesort". Con pocas filas no
--    se nota, pero es el patron que degrada con el catalogo de actas ya
--    generadas de una empresa activa.
ALTER TABLE actas
  ADD INDEX idx_actas_empresa_estado_generada (empresa_id, estado, generada_en);

-- 2. listar() sin busqueda de texto (el caso mas comun: abrir el historico)
--    filtra por empresa_id y ordena por creada_en DESC. EXPLAIN mostraba que
--    ni siquiera usaba idx_actas_empresa_estado para esto —MySQL prefería un
--    escaneo completo por PRIMARY con filesort—, porque ningun indice cubria
--    el ORDER BY junto al filtro.
ALTER TABLE actas
  ADD INDEX idx_actas_empresa_creada (empresa_id, creada_en);

-- El LIKE '%texto%' de la busqueda (do_no/cliente) sigue sin poder usar
-- indice por diseño (comodin al inicio) — eso no lo resuelve un indice B-tree
-- normal. Ya estaba senalado en el spec (H4) como aceptable mientras el
-- volumen de actas por empresa sea bajo; full-text o un motor de busqueda
-- aparte es la solucion cuando deje de serlo, no un indice mas aqui.
