# 👨‍🔧 ITFlow — Guía de uso para OPERARIO/TÉCNICO

**Versión:** 2.2 | **Fecha:** Abril 2026 | **Público:** Operarios, técnicos, usuarios regulares

---

## 📌 Descripción del rol

Como **USER**, tu responsabilidad es:
- Ver las tareas asignadas a ti
- Actualizar el estado y avance de tus tareas
- Cargar evidencias (fotos, documentos)
- Comunicar problemas o bloqueos
- Completar trabajo dentro de los plazos

**Permisos:**
- ✅ Ver solo mis tareas
- ✅ Actualizar mi progreso
- ✅ Cargar evidencias
- ✅ Dejar comentarios
- ✅ Recibir alertas del admin en dashboard
- ✅ Confirmar lectura de alerta (OK / Enterado)
- ❌ Ver tareas de otros
- ❌ Crear tareas
- ❌ Asignar tareas

---

## 🚀 Inicio de sesión

### Primer acceso

**Recibirás un email con:**

```
Asunto: Bienvenido a ITFlow

Contenido:
──────────────────────────────────────
Hola Juan,

Tu cuenta en ITFlow ha sido creada.

Email: juan.perez@empresa.com
Contraseña temporal: xK9mL2pQ

Link: https://itflow.tudominio.com

IMPORTANTE: Cambiar contraseña en primer login
──────────────────────────────────────
```

### Paso 1: Acceder a ITFlow

```
Abre navegador (Chrome, Firefox, Safari, Edge)
Escribe: https://itflow.tudominio.com
```

### Paso 2: Ingresa email y contraseña

```
Email: juan.perez@empresa.com
Contraseña: xK9mL2pQ (la temporal que te enviaron)
Click: "Iniciar sesión"
```

### Paso 3: Cambiar contraseña (IMPORTANTE)

```
Sistema te redirige a: "Cambiar contraseña"

Contraseña actual:    xK9mL2pQ
Nueva contraseña:     MiContraseñaSegura123!
Confirmar:            MiContraseñaSegura123!

Click: "Cambiar"
↓
✓ Contraseña actualizada
↓
Redirige a: /user/dashboard (Mi dashboard)
```

### Paso 4: Confirmación

```
Si todo está bien, verás:
┌──────────────────────────────────────┐
│  Bienvenido, Juan Pérez              │
│                                      │
│  📌 Mis tareas: 5 activas            │
│  ⏳ Tareas vencidas: 1               │
│  ✅ Completadas hoy: 0               │
│                                      │
│  [Ver mis tareas]  [Reportar error]  │
└──────────────────────────────────────┘
```

---

## 📊 Tu dashboard

### Ubicación

```
URL: /user/dashboard (automático después de login)
o Click en logo ITFlow desde cualquier página
```

### Banner de alerta individual (si aplica)

Cuando un admin te envía una alerta, verás un banner en la parte superior del dashboard.

```
⚠️ [Mensaje del admin...]
[OK / Enterado]
```

**Qué hacer:**

```
1. Lee el mensaje completo
2. Toma la acción solicitada
3. Click en "OK / Enterado" para confirmar lectura
```

### Las 4 tarjetas principales

#### Tarjeta 1: TAREAS ACTIVAS

```
┌─────────────────────────────────┐
│ 📋 Activas                      │
│                                 │
│         12 tareas               │
│                                 │
│ (Sin completar, sin plazo vencido)
└─────────────────────────────────┘

Click: Muestra solo tareas activas en listado
```

#### Tarjeta 2: EN PROCESO

```
┌─────────────────────────────────┐
│ ⚙️ En Proceso                   │
│                                 │
│          5 tareas               │
│                                 │
│ (Iniciadas pero no terminadas)
└─────────────────────────────────┘

Click: Filtra tareas que comenzaste
```

#### Tarjeta 3: COMPLETADAS

```
┌─────────────────────────────────┐
│ ✅ Completadas                  │
│                                 │
│          2 tareas               │
│                                 │
│ (100% listas, revisor aprobó)
└─────────────────────────────────┘

Click: Ve historial de trabajo
```

