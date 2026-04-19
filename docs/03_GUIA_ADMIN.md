# 👨‍💼 ITFlow — Guía de uso para ADMINISTRADOR

**Versión:** 2.1 | **Fecha:** Abril 2026 | **Público:** Administradores del sistema

---

## 📌 Descripción del rol

Como **ADMIN**, tienes acceso total al sistema. Tu responsabilidad es:
- Monitorear todas las tareas del sistema (global)
- Crear y asignar tareas a cualquier usuario
- Detectar cuellos de botella y redistribuir carga
- Generar reportes de desempeño
- Gestionar usuarios y configuración general

**Permisos:** ✅ Ver todo | ✅ Crear todo | ✅ Editar todo | ✅ Eliminar (con cuidado)

---

## 🚀 Inicio de sesión

### Paso 1: Acceder a la plataforma

```
URL: https://itflow.tudominio.com (o http://localhost:3000 en desarrollo)
```

### Paso 2: Ingresar credenciales

```
📧 Email:    tu-email@empresa.com
🔐 Contraseña: (tu contraseña)
```

### Paso 3: Confirmación

Si las credenciales son correctas, serás redirigido automáticamente a:
```
✅ /admin/dashboard
```

Si algo falla:
```
❌ "Error de autenticación" → Verifica email/contraseña
❌ "Usuario inactivo" → Contacta al super admin
```

---

## 📊 Dashboard administrativo

### Ubicación y estructura

```
URL: /admin/dashboard
```

El dashboard muestra **3 secciones principales**:

### Sección 1️⃣: CARGA POR RESPONSABLE

**¿Qué ves?**
- Gráfico de barras horizontal
- Cada barra = nombre de usuario
- Altura de barra = cantidad de tareas activas (sin completar)

**¿Para qué sirve?**
- Detectar si alguien tiene demasiadas tareas
- Detectar si alguien tiene muy pocas
- Identificar cuellos de botella

**Acciones disponibles:**
- Click en una barra → Filtra tareas de ese usuario
- Hover en barra → Muestra nombre + cantidad exacta

**Ejemplo:**
```
Juan Pérez     ████████████ (12 tareas)
María García   ██████ (6 tareas)
Carlos López   ████ (4 tareas)
```

**Qué hacer si ves desbalance:**
```
Si Juan tiene 12 y Carlos tiene 4:
1. Click en barra de Juan
2. Ve a sección de tareas
3. Reasigna 2-3 tareas a Carlos
```

---

### Sección 2️⃣: ESTADO GLOBAL

**¿Qué ves?**
- Gráfico de dona (pie chart)
- 3 segmentos de color:
  - 🔴 **Pendiente** (rojo) — Aún no iniciadas
  - 🟡 **En Proceso** (amarillo) — En progreso
  - 🟢 **Completada** (verde) — Finalizadas

**¿Para qué sirve?**
- Ver salud global del proyecto
- Identificar si hay muchas tareas atoradas
- Medir progreso general

**Lectura:**
```
Pendiente:    30% (90 tareas)
En Proceso:   50% (150 tareas)
Completada:   20% (60 tareas)

Interpretación: Sistema activo, buen flujo.
```

**Qué es malo:**
```
Pendiente:    70% (muy altas sin iniciar)
En Proceso:    5%
Completada:   25%

→ PROBLEMA: Tareas acumuladas, equipo no puede mantener ritmo
→ ACCIÓN: Crear más capacidad o revisar prioridades
```

---

### Sección 3️⃣: RIESGO ACTUAL

**¿Qué ves?**
- Tabla con tareas **VENCIDAS**
- Columnas:
  - Usuario (quién debería completarla)
  - Tarea (nombre)
  - Días vencida (ej: -3 días = 3 días tarde)
  - Prioridad (baja/media/alta/urgente)

**¿Para qué sirve?**
- Alertas de tareas que se salieron de tiempo
- Tomar decisiones rápidas

**Ejemplo de tabla:**
```
┌──────────────┬─────────────────┬──────────────┬──────────────┐
│ Usuario      │ Tarea           │ Vencida      │ Prioridad    │
├──────────────┼─────────────────┼──────────────┼──────────────┤
│ Juan Pérez   │ Instalar router │ -5 días      │ ALTA         │
│ María García │ Backup servidor │ -2 días      │ MEDIA        │
│ Carlos López │ Config firewall │ -1 día       │ URGENTE      │
└──────────────┴─────────────────┴──────────────┴──────────────┘
```

**Qué hacer:**
1. **URGENTE:** Contacta al usuario de la fila roja
2. Pregunta: "¿Cuál es el bloqueante?"
3. Ofrece ayuda o reasigna a alguien más rápido

