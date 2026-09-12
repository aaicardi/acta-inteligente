-- Registro de cada llamada a un proveedor de IA, para poder ver cuanto
-- consume cada empresa y tarifar en el futuro (Fase 3, 3.1/3.2 del spec).
-- Solo registra: no bloquea ni limita a nadie todavia (decision de producto
-- pendiente, ver §2 del spec).
CREATE TABLE consumo_ia (
  id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  empresa_id    INT UNSIGNED NOT NULL,
  item_id       INT UNSIGNED NULL,
  proveedor     VARCHAR(32)  NOT NULL,
  modelo        VARCHAR(64)  NOT NULL,
  tokens_in     INT UNSIGNED NOT NULL DEFAULT 0,
  tokens_out    INT UNSIGNED NOT NULL DEFAULT 0,
  num_fotos     SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  exito         BOOLEAN NOT NULL DEFAULT TRUE,
  creado_en     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_consumo_ia_empresa FOREIGN KEY (empresa_id) REFERENCES empresas(id),
  INDEX idx_consumo_empresa_fecha (empresa_id, creado_en)
) ENGINE=InnoDB;