#### Tarjeta 4: VENCIDAS

```
┌─────────────────────────────────┐
│ ⚠️ Vencidas                     │
│                                 │
│          1 tarea                │
│                                 │
│ (Pasó fecha límite sin terminar)
└─────────────────────────────────┘

Click: ⚠️ OJO, aquí hay problemas
```

---

### Gráfico: Mi avance

**Debajo de las tarjetas:**

```
Mi progreso de tareas (últimos 7 días)

% Avance promedio
│
100% ├─────────────────●
     │                /│
 75% ├───────────●────┤│
     │      / │      ││
 50% ├────●────┤      ││
     │  /      │      ││
 25% ├─●───────┤      ││
     │/        │      ││
  0% ├─────────┴──────┘│
     └───────────────────
       Lun Mar Mie Jue Vie Sab Dom

Interpretación:
- Línea sube → Completaste tareas
- Línea baja → No avanzaste
- Objetivo: Mantenerla arriba
```

---

### Tabla: Mis tareas

**Debajo del gráfico, ves todas tus tareas:**

```
┌─────┬──────────────────┬──────┬─────────┬────────┬────────────┐
│ Nº  │ Tarea            │ Prio │ Avance  │ Estado │ Vence en   │
├─────┼──────────────────┼──────┼─────────┼────────┼────────────┤
│ 1   │ Instalar router  │ 🔴   │ [█ 50%] │ En uso │ Hoy        │
│ 2   │ Configurar DNS   │ 🟡   │ [  0%]  │ Pend.  │ En 2 días  │
│ 3   │ Backup servidor  │ 🟢   │ [█ 100%]│ Complt │ En 5 días  │
│ 4   │ Instalar parches │ 🔴   │ [█ 75%] │ En uso │ -1 día ⚠️  │
│ 5   │ Revisar logs     │ 🟡   │ [█ 25%] │ En uso │ En 3 días  │
└─────┴──────────────────┴──────┴─────────┴────────┴────────────┘

Columnas explicadas:
- Tarea: Nombre del trabajo
- Prio: 🔴 Urgente | 🟠 Alta | 🟡 Media | 🟢 Baja
- Avance: % de completitud
- Estado: Pendiente/En Proceso/Completada
- Vence en: Cuándo termina
```

---

## 📝 Trabajar en una tarea

### Paso 1: Abre la tarea

**Opción A: Click en la fila en la tabla**

```
Tabla de "Mis tareas"
Click en: "Instalar router"
↓
Se abre página de detalle
```

**Opción B: Desde el listado filtrado**

```
Click en una tarjeta (ej: "Activas")
↓
Ve listado de solo esas tareas
↓
Click en una tarea
↓
Se abre detalle
```

### Paso 2: Detalle de tarea

Verás toda la información:

