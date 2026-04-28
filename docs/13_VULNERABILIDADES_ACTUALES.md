# ITFlow - Vulnerabilidades actuales

**Fecha de revision:** 27 de abril de 2026
**Fuente:** `npm audit --json`

---

## Resumen

| Severidad | Cantidad |
| --- | --- |
| Critica | 0 |
| Alta | 0 |
| Moderada | 7 |
| Baja | 0 |

No se detectaron vulnerabilidades altas ni criticas al momento de la revision.

---

## Detalle por dependencia

| Dependencia | Severidad | Origen | Aviso |
| --- | --- | --- | --- |
| `postcss` `<8.5.10` | Moderada | Via `next` | `GHSA-qx2v-qp2m-jg93` |
| `esbuild` `<=0.24.2` | Moderada | Via `vite` | `GHSA-67mh-4wv8-2f99` |
| `vite` `<=6.4.1` | Moderada | Via `vitest` | `GHSA-4w7w-66w2-5vf9` |
| `vite-node` | Moderada | Via `vitest` | Hereda aviso de `vite` |
| `vitest` | Moderada | Directa devDependency | Hereda avisos de `vite`, `vite-node` y `@vitest/ui` |
| `@vitest/ui` | Moderada | Directa devDependency | Hereda aviso de `vitest` |
| `next` | Moderada | Directa dependency | Reportado por dependencia interna `postcss` |

---

## Lectura practica

- La mayor parte del riesgo esta en herramientas de desarrollo y pruebas: `vitest`, `vite`, `vite-node`, `@vitest/ui` y `esbuild`.
- El aviso de `postcss` aparece por la cadena de `next`; conviene tratarlo con mas cuidado porque `next` es dependencia de produccion.
- `npm audit` propone actualizaciones mayores para algunas herramientas. No aplicar `npm audit fix --force` sin validar la app.

---

## Validacion antes de actualizar

Si se actualizan dependencias, probar como minimo:

1. `npm install`
2. `npm run build`
3. `npm test`
4. Login de admin, supervisor y user.
5. Rutas protegidas por rol.
6. Evidencias y comentarios.
7. Alertas admin -> user.
8. Realtime en dashboards/listas.

---

## Recomendacion

Crear una rama separada para actualizar dependencias, aplicar cambios de forma controlada y revisar especialmente:

- compatibilidad de Next.js;
- compatibilidad de Vitest;
- build de produccion;
- comportamiento de APIs protegidas;
- rutas con Supabase Auth.
