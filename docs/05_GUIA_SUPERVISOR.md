# 👨‍💼 ITFlow — Guía de uso para SUPERVISOR

**Versión:** 2.1 (BORRADOR - En desarrollo) | **Fecha:** Abril 2026 | **Público:** Supervisores de planta

---

## 📌 Descripción del rol

Como **SUPERVISOR**, eres responsable de:
- Gestión de tareas en tu planta (no todas las plantas)
- Crear y asignar tareas a usuarios de tu planta
- Revisar tareas completadas
- Reportar estadísticas de tu área
- Contacto directo entre admin global y usuarios locales

**Permisos (Planeados):**
- ✅ Ver tareas de mi planta
- ✅ Crear tareas (solo para mi planta)
- ✅ Asignar a usuarios de mi planta
- ✅ Revisar tareas completadas
- ✅ Ver estadísticas locales
- ❌ Ver tareas de otras plantas
- ❌ Gestionar usuarios
- ❌ Gestionar plantas/países

---

## ⚠️ Estado actual

```
ESTADO DE DESARROLLO: 50% completado

Funcionalidades IMPLEMENTADAS:
├─ ✅ Autenticación de Supervisor
├─ ✅ Hook useProtegerRuta para proteger ruta
├─ ✅ Funciones de permisos (esSupervisor, etc)
└─ ✅ Estructura base de rutas

Funcionalidades EN DESARROLLO:
├─ 🚧 Dashboard de Supervisor (/supervisor/dashboard)
├─ 🚧 Panel de tareas (/supervisor/tareas)
├─ 🚧 APIs de supervisor (/api/supervisor/*)
├─ 🚧 Filtrado por planta
├─ 🚧 Asignación local
└─ 🚧 Revisión de tareas

Funcionalidades PLANEADAS:
├─ 📅 Reportes por planta
├─ 📊 Gráficos de productividad local
├─ 📧 Notificaciones de tareas vencidas
└─ 📱 Mobile-responsive
```

---

## 🚀 Inicio de sesión (cuando esté implementado)

### Paso 1: Acceder

```
URL: https://itflow.tudominio.com
Email: supervisor@empresa.com
Contraseña: (tu contraseña)
Click: "Iniciar sesión"
```

### Paso 2: Redirección automática

```
Sistema detecta que eres Supervisor
↓
Te redirige a: /supervisor/tareas
(una vez que se implemente)

O si dashboard existe primero:
↓
/supervisor/dashboard
```

---

## 📊 Dashboard Supervisor (planeado)

**Estado:** En desarrollo  
**Ubicación esperada:** `/supervisor/dashboard`

### Componentes planeados

```
┌─────────────────────────────────────────────────────┐
│ SUPERVISOR: Planta "Santa Tecla - El Salvador"     │
├─────────────────────────────────────────────────────┤
│                                                     │
│ RESUMEN DE PLANTA                                   │
│ ───────────────────────────────────────────────────│
│                                                     │
│ 📋 Total tareas:   48       📈 En progreso:  18    │
│ ✅ Completadas:     15       ⚠️ Vencidas:     3    │
│                                                     │
│ % Completitud:  [████████░░░░] 31%                 │
│                                                     │
├─────────────────────────────────────────────────────┤
│ USUARIOS EN MI PLANTA                               │
│ ───────────────────────────────────────────────────│
│                                                     │
│ Juan Pérez     (9 activas)  [Ver tareas] [+]       │
│ María García   (7 activas)  [Ver tareas] [+]       │
│ Carlos López   (6 activas)  [Ver tareas] [+]       │
│                                                     │
├─────────────────────────────────────────────────────┤
│ ALERTAS LOCALES                                     │
│ ───────────────────────────────────────────────────│
│                                                     │
│ 🔴 Carlos López - Tarea vencida hace 2 días        │
│    "Instalar parches Windows"                      │
│    [Ver detalle] [Reasignar]                       │
│                                                     │
│ 🟡 Juan Pérez - Vence hoy                          │
│    "Configurar firewall"                           │
│    [Ver detalle] [Acelerar]                        │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### Funciones esperadas

```
1. Crear tarea rápida
   Click: "+ Nueva tarea"
   Abre: Modal con formulario
   └─ Auto-completa: Mi planta