---

## 📋 Panel de tareas

### Acceso

```
URL: /admin/tareas
o Click en menú lateral → "Tareas"
```

### Vista general

**Grid de tareas** con columnas:

| Columna | Qué contiene | Interactivo |
|---------|-------------|-------------|
| Título | Nombre de la tarea | Click → Abre detalle |
| Usuario | Quién está asignada | - |
| Prioridad | Baja/Media/Alta/Urgente | Badge color |
| Estado | Pendiente/En Proceso/Completada | Dropdown para cambiar |
| % Avance | Barra 0-100% | - |
| Fecha límite | Cuándo vence | Rojo si vencida |
| Acciones | Botones | Ver, Editar, Eliminar |

### Crear nueva tarea

**Paso 1: Click en botón "+ Nueva tarea"**

```
Localización: esquina superior derecha
Abre: Modal con formulario
```

**Paso 2: Llenar formulario**

```
CAMPO REQUERIDO          TIP
─────────────────────────────────────────────────────
Título*                  "Instalar actualizaciones Windows"
Descripción              "En servidor producción, revisar antes"
Fecha inicio*            2026-04-20
Fecha límite*            2026-04-25
Prioridad*               [dropdown] → Selecciona "Alta"
Planta*                  [dropdown] → "Santa Tecla - SV"
Usuario asignado*        [dropdown] → "Juan Pérez"
Observaciones            "No reiniciar en horario laboral"

*: Campos obligatorios
```

**Paso 3: Enviar**

```
Click: "Crear tarea"
↓
Sistema valida en cliente
↓
Si OK: Envía a servidor
↓
Servidor valida (JWT, permisos, datos)
↓
Si OK: Insert en BD
↓
Notificación: "✓ Tarea creada exitosamente"
↓
Se cierra modal
↓
Tarea aparece en lista
```

**Si falla:**

```
Error: "Usuario no existe"
→ Verifica que el usuario está activo

Error: "Fecha límite no puede ser pasada"
→ Usa fecha futura

Error: "Todos los campos obligatorios"
→ Revisa que no dejaste vacíos
```

---

### Editar tarea existente

**Opción 1: Desde la tabla**

```
1. Busca tarea en lista
2. Click en fila → Abre detalle
3. Botón "Editar"
4. Modifica campos necesarios
5. Click "Guardar cambios"
```

**Opción 2: Cambio rápido de estado**

```
En la tabla, columna "Estado":
├─ Click dropdown
├─ Selecciona nuevo estado
│  ├─ Pendiente
│  ├─ En Proceso
│  ├─ Completada
│  └─ Pausada
└─ Auto-save (sin click adicional)
```

**Campos editables por Admin:**

```
✅ Título
✅ Descripción
✅ Fecha límite
✅ Prioridad
✅ Asignado a (reasignar)
✅ Estado
✅ Observaciones
✅ Planta
❌ Creado por (inmutable, auditoría)
❌ Fecha creación (inmutable)
```

---

### Reasignar tarea

**Escenario:** Juan tiene demasiadas tareas, necesitas reasignar a María.

**Paso 1: Abre tarea de Juan**

```
URL: /admin/tareas → Busca tarea
```

**Paso 2: Click "Editar"**

```
Se abre formulario con datos actuales
```

**Paso 3: Cambia campo "Usuario asignado"**

```
[Dropdown actual: Juan Pérez ▼]
Click en dropdown
Selecciona: María García
```

**Paso 4: Guarda cambios**

```
Click: "Guardar"
↓
Sistema valida
↓
Insert en tabla tareas (actualiza asignado_a)
↓
Notificación: "✓ Tarea reasignada"
↓
María recibe notificación (si implementado)
```

---

## 👥 Gestión de usuarios

### Acceso

```
URL: /admin/gestion
o Click en menú → "Gestión" → "Usuarios"
```

### Vista de usuarios

**Tabla con columnas:**

| Columna | Contenido |
|---------|-----------|
| Nombre | Nombre completo |
| Email | email@empresa.com |
| Rol | Admin/Supervisor/User |
| Planta | Ubicación |
| Estado | Activo/Inactivo |
| Acciones | Editar, Activar/Desactivar, Eliminar |

### Crear usuario

**Paso 1: Click "+ Nuevo usuario"**

```
Se abre modal de formulario
```

**Paso 2: Llenar datos**

```
CAMPO              EJEMPLO
────────────────────────────────────────
Nombre completo*   Juan Pérez García
Email*             juan.perez@empresa.com
Rol*               [dropdown] User
Planta*            [dropdown] Santa Tecla
Contraseña*        (sistema genera una temporal)
Estado*            Activo

*: Requeridos
```

