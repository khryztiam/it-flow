# Guía Rápida: Validación de Acceso y Visibilidad

## Resumen Ejecutivo

Esta guía valida que **cada rol solo pueda ver y hacer lo que le corresponde**:

- **User**: ve solo sus tareas
- **Supervisor**: ve tareas de sus subordinados
- **Admin**: ve todo

---

## Paso 1: Preparar Tokens

Para ejecutar tests necesitas tokens válidos de cada rol.

### Opción A: Obtener Token Desde el Navegador (Rápido)

1. **Abre el navegador** en http://localhost:3000
2. **Login con tu usuario** (cualquier rol)
3. **Abre DevTools** (F12)
4. **Consola** → Copia el token:
   ```javascript
   localStorage.getItem('sb-token');
   ```
5. **Copia el valor completo** (comienza con `eyJ...`)
6. **Repite para cada usuario** (usuario normal, supervisor, admin)

### Opción B: Obtener Token desde CLI (Alternativa)

```bash
# Instalar Supabase CLI si no lo tienes
npm install -g @supabase/cli

# Generar token para un usuario
supabase auth admin create-user \
  --email "test@example.com" \
  --password "password123"

# Obtener JWT
supabase auth admin get-user "test@example.com"
```

---

## Paso 2: Ejecutar Tests de API

### Test Simple (Recomendado para Empezar)

```bash
# Abre una terminal en el directorio del proyecto

# Establece los tokens como variables de entorno:
export USER_TOKEN="eyJ..."
export SUPERVISOR_TOKEN="eyJ..."
export ADMIN_TOKEN="eyJ..."

# Ejecuta el test
node test-acceso-simple.js
```

**Resultado esperado**:

```
VALIDACIÓN DE VISIBILIDAD Y ACCESO CRUZADO
──────────────────────────────────────────────────────────────────────────
  ✓ PASS: GET /api/user/tareas devuelve tareas (5 encontradas)
  ✓ PASS: GET /api/supervisor/tareas rechazado con 403
  ✓ PASS: GET /api/supervisor/tareas devuelve tareas (12 encontradas)
  ✓ PASS: GET /api/admin/usuarios rechazado con 403
  ✓ PASS: GET /api/admin/tareas devuelve todas las tareas (45 encontradas)
  ✓ PASS: Sin token: status 403 como esperado
  ✓ PASS: Token inválido: status 403 como esperado

RESUMEN: 7 pasados, 0 fallidos
```

---

## Paso 3: Tests Manuales en Navegador

### Test 1: Usuario ve solo sus tareas

```bash
# En DevTools → Network, haz click en:
GET /supervisor/tareas

# Verifica:
# ✗ Debería redirigir a /user/tareas (si es usuario normal)
# ✓ O mostrar error si intentas acceder directamente a API
```

### Test 2: Supervisor ve solo subordinados

```bash
# Como supervisor, navega a:
http://localhost:3000/supervisor/tareas

# Verifica la tabla:
# ✓ Muestra tareas
# ✓ El botón "Reasignar" funciona
# ✓ Puedes filtrar por estado
# ✓ Los números del dashboard = tareas en la lista

# En DevTools → Network:
# GET /api/supervisor/tareas
# Respuesta debe devolver solo tareas de usuarios supervisados
```

### Test 3: Usuario rechazado en supervisor

```bash
# Como usuario normal, intenta acceder directamente:
http://localhost:3000/supervisor/tareas

# Verifica:
# ✓ Redirige automáticamente a /user/tareas
```

### Test 4: Supervisor no puede reasignar afuera

```bash
# Como supervisor, en detalle de tarea, intentar reasignar a usuario que no supervisa
# En DevTools → Network → PUT /api/supervisor/tareas/[id]

# Esperado:
# ✓ Status 403
# ✓ Message: "No puedes reasignar a este usuario..."
```

---

## Paso 4: Validar Datos en Supabase

### Verificar Relaciones

```sql
-- Conecta a Supabase SQL Editor

-- ¿Qué usuarios supervisa Juan (supervisor)?
SELECT u.id, u.nombre_completo
FROM usuarios u
WHERE u.supervisor_id = 'ID_DE_JUAN';

-- ¿Qué tareas tiene cada usuario?
SELECT t.titulo, u.nombre_completo
FROM tareas t
JOIN usuarios u ON t.asignado_a = u.id
ORDER BY u.id;

-- ¿Supervisor1 supervisa User1?
SELECT EXISTS(
  SELECT 1 FROM usuarios
  WHERE id = 'USER1_ID'
  AND supervisor_id = 'SUPERVISOR1_ID'
);
-- Resultado: true o false
```

---

## Paso 5: Casos Críticos a Probar

### Caso A: Consistencia Dashboard ↔ Lista

**Como Supervisor**:

1. Abre `/supervisor/dashboard`
2. Nota el número en "Tareas Asignadas"
3. Abre `/supervisor/tareas`
4. **Verifica**: El número de tareas en la tabla = número en dashboard

**Si NO coinciden**:

