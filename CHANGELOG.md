# Changelog

Todos los cambios importantes de ITFlow se documentan en este archivo.

El formato sigue una estructura simple por version para dejar claro que cambio a nivel funcional, tecnico, seguridad y documentacion.

---

## [1.6.0] - 2026-05-01

### Agregado

- Nuevo drawer compartido para detalle de tareas en vistas de usuario.
- El drawer de usuario permite revisar resumen, descripcion, comentarios, evidencias y actualizar estado/avance sin salir del dashboard o de `Mis Tareas`.

### Corregido

- La logica de vencimiento ahora compara por dia calendario: una tarea con fecha limite de hoy se muestra como `Ultimo dia` y no como vencida.
- El panel de riesgo actual muestra todos los responsables empatados con el mayor numero de tareas vencidas, no solo el primer resultado.
- Ajuste de nombres largos de responsables en tarjetas para evitar saltos visuales no deseados.

### Mejorado (UI/UX)

- Compactacion de estados vacios en paneles de riesgo de admin y supervisor.
- Mejoras visuales en tarjetas de resumen ejecutivo de estadisticas.
- Optimizacion de layout en resoluciones 1366 y 1920 para dashboards admin, supervisor y estadisticas.
- Cards de tareas de usuario mas compactas, con prioridad/estado en header, descripcion breve, vencimiento y progreso visible.
- Vista `Mis Tareas` de usuario ahora usa el mismo drawer de detalle que el dashboard.

### Cambiado

- `package.json` sube de `1.5.0` a `1.6.0`.
- `package-lock.json` queda sincronizado con la version `1.6.0`.

---

## [1.5.0] - 2026-04-28

### Mejorado (UI/UX)

- Rediseño visual de dashboard admin: hero section mejorado con gradientes refinados y mejor gestión de indicadores.
- Cambio de modal a drawer en dashboard admin para interacciones con tareas.
- Refinado de columnas, cards y espaciado en dashboard admin.
- Rediseño de vista de estadísticas admin: paneles reorganizados, indicadores consolidados.
- Eliminación de duplicidad de información en estadísticas.

---

## [1.4.1] - 2026-04-27

### Documentacion

- Reescritura completa de `README.md` con enfoque mas claro para usuarios y desarrolladores nuevos.
- Nuevo `docs/00_ESTADO_ACTUAL.md` como referencia vigente del estado real del proyecto.
- Nuevo `docs/13_VULNERABILIDADES_ACTUALES.md` con detalle del ultimo `npm audit`.
- Consolidacion del indice maestro y resumen ejecutivo para reducir duplicidad.
- Actualizacion de la guia de supervisor para reflejar que el rol ya esta activo.
- Actualizacion de esquema y flujos Supabase con alertas, realtime y alcance supervisor.
- Movimiento de la guia rapida de validacion a `docs/11_GUIA_VALIDACION_RAPIDA.md`.

### Limpieza

- Eliminacion del repo de documentos raiz historicos u obsoletos que duplicaban informacion de `docs/`.
- Movimiento de pruebas manuales utiles a `tests/validation/`.
- Eliminacion del repo de scripts de prueba antiguos con credenciales hardcodeadas.
- Eliminacion de `tareas_rows.csv` del repo.

---

## [1.4.0] - 2026-04-25

### Agregado

- Supervisor pasa a estar operativo con dashboard, tareas, gestion, asignaciones y detalle de tarea.
- Nuevas rutas de supervisor:
  - `/supervisor/dashboard`
  - `/supervisor/tareas`
  - `/supervisor/gestion`
  - `/supervisor/asignaciones`
  - `/supervisor/tarea/[id]`
- Nuevas APIs de supervisor:
  - `/api/supervisor/tareas`
  - `/api/supervisor/tareas/crear`
  - `/api/supervisor/tareas/todas`
  - `/api/supervisor/tareas/[id]`
  - `/api/supervisor/tareas/[id]/upload`
  - `/api/supervisor/tareas/[id]/evidencias`
  - `/api/supervisor/subordinados/tareas`
