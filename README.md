# ITFlow

**Gestion clara de tareas para equipos de TI** 🧭

ITFlow ayuda a que administradores, supervisores y usuarios sepan que tareas hay, quien las tiene asignadas, en que estado van y que pendientes necesitan atencion. La idea es simple: menos seguimiento por mensajes sueltos y mas visibilidad en un solo lugar.

---

## Vista Rapida

| Dato | Estado actual |
| --- | --- |
| Version de la app | `1.4.0` |
| Estado funcional | 3 roles activos: Admin, Supervisor y User ✅ |
| Tipo de app | Aplicacion web privada para gestion operativa de tareas |
| Framework | Next.js `^16.1.0` con Pages Router |
| Lenguaje | JavaScript |
| Base de datos y login | Supabase |
| Estilos | CSS Modules |
| Iconos | React Icons y Lucide React |
| Ultima revision de este README | 27 de abril de 2026 |

---

## Que Puedes Hacer con ITFlow

- 📌 **Ver tareas por rol:** cada persona entra a una vista pensada para su trabajo.
- 👥 **Asignar responsables:** admin y supervisor pueden organizar tareas segun permisos.
- 📊 **Revisar avance:** estados, prioridades, fechas y porcentaje de progreso.
- 🚨 **Detectar atrasos:** las vistas resaltan tareas vencidas o cercanas a vencer.
- 💬 **Comentar tareas:** cada tarea puede tener conversacion y seguimiento.
- 📎 **Subir evidencias:** imagenes, PDF u otros archivos permitidos desde el detalle de tarea.
- 🔔 **Enviar alertas:** el admin puede mandar avisos directos a usuarios y ver si fueron atendidos.
- 🌎 **Trabajar por planta y pais:** la informacion se organiza por ubicacion cuando aplica.
- ⚡ **Actualizar en tiempo real:** dashboards y listas se refrescan cuando cambian las tareas.

---

## Para Quien Es

### Admin 🔴

El administrador tiene una vista global del sistema.

Puede:

- Ver el **Tablero de Tareas por Region**.
- Revisar carga por responsable.
- Detectar tareas vencidas o usuarios con demasiada carga.
- Crear, editar, revisar y eliminar tareas.
- Gestionar paises, plantas y usuarios.
- Ver estadisticas del tablero.
- Enviar alertas individuales a responsables.
- Consultar evidencias y comentarios.

Rutas principales:

- `/admin/dashboard`
- `/admin/estadisticas`
- `/admin/gestion`
- `/admin/tareas`
- `/admin/asignaciones`

### Supervisor 🟡

El supervisor trabaja con su planta y sus usuarios supervisados.

Puede:

- Ver su **Tablero de supervisor**.
- Revisar su propio trabajo y el de usuarios supervisados.
- Filtrar por usuario, prioridad y estado.
- Crear tareas locales.
- Reasignar tareas dentro de su alcance.
- Ver evidencias y comentarios.
- Gestionar usuarios asignados a su supervision.

Rutas principales:

- `/supervisor/dashboard`
- `/supervisor/gestion`
- `/supervisor/tareas`
- `/supervisor/asignaciones`
- `/supervisor/tarea/[id]`

### User 🟢

El usuario ve solamente sus tareas asignadas.

Puede:

- Ver su dashboard personal con tareas activas, en proceso, vencidas y avance promedio.
- Abrir el detalle de cada tarea.
- Actualizar estado y porcentaje de avance.
- Agregar observaciones y comentarios.
- Subir evidencias.
- Confirmar alertas recibidas con **OK / Enterado**.

Rutas principales:

- `/user/dashboard`
- `/user/tareas`
- `/user/tarea/[id]`

---

## Como Se Ve el Flujo Diario

```text
1. La persona inicia sesion en /login.
2. ITFlow identifica su rol.
3. La app la envia a su dashboard.
4. Desde ahi revisa tareas, filtros, vencimientos y avance.
5. Si trabaja una tarea, abre el detalle y actualiza progreso.
6. Si hace falta, agrega comentario o evidencia.
7. Los paneles se actualizan para que otros roles vean el cambio.
```

---

## Funciones Destacadas por Pantalla