```
┌────────────────────────────────────────────────────┐
│ 🔴 TAREA: Instalar router Ubiquiti                │
├────────────────────────────────────────────────────┤
│                                                    │
│ INFORMACIÓN GENERAL                                │
│ ──────────────────────────────────────────────────│
│ Descripción:                                       │
│   "Instalar y configurar router Ubiquiti en      │
│    planta Santa Tecla. Config VLAN 10 y 20."     │
│                                                    │
│ Planta:           Santa Tecla - El Salvador      │
│ Creada por:       Carlos López                    │
│ Fecha inicio:     2026-04-15                      │
│ Fecha límite:     2026-04-20 (HOY) ⚠️             │
│ Prioridad:        🔴 URGENTE                      │
│                                                    │
├────────────────────────────────────────────────────┤
│ TU PROGRESO                                        │
│ ──────────────────────────────────────────────────│
│                                                    │
│ Estado actual:    [En Proceso ▼]                  │
│                   Puedes cambiar a: Pendiente     │
│                                    En Proceso ✓   │
│                                    Completada     │
│                                    Pausada        │
│                                                    │
│ Porcentaje:       [═══════════════  50%] ←────┐  │
│                   (Barra deslizable 0-100%)   │  │
│                   Haz click y arrastra         │  │
│                                                    │
│ Observaciones:                                    │
│ ┌──────────────────────────────────────────────┐ │
│ │ El técnico llegó tarde, comenzamos a las 3pm│ │
│ │ Falta configurar VLAN 20                     │ │
│ └──────────────────────────────────────────────┘ │
│                                                    │
│ [Auto-guardado cada 10 seg]                       │
│                                                    │
├────────────────────────────────────────────────────┤
│ CARGAR EVIDENCIA                                   │
│ ──────────────────────────────────────────────────│
│                                                    │
│ Sube fotos/documentos/videos como prueba:         │
│                                                    │
│ [📎 Seleccionar archivo]  [Tipos: JPG,PNG,PDF]   │
│                            [Máx: 10 MB]           │
│                                                    │
│ ┌──────────────────────────────────────────────┐ │
│ │ 📸 router-config-screenshot.png (2.5 MB)    │ │
│ │ [✓ Subido]  [🗑️ Eliminar]                   │ │
│ └──────────────────────────────────────────────┘ │
│                                                    │
├────────────────────────────────────────────────────┤
│ COMENTARIOS                                        │
│ ──────────────────────────────────────────────────│
│                                                    │
│ Carlos López (Admin)  - 2026-04-18 15:30         │
│ ┌──────────────────────────────────────────────┐ │
│ │ "Recuerda dejar documentado el config antes  │ │
│ │  de instalar el siguiente"                   │ │
│ └──────────────────────────────────────────────┘ │
│                                                    │
│ TÚ (Juan Pérez)  - 2026-04-18 16:00             │
│ ┌──────────────────────────────────────────────┐ │
│ │ "Entendido, documento antes de continuar"    │ │
│ └──────────────────────────────────────────────┘ │
│                                                    │
│ [Agregar comentario...]                           │
│ Escribe tu mensaje: ____________________          │
│                     [Enviar comentario]           │
│                                                    │
└────────────────────────────────────────────────────┘
```

---

## 🎯 Actualizar tu progreso

### Cambiar estado

**Escenario:** Empezaste a trabajar

```
Campo "Estado actual": [Pendiente ▼]
Click en el dropdown
Selecciona: [En Proceso]
↓
Automáticamente guardado
↓
Se actualiza en dashboard admin
```

**Estados disponibles:**

```
1. Pendiente
   └─ Aún no empezaste
   
2. En Proceso
   └─ Ya empezaste, estás trabajando
   
3. Completada
   └─ Terminaste 100%, listo para revisar
   
4. Pausada
   └─ Temporalmente detenida (bloqueante)
```

### Actualizar porcentaje

**Escenario:** Completaste el 50% del trabajo

```
Barra de % Avance: [═══════════════  50%]
                    ↑ Click aquí y arrastra hacia la derecha
                    
O escribe directamente: [50] %

Barra se actualiza en TIEMPO REAL
```

**Guía de % por estado:**

```
PENDIENTE:   0%   (no empezó)
EN PROCESO:  1-99% (en progreso)
COMPLETADA:  100%  (terminado)
PAUSADA:     x%   (el % que tenía cuando pausó)
```

---

## 📸 Cargar evidencia

**¿Por qué?** Para demostrar que completaste el trabajo.

**Tipos aceptados:** JPG, PNG, PDF  
**Tamaño máximo:** 10 MB

### Paso 1: Click en "Seleccionar archivo"

```
Se abre diálogo de selección
```

### Paso 2: Elige archivo

```
Opciones:
├─ Fotos que tomaste con la cámara
├─ Screenshots de pantalla (Win: PrtSc, Mac: Cmd+Shift+3)
├─ Documentos PDF de reports
└─ Cualquier archivo que pruebe completitud
```

### Paso 3: Confirma

```
Sistema valida:
├─ ¿Tipo correcto? (JPG/PNG/PDF)
├─ ¿Tamaño < 10 MB?
└─ Si todo OK: Preview si es imagen

Si hay error:
"Archivo debe ser JPG, PNG o PDF (máx 10 MB)"
```

### Paso 4: Sube

