# 📖 Guía de uso ITFlow — Instrucciones por rol

**Fecha:** 17/04/2026 | **Versión:** 2.0 (Actualizada según vistas reales)

> 📌 **Esta guía está diseñada para ayudarte a usar ITFlow según tu rol.** Selecciona el tuyo para comenzar.

---

## 📑 Tabla de contenidos

- [🔴 Administrador](#-administrador)
- [🟢 Operario / Técnico](#-operario--técnico)
- [❓ Preguntas frecuentes](#-preguntas-frecuentes)

> **Nota:** Supervisor está en desarrollo y será agregado próximamente.

---

# 🔴 ADMINISTRADOR

**Rol:** Gestor del sistema completo (ITFlow)  
**Acceso:** Todas las tareas del sistema  
**Responsabilidad:** Monitorear carga de trabajo, crear tareas, revisar progreso

---

## 📊 Mi Dashboard

**Ubicación:** `/admin/dashboard`

El dashboard administrativo se llama **"Tablero de Tareas por Región"** — Una vista ejecutiva optimizada para toma de decisiones rápida.

### 📋 Sección 1: CARGA POR RESPONSABLE

**¿Cuántas tareas tiene cada persona asignada?**

```
Axel Iglesias Gutierrez        6 tareas
Gilberto Chavarria Romero      5 tareas
Jose Gutierrez Vargas          5 tareas
Mario Gonzalez Oviedo          5 tareas
Francisco Chavarria Ramirez    4 tareas
Christian Melendez             1 tarea
```

**¿Por qué ves esto?** Para detectar si hay desbalance de carga (alguien con muchas tareas vs. otro con pocas).

### 📉 Sección 2: ESTADO GLOBAL

**¿Qué porcentaje del trabajo está completado?**

```
COMPLETADO: 3%    (1 de 31 tareas)
PENDIENTE:  94%   (29 de 31 tareas)
```

**¿Por qué ves esto?** Para entender el progreso general del proyecto de un vistazo.

### ⚠️ Sección 3: RIESGO ACTUAL

**¿Quién tiene más tareas vencidas?**

```
En este momento: No hay tareas vencidas

(Cuando las haya, mostrará quién está en riesgo)
```

**¿Por qué ves esto?** Para actuar rápido ante retrasos y evitar cascadas problemáticas.

---

## 🎚️ Filtros operativos

Bajo las 3 secciones, hay **dropdowns para personalizar la vista**:

- **TODOS LOS USUARIOS** → Selecciona un responsable específico
- **TODAS LAS PRIORIDADES** → Filtro por Alta / Media / Baja
- **TODOS LOS ESTADOS** → Filtro por Pendiente / En proceso / Completado

**Ejemplo:** "Mostrar solo tareas ALTAS de Gilberto Chavarria" → Selecciona usuario + prioridad

---

## 📊 Lista de Tareas (Top 10)

**"Top 10 ordenado por vencimiento e impacto operativo"**

Tabla con columnas:

| Columna          | Qué ves                                                       |
| ---------------- | ------------------------------------------------------------- |
| **Título**       | Nombre de la tarea (ej: "Aplicativo de Flujos de Trabajo IT") |
| **Planta**       | Ubicación (Santa Ana, Planta1, Planta6, etc.)                 |
| **Prioridad**    | 🔴 Urgente / 🟠 Alta / 🟡 Media / 🟢 Baja                     |
| **Asignado a**   | Nombre del responsable                                        |
| **Fecha límite** | Cuándo vence — 🔴 Rojo si ya vencida                          |
| **Estado**       | ✅ Completado / ⏳ Pendiente / 🔄 En revisión                 |
| **Acciones**     | Botones: [Ver] [Editar] [Eliminar evidencias]                 |

**Interactividad:** Click en cualquier tarea → Abre modal con detalles completos

---

## 📝 Ver todas las tareas (Panel completo)

**Ubicación:** `/admin/tareas`

Panel de **"Gestión Global de Tareas"** con acceso a TODAS las tareas (sin límite).

### Tabla de tareas completa

Mismas columnas que el Top 10 del dashboard, pero sin límite de registros.

### 📍 Selector de planta

Dropdown en la parte superior izquierda:

```
Todas las Plantas ▼
- Todas
- Santa Ana
- Planta1
- Planta2
- ... (más plantas)
```

**Propósito:** Filtrar tareas por planta específica.

---

## ➕ Crear una nueva tarea

**Ubicación:** Botón **"+ Nueva Tarea"** (arriba derecha en `/admin/tareas`)

### Modal de creación

Completa el formulario:

```
Título:              (Texto libre - nombre descriptivo)
Descripción:         (Detalles de qué hacer)
Planta:              [Dropdown - Selecciona planta]
Fecha de inicio:     [Date picker]
Fecha de límite:     [Date picker]
Prioridad:           [Urgente / Alta / Media / Baja]
Asignar a usuario:   [Dropdown - Selecciona responsable]
```

### Ejemplo:

```
Título:       "UPS están en el suelo"
Descripción:  "La UPS de la sala de servidores tiene batería baja.
              Reemplazar baterías y verificar funcionamiento."
Planta:       "Planta1"
Fecha inicio: 15/04/2026
Fecha límite: 16/04/2026
Prioridad:    "Urgente"
Asignar a:    "Mario Gonzalez Oviedo"
```

Click **"Crear Tarea"** → Tarea aparece en el sistema.

---

## ✏️ Actualizar detalles de tarea

**Ubicación:** Click en cualquier tarea de la tabla

### Modal "Detalles de la Tarea"

Se abre un modal con:

```
┌─────────────────────────────────────┐
│     DETALLES DE LA TAREA            │
├─────────────────────────────────────┤
│ ASIGNADO A:     Christian Melendez  │
│ PLANTA:         Santa Ana           │
│ ESTADO:         [Dropdown editable] │
│ REVISADO POR:   ❌ Pendiente        │
│ OBSERVACIONES:  [Área de texto]     │
│ EVIDENCIAS (1): [Vista inicial...] │
│                                     │
│ [Cancelar]  [Actualizar]            │
└─────────────────────────────────────┘
```

### Cambios que puedes hacer:

1. **Reasignar:** Cambiar "ASIGNADO A" a otro usuario
2. **Cambiar planta:** (Si aplica)
3. **Cambiar estado:** Pendiente → En proceso → Completado → En revisión
4. **Agregar observaciones:** Para dejar notas administrativas
5. **Ver evidencias:** Archivos cargados por el usuario

Click **"Actualizar"** → Se guardan cambios

---

## 💡 Consejos para Administradores

✅ **Revisa el tablero cada mañana** — Es tu "control tower"  
✅ **Monitorea sección "RIESGO ACTUAL"** — Alertas tempranas  
✅ **Usa filtros** para ver específico (ej: tareas ALTAS de cierto usuario)  
✅ **Detecta desbalance** en la carga por responsable — Reasigna si es necesario  
✅ **Agrega observaciones claras** cuando cambies estado de tarea  
✅ **Revisa EVIDENCIAS** cargadas por usuarios para confirmar completitud

---

---

# 🟢 OPERARIO / TÉCNICO

**Rol:** Ejecutor de tareas  
**Acceso:** Solo tus tareas asignadas  
**Responsabilidad:** Ejecutar tareas, actualizar progreso, cargar evidencia

---

## 🏠 Mi Dashboard

**Ubicación:** `/user/dashboard`

Cuando inician sesión, ven **"Mis Tareas"** — Una vista personalizada a cada usuario.

### 📊 Resumen rápido (4 cards)

En la parte superior, 4 números importantes:

```
ACTIVAS:       0    (Tareas sin completar)
EN PROCESO:    0    (Tareas que recién empezaste)
VENCIDAS:      0    (Tareas pasadas la fecha límite)
% AVANCE:      0%   (Promedio de todas tus tareas)
```

**¿Por qué ves esto?** Para saber de un vistazo tu situación actual.

### 📁 Filtros

Tres dropdowns para filtrar tus tareas:

```
TODOS LOS ESTADOS ▼     (Mostrar todo / Pendiente / En proceso / Completado)
TODAS LAS PRIORIDADES ▼ (Mostrar todo / Urgente / Alta / Media / Baja)
TODAS LAS FECHAS ▼      (Mostrar todo / Esta semana / Próxima semana / Próximos 30 días)
```

---

## 📋 Mis tareas asignadas

**Ubicación:** `/user/tareas`

Tabla con **MIS TAREAS ACTIVAS**:

| Columna          | Qué ves                                      |
| ---------------- | -------------------------------------------- |
| **Título**       | Nombre de la tarea                           |
| **Prioridad**    | 🔴 Urgente / 🟠 Alta / 🟡 Media / 🟢 Baja    |
| **Avance**       | [==== ] 50% — Barra visual + porcentaje      |
| **Fecha límite** | Cuándo vence (🔴 rojo si vencida)            |
| **Estado**       | ✅ Completado / ⏳ Pendiente / 🔄 En proceso |
| **Acciones**     | Botón [Ver] para abrir detalle               |

---

## 📖 Detalle de tarea (Abrir y actualizar)

**Ubicación:** Click en cualquier tarea → Abre `/user/tarea/[id]`

### Información básica (lado izquierdo)

```
Aplicativo de Flujos de Trabajo IT

PRIORIDAD:    Urgente
PLANTA:       Santa Ana
PAÍS:         El Salvador
CREADO POR:   Admin ITFlow
FECHA INICIO: 16/04/2026
FECHA LÍMITE: 17/04/2026
```

### Sección "Actualizar Progreso"

Aquí es donde **tú avanzas la tarea**:

```
┌──────────────────────────────────┐
│   ACTUALIZAR PROGRESO            │
├──────────────────────────────────┤
│                                  │
│ ESTADO:                          │
│ [Completado ▼]                   │
│ (Pendiente / En proceso / Completado)
│                                  │
│ PORCENTAJE DE AVANCE:            │
│ [===================] 100%       │
│                                  │
│  [🔴 Guardar Cambios]            │
│                                  │
└──────────────────────────────────┘
```

**Paso a paso:**

1. **Cambia ESTADO** según dónde estés:
   - Pendiente → Recién te asignan la tarea
   - En proceso → Empezaste a trabajar
   - Completado → Terminaste

2. **Actualiza PORCENTAJE** con el slider:
   - 0% = No he empezado
   - 25% = Cuarta parte lista
   - 50% = Mitad completada
   - 75% = Casi listo
   - 100% = Completado

3. **Click "Guardar Cambios"** para guardar

---

## 💬 Comentarios (Sistema de comunicación)

**Lado derecho de la pantalla:**

```
COMENTARIOS

Christian Melendez (Hoy, 10:30 AM)
"Correcciones en el Flujo de las tareas"

Christian Melendez (Ayer, 15:45)
"Revision de Vistas y Estados"

[Agregar comentario...]
```

**¿Para qué?** Dejar notas sobre:

- Preguntas sobre la tarea
- Explicar por qué hay retrasos
- Documentar lo que hiciste
- Comunicación con admin/supervisor

---

## 📸 Evidencias (Cargar archivos)

**Sección en la parte inferior derecha:**

```
EVIDENCIAS

[Seleccionar archivo (JPG, PNG, PDF - máx 10 MB)]

Descripción opcional (ej: Captura de instalación):
[________________________]

[Subir evidencia]

Vista inicial Usuario
Christian Melendez - 17/04/2026 - 100 KB
[Ver] [Eliminar]
```

### Cómo cargar evidencia:

1. Click en **"Seleccionar archivo"**
2. Elige una imagen, PDF, o documento que pruebe tu trabajo
3. (Opcional) Agrega descripción: "Screenshot del software instalado"
4. Click **"Subir evidencia"**
5. El archivo aparece en la lista

---

## ⚙️ Flujo recomendado de trabajo

### Lunes: Recibo tarea

```
Estado:       Pendiente
Avance:       0%
Comentario:   "Recibida, empezaré mañana"
```

### Martes: Empiezo

```
Estado:       En proceso
Avance:       25%
Comentario:   "Comenzó instalación en servidor1"
```

### Miércoles: Mitad

```
Estado:       En proceso
Avance:       50%
Comentario:   "Mitad de la instalación completada"
```

### Jueves: Casi listo

```
Estado:       En proceso
Avance:       75%
Comentario:   "Falta solo testing final"
```

### Viernes: Terminada

```
Estado:       Completado
Avance:       100%
Evidencias:   [Screenshot de resultado]
Comentario:   "Completada. Todo funcionando correctamente"
```

---

## 💡 Consejos para Operarios

✅ **Actualiza regularmente** — No esperes a terminar todo (actualiza cada día)  
✅ **Cambia a "En proceso"** cuando empieces (no al final)  
✅ **Documenta en comentarios** si hay problemas o preguntas  
✅ **Estima realista** — Si tardará más, avisa en comentarios  
✅ **Carga evidencia** de trabajos importantes (fotos, screenshots)  
✅ **Lee la descripción completa** antes de empezar

---

---

# ❓ PREGUNTAS FRECUENTES

## 🔓 ¿Olvidé mi contraseña?

1. En página de login, click **"¿Olvidó su contraseña?"**
2. Ingresa tu email
3. Revisa tu email (incluyendo spam)
4. Click en enlace de recuperación
5. Ingresa nueva contraseña

## 👤 ¿Cómo cambio mi nombre o email?

**No puedes cambiarlos tú mismo.** Contacta al administrador con tu solicitud.

## 🔄 ¿Pueden cambiarme de planta o rol?

**Sí, pero solo el administrador puede.** Contacta directamente.

## 📊 ¿Puedo ver tareas de otros usuarios?

**Depende de tu rol:**

- **Admin:** Ve TODAS las tareas del sistema
- **User:** Ve SOLO sus tareas asignadas

## 📅 ¿Cuántos días quedan para vencer?

**Mira la columna "Fecha límite":**

- 🟢 Verde: +5 días
- 🟡 Amarillo: 1-5 días
- 🔴 Rojo: Ya vencida

## 📤 ¿Qué tipo de evidencia puedo cargar?

- Imágenes: JPG, PNG
- Documentos: PDF
- Máximo: 10 MB por archivo
- Ejemplos: Screenshots, fotos del trabajo, tickets, URLs

## ⏰ ¿Cuándo debo actualizar el % avance?

**Actualiza cuando hagas progreso significativo:**

- Al empezar: 10-20%
- A mitad: 50%
- Antes de terminar: 75-90%
- Al completar: 100%

**No necesitas actualizar cada hora.**

## 🆘 ¿Qué si me asignan una tarea en error?

1. Contacta inmediatamente al administrador
2. Explica el error
3. El admin la reasignará a la persona correcta

**No ignores la tarea** — El admin recibirá alertas de tareas vencidas.

## 📞 ¿Cómo contacto soporte?

Pregunta a tu administrador o supervisor por:

- Email del soporte técnico
- Teléfono
- Slack/Teams

---

**Última actualización:** 17/04/2026 | **Versión:** 2.0