| Pantalla | Que muestra |
| --- | --- |
| Login | Entrada con usuario y contrasena usando Supabase Auth |
| Home `/` | Redireccion automatica segun rol |
| Admin Dashboard | Carga por responsable, estado global, riesgo actual y alertas |
| Admin Estadisticas | Lectura del portafolio, graficos y analisis por fechas |
| Admin Gestion | Catalogos de paises, plantas y usuarios |
| Admin Tareas | Lista global, filtros, creacion, edicion, evidencias y comentarios |
| Admin Asignaciones | Asignacion centralizada y seguimiento operativo |
| Supervisor Dashboard | Tareas propias, tareas de supervisados, riesgo local y filtros |
| Supervisor Gestion | Asignacion y desasignacion de usuarios supervisados |
| Supervisor Tareas | Tareas del supervisor con filtros y reasignacion |
| Supervisor Asignaciones | Gestion local de tareas y creacion desde supervisor |
| User Dashboard | Resumen personal, filtros y alerta activa si existe |
| User Tareas | Lista de tareas asignadas |
| Detalle de Tarea | Estado, avance, observaciones, comentarios y evidencias |

---

## Tecnologias y Paquetes

ITFlow esta construido con:

| Paquete | Version en `package.json` | Uso |
| --- | --- | --- |
| `next` | `^16.1.0` | Aplicacion web con Pages Router |
| `react` | `^18.3.0` | Interfaz de usuario |
| `react-dom` | `^18.3.0` | Renderizado React |
| `@supabase/supabase-js` | `^2.45.0` | Login, base de datos, realtime y storage |
| `react-icons` | `^5.0.0` | Iconos de la interfaz |
| `lucide-react` | `^0.395.0` | Iconos adicionales |
| `recharts` | `^2.12.0` | Graficos |
| `chart.js` | `^4.4.1` | Graficos |
| `react-chartjs-2` | `^5.2.0` | Integracion React para Chart.js |
| `date-fns` | `^3.6.0` | Manejo de fechas |
| `vitest` | `^1.1.0` | Pruebas |
| `eslint` | `^9.0.0` | Revision de codigo |
| `prettier` | `^3.1.1` | Formato de codigo |

Nota: el repositorio tiene `typescript` como dependencia de desarrollo y un script `type-check`, pero el codigo de la app esta escrito en JavaScript. No se usa App Router ni Tailwind.

---

## Estructura Principal

```text
src/
├─ pages/                 Vistas y API routes de Next.js
│  ├─ admin/              Pantallas de administrador
│  ├─ supervisor/         Pantallas de supervisor
│  ├─ user/               Pantallas de usuario operativo
│  └─ api/                Endpoints internos
├─ components/            Layout, sidebar, modales, tablas y formularios
├─ context/               Estado de sesion y perfil del usuario
├─ hooks/                 Proteccion de rutas y carga de datos
├─ lib/                   Clientes Supabase, permisos y helpers
├─ styles/                CSS Modules y estilos globales
└─ utils/                 Utilidades de formato
```

Documentacion adicional:

```text
docs/
├─ 00_ESTADO_ACTUAL.md              Resumen vivo del estado real del proyecto
├─ 01_FLUJOS_DETALLADOS.md          Flujos funcionales y tecnicos
├─ 03_GUIA_ADMIN.md                 Guia para administradores
├─ 04_GUIA_USER.md                  Guia para usuarios
├─ 05_GUIA_SUPERVISOR.md            Guia para supervisores
├─ 06_INSTALACION_DEPLOYMENT.md     Instalacion y despliegue
├─ 11_GUIA_VALIDACION_RAPIDA.md     Pruebas rapidas de acceso por rol
├─ 09_INDICE_MAESTRO.md             Indice actualizado de lectura
└─ SUPABASE_ESQUEMA_Y_FLUJOS.md     Tablas, permisos y flujos de datos
```

---

## Instalacion Local

### 1. Requisitos

- Node.js 18 o superior.
- npm.
- Proyecto Supabase activo.
- Variables de entorno configuradas.

### 2. Instalar dependencias

```bash
npm install
```

### 3. Crear `.env.local`

Usa `.env.example` como plantilla:

```env
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key
BASE_URL=http://localhost:3000
```

Importante 🔐

- `NEXT_PUBLIC_SUPABASE_ANON_KEY` se puede usar en el cliente.
- `SUPABASE_SERVICE_ROLE_KEY` solo debe vivir en servidor o scripts seguros.
- Nunca subas `.env.local` al repositorio.

### 4. Levantar la app

```bash
npm run dev
```

Abre:

```text
http://localhost:3000
```