```
Proceso:
├─ Comienza upload
├─ Barra de progreso: [████░░░░░░] 45%
├─ Si es rápido: < 2 segundos
├─ Si es lento: Espera, no cierres navegador
└─ Cuando complete: ✓ Evidencia subida

Verás:
✓ router-config-screenshot.png (2.5 MB)
  [Ver archivo]  [Descargar]  [Eliminar]
```

### Paso 5: Reemplazar evidencia

**Si subiste una por error:**

```
Click [Eliminar]
↓
Sube la correcta
```

---

## 💬 Dejar comentarios

### Cuándo comentar

```
✓ Preguntar duda sobre cómo hacer algo
✓ Reportar un bloqueante
✓ Informar de progreso
✓ Adjuntar links a documentación
✗ Comentarios personales, chismes
```

### Cómo hacerlo

```
Sección "COMENTARIOS" al fondo

Texto: [_________________________________]
       [Enviar comentario]

Escribes: "No encuentro la documentación de VLAN"
Click: "Enviar comentario"
↓
Aparece con tu nombre y hora
↓
Admin/Supervisor recibe notificación
↓
Pueden responder en el mismo hilo
```

---

## ✅ Completar tarea

### Paso 1: Prepara todo

```
Antes de marcar 100%:

□ ¿El trabajo está realmente terminado?
□ ¿Probaste todo funciona?
□ ¿Documentaste el proceso?
□ ¿Cargaste evidencia?
□ ¿Dejaste observaciones claras?
```

### Paso 2: Actualiza estado y %

```
% Avance: [════════════════════] 100%
Estado:   [Completada ▼]
```

### Paso 3: Agrega observación final

```
Campo "Observaciones":
─────────────────────────────────────────────
"Router instalado y configurado.
VLAN 10 asignada a planta.
VLAN 20 en espera de IPs de admin.
Sistema en producción, probado 30 min.
Documentación en /servidor/docs/router-config"
─────────────────────────────────────────────
```

### Paso 4: Guarda

```
Sistema auto-guarda cambios
↓
Registra fecha_cierre = HOY
↓
Notifica a Admin/Supervisor
↓
Queda pendiente de revisión
```

### Paso 5: Revisión

```
Después de 1-2 días:
├─ Admin revisa tu trabajo
├─ Si OK: Marca como "Revisada" ✓
├─ Si hay problema: Puede coment ar
└─ Si problemas graves: Vuelve a "En Proceso"
```

---

## ⏸️ Pausar una tarea

**Escenario:** Necesitas esperar a otro equipo, no puedes continuar.

### Cómo pausar

```
Estado: [Completada ▼]
Click dropdown
Selecciona: [Pausada]
↓
Observación: "Aguardando respuesta de networking 
             para VLAN 20. Sin esto no puedo continuar"
↓
Guarda
```

### Cómo reanudar

```
Cuando el bloqueante se resuelva:

Estado: [Pausada ▼]
Click dropdown
Selecciona: [En Proceso]
↓
% Avance: [el que tenía antes]
↓
Observación: "Bloqueante resuelto, reanudando trabajo"
```

---

## 📋 Ver historial de tareas

### Tareas completadas

```
Dashboard → Click tarjeta "Completadas"
↓
Muestra solo tareas que terminaste
```

**Para cada tarea ves:**
```
- Título
- % Avance (siempre 100%)
- Cuándo se completó
- Tiempo total (fecha inicio - fecha cierre)
- Quién las revisó
```

### Filtrar por fecha

```
Rango fechas: [Desde ▼] [Hasta ▼]
[Aplicar]
↓
Muestra tareas completadas en ese rango
```

---

## ⚠️ Problemas comunes

### Problema 1: "No puedo cambiar el estado"

**Causa:** Probablemente ya está en "Completada"  
**Solución:**
```
Si está completada y admin aprobó:
→ No se puede cambiar, fue enviada al historial

Si está completada pero falta corregir:
→ Comenta al admin: "Necesito volver a Proceso"
→ Admin abre para que corrijas
```

### Problema 2: "Se perdió mi avance"

