# 📊 ITFlow — Sistema de Gestión de Tareas y Flujo de TI

**ITFlow** es una aplicación web moderna para gestionar tareas, proyectos y flujos de trabajo en equipos de TI. Permite asignar, monitorear y completar tareas con roles jerárquicos, dashboards específicos y trazabilidad completa.

**Tipo:** Aplicación SaaS de gestión de tareas multirrol.  
**Stack:** Next.js 16, React 19, Supabase, CSS Modules  
**Última actualización:** 26 de abril de 2026  
**Status:** ✅ 3 roles en producción (Admin, Supervisor, User)

**Historial de cambios:** ver [CHANGELOG.md](./CHANGELOG.md)

---

## 🎯 Características principales

✅ **Autenticación segura** — Login con Supabase Auth  
✅ **Gestión de roles** — Admin, Supervisor, User con permisos granulares  
✅ **Dashboards personalizados** — Cada rol ve vistas únicas  
✅ **Asignación de tareas** — Admins y supervisores asignan a usuarios  
✅ **Seguimiento en tiempo real** — Estados, prioridades, porcentaje de avance  
✅ **Alertas admin → user en realtime** — Banner individual con confirmación "OK / Enterado"  
✅ **Trazabilidad de alertas** — El admin ve confirmación temporal tras lectura del usuario  
✅ **Gestión multiplantas** — Soporte para múltiples ubicaciones y países  
✅ **Reportes administrativos** — Estadísticas globales para admins  
✅ **Panel supervisor en producción** — Gestión local de tareas por planta

---

## 🏗️ Arquitectura general

```
ITFlow
├── Frontend (Next.js 16 - Pages Router)
│   ├── Autenticación → AuthContext
│   ├── Dashboards por rol → Admin / Supervisor / User
│   ├── Gestión de tareas → CRUD tareas
│   └── UI Components → Reutilizables
│
└── Backend (API Routes + Supabase)
    ├── Autenticación → Supabase Auth
    ├── Base de datos → PostgreSQL (Supabase)
    └── APIs REST → /api/admin, /api/user, /api/supervisor
```

---

## 📁 Estructura del proyecto

```
src/
├── pages/
│   ├── _app.js                          # Configuración global
│   ├── _document.js                     # HTML base
│   ├── index.js                         # Home (redirección según rol)
│   ├── login.js                         # Página de login
│   ├── admin/                           # Dashboard y gestiones admin
│   │   ├── dashboard.js                 # Estadísticas globales
│   │   ├── gestion.js                   # Gestión de datos maestros
│   │   ├── tareas.js                    # Listado de todas las tareas
│   │   └── asignaciones.js              # Asignar tareas a usuarios
│   ├── supervisor/                      # Vistas supervisor
│   │   ├── dashboard.js                 # Estadísticas de la planta
│   │   ├── tareas.js                    # Tareas de la planta
│   │   └── asignaciones.js              # Asignar tareas a usuarios
│   ├── user/                            # Vistas usuario operativo
│   │   ├── dashboard.js                 # Mis tareas y estadísticas
│   │   ├── tareas.js                    # Lista de mis tareas
│   │   └── tarea/[id].js                # Detalle y actualizar tarea
│   └── api/
│       ├── admin/                       # APIs administrativas
│       │   ├── asignar.js
│       │   ├── crear-usuario.js
│       │   └── [recursos]/              # CRUD plantas, países, usuarios
│       └── user/
│           └── tareas/                  # APIs de tareas del usuario
│
├── components/
│   ├── Layout.js                        # Layout principal (header + sidebar)
│   ├── EncabezadoPrincipal.js          # Header/navegación
│   ├── Sidebar.js                       # Menú lateral
│   ├── TablaGenerica.js                 # Tabla reutilizable
│   ├── FormularioMulti.js               # Formulario genérico
│   ├── Modal.js                         # Modal reutilizable
│   └── Tabs.js                          # Sistema de pestañas
│
├── context/
│   └── AuthContext.js                   # Estado global de autenticación
│
├── hooks/
│   ├── useAuth.js                       # Hook para obtener estado auth
│   ├── useCargaDatos.js                 # Hook para cargar datos
│   └── useProtegerRuta.js               # Hooks de protección por rol
│
├── lib/
│   ├── supabase.js                      # Cliente Supabase (público)
│   ├── supabaseClient.js                # Alias cliente
│   ├── supabaseAdmin.js                 # Cliente admin (server-side)
│   ├── permisos.js                      # Funciones de autorización
│   ├── apiHelpers.js                    # Helpers para APIs
│   └── auth.js                          # Utilidades de autenticación
│
├── styles/
│   ├── global.css                       # Estilos globales
│   └── [Componente].module.css          # CSS modules por componente
│
└── utils/
    └── formateo.js                      # Funciones de formato
```

