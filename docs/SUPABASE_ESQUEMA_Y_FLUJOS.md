# SUPABASE ESQUEMA Y FLUJOS

## Alcance

Documento reconstruido a partir del estado actual del repositorio en `origin/main`, principalmente desde:

- `docs/01_FLUJOS_DETALLADOS.md`
- `docs/06_INSTALACION_DEPLOYMENT.md`
- `src/lib/auth.js`

Resume el modelo de datos en Supabase, las relaciones clave, la seguridad observada y los flujos funcionales que hoy usa ITFlow.

## Arquitectura resumida

- `Supabase Auth` gestiona autenticacion y sesion.
- La tabla `usuarios` extiende el perfil aplicativo vinculado al usuario autenticado.
- La tabla `tareas` concentra el flujo operativo principal.
- `Storage` guarda evidencias de tareas en el bucket `evidencias-tareas`.
- `Realtime` actualiza dashboards y listas cuando cambian registros de `tareas`.
- El backend de Next.js usa `SUPABASE_SERVICE_ROLE_KEY` para operaciones servidor a servidor.

## Variables de entorno relacionadas

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

## Esquema funcional

### Tabla `usuarios`

Representa el perfil operativo de cada persona dentro de la app.

Campos principales:

- `id` `uuid` PK, alineado con el usuario autenticado.
- `email` unico.
- `nombre_completo`
- `estado` (`activo` o `inactivo`)
- `rol_id` FK a `roles`
- `planta_id` FK a `plantas`
- `created_at`
- `updated_at`

### Tabla `tareas`

Entidad principal del sistema para asignacion, seguimiento y cierre.

Campos principales:

- `id` `uuid` PK
- `titulo`
- `descripcion`
- `estado_id` FK a `estados_tarea`
- `prioridad_id` FK a `prioridades`
- `asignado_a` FK a `usuarios`
- `creado_por` FK a `usuarios`
- `supervisado_por` FK a `usuarios`, nullable
- `planta_id` FK a `plantas`
- `porcentaje_avance`
- `observaciones`
- `evidencia`
- `revisado`
- `fecha_inicio`
- `fecha_limite`
- `fecha_cierre`
- `created_at`
- `updated_at`

### Tabla `comentarios_tarea`

Se usa en el detalle de tareas para registrar comentarios vinculados a una tarea y a un usuario.

Campos observados:

- `id`
- `tarea_id` FK a `tareas`
- `usuario_id` FK a `usuarios`
- `contenido`
- `created_at`
- `updated_at`

### Tabla `evidencias_tareas`

Guarda metadatos de archivos subidos por usuarios.

Campos observados en flujo backend:

- `id`
- `tarea_id` FK a `tareas`
- `usuario_id` FK a `usuarios`
- `archivo_path`
- `archivo_url`
- metadatos de archivo y auditoria

### Catalogos auxiliares

- `roles`
- `plantas`
- `paises`
- `estados_tarea`
- `prioridades`

## Relaciones clave

- Un `usuario` pertenece a un `rol`.
- Un `usuario` puede pertenecer a una `planta`.
- Una `tarea` pertenece a una `planta`.
- Una `tarea` tiene un `estado`.
- Una `tarea` tiene una `prioridad`.
- Una `tarea` puede tener un usuario asignado.
- Una `tarea` registra quien la creo y opcionalmente quien la supervisa.
- Una `tarea` puede tener muchos comentarios.
- Una `tarea` puede tener muchas evidencias.

## Indices recomendados/observados

En la documentacion del proyecto aparecen indices para:

- `tareas.asignado_a`
- `tareas.planta_id`
- `tareas.estado_id`
- `usuarios.rol_id`
- `usuarios.planta_id`

## Seguridad y acceso

### RLS

La documentacion de instalacion indica que se habilita `ROW LEVEL SECURITY` en al menos:

- `usuarios`
- `tareas`

Politicas funcionales descritas:

- `admin` puede ver todas las tareas.
- `user` ve solo tareas donde `asignado_a = auth.uid()`.
- `supervisor` ve tareas de su planta.

### Autorizacion actual en backend