2. Ver tareas de mi planta
   Click: "Panel de tareas"
   Muestra: Solo tareas de mi ubicación

3. Asignar tarea a usuario local
   Click: "Asignar"
   Filtra: Solo usuarios de mi planta

4. Revisar trabajo completado
   Estado: Completadas
   Puedo: Marcar como "Revisada"
   └─ Comentar si necesita correcciones

5. Exportar reporte local
   Click: "Descargar reporte"
   Rango: Selecciona fechas
   Datos: Solo mi planta
```

---

## 📋 Panel de tareas (planeado)

**Estado:** En desarrollo  
**Ubicación esperada:** `/supervisor/tareas`

### Vista esperada

```
PLANTA: Santa Tecla - El Salvador

[Filtros]
├─ Usuario: [Todos ▼]
├─ Estado:  [☐ Pendiente ☑ En Proceso ☑ Vencidas]
├─ Prioridad: [☑ Todas]
└─ Buscar: [_____________]

[Tabla de tareas]
┌─────┬──────────────────┬────────┬──────┬──────────┬────────────┐
│ #   │ Tarea            │ Usuario│ Prio │ Avance   │ Vence      │
├─────┼──────────────────┼────────┼──────┼──────────┼────────────┤
│ 1   │ Instalar router  │ Juan   │ 🔴   │ [██ 50%] │ Hoy ⚠️     │
│ 2   │ Config DNS       │ María  │ 🟡   │ [░░ 0%]  │ +2 días    │
│ 3   │ Backup servidor  │ Juan   │ 🟢   │ [██ 100%]│ +5 días ✓  │
│ 4   │ Instalar parches │ Carlos │ 🔴   │ [██ 75%] │ -1 día ⚠️  │
│ 5   │ Revisar logs     │ María  │ 🟡   │ [█░ 25%] │ +3 días    │
└─────┴──────────────────┴────────┴──────┴──────────┴────────────┘

[Acciones]
├─ Click en tarea → Abre detalle
├─ Hover en fila → Botón "Reasignar"
└─ Checkbox → Acciones en batch
```

---

## ➕ Crear tarea local

**Flujo esperado:** (cuando esté implementado)

### Paso 1: Click "+ Nueva tarea"

```
Ubicación: Esquina superior derecha
Abre: Modal "Nueva tarea"
```

### Paso 2: Formulario

```
CAMPO REQUERIDO         NOTA
─────────────────────────────────────────────
Título*                 "Instalar switch PoE"
Descripción             "Detalles del trabajo"
Fecha inicio*           2026-04-20
Fecha límite*           2026-04-25
Prioridad*              [dropdown: Alta]
Usuario asignado*       [dropdown: Solo mis usuarios]
Observaciones           "Notas especiales"

NOTA: Planta se auto-completa con tu planta
```

### Paso 3: Enviar

```
Click: "Crear tarea"
↓
Validaciones
├─ JWT válido y eres Supervisor
├─ Usuario pertenece a tu planta
└─ Fecha límite es futura

Si OK:
↓
Insert en BD
↓
Usuario recibe notificación
↓
Aparece en tu panel
```

---

## ✅ Revisar tareas completadas

**Flujo esperado:**

### Paso 1: Abre tarea completada

```
Panel de tareas
├─ Filtro: Estado = "Completada"
└─ Click en tarea
```

### Paso 2: Revisa detalle

```
Ver:
├─ % Avance (debe ser 100%)
├─ Evidencia cargada
├─ Observaciones del usuario
├─ Comentarios del hilo
└─ Duración total
```

### Paso 3: Decide

```
Opción A: APROBADA
└─ Click: "Aprobar"
   ├─ Marca como "Revisada"
   ├─ Usuario recibe notificación
   └─ Va a historial

