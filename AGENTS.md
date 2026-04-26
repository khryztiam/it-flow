# AGENTS.md

## Propósito

Este archivo define cómo debe trabajar un agente sobre este proyecto cuando se le solicita analizar, depurar, modificar o extender funcionalidad.

Complementa `.github/copilot-instructions.md`:

- `copilot-instructions.md` define reglas globales de estilo, stack y restricciones.
- `AGENTS.md` define el flujo operativo del agente para ejecutar tareas de forma segura y mantenible.

---

## Modo de trabajo esperado

El agente debe trabajar como un **ingeniero de mantenimiento y evolución incremental**, no como un generador de refactors innecesarios.

Prioridades:

1. Entender el problema real
2. Minimizar riesgo de ruptura
3. Aplicar el cambio mínimo útil
4. Validar lo modificado
5. Explicar claramente qué cambió

---

## Flujo operativo obligatorio

### 1) Entender la tarea antes de editar

Antes de proponer cambios:

- leer los archivos directamente relacionados,
- identificar el flujo afectado,
- ubicar el origen probable del problema,
- revisar si ya existe lógica similar reutilizable.

No asumir que la mejor solución es crear algo nuevo.

### 2) Clasificar el tipo de tarea

Antes de actuar, clasificar la solicitud en una de estas categorías:

- **bug**
- **ajuste UI**
- **nueva feature**
- **refactor puntual**
- **integración con Supabase**
- **auth / sesión / roles**
- **API route / backend**
- **performance**
- **revisión de código**

La estrategia debe adaptarse a la categoría.

### 3) Elegir el camino de menor riesgo

Siempre preferir:

- editar una función existente,
- ajustar una query existente,
- corregir una validación,
- reparar un flujo puntual,
  antes que:
- rehacer módulos completos,
- mover archivos,
- crear nueva arquitectura,
- introducir dependencias nuevas.

### 4) Validar impacto antes de cambiar

Antes de tocar cualquier archivo, evaluar impacto en:

- autenticación,
- sesión,
- roles,
- rutas protegidas,
- Supabase / RLS,
- props compartidas,
- estilos globales o layout,
- compatibilidad con Pages Router.

### 5) Aplicar el cambio mínimo necesario

Cada cambio debe tener un alcance acotado.
Evitar cambios colaterales no pedidos.

### 6) Validar después del cambio

Después del cambio:

- comprobar coherencia del código,
- revisar imports,
- revisar nombres de variables,
- verificar que no se rompió el flujo existente,
- indicar cómo probar.

---

## Estrategia por tipo de tarea

## Bugs

### Método

1. Reproducir mentalmente o con evidencia el flujo
2. Ubicar el punto de falla más probable
3. Revisar código similar o patrón existente
4. Corregir con el menor cambio posible
5. Validar el resultado

### Reglas

- No hacer refactor grande como primera respuesta
- No mezclar corrección de bug con mejoras cosméticas no pedidas
- Si existen varias causas posibles, empezar por la más probable y barata de validar

---

## Ajustes UI

### Método

1. Revisar componente actual
2. Revisar CSS Module asociado
3. Revisar componente padre si afecta props o layout
4. Ajustar sin rediseñar toda la pantalla

### Reglas

- Mantener CSS Modules
- Reutilizar clases existentes cuando sea razonable
- No introducir librerías UI nuevas
- No romper responsive existente
- No cambiar estructura visual completa si solo se pidió un ajuste puntual

---

## Nuevas features

### Método

1. Revisar si ya existe un flujo similar
2. Determinar dónde encaja la funcionalidad en la estructura actual
3. Implementar por capas mínimas:
   - UI
   - lógica
   - integración
   - validación

### Reglas

- No sobreingenierizar
- No crear abstracciones anticipadas
- Si la feature toca auth, roles o Supabase, validar esos impactos antes de codificar

---

## Auth, sesión y roles

### Archivos críticos a revisar primero

- `src/context/AuthContext.js`
- `src/lib/auth.js`
- `src/lib/supabaseClient.js`
- `src/pages/api/**` relacionadas
- componentes o hooks que dependan de usuario, sesión o rol

### Reglas

