CREATE TABLE empresas (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nombre      VARCHAR(255) NOT NULL,
  nit         VARCHAR(64)  NOT NULL DEFAULT '',
  estado      ENUM('activa','suspendida') NOT NULL DEFAULT 'activa',
  creada_en   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_empresas_estado (estado)
) ENGINE=InnoDB;

CREATE TABLE usuarios (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  empresa_id    INT UNSIGNED NOT NULL,
  email         VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  nombre        VARCHAR(255) NOT NULL DEFAULT '',
  rol           ENUM('admin','inspector') NOT NULL DEFAULT 'inspector',
  estado        ENUM('activo','inactivo') NOT NULL DEFAULT 'activo',
  creado_en     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_usuarios_empresa FOREIGN KEY (empresa_id) REFERENCES empresas(id),
  UNIQUE KEY uq_usuarios_email (email),
  INDEX idx_usuarios_empresa (empresa_id)
) ENGINE=InnoDB;
