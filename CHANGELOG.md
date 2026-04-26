# Changelog

Todos los cambios importantes de ITFlow se documentan en este archivo.

El formato sigue una estructura simple por version para dejar claro que cambio a nivel funcional, tecnico y de documentacion.

## [1.3.1] - 2026-04-26

### Agregado

- ✅ **Realtime habilitado para Supervisor**: Dashboards actualizados en tiempo real
- Canal realtime `realtime-tareas-supervisor` activo en:
  - `/supervisor/dashboard` — Estadísticas y tareas actualizadas
  - `/supervisor/tareas` — Lista de tareas con cambios en vivo
  - `/supervisor/asignaciones` — Formulario de tareas con datos frescos
- Suscripciones automáticas a cambios en tabla `tareas`

### Cambiado

- Comportamiento realtime: Todos los roles (Admin, User, Supervisor) reciben actualizaciones en tiempo real
- Documentación actualizada sobre capacidades realtime

### Documentación

- docs/05_GUIA_SUPERVISOR.md — Realtime ✅ activo
- docs/SUPABASE_ESQUEMA_Y_FLUJOS.md — Canales realtime expandidos
- docs/01_FLUJOS_DETALLADOS.md — Suscripciones realtime por rol

---

## [1.3.0] - 2026-04-26

### Agregado

- ✅ **Supervisor completamente en producción**: Dashboard, panel de tareas, asignaciones locales
- Nuevas vistas: `/supervisor/dashboard`, `/supervisor/tareas`, `/supervisor/gestion`, `/supervisor/asignaciones`
- APIs supervisor: `/api/supervisor/tareas`, `/api/supervisor/subordinados`, `/api/supervisor/asignaciones`
- Modal de detalle y actualización de tareas desde supervisor
- Sistema de filtrado por usuario, prioridad y estado en vistas supervisor

### Cambiado

- Estado oficial: **3 de 3 roles en producción** (Admin, Supervisor, User)
- Documentación actualizada para reflejar supervisor como producción (no planeado)

### Documentación

- Actualización de README.md con supervisor en producción
- Actualización de guías y referencias a supervisor
- Aclaración: Realtime está activo para supervisor

## [1.2.0] - 2026-04-19

### Agregado

- Nuevo `favicon` SVG del producto en `public/favicon.svg`.
- Nuevo componente reutilizable de identidad visual `BrandSignature`.
- Nuevo documento `docs/SUPABASE_ESQUEMA_Y_FLUJOS.md` con resumen del esquema funcional, relaciones, seguridad y flujos en Supabase.

### Cambiado

- Actualizacion de version del proyecto de `1.0.0` a `1.2.0`.
- Rediseño visual del login para alinearlo con la identidad actual de ITFlow.
- El login ahora muestra la version real desde `package.json` en lugar de un texto hardcodeado.
- Actualizacion visual del sidebar con nueva marca y refinamiento tipografico.
- Mejora de la experiencia de la vista `user/tareas` con nuevo hero, filtro visible y mejor jerarquia visual.
- Ajustes de estilos en `Layout`, `GestionAdmin` y pantallas relacionadas para mejorar consistencia visual.

### Documentacion

- Se consolido documentacion tecnica y funcional complementaria para respaldar el estado actual del sistema y su evolucion.

## [1.1.0] - 2026-04-18

### Agregado

- Nueva vista administrativa de estadisticas.
- Nuevo bloque amplio de documentacion funcional, tecnica, operativa y ejecutiva dentro de `docs/`.
- Archivo de apoyo `tareas_rows.csv`.

### Cambiado

- Ampliacion del panel administrativo, gestion de tareas y asignaciones.
- Mejoras a `TablaGenerica`, sidebar y estilos administrativos.

## [1.0.1] - 2026-04-17

### Agregado

- Nuevos endpoints para carga de evidencias en tareas.
- Realtime activado para dashboards admin y user.
- Script de prueba para upload de evidencias.
- Archivo `.env.example` para configuracion segura.

### Cambiado

- Mejoras importantes en dashboards de admin y user, layout y sidebar.
- Mejoras de UI en detalle y gestion de tareas.

### Seguridad

- Eliminacion de credenciales hardcodeadas en scripts, migrando a variables de entorno.

## [1.0.0] - 2026-04-16

### Lanzamiento inicial

- Base del proyecto ITFlow publicada en GitHub.
- Estructura inicial con autenticacion, roles, dashboards, tareas, APIs y componentes principales.
