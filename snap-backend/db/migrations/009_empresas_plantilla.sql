-- Plantilla de acta personalizada por empresa (3.5 del spec). NULL usa la
-- plantilla por defecto (templates/ACTA_compras_.xlsx). Se guarda el
-- public_id de Cloudinary (type raw: no es una imagen), no el archivo en
-- disco — Render no tiene almacenamiento persistente entre despliegues.
ALTER TABLE empresas
  ADD COLUMN plantilla_public_id VARCHAR(255) NULL AFTER slug;