Opción B: PROBLEMAS
└─ Click: "Rechazar" o "Solicitar correcciones"
   ├─ Comenta qué falta
   ├─ Cambia estado a "En Proceso"
   ├─ Usuario vuelve a trabajar
   └─ Reenvía cuando termine
```

---

## 📊 Reportes locales (planeado)

**Funcionalidad esperada:**

```
Botón: "Descargar reporte"

Opciones:
├─ Formato: PDF | Excel
├─ Período: Última semana | Mes | Personalizado
└─ Incluir: Tareas completadas | En proceso | Vencidas

Datos:
├─ Solo de mi planta
├─ Productividad por usuario
├─ Tareas vencidas
└─ Timeline de progreso

Uso:
├─ Reportar a admin global
├─ Planificación de capacidad
└─ Justificar necesidades de recursos
```

---

## 👥 Gestión de usuarios locales

**Limitaciones (planeadas):**

```
Puedes VER:
✅ Usuarios de tu planta
✅ Tareas asignadas a cada uno
✅ Carga de trabajo por usuario

NO puedes:
❌ Crear usuarios
❌ Cambiar rol (supervisor → admin)
❌ Eliminar usuarios
❌ Cambiar contraseña de otros

Contacta al admin para cambios de usuario
```

---

## 🚦 Identificar cuellos de botella

### Indicadores de problema

```
ROJO (Acción inmediata):
├─ Usuario con 3+ tareas vencidas
├─ Tarea vencida hace > 3 días
├─ Usuario con 0% avance hace 5+ días
└─ Planta entera < 20% completitud

AMARILLO (Vigilancia):
├─ Usuario con 2 tareas vencidas
├─ Tarea vencida hace 1-3 días
└─ Alguien con > 50% carga de planta

VERDE (Normal):
├─ < 5% tareas vencidas
├─ Promedio 30-50% completitud/semana
└─ Carga distribuidaEquitativamente
```

### Qué hacer

```
Problema detectado
↓
Comunicación directa con usuario:
├─ "¿Qué bloquea la tarea X?"
├─ "¿Necesitas ayuda?"
├─ "¿Hay recursos faltantes?"
└─ "¿Prioridad correcta?"

Si el usuario no puede resolver:
↓
Escalar a Admin:
├─ Describir problema
├─ Proponer solución
├─ Pedir reasignación o recursos
└─ Documentar en la tarea
```

---

## 🔄 Ciclo semanal recomendado

### Lunes (Planificación)

```
1. Revisar tareas sin asignar en tu planta
2. Asignar tareas a usuarios según carga
3. Comunicar plan a equipo
4. Revisar tareas que cumplen plazo esta semana
```

### Miércoles (Seguimiento)

```
1. Revisar avance de todas las tareas
2. Contactar a usuarios que van lento
3. Escalara admin si hay bloqueantes
4. Ajustar prioridades si es necesario
```

### Viernes (Revisión)

```
1. Revisar tareas completadas esta semana
2. Aprobar o pedir correcciones
3. Generar reporte de desempeño
4. Planificar siguiente semana
```

---

## 📞 Contacto escalación

### Con el admin global

```
Caso 1: Usuario sin tareas asignadas
Email: admin@empresa.com
Mensaje: "Juan en mi planta necesita más trabajo"

Caso 2: Tarea bloqueada por otro equipo
Caso 3: Falta de recursos (herramientas, acceso)
Caso 4: Cambio de usuario o emergencia
```

### Con usuarios

```
Reunión semanal:
├─ Monitoreo de progreso
├─ Problemas y soluciones
├─ Feedback de desempeño
└─ Motivación y coaching
```

---

## 🎓 Mejores prácticas

### 1. Comunicación clara

```
Al asignar tarea:
├─ Criterio de completitud claro
├─ Recursos disponibles confirmados
├─ Timeline realista
└─ Contacto para preguntas