**Paso 3: Crear**

```
Click: "Crear usuario"
↓
Validaciones en servidor
↓
Insert en tabla usuarios
↓
Supabase crea cuenta de auth
↓
Contraseña temporal enviada por email
↓
Usuario debe cambiarla en primer login
```

### Cambiar rol de usuario

**Paso 1: Abre usuario**

```
Click en fila del usuario en tabla
```

**Paso 2: Click "Editar"**

```
Se abre formulario
```

**Paso 3: Cambia "Rol"**

```
[Dropdown: User ▼]
Selecciona: Supervisor
```

**Paso 4: Guardar**

```
Click: "Guardar"
↓
Update en BD
↓
Próximo login del usuario → Nuevo dashboard
```

### Desactivar usuario

**Caso:** Usuario se va de vacaciones/renuncia temporalmente.

**Paso 1: Abre usuario en tabla**

**Paso 2: Click "Desactivar"**

```
Estado cambia: Activo → Inactivo
↓
Usuario NO puede hacer login
↓
Sus tareas siguen en BD (historial)
↓
Si reactivas: Recupera acceso
```

### Eliminar usuario

**⚠️ CUIDADO: Acción irreversible**

```
Antes de eliminar:
1. Verifica que NO tiene tareas activas
2. Reasigna cualquier tarea pendiente
3. Solo elimina si es de prueba
```

**Cómo hacerlo:**

```
1. Abre usuario
2. Click "Eliminar"
3. Confirma: "¿Estás seguro?"
4. Clicks "Sí, eliminar"
↓
Usuario + todas sus tareas se eliminan permanentemente
```

---

## 🌍 Gestión de plantas y países

### Plantas

**Acceso:** `/admin/gestion` → Tab "Plantas"

**Qué es:** Una planta es una ubicación física (oficina, datacenter, etc.)

**Crear planta:**

```
Click "+ Nueva planta"
├─ Nombre: "Santa Tecla - SV"
├─ País: [dropdown] El Salvador
└─ Click "Crear"
```

**Editar planta:**

```
Click en planta → "Editar"
├─ Cambia nombre
├─ Cambia país
└─ "Guardar"
```

### Países

**Acceso:** `/admin/gestion` → Tab "Países"

**Crear país:**

```
Click "+ Nuevo país"
├─ Nombre: "El Salvador"
└─ Click "Crear"
```

**Nota:** Raramente necesitarás crear países (probablemente todos existan ya).

---

## 📈 Reportes y exportación

### Generar reporte

**Paso 1: En dashboard o panel de tareas**

```
Botón: "Descargar reporte"
```

**Paso 2: Selecciona opciones**

```
Formato:
├─ PDF (para imprimir)
└─ Excel (para analizar)

Rango de fechas:
├─ Última semana
├─ Último mes
└─ Personalizado (ej: 15 mar - 30 abr)

Incluir:
☑ Tareas completadas
☑ Tareas en proceso
☑ Tareas vencidas
☑ Comentarios
```

**Paso 3: Descargar**

```
Click: "Generar reporte"
↓
Servidor construye documento
↓
Download automático
↓
Archivo: itflow_reporte_2026-04-20.pdf
```

---

## 🔍 Filtros avanzados

### En panel de tareas

**Filtro por usuario:**

```
Dropdown: "Todos los usuarios"
Selecciona: Juan Pérez
↓
Muestra solo tareas de Juan
```

**Filtro por prioridad:**

```
Checkbox: ☐ Baja ☐ Media ☑ Alta ☑ Urgente
↓
Muestra solo tareas Alta+Urgente
```

**Filtro por estado:**

```
Checkbox: ☑ Pendiente ☑ En Proceso ☐ Completada
↓
Muestra tareas activas (no completadas)
```

**Filtro por planta:**

```
Dropdown: "Todas las plantas"
Selecciona: Santa Tecla - SV
↓
Muestra solo tareas de esa planta
```

**Búsqueda por texto:**

```
Campo "Buscar":
Escribes: "instalar"
↓
Filtra tareas con "instalar" en título o descripción
```

---

## ⚠️ Tareas críticas (Riesgo)

### Identificar tareas en riesgo

**Sistema automáticamente marca como "riesgo" si:**

```
1. Fecha límite < HOY
   └─ Tarea está vencida
   
2. Días para vencer < 2
   └─ Alerta preventiva
   
3. % Avance = 0 y está vencida
   └─ NO se inició ni vence hoy
```

**Visualización:**

