# 🏗️ Documento de Arquitectura — ITFlow

**Versión:** 2.0 | **Fecha:** 17/04/2026 (Actualizado) | **Autor:** Equipo de desarrollo

> **Estado:** 2 de 3 roles implementados (Admin + User en uso; Supervisor en desarrollo)

---

## 📋 Tabla de contenidos

1. [Visión general](#visión-general)
2. [Componentes principales](#componentes-principales)
3. [Flujos críticos](#flujos-críticos)
4. [Hallazgos técnicos](#hallazgos-técnicos)
5. [Patrones y convenciones](#patrones-y-convenciones)
6. [Recomendaciones](#recomendaciones)

---

## 🎯 Visión general

**ITFlow** es un sistema de gestión de tareas multirrol con 2 roles implementados actualmente:

- **🔴 ADMIN** — Monitorea y gestiona todas las tareas del sistema
- **🟢 USER** — Ejecuta tareas asignadas y actualiza progreso

El rol 🟡 **SUPERVISOR** está en desarrollo.

**Características principales:**

- Dashboard "Tablero de Tareas por Región" para análisis ejecutivo
- Sistema de comentarios en tiempo real
- Carga de evidencias (archivos)
- Filtros avanzados por usuario, prioridad, estado, planta
- Protección de rutas por rol

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (Next.js 16)                    │
│ ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐   │
│ │  UI/Pages    │─▶│  AuthContext │◀─┤  useProtegerRuta │   │
│ │ (Admin/Sup   │  │  (JWT Token) │  │   (Autorización) │   │
│ │  /User)      │  └──────────────┘  └──────────────────┘   │
│ └─────┬────────┘         │                                    │
│       │                  │                                    │
│ ┌─────▼──────────────────▼──────────────────────────────┐   │
│ │           Next.js API Routes (/api/...)              │   │
│ │  (Validación + Lógica de negocio + Filtrado RLS)     │   │
│ └──────────────┬───────────────────────────────────────┘   │
│                │                                             │
└────────────────┼──────────────────────────────────────────┘
                 │
         ┌───────▼──────────────┐
         │  Supabase Backend    │
         ├──────────────────────┤
         │ • PostgreSQL DB      │
         │ • Row Level Security │
         │ • JWT Authentication │
         │ • Real-time Queries  │
         └──────────────────────┘
```

---

## 🔧 Componentes principales

### 1. **Autenticación (AuthContext)**

**Archivo:** `src/context/AuthContext.js`

```javascript
{
  usuario: {                    // Datos de Supabase Auth
    id,
    email,
    created_at
  },
  usuarioDetalles: {            // Datos de BD
    id,
    email,
    nombre_completo,
    estado: 'activo',
    rol: { id, nombre, descripcion },
    planta: { id, nombre, pais: { id, nombre } }
  },
  cargando: boolean,
  error: null|string
}
```

**Flujo:**

1. Componente monta → `obtenerSesion()`
2. Obtiene JWT de Supabase Auth
3. Carga detalles del usuario desde tabla `usuarios`
4. Escucha cambios de sesión con `onAuthStateChange`
5. Actualiza estado global

**Métodos expuestos:**

- `login(email, password)` → autentica usuario
- `registro(email, password)` → crea nueva cuenta
- `logout()` → limpia sesión

---

### 2. **Protección de rutas (useProtegerRuta)**

**Archivo:** `src/hooks/useProtegerRuta.js`

Hooks específicos por rol que validan acceso:

```javascript
useAdmin(); // Redirige a /login si no es admin
useSupervisor(); // Redirige a /login si no es supervisor
useUser(); // Redirige a /login si no es user
```

**Lógica:**

```
1. Obtiene usuarioDetalles del AuthContext
2. Verifica rol usando permisos.js
3. Si no tiene permiso → router.push('/login')
4. Retorna { cargando, usuarioDetalles }
```

---

### 3. **Funciones de permisos**

**Archivo:** `src/lib/permisos.js`

Define todas las reglas de negocio:

| Función                    | Admin    | Supervisor | User     |
| -------------------------- | -------- | ---------- | -------- |
| `esAdmin()`                | ✅       | ❌         | ❌       |
| `esSupervisor()`           | ❌       | ✅         | ❌       |
| `esUser()`                 | ❌       | ❌         | ✅       |
| `puedeVerTareas()`         | ✅ Todas | ✅ Planta  | ✅ Suyas |
| `puedeCrearTareas()`       | ✅       | ✅         | ❌       |
| `puedeAsignarTareas()`     | ✅       | ✅         | ❌       |
| `puedeGestionarUsuarios()` | ✅       | ❌         | ❌       |

---

### 4. **APIs Rest**

#### **Admin APIs** (`/api/admin/`):

- `POST /admin/asignar` → Asignar tarea a usuario
- `POST /admin/crear-usuario` → Crear usuario
- `GET /admin/usuarios/` → Listar usuarios (con paginación)
- `POST /admin/usuarios/` → Crear usuario
- `PUT /admin/usuarios/[id]` → Actualizar usuario
- `DELETE /admin/usuarios/[id]` → Eliminar usuario

#### **User APIs** (`/api/user/`):

- `GET /user/tareas` → Obtener mis tareas (solo las asignadas)
- `PUT /user/tareas/[id]` → Actualizar mi tarea (estado, avance, evidencia)

**Validación en todas las APIs:**

```javascript
// Pseudocódigo
1. Obtener token del header Authorization
2. Verificar token válido con Supabase
3. Obtener usuarioDetalles
4. Validar permiso (ej: puedeCrearTareas)
5. Aplicar filtro RLS (ej: solo su planta)
6. Ejecutar query + retornar datos
```

---

## 🔄 Flujos críticos

### Flujo 1: Login y redirección

```
Usuario accede /
  ↓
useEffect en index.js chequea cargando + usuarioDetalles
  ↓
¿Cargando? → Muestra spinner
  ↓
¿usuarioDetalles existe? → Sí: router.push(obtenerRutaPrincipal)
  ↓
  (Admin)         (Supervisor)       (User)
   ↓                ↓                  ↓
/admin/dashboard  /supervisor/dash   /user/dashboard

¿No existe usuarioDetalles? → router.push('/login')
```

### Flujo 2: Crear y asignar tarea (Admin/Supervisor)

```
Supervisor accede /supervisor/tareas → Botón "Nueva tarea"
  ↓
Abre Modal con formulario (FormularioMulti)
  ↓
Ingresa: título, descripción, fecha_límite, prioridad, usuario_destino
  ↓
Submit → POST /api/admin/asignar (con JWT)
  ↓
  Backend valida:
  ├─ ¿Es supervisor o admin?
  ├─ ¿Usuario destino existe?
  └─ ¿Usuario destino es de su planta?
  ↓
Insert en tabla tareas
  ↓
Retorna 200 + tarea creada
  ↓
Frontend actualiza lista local
```

### Flujo 3: Actualizar tarea (User)

```
User accede /user/tareas → Ve su tarea asignada
  ↓
Click en tarea → /user/tarea/[id]
  ↓
Carga detalles: estado, avance, evidencia, observaciones
  ↓
Modifica:
├─ Porcentaje de avance (0-100%)
├─ Estado (de dropdown)
├─ Carga evidencia (URL/imagen)
└─ Observaciones
  ↓
Submit → PUT /api/user/tareas/[id] (con JWT)
  ↓
  Backend valida:
  ├─ ¿Es user?
  ├─ ¿Es la tarea suya?
  └─ ¿Valores están en rango válido?
  ↓
Update tabla tareas
  ↓
Retorna 200 + tarea actualizada
```

---

## 🔍 Hallazgos técnicos

### ✅ Fortalezas

1. **Separación de responsabilidades clara**
   - Context para estado global
   - Hooks para lógica reutilizable
   - Components para UI
   - Lib para utilidades

2. **Seguridad multinivel**
   - Validación en cliente (AuthContext)
   - Validación en API (permisos.js)
   - Filtrado a nivel BD (Supabase RLS)

3. **Reutilización de componentes**
   - `FormularioMulti` para crear/editar cualquier recurso
   - `TablaGenerica` para listar datos
   - `Modal` para confirmaciones

4. **Escalabilidad**
   - Fácil agregar nuevos roles
   - Fácil agregar nuevas funcionalidades
   - Estructura modular

### ⚠️ Áreas de mejora

1. **Manejo de errores inconsistente**
   - Algunos componentes no capturan errores de API
   - Falta validación de datos antes de actualizar
   - Recomendación: Crear hook `useApi` centralizado

2. **Performance**
   - Las queries cargan muchas relaciones (N+1 problem potencial)
   - Recomendación: Usar select específico de columnas + caching

3. **Testing**
   - No hay tests unitarios
   - Vitest + Vitest UI instalados pero sin uso
   - Recomendación: Cobertura mínima 60% en datos críticos

4. **Documentación de APIs**
   - No existe Swagger/OpenAPI
   - Endpoints documentados en README pero sin detalles de parámetros
   - Recomendación: Usar `next-swagger-doc`

5. **Validación de datos**
   - Falta validación server-side en algunos endpoints
   - Recomendación: Agregar `zod` o `joi` para schemas

### ⚠️ Vulnerabilidades detectadas

**Ejecutado:** `npm audit` el 17/04/2026

- **5 vulnerabilidades moderadas** (todas en devDeps, impacto solo desarrollo)
- **Removida:** `@supabase/ssr@0.4.1` (dependencia innecesaria)
- **Resultado:** Reducción de 7 → 5 vulnerabilidades

Ver [Security Audit](#) para detalles.

---

## 📐 Patrones y convenciones

### Naming Conventions

| Tipo           | Formato                   | Ejemplo                |
| -------------- | ------------------------- | ---------------------- |
| Componentes    | PascalCase                | `DashboardAdmin.js`    |
| Carpetas       | kebab-case                | `admin-dashboards/`    |
| Variables      | camelCase                 | `usuarioDetalles`      |
| Constantes     | UPPER_SNAKE_CASE          | `ROLES.ADMIN`          |
| Archivos utils | camelCase                 | `formateo.js`          |
| Hooks          | `use` prefix              | `useAuth`              |
| CSS Modules    | `[Componente].module.css` | `Dashboard.module.css` |

### Estructura de componentes

```javascript
// Imports
import { useAuth } from '@context/AuthContext';
import styles from '@styles/MyComponent.module.css';

// Componente
export default function MyComponent() {
  // Estado
  const [data, setData] = useState(null);

  // Hooks
  const { usuarioDetalles } = useAuth();

  // Efectos
  useEffect(() => { ... }, []);

  // Renders condicionales
  if (cargando) return <div>Cargando...</div>;

  // JSX
  return <div className={styles.container}>...</div>;
}
```

### Patrón de rutas protegidas

```javascript
// En pagina protegida
import { useSupervisor } from '@hooks/useProtegerRuta';

export default function SupervisorPage() {
  const { cargando } = useSupervisor(); // Redirige si no tiene acceso

  if (cargando) return <p>Cargando...</p>;

  return <Layout titulo="Dashboard">{/* Contenido supervisor */}</Layout>;
}
```

---

## 🚀 Recomendaciones

### Corto plazo

- [ ] Agregar validación Zod en APIs
- [ ] Crear hook `useApi` para manejo centralizado de requests
- [ ] Documentar endpoints con Swagger
- [ ] Tests unitarios para `permisos.js` y `auth.js`

### Mediano plazo

- [ ] Implementar paginación en listados
- [ ] Agregar búsqueda/filtrado avanzado
- [ ] Optimizar queries (evitar N+1)
- [ ] Implementar caché con SWR o React Query

### Largo plazo

- [ ] Migrar a TypeScript
- [ ] E2E tests con Cypress/Playwright
- [ ] Migraciones de BD versionadas
- [ ] CI/CD pipeline completo
- [ ] Monitoreo y logging centralizado

---

## 📞 Contacto y cambios

**Última revisión:** 17/04/2026  
**Próxima revisión:** Q2 2026  
**Responsable:** Equipo de desarrollo
