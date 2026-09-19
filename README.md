# acta-inteligente
proyecto de inventario

## Levantar el entorno local por primera vez

```bash
docker compose up -d mysql
cd snap-backend && npm run migrate
```

`db/init` (montado en el contenedor MySQL) solo trae el esquema base
pre-multitenant; `npm run migrate` aplica el resto (`db/migrations/*.sql`:
empresas, usuarios, `empresa_id`, auditoría, consumo de IA). El runner
detecta que el esquema base ya existe y sigue desde ahí, así que es seguro
correrlo aunque el contenedor lleve rato levantado.

Ver `DESPLIEGUE.md` para redesplegar con Docker tras modificar código.