```
En tabla: Fila con fondo ROJO
En dashboard "Riesgo actual": Aparece en tabla de alertas
```

### Qué hacer

**Opción 1: Acelerar**

```
1. Contacta al usuario
2. Pregunta: "¿Qué bloquea terminarla?"
3. Ofrece recursos (más personas, horas extra)
```

**Opción 2: Reasignar**

```
1. Busca a alguien con menos carga
2. Click "Reasignar"
3. Selecciona nuevo usuario
4. Notifica al anterior
```

**Opción 3: Extender fecha**

```
1. Click "Editar"
2. Cambia "Fecha límite" a 1-2 días más
3. Justifica en observaciones
4. Click "Guardar"

NOTA: Esto debe ser último recurso
```

**Opción 4: Pausar**

```
1. Click "Editar"
2. Cambia "Estado" → "Pausada"
3. Agrega observación: "Aguardando decisión X"
4. Reanuda cuando sea pertinente
```

---

## 🔒 Consideraciones de seguridad

### Buenas prácticas para Admin

1. **Nunca compartas tu contraseña**
   - Ni con otros admins
   - Ni con el equipo técnico

2. **Cambia contraseña cada 90 días**
   - Si la olvidaste: Contacta super-admin

3. **No edites tareas asignadas personalmente**
   - Conflicto de intereses
   - Deja que otros admins auditen

4. **Documenta cambios grandes**
   - Si cambias a alguien de rol: Nota el motivo en observaciones
   - Si eliminas usuario: Resguarda email por auditoría

5. **Haz logout al terminar**
   - Especialmente si usas computadora compartida

---

## ❓ Preguntas frecuentes

### P: ¿Puedo ver tareas de otros países?

**R:** Sí, eres Admin, ves TODAS las tareas del sistema sin límite geográfico.

### P: ¿Qué pasa si elimino un usuario con tareas?

**R:** 
```
❌ BLOQUEADO: El sistema no permite.
┗━ Primero: Reasigna sus tareas a otro
┗━ Luego: Elimina el usuario
```

### P: ¿Las tareas completadas desaparecen?

**R:** No, quedan en base de datos. Puedes filtrar:
```
Checkbox "Completadas" → Desmarcar
↓
Muestra solo activas
```

### P: ¿Puedo editar tareas que completó un usuario?

**R:** Sí, pero evítalo. Crea una tarea nueva en su lugar.
```
Razón: Auditoría y trazabilidad de cambios.
```

### P: ¿Cuál es el máximo de tareas por usuario?

**R:** No hay límite técnico, pero recomendado:
```
- User típico: 5-10 tareas activas
- Usuario experimentado: 15-20 máximo
```

### P: ¿Se pueden agendar tareas para el futuro?

**R:** No directamente. Workaround:
```
1. Crea tarea con fecha futura
2. Pídele al usuario que espere a la fecha
3. Cambias estado a "En Proceso" cuando sea hora
```

---

## 🚀 Mejores prácticas

### 1. Distribución de carga

**Semanalmente:**
```
1. Abre dashboard
2. Revisa gráfico "Carga por responsable"
3. Si desbalance > 50% diff:
   └─ Reasigna tareas
```

### 2. Monitoreo de riesgo

**Diariamente:**
```
1. Revisa tabla "Riesgo actual"
2. Si hay tareas con -2+ días:
   └─ Toma acción (acelerar, reasignar, extender)
```

### 3. Creación eficiente de tareas

```
✓ Títulos claros y específicos
  ✗ "Arreglar servidor" 
  ✓ "Instalar parche seguridad servidor prod"

✓ Fechas realistas
  ✗ Tareas de 2 días con 1 día límite
  ✓ Margen 20% buffer

✓ Prioridad honesta
  ✗ Todo marcado "Urgente"
  ✓ Solo 10-15% urgente total
```

### 4. Comunicación clara

```
Al crear tarea:
├─ Descripción detallada
├─ Links a documentación relevante
├─ Contacto de quién solicita
└─ Criterio de "completado"

Ejemplo:
"Instalar patches Microsoft en SRV-PROD-01
Documentación: wiki.empresa.com/patches
Solicitante: Carlos López (ext 123)
Criterio: Reboot completado, sistema online, logs sin errores"
```

---

## 📞 Soporte

**Problema técnico:**
```
Email: soporte@empresa.com
Slack: #itflow-support
```

**Pregunta sobre tarea específica:**
```
Contacta a supervisores de planta
```

**Sugerencia de feature:**
```
Abre issue en GitHub: github.com/empresa/itflow/issues
```

---

**Última actualización:** Abril 2026  
**Próxima revisión:** Q3 2026
