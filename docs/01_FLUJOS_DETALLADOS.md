# 📊 ITFlow — Documentación detallada de flujos

**Versión:** 2.1 | **Fecha:** Abril 2026 | **Arquitecto de Software**

---

## 📑 Tabla de contenidos

1. [Flujo de autenticación](#flujo-de-autenticación)
2. [Flujos por rol](#flujos-por-rol)
3. [Flujos de tareas](#flujos-de-tareas)
4. [Flujos de datos](#flujos-de-datos)
5. [Integración de seguridad](#integración-de-seguridad)

---

## 🔐 Flujo de autenticación

### Entrada: Login

```
┌─ Usuario accede http://localhost:3000
│  └─ ¿Existe sesión válida? (JWT en localStorage)
│     ├─ SÍ → AuthContext carga usuarioDetalles
│     │        └─ Redirige a dashboard según rol
│     └─ NO → Redirige a /login
│
└─ Usuario en /login
   ├─ Ingresa email + contraseña
   ├─ Submit → AuthContext.login(email, contraseña)
   │  └─ Supabase.auth.signInWithPassword()
   │     ├─ Validación de credenciales
   │     └─ Retorna JWT token + user id
   │
   └─ Si login exitoso:
      ├─ JWT guardado en sessionStorage (automático Supabase)
      ├─ onAuthStateChange detecta cambio
      ├─ AuthContext carga datos de tabla usuarios
      ├─ usuarioDetalles actualizado con:
      │  ├─ id, email, nombre_completo
      │  ├─ rol: { id, nombre, descripcion }
      │  └─ planta: { id, nombre, pais: { id, nombre } }
      └─ Router redirige a obtenerRutaPrincipal()
         ├─ Admin → /admin/dashboard
         ├─ Supervisor → /supervisor/tareas
         └─ User → /user/dashboard
```

### Componentes involucrados:

- **Página:** `/pages/login.js`
- **Context:** `AuthContext.js` (AuthProvider)
- **Backend:** Supabase Auth + tabla `usuarios`
- **Datos devueltos:** usuarioDetalles con rol y planta

### Gestión de sesión:

- **Almacenamiento:** Supabase gestiona JWT automáticamente
- **Refresco:** `onAuthStateChange` escucha cambios
- **Timeout:** Configurado en Supabase (default 1 hora)
- **Logout:** Limpia JWT + usuarioDetalles

---

## 👥 Flujos por rol

### 🔴 ADMIN — Administrador del sistema

#### Acceso y permisos:

```
ADMIN puede:
├─ Ver todas las tareas del sistema (sin filtro)
├─ Crear nuevas tareas
├─ Asignar tareas a cualquier usuario
├─ Editar tareas (excepto que estén completadas)
├─ Ver todas las plantas y países
├─ Gestionar usuarios (crear, editar, eliminar)
├─ Generar reportes globales
└─ Ver evidencias cargadas por usuarios
```

#### Dashboard Admin: "Tablero de Tareas por Región"

```
Usuario accede /admin/dashboard
│
├─ Sección 1: CARGA POR RESPONSABLE
│  ├─ Gráfico de barras (Chart.js/Recharts)
│  ├─ X-axis: Nombre del usuario
│  ├─ Y-axis: Cantidad de tareas activas
│  ├─ Objetivo: Detectar desbalance de carga
│  └─ Interacción: Click en barra → filtra tareas de ese usuario
│
├─ Sección 2: ESTADO GLOBAL
│  ├─ Gráfico de dona (Recharts)
│  ├─ Segmentos:
│  │  ├─ Pendientes (rojo)
│  │  ├─ En Proceso (amarillo)
│  │  └─ Completadas (verde)
│  └─ Porcentaje de avance general
│
├─ Sección 3: RIESGO ACTUAL
│  ├─ Tabla con tareas vencidas
│  ├─ Columnas: Usuario, Tarea, Días vencida, Prioridad
│  ├─ Color de fila según severidad
│  └─ Botón: Escalar tarea o reasignar
│
└─ Acciones flotantes:
   ├─ Botón "+ Nueva tarea" → Modal FormularioMulti
   └─ Botón "Reportes" → Export a PDF/Excel
```

#### Flujo: Crear tarea

```
Admin en /admin/tareas → Botón "+ Nueva tarea"
│
├─ Modal abierto: FormularioMulti
│  ├─ Campos:
│  │  ├─ Título (required)
│  │  ├─ Descripción (textarea)
│  │  ├─ Fecha inicio (datetime)
│  │  ├─ Fecha límite (datetime)
│  │  ├─ Prioridad (dropdown: baja/media/alta/urgente)
│  │  ├─ Planta (dropdown + dependencia)
│  │  ├─ Usuario asignado (dropdown + filtro por planta)
│  │  └─ Observaciones iniciales
│  │
│  └─ Validación en cliente:
│     ├─ Título no vacío
│     ├─ Fecha límite > fecha inicio
│     └─ Usuario asignado existe
│
├─ Submit → POST /api/admin/asignar
│  └─ Headers: Authorization: Bearer {JWT}
│
├─ Backend valida:
│  ├─ JWT válido y corresponde a Admin
│  ├─ Usuario destino existe y está activo
│  ├─ Usuario destino pertenece a planta válida
│  └─ Todos los campos obligatorios presentes
│
├─ Insert en tabla tareas:
│  ├─ id: generado por BD
│  ├─ titulo, descripcion, observaciones
│  ├─ fecha_inicio, fecha_limite
│  ├─ estado_id: 1 (Pendiente)
│  ├─ prioridad_id: seleccionado
│  ├─ asignado_a: usuario_id
│  ├─ creado_por: admin_id
│  ├─ supervisado_por: supervisor_de_planta (si aplica)
│  ├─ planta_id: seleccionado
│  ├─ porcentaje_avance: 0
│  ├─ created_at, updated_at: NOW()
│  └─ revisado: false
│
└─ Retorna 200 + { tarea creada }
   └─ Frontend cierra modal + recarga lista
   └─ Notificación: "Tarea creada exitosamente"
```

#### Flujo: Reasignar tarea

```
Admin ve tarea con riesgo → Menú de acciones
│
├─ Click "Reasignar"
├─ Modal: Seleccionar nuevo usuario
├─ Validaciones:
│  ├─ Usuario exists
│  └─ Pertenece a misma planta o está permitido cambio entre plantas
│
├─ PUT /api/admin/tareas/{id}
│  └─ { asignado_a: new_user_id }
│
└─ Update successful → Notificación + recarga
```

---

### 🟡 SUPERVISOR — Jefe de planta (en desarrollo)

#### Acceso y permisos planeados:

```
SUPERVISOR puede:
├─ Ver tareas de su planta (solo)
├─ Crear tareas en su planta
├─ Asignar tareas a usuarios de su planta
├─ Revisar tareas completadas
├─ Ver estadísticas de su planta
├─ NO accede a otras plantas
└─ NO gestiona usuarios
```

#### Dashboard Supervisor (planeado)

```
/supervisor/dashboard
│
├─ Estadísticas de planta:
│  ├─ Total tareas (esta planta)
│  ├─ Tareas completadas (%)
│  ├─ Tareas vencidas
│  └─ Comparativa vs semana anterior
│
└─ Acciones:
   ├─ Crear tarea (solo para su planta)
   └─ Ver listado de usuarios de su planta
```

---

### 🟢 USER — Operario/Técnico

#### Acceso y permisos:

```
USER puede:
├─ Ver SOLO sus tareas asignadas
├─ Actualizar estado de sus tareas
├─ Actualizar porcentaje de avance
├─ Cargar evidencias (archivos: JPG, PNG, PDF)
├─ Dejar comentarios en tareas
├─ NO crear tareas
├─ NO asignar tareas
└─ NO ver tareas de otros usuarios
```

#### Dashboard User: "Mis Tareas"

```
Usuario accede /user/dashboard
│
├─ Resumen personalizado:
│  ├─ Tarjeta: "Activas" (color amarillo)
│  │  └─ Contador: Tareas sin completar
│  │
│  ├─ Tarjeta: "En Proceso" (color azul)
│  │  └─ Contador: Tareas con 0 < avance < 100
│  │
│  ├─ Tarjeta: "Completadas" (color verde)
│  │  └─ Contador: Tareas al 100%
│  │
│  └─ Tarjeta: "Vencidas" (color rojo)
│     └─ Contador: Tareas pasada fecha límite
│
├─ Gráfico: Porcentaje promedio de avance
│  └─ Línea de tendencia: últimos 7 días
│
├─ Tabla: Mis tareas
│  ├─ Columnas:
│  │  ├─ Título
│  │  ├─ Prioridad (badge de color)
│  │  ├─ % Avance (barra)
│  │  ├─ Fecha límite
│  │  ├─ Estado
│  │  └─ Acciones (Ver, Actualizar)
│  │
│  ├─ Filtros:
│  │  ├─ Por prioridad
│  │  ├─ Por estado
│  │  └─ Por fecha (vencidas, próximas)
│  │
│  └─ Ordenamiento:
│     ├─ Por fecha límite (default)
│     ├─ Por prioridad
│     └─ Por estado
│
└─ Acciones:
   └─ Click en tarea → /user/tarea/{id}
```

#### Flujo: Actualizar tarea

```
User en /user/dashboard → Click en tarea
│
├─ Navegación: /user/tarea/{id}
│
├─ Carga datos de tarea:
│  ├─ GET /api/user/tareas/{id}
│  ├─ Backend valida:
│  │  ├─ JWT válido
│  │  └─ Tarea asignada a este usuario
│  └─ Retorna tarea completa
│
├─ Página muestra:
│  ├─ Información de tarea (título, descripción, planta)
│  ├─ Fecha inicio/límite
│  ├─ Prioridad
│  │
│  ├─ SECCIÓN DE ACTUALIZACIÓN:
│  │  ├─ Dropdown: Cambiar estado
│  │  │  └─ Opciones: Pendiente, En Proceso, Completado, Pausado
│  │  │
│  │  ├─ Slider: Porcentaje de avance (0-100%)
│  │  │  └─ Actualización en tiempo real
│  │  │
│  │  ├─ Textarea: Observaciones
│  │  │  └─ Cambios = auto-save
│  │  │
│  │  └─ Sección: Cargar evidencia
│  │     ├─ Botón: "Seleccionar archivo"
│  │     ├─ Tipos permitidos: JPG, PNG, PDF
│  │     ├─ Tamaño máx: 10 MB
│  │     ├─ Preview si es imagen
│  │     └─ Botón: "Subir evidencia"
│  │
│  └─ SECCIÓN DE COMUNICACIÓN:
│     ├─ Comentarios históricos (readonly)
│     ├─ Campo: Agregar comentario
│     └─ Botón: Enviar comentario
│
├─ Submit de cambios → PUT /api/user/tareas/{id}
│  └─ Body: { estado_id, porcentaje_avance, observaciones, evidencia }
│
├─ Backend valida:
│  ├─ JWT válido + User
│  ├─ Tarea es de este user
│  ├─ Valores en rango válido:
│  │  ├─ 0 <= porcentaje_avance <= 100
│  │  ├─ estado_id existe en BD
│  │  └─ Evidencia cumple requisitos
│  │
│  └─ Insert en tabla comentarios (si aplica)
│
├─ Update tabla tareas:
│  ├─ estado_id, porcentaje_avance
│  ├─ observaciones
│  ├─ evidencia (URL si se subió)
│  ├─ updated_at: NOW()
│  └─ Si estado es "Completado":
│     └─ fecha_cierre: NOW()
│
└─ Retorna 200 + tarea actualizada
   └─ Notification: "Cambios guardados"
   └─ Redirección: /user/tareas (o permanece en detalle)
```

#### Flujo: Cargar evidencia

```
User en detalle de tarea → Sección "Cargar evidencia"
│
├─ Click: "Seleccionar archivo"
│  └─ File picker abierto
│
├─ Usuario selecciona archivo
│  ├─ Validación cliente:
│  │  ├─ Tipo: JPG | PNG | PDF
│  │  ├─ Tamaño < 10 MB
│  │  └─ Si es imagen → muestra preview
│  │
│  └─ Si validación falla → Error message
│
├─ Click: "Subir evidencia"
│  └─ Upload a Supabase Storage
│     ├─ Bucket: 'tareas-evidencia'
│     ├─ Path: tareas/{tarea_id}/evidencia_{timestamp}
│     └─ Progress bar durante carga
│
├─ Backend retorna URL pública
│
├─ Frontend guarda URL en form
│  └─ PUT /api/user/tareas/{id}
│     └─ { evidencia: "https://..." }
│
└─ Success → Muestra evidencia cargada + opción de eliminar
```

---

## 🎯 Flujos de tareas

### Ciclo de vida de una tarea

```
┌─────────────────────────────────────────────────────────────┐
│ Estado: PENDIENTE (inicial)                                 │
├─────────────────────────────────────────────────────────────┤
│ • Acción: Admin/Supervisor crea → asigna a usuario         │
│ • Notificación enviada a usuario                           │
│ • Visible en dashboard de usuario                          │
│ • Avance: 0%                                               │
└──────────────────┬──────────────────────────────────────────┘
                   │ User actualiza estado
                   ▼
┌─────────────────────────────────────────────────────────────┐
│ Estado: EN PROCESO                                          │
├─────────────────────────────────────────────────────────────┤
│ • Acción: User cambia a "En Proceso"                       │
│ • Avance: 0-100% (slider)                                  │
│ • Observaciones: User agrega notas                         │
│ • Timeline mostrado en dashboard admin                     │
└──────────────────┬──────────────────────────────────────────┘
                   │ User completa + carga evidencia
                   ▼
┌─────────────────────────────────────────────────────────────┐
│ Estado: COMPLETADO                                          │
├─────────────────────────────────────────────────────────────┤
│ • Acción: User establece avance=100% + estado=Completado   │
│ • Evidencia: Cargada en Storage                            │
│ • fecha_cierre: Registrada automáticamente                 │
│ • Pendiente revisión de supervisor/admin                   │
└──────────────────┬──────────────────────────────────────────┘
                   │ Admin/Supervisor revisa
                   ▼
┌─────────────────────────────────────────────────────────────┐
│ Estado: REVISADO (final)                                    │
├─────────────────────────────────────────────────────────────┤
│ • Acción: Admin/Supervisor marca como "revisado"           │
│ • Comentario de revisión agregado                          │
│ • Cerrada para ediciones de usuario                        │
│ • Archivada en reportes históricos                         │
└─────────────────────────────────────────────────────────────┘

Opcionales:
├─ Estado: PAUSADO
│  └─ User marca en pausa (motivo)
│     └─ Puede regresar a EN PROCESO
│
└─ Estado: CANCELADA
   └─ Admin/Supervisor cancela
      └─ No se cierra, se marca como cancelada
```

### Flujo de validación de tareas

```
Cada vez que se actualiza una tarea:
│
├─ Validaciones cliente (UX):
│  ├─ Campos obligatorios llenoscontenido
│  ├─ 0 <= avance <= 100
│  ├─ archivo < 10 MB
│  └─ Fecha límite futura (si es creación)
│
└─ Validaciones servidor (seguridad):
   ├─ JWT válido
   ├─ Usuario tiene permisos
   ├─ Tarea existe
   ├─ Tarea pertenece a usuario (si user)
   ├─ Valores en rango
   └─ Cambio de estado es válido
      ├─ Pendiente → En Proceso ✓
      ├─ En Proceso → Completado ✓
      ├─ Pendiente → Completado ✓
      ├─ Cualquiera → Pausada ✓
      ├─ Pausada → En Proceso ✓
      └─ Cualquiera → Cancelada (admin solo) ✓
```

---

## 🔄 Flujos de datos

### Fetch de tareas: Múltiples vistas

```
ADMIN → /api/admin/tareas
├─ Query: SELECT * FROM tareas
│  ├─ No filtro por usuario
│  ├─ No filtro por planta
│  ├─ Retorna todas
│  └─ Joins: usuarios, plantas, estados, prioridades
│
└─ Respuesta: Array[tareas]
   └─ Estructura:
      {
        id, titulo, descripcion,
        estado: { id, nombre },
        prioridad: { id, nombre },
        asignado_a: { id, nombre_completo, planta },
        creado_por: { id, nombre_completo },
        supervisado_por: { id, nombre_completo },
        fecha_inicio, fecha_limite, fecha_cierre,
        porcentaje_avance, observaciones,
        revisado, evidencia,
        created_at, updated_at
      }

SUPERVISOR → /api/supervisor/tareas (en desarrollo)
├─ Query: SELECT * FROM tareas WHERE planta_id = supervisor.planta_id
└─ Retorna: Tareas de su planta solo

USER → /api/user/tareas
├─ Query: SELECT * FROM tareas WHERE asignado_a = user.id
└─ Retorna: Tareas asignadas a este usuario
```

### Suscripciones Realtime

```
Dashboard Admin/User escucha cambios en tiempo real:
│
├─ Canal: supabase.channel('realtime-tareas')
├─ Tabla: tareas
├─ Eventos: INSERT, UPDATE, DELETE
│
└─ Callback:
   ├─ Detecta cambio
   ├─ Recarga lista de tareas (GET)
   ├─ Actualiza UI sin full page reload
   └─ Notificación visual opcional
```

### Modelo de datos (tablas)

```
USUARIOS
├─ id (UUID, PK)
├─ email (unique)
├─ nombre_completo
├─ estado ('activo'|'inactivo')
├─ rol_id (FK → roles)
├─ planta_id (FK → plantas)
└─ Timestamps: created_at, updated_at

TAREAS
├─ id (UUID, PK)
├─ titulo (string, required)
├─ descripcion (text)
├─ estado_id (FK → estados_tarea)
├─ prioridad_id (FK → prioridades)
├─ asignado_a (FK → usuarios)
├─ creado_por (FK → usuarios)
├─ supervisado_por (FK → usuarios, nullable)
├─ planta_id (FK → plantas)
├─ porcentaje_avance (0-100)
├─ observaciones (text)
├─ evidencia (URL o text)
├─ revisado (boolean, default false)
├─ fecha_inicio (datetime)
├─ fecha_limite (datetime)
├─ fecha_cierre (datetime, nullable)
├─ created_at (datetime)
└─ updated_at (datetime)

COMENTARIOS (opcional, no implementado)
├─ id (UUID, PK)
├─ tarea_id (FK → tareas)
├─ usuario_id (FK → usuarios)
├─ contenido (text)
├─ created_at (datetime)
└─ updated_at (datetime)

ESTADOS_TAREA
├─ id (PK)
├─ nombre ('pendiente'|'en_proceso'|'completado'|'pausada'|'cancelada')
└─ color_hex (para UI)

PRIORIDADES
├─ id (PK)
├─ nombre ('baja'|'media'|'alta'|'urgente')
└─ color_hex

PLANTAS
├─ id (UUID, PK)
├─ nombre
├─ pais_id (FK → paises)
└─ Timestamps

PAISES
├─ id (UUID, PK)
└─ nombre
```

---

## 🔒 Integración de seguridad

### Triple capa de validación

```
Capa 1: CLIENTE (Navegador)
│
├─ useAuth() → Verifica usuarioDetalles
├─ useProtegerRuta() → Redirige si no autorizado
├─ AuthContext → Guarda JWT en sessionStorage
└─ Validación de formularios básica

        ↓ (JWT en Authorization header)

Capa 2: API ROUTES (Next.js)
│
├─ verifyUserToken() → Valida JWT
├─ getUsuarioDetalles() → Carga datos usuario
├─ permisos.js → Verifica regla de negocio
│  ├─ esAdmin(), esSupervisor(), esUser()
│  ├─ puedeCrearTareas(), puedeModificarTarea()
│  └─ puedeGestionarUsuarios()
└─ Lógica de negocio + Filtrado manual

        ↓ (Query a BD)

Capa 3: ROW LEVEL SECURITY (Supabase)
│
├─ Policies por tabla + rol
├─ Filtrado a nivel de BD
├─ Imposible bypasear desde cliente
└─ Último resguardo
```

### Flujo de autorización en detalle

```
Request a API protegida (ejemplo: POST /api/admin/asignar)
│
├─ Headers incluyen: Authorization: Bearer {JWT}
│
├─ Servidor extrae token
├─ Llama supabase.auth.getUser()
│  └─ Valida firma + expiración
│
├─ Si inválido → 403 Forbidden
│
├─ Si válido:
│  ├─ Obtiene user_id del token
│  ├─ Query: SELECT * FROM usuarios WHERE id = user_id
│  ├─ Carga usuarioDetalles + rol
│  │
│  ├─ Verifica permiso:
│  │  └─ Si no es Admin → 403
│  │
│  ├─ Valida datos:
│  │  ├─ Usuario destino exists
│  │  ├─ Planta válida
│  │  └─ Campos obligatorios
│  │
│  ├─ Si falla validación → 400 Bad Request
│  │
│  └─ Si todo OK:
│     ├─ Ejecuta operación en BD
│     ├─ RLS policies permiten el INSERT
│     └─ Retorna 200 + datos creados
```

---

## 📊 Flujos de reportería (Admin)

```
Admin en /admin/dashboard
│
├─ Gráfico 1: Carga por responsable
│  ├─ Query: SELECT COUNT(*) FROM tareas
│  │         GROUP BY asignado_a
│  │         WHERE estado != 'completado'
│  │         AND planta_id = usuario.planta_id
│  └─ Visualización: Recharts BarChart
│
├─ Gráfico 2: Estado global
│  ├─ Query: SELECT COUNT(*) FROM tareas
│  │         GROUP BY estado_id
│  │         WHERE created_at >= hoy
│  └─ Visualización: Recharts PieChart
│
├─ Tabla 3: Riesgo (tareas vencidas)
│  ├─ Query: SELECT * FROM tareas
│  │         WHERE fecha_limite < NOW()
│  │         AND estado != 'completado'
│  │         ORDER BY fecha_limite
│  └─ Visualización: Tabla con color de alerta
│
└─ Exportación (futura):
   ├─ Botón: "Descargar PDF"
   ├─ Botón: "Descargar Excel"
   └─ Usos: Reportes ejecutivos, análisis histórico
```

---

## 🚀 Resumen de flujos

| Flujo | Inicio | Fin | Duración esperada | Roles |
|-------|--------|-----|-------------------|-------|
| Login | /login | /dashboard | < 2 seg | Todos |
| Crear tarea | Admin/dashboard | BD | < 1 seg | Admin, Supervisor |
| Actualizar tarea | User/tarea/[id] | BD | < 1 seg | User |
| Cargar evidencia | User/tarea/[id] | Storage | < 5 seg (según tamaño) | User |
| Reasignar tarea | Admin/tareas | BD | < 1 seg | Admin |
| Ver dashboard | / | Estadísticas | < 2 seg | Todos |

---

**Próxima actualización:** Q2 2026 cuando se implemente role Supervisor completamente.