- Nueva gestion de usuarios supervisados desde `/supervisor/gestion`.
- Endpoint administrativo `/api/admin/elevar-supervisor`.
- Soporte de evidencias y comentarios para supervisor.
- Modal de detalle y actualizacion de tareas para supervisor.
- Formulario de comentarios en modales de dashboard admin y supervisor.
- Scripts de soporte y validacion para flujos supervisor.
- Documentos de validacion de acceso y visibilidad por rol.

### Cambiado

- `package.json` sube de `1.3.1` a `1.4.0`.
- Sidebar incluye opciones completas para el rol supervisor.
- `AuthContext` carga `supervisor_id` dentro del perfil de usuario.
- Endpoints admin de tareas, usuarios y plantas amplian validaciones y datos relacionados.
- Vistas de supervisor reciben un rediseño funcional amplio para operar tareas, evidencia, comentarios y filtros.

### Realtime y documentacion posterior

- Realtime habilitado para supervisor en:
  - `/supervisor/dashboard`
  - `/supervisor/tareas`
  - `/supervisor/asignaciones`
- Canal `realtime-tareas-supervisor` agregado para recargar datos ante cambios en `tareas`.
- Documentacion actualizada para reflejar supervisor como rol activo.

### Seguridad

- Remocion de credenciales hardcodeadas en scripts de creacion de usuarios/admin.
- `.env.example` ampliado con variables seguras y advertencias de manejo de secrets.

---

## [1.3.1] - 2026-04-22

### Corregido

- Upload de evidencias de usuario ahora maneja respuestas no JSON sin romper la UI.
- `bodyParser.sizeLimit` para `/api/user/tareas/[id]/upload` aumenta a `20mb`.
- Mensaje mas claro cuando el servidor rechaza archivos demasiado grandes.
- `user/tarea/[id].js` y `user/tareas.js` usan parsing defensivo de respuestas API.

### Cambiado

- `package.json` sube de `1.3.0` a `1.3.1`.

---

## [1.3.0] - 2026-04-21

### Agregado

- Flujo de alertas admin -> user.
- Nueva tabla Supabase `alertas_usuario`.
- Nueva vista `vw_alertas_usuario_estado`.
- Nuevas funciones/RPC:
  - `crear_alerta_usuario`
  - `confirmar_alerta_usuario`
- Politicas RLS para alertas de usuario.
- Script SQL `scripts/sql/2026-04-21_alertas_usuario_flujo.sql`.
- Script SQL `scripts/sql/2026-04-22_enable_realtime_alertas_usuario.sql`.
- Dashboard admin puede enviar alerta individual a un responsable.
- Dashboard admin muestra estado visual de alerta pendiente o confirmada.
- Dashboard user muestra banner de alerta activa.
- User puede confirmar alerta con `OK / Enterado`.

### Cambiado

- `package.json` sube de `1.2.0` a `1.3.0`.
- `Modal` y estilos relacionados se ajustan para soportar el nuevo flujo.
- Documentacion de admin, user, flujos e instalacion incorpora alertas.

---

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

---

## [1.1.0] - 2026-04-18

### Agregado

- Nueva vista administrativa de estadisticas.
- Nuevo bloque amplio de documentacion funcional, tecnica, operativa y ejecutiva dentro de `docs/`.
- Archivo de apoyo `tareas_rows.csv`.

### Cambiado

- Ampliacion del panel administrativo, gestion de tareas y asignaciones.
- Mejoras a `TablaGenerica`, sidebar y estilos administrativos.

---

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

---

## [1.0.0] - 2026-04-16

### Lanzamiento inicial

- Base del proyecto ITFlow publicada en GitHub.
- Estructura inicial con autenticacion, roles, dashboards, tareas, APIs y componentes principales.