---

## Scripts Disponibles

| Comando | Para que sirve |
| --- | --- |
| `npm run dev` | Inicia la app en desarrollo |
| `npm run build` | Compila la app para produccion |
| `npm run start` | Ejecuta la version compilada |
| `npm run lint` | Revisa y corrige estilo con ESLint |
| `npm run format` | Formatea archivos de `src` |
| `npm test` | Ejecuta pruebas con Vitest |
| `npm run test:ui` | Abre la interfaz visual de Vitest |
| `npm run type-check` | Ejecuta `tsc --noEmit`; existe por tooling, aunque la app es JavaScript |

---

## Seguridad

ITFlow separa responsabilidades:

- 🔑 **Login:** Supabase Auth.
- 🧑‍💼 **Perfil y rol:** tabla `usuarios` conectada con `roles`.
- 🚪 **Rutas protegidas:** hooks como `useAdmin`, `useSupervisor` y `useUser`.
- 🧱 **APIs protegidas:** endpoints validan token y rol antes de responder.
- 🗄️ **Base de datos:** se espera RLS activo en Supabase para reforzar permisos.
- 🧰 **Clave de servicio:** `SUPABASE_SERVICE_ROLE_KEY` solo para backend y scripts autorizados.

Puntos a vigilar:

- Las APIs actuales leen el JWT y luego contrastan el usuario contra Supabase. Conviene mantener RLS fuerte y revisar validacion criptografica del token si se endurece seguridad.
- Supervisor debe seguir limitado por planta y usuarios supervisados.
- User no debe recibir tareas que no esten asignadas a su usuario.

---

## Vulnerabilidades Detectadas Hoy

Resultado de `npm audit --json` ejecutado el **27 de abril de 2026**:

| Severidad | Cantidad |
| --- | --- |
| Moderada | 7 |
| Alta | 0 |
| Critica | 0 |

Detalle importante:

- ⚠️ `postcss` `<8.5.10`, reportado via `next`: XSS al serializar CSS con `</style>` sin escapar. Aviso: `GHSA-qx2v-qp2m-jg93`.
- ⚠️ `esbuild` `<=0.24.2`, via `vite`: un sitio podria hacer peticiones al servidor de desarrollo y leer respuestas en ciertos escenarios. Aviso: `GHSA-67mh-4wv8-2f99`.
- ⚠️ `vite` `<=6.4.1`, via `vitest`: path traversal en mapas de dependencias optimizadas. Aviso: `GHSA-4w7w-66w2-5vf9`.
- ⚠️ `vitest`, `@vitest/ui` y `vite-node`: heredan avisos de Vite/esbuild y tienen fix mayor disponible hacia `4.1.5`.

Lectura practica:

- La mayoria del riesgo viene de herramientas de desarrollo y pruebas.
- El aviso de `postcss` aparece ligado a `next`, por lo que debe revisarse con cuidado antes de actualizar.
- `npm audit` sugiere cambios mayores en algunos paquetes; no conviene aplicar `--force` sin probar build, login, rutas por rol, evidencias y dashboards.

---

## Validacion Recomendada

Antes de dar un cambio por listo:

```bash
npm run lint
npm run build
npm test
npm audit
```

Prueba manual minima:

1. Entrar como admin y abrir dashboard, estadisticas, gestion, tareas y asignaciones.
2. Entrar como supervisor y confirmar que solo ve su alcance.
3. Entrar como user y confirmar que solo ve sus tareas.
4. Actualizar una tarea y comprobar que el cambio aparece en los paneles.
5. Subir una evidencia desde detalle de tarea.
6. Enviar una alerta desde admin y confirmarla desde user.

---

## Buenas Practicas para Trabajar en el Proyecto

- Mantener Pages Router.
- Mantener JavaScript.
- Usar CSS Modules.
- No mover logica sensible al cliente.
- Revisar `AuthContext.js`, `useProtegerRuta.js`, APIs y RLS cuando se toque login, roles o permisos.
- Hacer cambios pequenos y comprobables.
- Actualizar documentacion cuando cambie una vista, permiso o flujo.

---

## Historial

Consulta [CHANGELOG.md](./CHANGELOG.md) para ver cambios por version.

---

## Soporte

Para dudas de uso, reportes o mejoras, contacta al equipo responsable de ITFlow.

**ITFlow busca que el trabajo diario sea mas claro, trazable y facil de seguir.** ✅
