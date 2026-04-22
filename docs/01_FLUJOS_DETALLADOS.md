# 📊 ITFlow — Documentación detallada de flujos

**Versión:** 2.3 | **Fecha:** Abril 2026 | **Arquitecto de Software**

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
├─ Analizar KPIs globales y riesgo operativo
├─ Crear nuevas tareas
├─ Asignar tareas a cualquier usuario o resolver backlog sin asignar
├─ Editar tareas desde la consola operativa
├─ Revisar comentarios en modal de detalle de tarea (/admin/dashboard)
├─ Abrir comentarios por tarea desde botón dedicado en tabla (/admin/tareas)
├─ Enviar alertas puntuales a usuarios desde /admin/dashboard
├─ Ver estado visual de lectura de alertas (pendiente/confirmada visible)
├─ Ver todas las plantas y países
├─ Gestionar usuarios (crear, editar, eliminar)
├─ Exportar cortes CSV desde el panel de tareas
└─ Ver evidencias cargadas por usuarios
```

#### Mapa actual del módulo Admin

```
Usuario accede al sidebar admin
│
├─ /admin/dashboard
│  ├─ Vista global por carga, estado y riesgo
│  ├─ Agrupa tareas para lectura operativa rápida
│  └─ Permite bajar al detalle del portafolio
│
├─ /admin/estadisticas
│  ├─ KPIs: tareas en vista, avance promedio, por vencer, cobertura de revisión
│  ├─ Charts: prioridad, estado, riesgo temporal, responsables, plantas
│  └─ Filtros de lectura por planta y responsable
│
├─ /admin/gestion
│  ├─ Tabla principal de usuarios
│  ├─ Sidebar de plantas
│  └─ Sidebar de países
│
├─ /admin/tareas
│  ├─ CRUD de tareas
│  ├─ Filtros de trabajo y búsqueda
│  ├─ Exportación CSV
│  ├─ Revisión de evidencias
│  └─ Botón "Comentarios" por fila
│
└─ /admin/asignaciones
   ├─ Bandeja de tareas sin asignar
   ├─ Filtro por planta
   └─ Asignación inmediata a usuarios activos
```

#### Flujo: Crear tarea

```
Admin en /admin/tareas → Botón "+ Nueva tarea"
│
├─ Modal abierto: FormularioMulti
│  ├─ Campos:
│  │  ├─ Título (required)
│  │  ├─ Descripción (textarea)
│  │  ├─ Fecha inicio (date)
│  │  ├─ Fecha límite (date)
│  │  ├─ Estado (dropdown)
│  │  ├─ Prioridad (dropdown: baja/media/alta/urgente)
│  │  ├─ Planta (dropdown)
│  │  └─ Usuario asignado (dropdown opcional)
│  │
│  └─ Validación en cliente:
│     ├─ Título no vacío
│     ├─ Fecha límite > fecha inicio
│     └─ Campos requeridos completos
│
├─ Submit → POST /api/admin/tareas
│  └─ Headers: Authorization: Bearer {JWT}
│
├─ Backend valida:
│  ├─ JWT válido y corresponde a Admin
│  ├─ Si hay responsable: usuario destino existe y está activo
│  └─ Todos los campos obligatorios presentes
│
├─ Insert en tabla tareas:
│  ├─ id: generado por BD
│  ├─ titulo, descripcion
│  ├─ fecha_inicio, fecha_limite
│  ├─ estado_id: seleccionado
│  ├─ prioridad_id: seleccionado
│  ├─ asignado_a: usuario_id | null
│  ├─ creado_por: admin_id
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
├─ Opción A: /admin/tareas → editar campo asignado_a
├─ Opción B: /admin/asignaciones → POST /api/admin/asignar
├─ Validaciones:
│  ├─ Usuario existe y está activo
│  └─ Tarea sigue disponible para asignación
│
└─ Update successful → Notificación + recarga
```

#### Flujo: Alerta admin → user (banner + confirmación)

```
Admin en /admin/dashboard → Selecciona responsable
│
├─ Click "Enviar alerta"
│  ├─ Modal de alerta
│  ├─ Campo mensaje (1-500 chars)
│  └─ Submit
│
├─ RPC: public.crear_alerta_usuario(p_usuario_id, p_creado_por, p_mensaje)
│  ├─ Inserta alerta activa
│  └─ Si ya existe activa para ese user, la reemplaza (upsert)
│
├─ User en /user/dashboard
│  ├─ Escucha realtime sobre tabla alertas_usuario
│  ├─ Muestra banner con mensaje
│  └─ Click "OK / Enterado"
│
├─ RPC: public.confirmar_alerta_usuario(p_alerta_id, p_usuario_id)
│  ├─ Marca alerta como inactiva
│  ├─ Registra confirmada_at / confirmada_por
│  └─ Mantiene admin_resuelta_visible_hasta por 12 horas
│
└─ Admin visualiza estado temporal en dashboard:
   ├─ pendiente
   ├─ confirmada_visible_admin
   └─ cerrada
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
├─ Recibir alertas individuales en banner del dashboard
├─ Confirmar lectura de alerta con acción "OK / Enterado"
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
   ├─ Banner de alerta individual (si existe alerta activa)
   ├─ Confirmación de lectura de alerta
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
├─ TAREAS
│  ├─ Canales: realtime-tareas-admin, realtime-tareas-user
│  ├─ Tabla: tareas
│  └─ Eventos: INSERT, UPDATE, DELETE
│
├─ ALERTAS USUARIO
│  ├─ Admin: realtime-alertas-admin (tabla alertas_usuario)
│  ├─ User: realtime-alertas-user-{usuario_id} (filtro por usuario_id)
│  ├─ Eventos: INSERT, UPDATE, DELETE
│  └─ Requiere publicación en supabase_realtime para alertas_usuario
│
└─ Callback:
   ├─ Detecta cambio
   ├─ Recarga lista de tareas o alertas (GET/consulta directa)
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

