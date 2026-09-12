-- Auditoria de acciones sensibles (3.4 del spec): quien hizo que, sobre que
-- recurso, cuando. En aduanas suele ser requisito poder responder "quien
-- genero esta acta" o "quien borro este item" meses despues.
--
-- Solo mutaciones que importan de cara a una auditoria real (crear/eliminar
-- acta, generar el Excel, alta/cambio de usuarios) — no cada GET, eso es
-- ruido de trafico, no un rastro de auditoria.
-- usuario_id NO lleva FK a proposito: un registro de auditoria debe
-- sobrevivir aunque el usuario que hizo la accion se elimine despues (o la
-- empresa reorganice su plantilla), para no perder el rastro historico.
CREATE TABLE auditoria (
  id           BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  empresa_id   INT UNSIGNED NOT NULL,
  usuario_id   INT UNSIGNED NULL,
  accion       VARCHAR(64)  NOT NULL,
  recurso_tipo VARCHAR(32)  NOT NULL,
  recurso_id   INT UNSIGNED NULL,
  detalle      JSON NULL,
  creado_en    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_auditoria_empresa FOREIGN KEY (empresa_id) REFERENCES empresas(id),
  INDEX idx_auditoria_empresa_fecha (empresa_id, creado_en),
  INDEX idx_auditoria_recurso (recurso_tipo, recurso_id)
) ENGINE=InnoDB;