El backend valida permisos revisando el token `Bearer` y consultando la tabla `usuarios` con su rol:

- `verifyAdminToken`
- `verifyAdminOrSupervisorToken`
- `verifyUserToken`

Observacion importante:

- En `src/lib/auth.js` se parsea el payload del JWT y luego se contrasta el email contra `usuarios`.
- Esto implementa control de acceso aplicativo, pero no equivale a verificacion criptografica completa del token.

## Realtime

Los dashboards escuchan cambios sobre `tareas` con un canal estilo:

```js
supabase.channel('realtime-tareas')
```

Eventos esperados:

- `INSERT`
- `UPDATE`
- `DELETE`

Comportamiento:

- se detecta el cambio;
- se vuelve a consultar la lista;
- la UI se refresca sin recarga completa;
- el usuario ve cambios casi inmediatos.

## Flujos principales

### 1. Login y carga de perfil

1. El usuario inicia sesion con `Supabase Auth`.
2. El frontend obtiene sesion activa.
3. La app consulta `usuarios` para completar contexto de negocio.
4. Segun el rol, redirige a la vista principal correspondiente.

### 2. Consulta de tareas por rol

Admin:

- consume `/api/admin/tareas`
- puede ver todas las tareas
- recibe joins de usuario asignado, creador, supervisor, estado y prioridad

User:

- consume `/api/user/tareas`
- solo ve tareas asignadas a su usuario

Supervisor:

- flujo documentado, aun marcado como parcial o en desarrollo en algunas guias
- deberia limitarse a tareas de su planta

### 3. Creacion de tarea

1. Admin o supervisor abre formulario.
2. Backend valida rol.
3. Se inserta registro en `tareas`.
4. La tarea queda ligada a planta, prioridad, estado y responsables.
5. Realtime propaga el cambio a dashboards y listas.

### 4. Actualizacion de tarea por usuario

1. User abre detalle de una tarea asignada.
2. Backend valida que la tarea pertenezca al usuario autenticado.
3. Se actualizan campos como:
   - `estado_id`
   - `porcentaje_avance`
   - `observaciones`
   - `fecha_cierre` cuando aplica
4. La UI y paneles reflejan el cambio por consulta y/o realtime.

### 5. Comentarios en tarea

1. User o actor autorizado abre el detalle.
2. Se inserta registro en `comentarios_tarea`.
3. El comentario vuelve asociado al usuario autor.

### 6. Carga de evidencias

1. El usuario abre `/api/user/tareas/[id]/upload`.
2. Backend valida que la tarea le pertenezca.
3. El archivo se sube al bucket `evidencias-tareas`.
4. Se guarda metadata en `evidencias_tareas`.
5. `tareas.evidencia` se actualiza con la URL mas reciente.

### 7. Reasignacion de tareas

1. Admin o supervisor selecciona tarea y responsable.
2. Backend valida alcance del rol.
3. Se actualiza `asignado_a`.
4. Realtime y/o refetch reflejan la nueva asignacion.

## Mapa rapido de tablas a funcionalidades

- `usuarios`: identidad operativa, rol, planta, estado
- `tareas`: trabajo principal del negocio
- `comentarios_tarea`: colaboracion y trazabilidad
- `evidencias_tareas`: archivos de respaldo de ejecucion
- `roles`: control de permisos
- `plantas` y `paises`: segmentacion geografica
- `estados_tarea`: ciclo de vida
- `prioridades`: urgencia y foco

## Riesgos tecnicos visibles desde el codigo actual

- La validacion del token en backend depende de parsear JWT y luego consultar `usuarios`.
- El flujo supervisor aparece documentado pero no completamente homologado en todas las vistas.
- La seguridad real depende de mantener consistentes tanto las validaciones API como las politicas RLS.

## Referencias internas

- [01_FLUJOS_DETALLADOS.md](/m:/Apps/it-flow/docs/01_FLUJOS_DETALLADOS.md:1)
- [06_INSTALACION_DEPLOYMENT.md](/m:/Apps/it-flow/docs/06_INSTALACION_DEPLOYMENT.md:1)
- [auth.js](/m:/Apps/it-flow/src/lib/auth.js:1)