- No romper login ni logout
- No asumir que el rol viene siempre cargado
- Validar persistencia de sesión
- Validar rutas protegidas
- Validar diferencias entre frontend público, backend seguro y operaciones admin
- No mover lógica sensible al cliente si requiere privilegios elevados

### Riesgos típicos

- perfil no cargado,
- sesión expirada,
- inconsistencia entre rol y permisos,
- consultas bloqueadas por RLS,
- render condicional incorrecto,
- estados iniciales mal manejados.

---

## Supabase

### Antes de tocar queries

Confirmar:

- nombre real de tabla,
- columnas reales,
- relaciones,
- filtros correctos,
- impacto de RLS,
- si la operación debe ir en cliente o backend seguro.

### Reglas

- No usar lógica admin en cliente
- No exponer secretos
- No inventar estructura de base de datos
- Reutilizar queries o patrones existentes cuando sea posible
- Si la operación requiere privilegios elevados, usar backend seguro o API route

### Para cambios de datos

Al proponer `select`, `insert`, `update` o `delete`, indicar:

- qué tabla se afecta,
- qué columnas intervienen,
- qué condición o filtro se usa,
- qué impacto puede tener RLS.

---

## API routes y backend

### Método

1. Revisar contrato actual de entrada y salida
2. Verificar validaciones
3. Verificar manejo de errores
4. Mantener respuesta consistente

### Reglas

- No cambiar contratos de API sin explicarlo
- Mantener JSON consistente
- Evitar lógica innecesaria en rutas simples
- Validar permisos si la ruta toca datos sensibles

---

## Refactor puntual

Solo hacer refactor cuando:

- mejora legibilidad sin alterar comportamiento,
- elimina duplicación real,
- corrige deuda técnica que afecta el cambio solicitado.

No usar una solicitud puntual como excusa para reestructurar el proyecto.

---

## Archivos nuevos

Crear un archivo nuevo solo si:

- el framework lo requiere,
- la responsabilidad está claramente separada,
- existe reutilización real,
- mantener todo en un archivo empeora claramente el mantenimiento.

Si el cambio cabe razonablemente en un archivo existente, no crear uno nuevo.

---

## Documentación

No crear documentación nueva salvo que:

- el usuario la pida,
- el cambio la requiera de forma evidente,
- haga falta registrar una convención técnica nueva.

---

## Formato de respuesta esperado del agente

Cuando el agente proponga o aplique cambios, debe responder así:

### 1. Resumen

Explicar en pocas líneas qué problema se detectó o qué se va a implementar.

### 2. Causa o enfoque

Indicar la causa probable del bug o el enfoque elegido para la mejora.

### 3. Archivos afectados

Listar los archivos a revisar o modificar.

### 4. Cambio aplicado

Describir el cambio mínimo necesario.

### 5. Validación

Indicar cómo probarlo.

---

## Estilo de respuesta

- Técnico
- Directo
- Sin relleno
- Sin repetir obviedades
- Sin explicaciones largas si no aportan valor
- Si falta información crítica, hacer una sola pregunta clara
- Si la ambigüedad no bloquea, asumir la opción más razonable y declararla

---

## Lista de verificación antes de cerrar una tarea

- ¿Se entendió bien el problema?
- ¿Se revisaron los archivos correctos?
- ¿El cambio fue mínimo y controlado?
- ¿Se evitó tocar arquitectura sin necesidad?
- ¿Se consideró auth, roles, sesión o RLS si aplicaba?
- ¿Se mantuvo compatibilidad con Pages Router?
- ¿Se evitó introducir dependencias innecesarias?
- ¿Se explicó cómo validar?

---

## No hacer

- No migrar a TypeScript
- No migrar a Tailwind
- No migrar a App Router
- No rehacer módulos completos sin necesidad
- No inventar tablas, columnas, endpoints o variables de entorno
- No cambiar nombres por preferencia personal
- No declarar algo como listo sin validación razonable
- No mezclar arreglos funcionales con refactors estéticos innecesarios

---

## Prioridad de decisión

Si hay conflicto entre varias opciones, priorizar en este orden:

1. seguridad,
2. no romper flujos actuales,
3. compatibilidad con arquitectura existente,
4. cambio mínimo útil,
5. claridad del código,
6. velocidad de implementación.

---

**Última actualización:** 23 de abril de 2026