COMENTARIOS_TAREA
├─ id (UUID, PK)
├─ tarea_id (FK → tareas)
├─ usuario_id (FK → usuarios)
├─ contenido (text)
├─ created_at (datetime)
└─ updated_at (datetime)

ALERTAS_USUARIO
├─ id (UUID, PK)
├─ usuario_id (FK → usuarios)
├─ creado_por (FK → usuarios)
├─ mensaje (1-500)
├─ activa (boolean)
├─ enviada_at (datetime)
├─ confirmada_at (datetime, nullable)
├─ confirmada_por (FK → usuarios, nullable)
├─ admin_resuelta_visible_hasta (datetime, nullable)
└─ created_at / updated_at

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
Admin combina /admin/dashboard + /admin/estadisticas + /admin/tareas
│
├─ Dashboard global (/admin/dashboard)
│  ├─ Query: SELECT COUNT(*) FROM tareas
│  │         + joins de responsables / plantas / países
│  └─ Visualización: tarjetas y bloques operativos
│
├─ Estadísticas (/admin/estadisticas)
│  ├─ Query base: SELECT tareas + catálogos relacionados
│  ├─ Métricas derivadas: avance, vencidas, por vencer, evidencia, revisión
│  └─ Visualización: PieChart, BarChart, rankings y KPIs
│
├─ Exportación (/admin/tareas)
│  ├─ Fuente: tareas filtradas en memoria
│  ├─ Formato: CSV UTF-8
│  └─ Uso: compartir cortes operativos o análisis rápido
│
└─ Lectura de riesgo
   ├─ Responsable con más vencidas
   ├─ Buckets de vencimiento
   └─ Cobertura de revisión / evidencia
```

---

## 🚀 Resumen de flujos

| Flujo | Inicio | Fin | Duración esperada | Roles |
|-------|--------|-----|-------------------|-------|
| Login | /login | /dashboard | < 2 seg | Todos |
| Crear tarea | Admin/tareas | BD | < 1 seg | Admin, Supervisor |
| Actualizar tarea | User/tarea/[id] | BD | < 1 seg | User |
| Cargar evidencia | User/tarea/[id] | Storage | < 5 seg (según tamaño) | User |
| Reasignar tarea | Admin/tareas | BD | < 1 seg | Admin |
| Ver estadísticas admin | Admin/estadisticas | KPIs y charts | < 2 seg | Admin |
| Ver dashboard | / | Estadísticas | < 2 seg | Todos |

---

**Próxima actualización:** Q2 2026 cuando se implemente role Supervisor completamente.
