# Validación de Visibilidad y Acceso Cruzado

## Objetivo

Garantizar que cada rol (admin, supervisor, user) solo pueda ver y acceder a la información que le corresponde.

---

## 1. Matriz de Acceso por Rol

| Recurso                       | Admin          | Supervisor                      | User                      |
| ----------------------------- | -------------- | ------------------------------- | ------------------------- |
| `/api/admin/tareas`           | ✓ (todas)      | ✓ (filtrado su planta)          | ✗ (403)                   |
| `/api/admin/usuarios`         | ✓ (todas)      | ✗ (403)                         | ✗ (403)                   |
| `/api/supervisor/tareas`      | ✗ (403)        | ✓ (de subordinados)             | ✗ (403)                   |
| `/api/supervisor/tareas/[id]` | ✗ (403)        | ✓ (si subordinado)              | ✗ (403)                   |
| `/api/user/tareas`            | ✗ (403)        | ✗ (403)                         | ✓ (asignadas)             |
| `/api/user/tareas/[id]`       | ✗ (403)        | ✗ (403)                         | ✓ (asignadas)             |
| `/supervisor/*` (páginas)     | Redirige a `/` | ✓                               | Redirige a `/user/tareas` |
| `/admin/*` (páginas)          | ✓              | Redirige a `/supervisor/tareas` | Redirige a `/user/tareas` |
| `/user/*` (páginas)           | Redirige a `/` | Redirige a `/supervisor/tareas` | ✓                         |

---

## 2. Casos de Test API

### 2.1 Usuario Normal - Tareas

**Endpoint**: `GET /api/user/tareas`
**Rol**: User
**Validaciones**:

- ✓ Status 200
- ✓ Devuelve array (vacío si sin tareas)
- ✓ Todas las tareas tienen `asignado_a == usuario_id`
- ✓ No devuelve tareas de otros usuarios

**Test Manual**:

```bash
curl -H "Authorization: Bearer TOKEN_USER" \
  http://localhost:3000/api/user/tareas
```

### 2.2 Usuario Normal - Rechazado en Supervisor

**Endpoint**: `GET /api/supervisor/tareas`
**Rol**: User (intentando acceder)
**Validaciones**:

- ✓ Status 403 Forbidden
- ✓ Message: "Solo supervisores pueden acceder a este endpoint"

**Test Manual**:

```bash
curl -H "Authorization: Bearer TOKEN_USER" \
  http://localhost:3000/api/supervisor/tareas
```

### 2.3 Supervisor - Ve Solo Subordinados

**Endpoint**: `GET /api/supervisor/tareas`
**Rol**: Supervisor
**Validaciones**:

- ✓ Status 200
- ✓ Devuelve solo tareas asignadas a usuarios donde `supervisor_id == supervisor_id`
- ✓ No devuelve tareas de otros supervisores
- ✓ Incluye info de usuario asignado en `asignado_a_user`

**Test Manual**:

```bash
curl -H "Authorization: Bearer TOKEN_SUPERVISOR" \
  http://localhost:3000/api/supervisor/tareas
```

### 2.4 Supervisor - Detalle de Tarea Propia

**Endpoint**: `GET /api/supervisor/tareas/[id]`
**Rol**: Supervisor
**Validaciones**:

- ✓ Status 200 si tarea es de uno de sus subordinados
- ✓ Status 403 si tarea es de otro supervisor o sin asignación válida

**Test Manual** (con tarea válida):

```bash
curl -H "Authorization: Bearer TOKEN_SUPERVISOR" \
  http://localhost:3000/api/supervisor/tareas/[TAREA_ID]
```

### 2.5 Supervisor - NO puede reasignar fuera de subordinados

**Endpoint**: `PUT /api/supervisor/tareas/[id]`
**Rol**: Supervisor
**Body**: `{ "asignado_a": "USER_ID_AJENO" }`
**Validaciones**:

- ✓ Status 403 si intenta reasignar a usuario que NO supervisa
- ✓ Status 200 si reasigna a uno de sus subordinados

**Test Manual** (reasignar a ajeno):

```bash
curl -X PUT \
  -H "Authorization: Bearer TOKEN_SUPERVISOR" \
  -H "Content-Type: application/json" \
  -d '{"asignado_a": "UUID_DE_USER_AJENO"}' \
  http://localhost:3000/api/supervisor/tareas/[TAREA_ID]
```

---

## 3. Casos de Test de Rutas (Páginas)

### 3.1 Usuario intenta acceder a /supervisor/tareas

**Ruta**: `/supervisor/tareas`
**Usuario**: User
**Validación**:

- ✓ Redirige a `/user/tareas`
- ✓ Se verifica con `useProtegerRuta()` hook

### 3.2 User intenta acceder a /admin

**Ruta**: `/admin/dashboard`
**Usuario**: User
**Validación**:

- ✓ Redirige a `/user/tareas` o `/`
- ✓ Se verifica con `useProtegerRuta()` hook

### 3.3 Supervisor accede a /admin (sin permisos)

**Ruta**: `/admin/dashboard`
**Usuario**: Supervisor
**Validación**:

- ✓ Redirige a `/supervisor/tareas`
- ✓ No puede crear tareas, usuarios, etc.

---

## 4. Casos de Test de RLS (Row Level Security)

### 4.1 RLS en tabla tareas - usuarios

**Política**: Usuario solo ve sus propias tareas
**Test SQL**:

```sql
-- Como usuario normal, debería ver solo sus tareas
SELECT COUNT(*) FROM tareas
WHERE asignado_a = auth.uid();
-- Resultado: número de tareas asignadas a él

-- Como usuario normal, intentar SELECT directo SIN filtro
-- debería aplicar RLS automáticamente
SELECT * FROM tareas;
-- Resultado: solo sus tareas (RLS filtra automáticamente)
```