---

## 👥 Roles y permisos

**Estado actual:** 3 de 3 roles implementados en producción ✅

### 🔴 **ADMIN** (Administrador) — ✅ EN PRODUCCIÓN

- **Acceso:** Sistema completo
- **Dashboard:** "Tablero de Tareas por Región" — Carga por responsable, Estado global %, Riesgo actual
- **Tareas:** Ver todas, crear, editar, cambiar estado
- **Alertas:** Enviar alerta directa por usuario desde dashboard y ver estado de lectura
- **Filtros:** Por usuario, prioridad, estado, planta
- **Monitoreo:** Detectar desbalance de carga de trabajo

### 🟢 **USER** (Operario/Técnico) — ✅ EN PRODUCCIÓN

- **Acceso:** Solo sus tareas asignadas
- **Dashboard:** "Mis Tareas" — Activas, En proceso, Vencidas, % Avance
- **Tareas:** Ver solo asignadas, actualizar estado y avance
- **Alertas:** Recibir banner individual en dashboard y confirmar lectura
- **Evidencias:** Cargar archivos (JPG, PNG, PDF máx 10 MB)
- **Comentarios:** Sistema de comunicación en cada tarea

### 🟡 **SUPERVISOR** (Jefe de planta) — ✅ EN PRODUCCIÓN

- **Acceso:** Tareas de su planta únicamente
- **Dashboard:** Estadísticas locales, tareas activas, subordinados
- **Tareas:** Crear, asignar a usuarios de su planta, revisar completadas
- **Operaciones:** Cambiar estado, agregar observaciones, ver evidencias
- **Filtros:** Por usuario, prioridad, estado (solo su planta)
- **Monitoreo:** Carga de trabajo de subordinados, tareas vencidas locales

---

## 🗄️ Modelo de datos

```
USUARIOS
├── id (PK)
├── email
├── nombre_completo
├── estado (activo/inactivo)
├── rol_id (FK) → ROLES
└── planta_id (FK) → PLANTAS

TAREAS
├── id (PK)
├── titulo
├── descripcion
├── fecha_inicio
├── fecha_limite
├── estado_id (FK) → ESTADOS_TAREA
├── prioridad_id (FK) → PRIORIDADES
├── porcentaje_avance (0-100)
├── asignado_a (FK) → USUARIOS
├── creado_por (FK) → USUARIOS
├── supervisado_por (FK) → USUARIOS
├── planta_id (FK) → PLANTAS
├── observaciones
├── evidencia (URL)
└── revisado (boolean)

PLANTAS
├── id (PK)
├── nombre
├── pais_id (FK) → PAISES

PAISES
├── id (PK)
└── nombre

ROLES
├── id (PK)
├── nombre (admin/supervisor/user)
└── descripcion

ESTADOS_TAREA
├── id (PK)
├── nombre (pendiente/en_proceso/completado)
└── color_hex

PRIORIDADES
├── id (PK)
└── nombre (baja/media/alta/urgente)

ALERTAS_USUARIO
├── id (PK)
├── usuario_id (FK) → USUARIOS (destinatario)
├── creado_por (FK) → USUARIOS (admin)
├── mensaje (1-500 chars)
├── activa (true hasta confirmación user)
├── enviada_at
├── confirmada_at
├── confirmada_por (FK) → USUARIOS
└── admin_resuelta_visible_hasta (visibilidad temporal para admin)
```

---

## 🚀 Instalación y configuración

### Requisitos previos

- Node.js 18+
- npm o yarn
- Cuenta Supabase activa

### 1. Instalación de dependencias

```bash
npm install
```

### 2. Configurar variables de entorno

Crea un archivo `.env.local` en la raíz del proyecto:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-clave-anonima
SUPABASE_SERVICE_ROLE_KEY=tu-clave-servicio

