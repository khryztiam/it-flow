# ITFlow - Resumen ejecutivo

**Fecha de revision:** 27 de abril de 2026
**Version app:** `1.4.0`
**Publico:** responsables de producto, operacion y tecnologia

---

## Que Es ITFlow

ITFlow es una aplicacion web para centralizar tareas de equipos de TI. Permite que cada persona vea lo que le corresponde, actualice avances y deje evidencia del trabajo realizado.

El sistema ya trabaja con tres roles:

- **Admin:** ve y administra todo el flujo.
- **Supervisor:** gestiona su alcance local y usuarios supervisados.
- **User:** atiende sus tareas asignadas.

---

## Estado Actual

| Area | Estado |
| --- | --- |
| Login y sesion | Activo con Supabase Auth |
| Roles | Admin, Supervisor y User activos |
| Tareas | Creacion, edicion, asignacion, filtros y seguimiento |
| Evidencias | Subida y consulta desde detalle de tarea |
| Comentarios | Disponibles en tareas |
| Alertas | Admin envia, user confirma |
| Realtime | Activo para cambios de tareas |
| Documentacion | En consolidacion para eliminar duplicidad |

---

## Valor para la Operacion

- 👁️ **Visibilidad:** cada rol ve una pantalla enfocada en su trabajo.
- ⏱️ **Menos seguimiento manual:** el avance queda registrado en la tarea.
- 📎 **Evidencia:** archivos y comentarios ayudan a comprobar ejecucion.
- 🚨 **Riesgo visible:** tareas vencidas o urgentes aparecen destacadas.
- 🧑‍🤝‍🧑 **Responsabilidad clara:** se sabe quien tiene cada tarea.

---

## Pantallas Clave

| Rol | Pantallas principales |
| --- | --- |
| Admin | Dashboard global, estadisticas, gestion, tareas y asignaciones |
| Supervisor | Dashboard local, gestion de usuarios, tareas y asignaciones locales |
| User | Dashboard personal, mis tareas y detalle de tarea |

---

## Tecnologia

ITFlow usa:

- Next.js `^16.1.0` con Pages Router.
- React `^18.3.0`.
- JavaScript.
- Supabase para login, base de datos, realtime y storage.
- CSS Modules para estilos.
- React Icons y Lucide React para iconos.

No usa App Router, Tailwind ni TypeScript en el codigo de la app.

---

## Riesgos Actuales

| Riesgo | Lectura ejecutiva |
| --- | --- |
| Validacion de APIs | Debe mantenerse fuerte para evitar accesos fuera de rol |
| RLS en Supabase | Es clave para que los permisos no dependan solo del frontend |
| Token en backend | Hoy se lee el JWT y se contrasta contra `usuarios`; conviene endurecer si se escala |
| Dependencias | `npm audit` reporta 7 vulnerabilidades moderadas |
| Documentacion antigua | Algunos documentos tenian referencias ya desactualizadas |

---

## Vulnerabilidades al 27 de Abril de 2026

`npm audit` reporta:

- 7 moderadas.
- 0 altas.
- 0 criticas.

Avisos principales:

- `postcss` via `next`: XSS en serializacion CSS (`GHSA-qx2v-qp2m-jg93`).
- `esbuild` via `vite`: exposicion del servidor de desarrollo bajo ciertas condiciones (`GHSA-67mh-4wv8-2f99`).
- `vite` via `vitest`: path traversal en mapas de dependencias optimizadas (`GHSA-4w7w-66w2-5vf9`).

Recomendacion: actualizar dependencias en una rama separada y validar build, login, permisos, evidencias, comentarios, alertas y realtime antes de publicar.

---

## Recomendacion de Corto Plazo

1. Mantener documentacion consolidada desde `README.md` y `docs/00_ESTADO_ACTUAL.md`.
2. Revisar RLS y APIs de tareas por rol.
3. Evaluar actualizacion controlada de dependencias afectadas por `npm audit`.
4. Agregar pruebas automatizadas de acceso: admin ve todo, supervisor ve su alcance, user ve solo lo suyo.
5. Validar manualmente alertas, evidencias y comentarios despues de cada cambio relevante.

---

## Decision Recomendada

ITFlow ya tiene una base funcional util para operacion interna. El siguiente paso no es rehacer la app, sino fortalecer seguridad, pruebas y documentacion para que el crecimiento sea controlado.