**Causa:** Probablemente cerraste sin guardar  
**Solución:**
```
Recarga página (F5)
↓
¿Sigue igual? → Sistema auto-guarda cada 10 seg
┗━ Si no está, puede haber desconexión

Prevención:
✓ Espera 10 segundos después de cambios
✓ Verifica que dice "[Auto-guardado]" debajo
```

### Problema 3: "El archivo no sube"

**Causas posibles:**
```
❌ Archivo muy grande (> 10 MB)
   ✓ Comprime imagen o convierte a PDF

❌ Tipo de archivo no permitido (.doc, .xls, .zip)
   ✓ Convierte a JPG/PNG/PDF

❌ Internet lenta
   ✓ Espera a mejor conexión o usa wifi

❌ Navegador antiguo
   ✓ Actualiza Chrome/Firefox/Edge
```

### Problema 4: "Olvidé mi contraseña"

**Solución:**
```
En página de login, click: "[¿Olvidaste contraseña?]"
↓
Ingresa tu email
↓
Recibes link de reset en email
↓
Haz click en link
↓
Establece nueva contraseña
↓
Login con nueva contraseña
```

---

## 🎯 Mejores prácticas

### 1. Revisar tareas diarias

```
Cada mañana:
1. Login a ITFlow
2. Abre dashboard
3. Revisa tarjetas:
   └─ ¿Alguna vencida? → Prioriza
   └─ ¿Muchas en proceso? → Avanza las más viejas
```

### 2. Actualizar progreso regularmente

```
Cada 2 horas:
└─ Actualiza % avance en tareas
   ├─ No esperes al final
   ├─ Mantén admin informado
   └─ Muestra compromiso
```

### 3. Documentar bien

**Observaciones claras:**
```
✓ "Instalé parches KB4567890 y KB4567891.
   Sistema reiniciado. Verificé en Windows Update.
   Pendiente: Actualizar doc wiki."

✗ "Done"
```

**Evidencia de calidad:**
```
✓ Screenshot mostrando sistema online
✓ Foto de dispositivo físico instalado
✓ PDF con logs de instalación

✗ Foto borrosa
✗ Screenshot de fondo de escritorio
```

### 4. Comunicación proactiva

```
Problema identificado:
1. ANTES: Intenta resolverlo tú
2. SI NO PUEDES: Comenta en tarea explicando
3. ESPERA: Admin/Supervisor responde
4. SIGUE: Con su orientación

NUNCA: Dejes la tarea sin actualizar "atrapada"
```

### 5. Respetar los plazos

```
Si vence mañana:
├─ 100% de concentración
├─ Avisa si no vas a llegar
├─ Pide ayuda a tiempo

Si está a tiempo:
├─ Actualiza diariamente
├─ No dejes para último día
├─ Maneja imprevistos
```

---

## 📞 Soporte

**¿Problema técnico de ITFlow?**

```
Email: soporte@empresa.com
Slack: #itflow-support
Llamada: Ext. 1234
```

**¿Duda sobre cómo hacer una tarea?**

```
Comenta en la tarea
↓
Admin/Supervisor responde
↓
Lee documentación: wiki.empresa.com
```

**¿La app está muy lenta?**

```
Intenta:
1. F5 (recargar página)
2. Cierra otras pestañas
3. Prueba navegador diferente
4. Si persiste: Contacta soporte
```

---

## ✨ Resumen rápido

| Acción | Ubicación | Atajo |
|--------|-----------|-------|
| Ver mis tareas | Dashboard | Ctrl+Home |
| Abrir una tarea | Click en tabla | Enter |
| Cambiar estado | Dropdown estado | - |
| Actualizar % | Barra avance | - |
| Cargar archivo | Botón "📎" | - |
| Dejar comentario | Sección comentarios | Ctrl+Enter |
| Completar tarea | Estado = 100% | - |
| Cambiar contraseña | Menú usuario (arriba) | - |
| Logout | Menú usuario | - |

---

**Última actualización:** 22/04/2026  
**Próxima revisión:** Q3 2026

**¡Bienvenido al equipo! Cualquier duda, no dudes en preguntar.** 🚀