Al revisar tarea:
├─ Feedback constructivo
├─ Reconocer trabajo bien hecho
├─ Si hay problemas: solicitar ajustes claros
└─ Documentar decisión
```

### 2. Distribución equilibrada

```
Cada semana:
├─ Sumar tareas por usuario
├─ Detectar desequilibrios
├─ Reasignar si diferencia > 50%
└─ Comunicar cambios
```

### 3. Documentación local

```
Mantener registro de:
├─ Cambios de asignación (por qué)
├─ Tareas vencidas (causa)
├─ Mejoras implementadas
└─ Capacitación dada
```

### 4. Escalación oportuna

```
BUENO: Escalar el día 1 cuando detectas problema
  ├─ Admin tiene más opciones
  ├─ Se resuelve más rápido
  └─ Menos daño

MALO: Esperar a que se agrave
  ├─ Mayor impacto
  ├─ Menos opciones de solución
  └─ Baja moral del equipo
```

---

## 🚀 Características futuras

```
📅 En roadmap Q2 2026:
├─ Notificaciones automáticas de vencidas
├─ Gráficos de productividad en tiempo real
├─ Predictor de tareas que van a vencer
├─ Integración con Slack/Teams
├─ Mobile app nativa

📅 En roadmap Q3 2026:
├─ Gestión de vacaciones por usuario
├─ Asignación automática inteligente
├─ Analytics de patrones de retraso
└─ Certificación de competencias
```

---

## ⚠️ Limitaciones actuales

```
Mientras estamos en fase beta:

❌ No puedes editar tareas creadas por admin
❌ No puedes ver reportes de otras plantas
❌ No hay filtro por país (solo por planta)
❌ Notificaciones aún en desarrollo
❌ Sin integración con calendarios

WORKAROUND: Contacta al admin para estos cambios
```

---

## 🆘 Soporte

**¿La aplicación de Supervisor no funciona?**

```
Como aún está en desarrollo, es normal encontrar bugs.

Reporta a:
├─ Email: dev-itflow@empresa.com
├─ Slack: #itflow-development
├─ Incluye: Qué quisiste hacer + error exacto
└─ Screenshot de error si es posible
```

**¿Duda sobre cómo supervisar una tarea?**

```
Contacta a:
├─ Admin de tu región
├─ Supervisor más experimentado
└─ Documentación en wiki: wiki.empresa.com/supervisor
```

---

## 📝 Checklist de supervisor

### Diariamente

```
☐ Login a ITFlow
☐ Revisar tareas vencidas
☐ Contactar usuarios si hay retraso
☐ Actualizar observaciones si procede
☐ Documentar cambios
```

### Semanalmente

```
☐ Reunión con equipo
☐ Distribuir nuevas tareas
☐ Revisar tareas completadas
☐ Generar reporte
☐ Escalaciones pendientes
```

### Mensualmente

```
☐ Análisis de productividad
☐ Identificar tendencias
☐ Capacitación si necesaria
☐ Reunión con admin global
☐ Planificación siguiente mes
```

---

## 🎯 Resumen

**Tu rol como Supervisor es:**

1. **Gestor local** — Administra tareas de tu planta
2. **Facilitador** — Quita obstáculos para tu equipo
3. **Revisor** — Asegura calidad de trabajo completado
4. **Comunicador** — Nexo entre admin global y usuarios
5. **Coach** — Desarrollo de habilidades de tu gente

**Con esto, ITFlow funciona como sistema descentralizado:**

```
Admin global        → Visión estratégica
  ↕
Supervisores locales → Ejecución táctica
  ↕
Usuarios            → Trabajo operativo
```

---

**Nota:** Este documento es un borrador. Cuando el rol Supervisor se complete (Q2 2026), se actualizará con instrucciones precisas y screenshots.

**Próxima revisión:** Cuando se implemente módulo de Supervisor completamente  
**Contacto:** dev-itflow@empresa.com
