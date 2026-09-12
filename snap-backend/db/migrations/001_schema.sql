CREATE TABLE actas (
  id                    INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  estado                ENUM('en_curso','generada') NOT NULL DEFAULT 'en_curso',
  do_no                 VARCHAR(64)  NOT NULL DEFAULT '',
  cliente               VARCHAR(255) NOT NULL DEFAULT '',
  documento_transporte  VARCHAR(128) NOT NULL DEFAULT '',
  deposito              VARCHAR(255) NOT NULL DEFAULT '',
  ciudad                VARCHAR(128) NOT NULL DEFAULT '',
  fecha                 DATE NULL,
  hora_inicio           VARCHAR(16)  NOT NULL DEFAULT '',
  hora_fin              VARCHAR(16)  NOT NULL DEFAULT '',
  bultos                VARCHAR(32)  NOT NULL DEFAULT '',
  peso                  VARCHAR(32)  NOT NULL DEFAULT '',
  observaciones         TEXT NULL,
  nombre_archivo        VARCHAR(255) NULL,
  creada_en             DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizada_en        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  generada_en           DATETIME NULL,
  INDEX idx_actas_estado (estado),
  INDEX idx_actas_creada_en (creada_en)
) ENGINE=InnoDB;

CREATE TABLE items (
  id                 INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  acta_id            INT UNSIGNED NOT NULL,
  orden              INT NOT NULL,
  referencia         VARCHAR(255) NOT NULL DEFAULT '',
  modelo             VARCHAR(255) NOT NULL DEFAULT '',
  serial             VARCHAR(255) NOT NULL DEFAULT '',
  pais_origen        VARCHAR(128) NOT NULL DEFAULT '',
  descripcion        TEXT NULL,
  marca              VARCHAR(255) NOT NULL DEFAULT '',
  datos_adicionales  JSON NULL,
  cantidad           INT NULL,
  confianza          DECIMAL(4,3) NULL,
  motivo_revision    VARCHAR(255) NULL,
  estado             ENUM('analizando','listo','revisar','en_cola') NOT NULL DEFAULT 'analizando',
  creado_en          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_items_acta FOREIGN KEY (acta_id) REFERENCES actas(id) ON DELETE CASCADE,
  UNIQUE KEY uq_items_acta_orden (acta_id, orden),
  INDEX idx_items_acta (acta_id)
) ENGINE=InnoDB;

CREATE TABLE fotos (
  id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  item_id    INT UNSIGNED NOT NULL,
  url        VARCHAR(500) NOT NULL,
  public_id  VARCHAR(255) NOT NULL,
  orden      SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  creada_en  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_fotos_item FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE,
  INDEX idx_fotos_item (item_id)
) ENGINE=InnoDB;