### 4.2 RLS en tabla comentarios_tarea

**Política**: Supervisor ve comentarios de tareas de subordinados
**Test SQL**:

```sql
-- Como supervisor, puedo ver comentarios de tareas de mis subordinados
SELECT ct.* FROM comentarios_tarea ct
JOIN tareas t ON ct.tarea_id = t.id
JOIN usuarios u ON t.asignado_a = u.id
WHERE u.supervisor_id = auth.uid();
```

### 4.3 RLS en tabla evidencias_tareas

**Política**: Acceso basado en asignación de tarea
**Test SQL**:

```sql
-- Como usuario, veo evidencias de mis tareas
SELECT et.* FROM evidencias_tareas et
JOIN tareas t ON et.tarea_id = t.id
WHERE t.asignado_a = auth.uid();

-- Como supervisor, veo evidencias de tareas de subordinados
SELECT et.* FROM evidencias_tareas et
JOIN tareas t ON et.tarea_id = t.id
JOIN usuarios u ON t.asignado_a = u.id
WHERE u.supervisor_id = auth.uid();
```

---

## 5. Checklist de Validación Manual

### Setup

- [ ] Al menos 1 usuario admin
- [ ] Al menos 1 supervisor con 2+ usuarios subordinados
- [ ] Al menos 3 usuarios normales (1 sin supervisor, 2 con supervisores diferentes)
- [ ] Mínimo 2 tareas por usuario

### Tests

- [ ] Admin puede ver todas las tareas del sistema
- [ ] Admin ve todos los usuarios
- [ ] Admin puede crear tareas para cualquier usuario
- [ ] Supervisor1 ve solo tareas de sus subordinados
- [ ] Supervisor1 NO ve tareas de Supervisor2
- [ ] Supervisor1 puede reasignar a sus subordinados
- [ ] Supervisor1 NO puede reasignar a usuarios de Supervisor2
- [ ] User1 ve solo sus propias tareas
- [ ] User1 NO ve tareas de User2 (otro usuario)
- [ ] User1 NO puede entrar a `/supervisor/tareas`
- [ ] Supervisor1 NO puede entrar a `/admin/dashboard`
- [ ] Dashboard muestra números consistentes con lista de tareas

### Base de Datos

- [ ] RLS está habilitado en todas las tablas críticas
- [ ] Políticas aplican correctamente al usuario autenticado
- [ ] No hay "SELECT \*" sin filtro en APIs públicas

---

## 6. Escenarios Críticos a Probar

### Escenario A: Transferencia de Tarea

1. Supervisor1 tiene User1 bajo su supervisión
2. Admin transfiere User1 bajo Supervisor2
3. **Validar**: Supervisor1 ya no ve tareas de User1
4. **Validar**: Supervisor2 ahora ve tareas de User1

### Escenario B: Múltiples Supervisores

1. Crear 2 supervisores con 2 usuarios cada uno
2. Supervisor1 intenta acceder a `/api/supervisor/tareas`
3. **Validar**: Solo ve tareas de sus 2 usuarios
4. **Validar**: No ve tareas del otro supervisor

### Escenario C: Eliminación de Acceso

1. Admin elimina rol de supervisor a un usuario
2. Usuario ahora es normal
3. **Validar**: Ya no puede acceder a `/supervisor/*`
4. **Validar**: Ya no puede acceder a `/api/supervisor/tareas`
5. **Validar**: Puede acceder a `/user/tareas` (si tiene tareas asignadas)

### Escenario D: Inactividad de Usuario

1. Supervisor asigna tarea a User1
2. Admin desactiva User1 (`estado = 'inactivo'`)
3. **Validar**: Supervisor sigue viendo la tarea
4. **Validar**: User1 no puede más loginearse
5. **Validar**: Admin puede ver el estado inactivo

---

## 7. Performance & Límites

### Tests de Volumen

- Supervisor con 100+ usuarios supervisados
  - **Validar**: `/api/supervisor/tareas` devuelve en < 2s
  - **Validar**: Dashboard carga sin timeout
- User con 1000+ tareas
  - **Validar**: Paginación funciona (si implementada)
  - **Validar**: No hay SELECT N+1

---

## 8. Pruebas de Seguridad

### 8.1 SQL Injection

- ✓ Validar que IDs en URL se sanitizan
- ✓ Validar que filtros usan parámetros preparados (Supabase lo hace)

### 8.2 Token Expirado

- ✓ Request con token expirado devuelve 401
- ✓ Frontend redirige a login

### 8.3 Token Modificado

- ✓ JWT inválido devuelve 403
- ✓ No se modifica respuesta si token es falso

### 8.4 Cross-Role

- ✓ User con token de Supervisor en `/api/user/` = 403
- ✓ Supervisor con token de User en `/api/supervisor/` = 403

---

## 9. Automatización (CI/CD)

```bash
# En pipeline CI, ejecutar:
npm run test:visibilidad

# Ejecutar tests API
npm run test:api-access

# Ejecutar tests de RLS
npm run test:rls
```

---

## 10. Registro de Issues Encontrados

Formato para documentar problemas:

```
### Issue #X: [Título]
- **Severidad**: Crítica | Alta | Media | Baja
- **Afectado**: [Rol/Recurso]
- **Descripción**: [Qué está mal]
- **Pasos**:
  1. ...
  2. ...
- **Resultado Esperado**: ...
- **Resultado Actual**: ...
- **Fix**: [Descrito en PR #X]
```

---

**Última actualización**: 25 de abril de 2026