# (Opcional) Configuración adicional
NODE_ENV=development
```

### 3. Inicializar Supabase (si es nuevo)

- Crea tablas según el modelo de datos arriba
- Habilita autenticación con email/contraseña
- Configura políticas RLS (Row Level Security)

### 4. Ejecutar en desarrollo

```bash
npm run dev
```

Accede a: [http://localhost:3000](http://localhost:3000)

---

## 🛠 Scripts disponibles

```bash
npm run dev              # Inicia servidor de desarrollo (puerto 3000)
npm run build            # Compila para producción
npm run start            # Inicia servidor de producción
npm run lint             # Ejecuta ESLint
npm run format           # Formatea código con Prettier
npm test                 # Ejecuta unit tests con Vitest
npm run test:ui          # Inicia Vitest con UI
npx npm audit            # Audita vulnerabilidades de dependencias
```

---

## 📊 Flujo de usuario por rol

### 1️⃣ Login

```
Usuario accede a /login
↓
Ingresa email + contraseña
↓
Supabase valida credenciales
↓
AuthContext carga datos del usuario + rol
↓
Redirección automática al dashboard según rol
```

### 2️⃣ Dashboard ADMIN ("Tablero de Tareas por Región")

```
Ve 3 secciones principales:
├─ CARGA POR RESPONSABLE: ¿Cuántas tareas cada responsable?
├─ ESTADO GLOBAL: ¿Qué % está completado?
└─ RIESGO ACTUAL: ¿Quién tiene tareas vencidas?
↓
Acceso a panel completo: /admin/tareas
├─ Ver todas las tareas del sistema
├─ Crear nuevas tareas
├─ Editar detalles y cambiar estado
├─ Ver evidencias cargadas por usuarios
└─ Abrir modal de comentarios desde botón "Comentarios"
↓
Dashboard /admin/dashboard
├─ Enviar alerta individual a responsable
└─ Ver estado visual: pendiente / confirmada visible
```

### 3️⃣ Dashboard USER ("Mis Tareas")

```
Ve resumen personalizado:
├─ Activas (sin completar)
├─ En proceso
├─ Vencidas
└─ % Avance promedio
↓
Click en tarea → "Detalle de Tarea"
├─ Ver información completa
├─ Actualizar estado
├─ Actualizar % avance (slider)
├─ Agregar comentarios
├─ Cargar evidencia (archivos)
↓
Si hay alerta activa:
├─ Muestra banner en /user/dashboard
└─ User confirma con "OK / Enterado"
```

---

## 🔐 Seguridad

- **Autenticación:** Supabase JWT
- **Autorización:** Verificación de rol en cliente + validación en servidor
- **Protección de rutas:** Hooks `useProtegerRuta` redirigen si no tiene permisos
- **Validación de datos:** APIs verifican rol y filtran resultados
- **Variables sensibles:** Service role key solo en servidor (`.env.local` no se expone)

---

## 📦 Dependencias principales

| Paquete                 | Versión  | Propósito              |
| ----------------------- | -------- | ---------------------- |
| `next`                  | ^16.1.0  | Framework React/SSR    |
| `react`                 | ^18.3.0  | Librería UI            |
| `@supabase/supabase-js` | ^2.45.0  | Cliente de BD y auth   |
| `recharts`              | ^2.12.0  | Gráficos (dashboards)  |
| `react-icons`           | ^5.0.0   | Iconos SVG             |
| `lucide-react`          | ^0.395.0 | Más iconos             |
| `date-fns`              | ^3.6.0   | Manipulación de fechas |

---

## ⚠️ Vulnerabilidades conocidas

Después de correr `npm audit` el 17/04/2026:

- **5 vulnerabilidades moderadas** en dependencias de desarrollo (`vitest`, `vite`, `esbuild`)
- **Impacto:** Solo en desarrollo, no afecta producción
- **Recomendación:** Actualizar cuando sea necesario con `npm audit fix --force`

Ver [VULNERABILITIES.md](./VULNERABILITIES.md) para detalles.

---

## 🤝 Contribuir

1. Crea una rama desde `main`
2. Haz cambios y testea
3. Abre un PR con descripción del cambio
4. Espera revisión

---

## 📞 Soporte

Para reportar bugs o sugerencias, contacta al equipo de desarrollo.

---

**Creado:** 2024 | **Última actualización:** 22/04/2026
