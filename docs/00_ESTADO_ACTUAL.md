# ITFlow - Estado actual del proyecto

**Fecha de revision:** 27 de abril de 2026
**Version de la app:** `1.4.1`
**Fuente principal:** codigo actual en `src/`, `package.json` y auditoria `npm audit`

---

## Resumen

ITFlow es una aplicacion web para organizar, asignar y dar seguimiento a tareas de equipos de TI. Hoy opera con tres roles activos: **admin**, **supervisor** y **user**.

La app usa **Next.js con Pages Router**, **JavaScript**, **Supabase**, **CSS Modules**, **React Icons** y **Lucide React**.

---

## Estado por rol

| Rol | Estado | Alcance real |
| --- | --- | --- |
| Admin | Activo ✅ | Vista global, estadisticas, gestion de catalogos, usuarios, tareas, asignaciones y alertas |
| Supervisor | Activo ✅ | Vista local, tareas propias, tareas de usuarios supervisados, gestion de usuarios y asignaciones locales |
| User | Activo ✅ | Tareas asignadas, avance, comentarios, evidencias y confirmacion de alertas |

---

## Vistas principales

### Admin

- `/admin/dashboard`: tablero global por region, carga por responsable, estado global, riesgo actual y alertas.
- `/admin/estadisticas`: analisis del portafolio de tareas, graficos y lectura por fechas.
- `/admin/gestion`: paises, plantas y usuarios.
- `/admin/tareas`: gestion global de tareas, filtros, evidencias y comentarios.
- `/admin/asignaciones`: asignacion centralizada.

### Supervisor

- `/supervisor/dashboard`: tablero local con tareas propias y tareas de usuarios supervisados.
- `/supervisor/gestion`: asignacion y desasignacion de usuarios supervisados.
- `/supervisor/tareas`: tareas del supervisor, filtros y reasignacion.
- `/supervisor/asignaciones`: gestion local y creacion de tareas.
- `/supervisor/tarea/[id]`: detalle de tarea.

### User

- `/user/dashboard`: resumen personal, filtros y alerta activa si existe.
- `/user/tareas`: listado de tareas asignadas.
- `/user/tarea/[id]`: detalle, avance, comentarios y evidencias.

---

## Flujos activos

- Login con Supabase Auth.
- Carga de perfil desde `usuarios`, incluyendo rol y planta.
- Redireccion por rol desde `/`.
- Proteccion de rutas con `useAdmin`, `useSupervisor` y `useUser`.
- APIs internas para tareas, usuarios, plantas, paises, evidencias y comentarios.
- Realtime en cambios de `tareas` para admin, user y supervisor.
- Alertas admin -> user mediante `alertas_usuario`.
- Subida de evidencias al bucket `evidencias-tareas`.

---

## Modelo funcional usado por el codigo

Tablas y vistas relevantes:

- `usuarios`
- `roles`
- `plantas`
- `paises`
- `tareas`
- `estados_tarea`
- `prioridades`
- `comentarios_tarea`
- `evidencias_tareas`
- `alertas_usuario`
- `vw_alertas_usuario_estado`

Funciones/RPC relevantes:

- `confirmar_alerta_usuario`

---

## Tecnologias

| Paquete | Version |
| --- | --- |
| `next` | `^16.1.0` |
| `react` | `^18.3.0` |
| `react-dom` | `^18.3.0` |
| `@supabase/supabase-js` | `^2.45.0` |
| `react-icons` | `^5.0.0` |
| `lucide-react` | `^0.395.0` |
| `recharts` | `^2.12.0` |
| `chart.js` | `^4.4.1` |
| `react-chartjs-2` | `^5.2.0` |
| `date-fns` | `^3.6.0` |
| `vitest` | `^1.1.0` |

Nota: el proyecto tiene `typescript` como dependencia de desarrollo, pero la aplicacion esta implementada en JavaScript.

---

## Seguridad y permisos

- El cliente usa `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- El backend y scripts usan `SUPABASE_SERVICE_ROLE_KEY`.
- La validacion de permisos se hace en rutas protegidas, API routes y Supabase/RLS.
- Las APIs actuales leen el JWT y luego consultan `usuarios` para confirmar rol y alcance.
- Para datos sensibles, mantener validacion en servidor y RLS estricto.

---

## Vulnerabilidades actuales

`npm audit --json` ejecutado el 27 de abril de 2026 reporta:

- 7 vulnerabilidades moderadas.
- 0 altas.
- 0 criticas.

Avisos especificos:

- `postcss` via `next`: `GHSA-qx2v-qp2m-jg93`.
- `esbuild` via `vite`: `GHSA-67mh-4wv8-2f99`.
- `vite` via `vitest`: `GHSA-4w7w-66w2-5vf9`.
- `vitest`, `@vitest/ui` y `vite-node` heredan avisos de la cadena Vite.

Recomendacion: no aplicar `npm audit fix --force` sin validar build, login, rutas por rol, evidencias y realtime.

---

## Documentos historicos movidos fuera de Git

Algunos documentos antiguos mencionaban supervisor como futuro, recomendaban migrar a TypeScript o describian cifras de roadmap que ya no coinciden con el estado actual. Se conservaron localmente en `.analysis/root-md-historico/`, carpeta ignorada por Git:

- `ANALISIS_DISCREPANCIAS_v2.md`
- `ARQUITECTURA.md`
- `CLAUDE.md`
- `GUIA_USUARIOS_ITFlow.md`
- `INSTRUCCIONES_USO.md`
- `INSTRUCCIONES_USO_v2.md`
- `SEGURIDAD_AUDIT.md`
- `supabase-mcp-autoconfig.md`

La referencia vigente queda en `README.md`, este documento y las guias dentro de `docs/`.

---

## Validacion minima recomendada

1. `npm run lint`
2. `npm run build`
3. `npm test`
4. `npm audit`
5. Prueba manual con admin, supervisor y user.