- Probablemente el dashboard está usando `/api/admin/tareas` en lugar de `/api/supervisor/tareas`
- Busca en `supervisor/dashboard.js` línea con `callAPI('/api/...')`

### Caso B: Dos Supervisores

1. **Crea 2 supervisores**: Supervisor1 y Supervisor2
2. **Crea usuarios**:
   - User1, User2 bajo Supervisor1
   - User3, User4 bajo Supervisor2
3. **Asigna tareas**:
   - Tarea1 → User1
   - Tarea2 → User3
4. **Login como Supervisor1**, ve tareas:
   - **Debe ver**: Tarea1
   - **NO debe ver**: Tarea2
5. **Login como Supervisor2**, ve tareas:
   - **Debe ver**: Tarea2
   - **NO debe ver**: Tarea1

### Caso C: Cambio de Supervisión

1. User1 está bajo Supervisor1
2. Supervisor1 ve Tarea1 (asignada a User1)
3. **Admin cambia**: User1 ahora bajo Supervisor2
4. **Verificar**:
   - Supervisor1 **YA NO ve** Tarea1
   - Supervisor2 **AHORA ve** Tarea1

---

## Paso 6: Checklist de Validación

Marca conforme valides cada punto:

### Acceso a Páginas

- [ ] User no puede ver `/supervisor/*`
- [ ] User no puede ver `/admin/*`
- [ ] Supervisor no puede ver `/admin/*`
- [ ] Supervisor ve `/supervisor/tareas` sin error
- [ ] Admin ve `/admin/*` sin error

### Acceso a APIs

- [ ] User: `GET /api/user/tareas` → 200 OK
- [ ] User: `GET /api/supervisor/tareas` → 403 Forbidden
- [ ] Supervisor: `GET /api/supervisor/tareas` → 200 OK
- [ ] Supervisor: `GET /api/admin/usuarios` → 403 Forbidden
- [ ] Admin: `GET /api/admin/tareas` → 200 OK
- [ ] Admin: `GET /api/admin/usuarios` → 200 OK

### Datos Filtrados

- [ ] User1 ve solo sus 5 tareas (no las de User2)
- [ ] Supervisor1 ve solo tareas de sus usuarios
- [ ] Supervisor1 NO ve tareas de Supervisor2
- [ ] Admin ve TODAS las tareas

### Reasignación

- [ ] Supervisor solo ve dropdown con sus subordinados
- [ ] Supervisor NO puede reasignar fuera de su grupo
- [ ] User no ve opción de reasignar

### Dashboard

- [ ] Dashboard de Supervisor muestra números correctos
- [ ] Números = cantidad de tareas en lista (`/supervisor/tareas`)
- [ ] No hay discrepancia entre dashboard y lista

---

## Paso 7: Reportar Issues

Si encuentra un problema, documenta:

```markdown
### Issue: [Título Descriptivo]

**Severidad**: Crítica | Alta | Media | Baja

**Pasos para reproducir**:

1. Login como [User/Supervisor/Admin]
2. Navega a [URL]
3. [Acción específica]

**Resultado esperado**:

- [Qué debería pasar]

**Resultado actual**:

- [Qué pasó realmente]

**Diferencia**:

- User ve tareas que no le pertenecen
- Supervisor puede reasignar fuera de su grupo
- Números inconsistentes entre dashboard y lista

**Punto de impacto**:

- API: `/api/supervisor/tareas`
- Página: `/supervisor/tareas`
- Archivo: `src/pages/supervisor/tareas.js`
```

---

## Paso 8: Validación de Seguridad Adicional

### Test: Token Expirado

```bash
# Esperar a que el token expire (o manipularlo)
# Luego intentar acceso
node test-acceso-simple.js

# Esperado: 401 Unauthorized o 403 Forbidden
```

### Test: SQL Injection

```bash
# Intentar acceder con ID malicioso:
curl -H "Authorization: Bearer TOKEN" \
  "http://localhost:3000/api/user/tareas/'; DROP TABLE tareas; --"

# Esperado: 404 o error de validación
# NO debe ejecutar SQL
```

### Test: Role Tampering

```bash
# Intentar cambiar rol en token (si fuera posible)
# En la práctica, Supabase JWT está firmado
# Cambiar rol debería resultar en 403
```

---

## Resumen de Archivos Creados

| Archivo                                    | Propósito                               |
| ------------------------------------------ | --------------------------------------- |
| `test-acceso-simple.js`                    | Tests de API rápidos                    |
| `test-visibilidad-acceso.mjs`              | Tests más complejos con Supabase client |
| `docs/12_VALIDACION_VISIBILIDAD_ACCESO.md` | Documentación completa                  |

---

## Próximos Pasos

1. ✓ Ejecuta `node test-acceso-simple.js` con tokens válidos
2. ✓ Verifica los casos manuales en navegador
3. ✓ Confirma que dashboard = lista (números)
4. ✓ Prueba con 2+ supervisores
5. ✓ Documenta cualquier discrepancia en Issues

---

**Última actualización**: 25 de abril de 2026
