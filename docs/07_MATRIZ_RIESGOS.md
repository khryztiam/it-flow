# ⚠️ ITFlow — Matriz de riesgos técnicos

**Versión:** 2.1 | **Fecha:** Abril 2026 | **Público:** Tech leads, DevOps, arquitectos

---

## 📊 Escala de evaluación

```
PROBABILIDAD:           IMPACTO:               SEVERIDAD:
─────────────────       ────────────────       ──────────────
1: Muy baja (< 5%)     1: Muy bajo (cosmético) P1: Crítica (9-10)
2: Baja (5-25%)        2: Bajo (menor perf)    P2: Alta (7-8)
3: Media (25-50%)      3: Medio (usuarios)     P3: Media (5-6)
4: Alta (50-75%)       4: Alto (negocio)       P4: Baja (3-4)
5: Muy alta (> 75%)    5: Crítico (empresa)    P5: Insignificante (1-2)

SEVERIDAD = PROBABILIDAD × IMPACTO / 5 (escala 1-25)
```

---

## 🔴 Riesgos críticos (Severidad 9+)

### R1: Validación inconsistente en APIs

**Descripción:**
```
Las APIs no validan entrada de datos antes de procesar.
Pueden aceptar valores inválidos, malformados o maliciosos.
```

**Probabilidad:** 4/5 (Alta)  
**Impacto:** 5/5 (Crítico)  
**Severidad:** P1 (20/25) 🔴

**Escenarios:**

```
Escenario 1: inyección SQL
POST /api/admin/tareas
{
  "titulo": "'; DROP TABLE tareas; --",
  "fecha_limite": null
}
Resultado: BD corrompida

Escenario 2: Valores fuera de rango
PUT /api/user/tareas/123
{
  "porcentaje_avance": 999,
  "asignado_a": "otro_usuario_id"
}
Resultado: Datos inconsistentes

Escenario 3: Tipos incorrectos
POST /api/admin/usuarios
{
  "email": 12345,  // número, no string
  "rol_id": "admin"  // string, no número
}
Resultado: Error en BD o comportamiento inesperado
```

**Mitigación:**

```
1. INMEDIATO (< 1 semana):
   ├─ Instalar librería Zod o Joi
   ├─ Crear schemas de validación
   ├─ Validar en TODOS los endpoints POST/PUT
   └─ Escribir tests de validación

2. CORTO PLAZO (1-2 semanas):
   ├─ Sanitizar inputs en frontend
   ├─ Implementar rate limiting
   ├─ Agregar logging de inputs rechazados
   └─ Monitoring de intentos fallidos

3. MONITOREO:
   ├─ Alert si 10+ fallos de validación/min
   ├─ Análisis de patrones (posible ataque)
   └─ Auditoría de cambios rechazados
```

**Responsable:** Backend lead  
**Timeline:** 3 días máximo  
**Verificación:** Test suite de validación

---

### R2: Cero testing automatizado

**Descripción:**
```
Vitest y @vitest/ui instalados pero sin tests.
0% cobertura de código.
Cualquier cambio puede romper algo sin saberlo.
```

**Probabilidad:** 5/5 (Muy alta)  
**Impacto:** 5/5 (Crítico)  
**Severidad:** P1 (25/25) 🔴🔴

**Escenarios:**

```
Escenario 1: Refactor de permisos
Cambias lógica de puedeCrearTareas()
↓
Olvidas actualizar puedeModificarTarea()
↓
Bug en producción: Users crean tareas
↓
Data corruption

Escenario 2: Actualización de librería
npm update @supabase/supabase-js
↓
Cambió API internamente
↓
AuthContext falla silenciosamente
↓
Todos los usuarios sin login

Escenario 3: Nuevo endpoint
POST /api/admin/reasignar-lote
↓
Sin test, asume que usuario_id es válido
↓
Produce error 500 en producción
↓
Admin no puede reasignar tareas
```

**Mitigación:**

```
1. SEMANA 1 (Unit tests de funciones críticas):
   ├─ src/lib/permisos.js (todas las funciones)
   ├─ src/lib/auth.js (validación JWT)
   ├─ src/utils/formateo.js
   └─ Target: 40% cobertura (funciones críticas)

2. SEMANA 2-3 (Integration tests):
   ├─ POST /api/admin/asignar
   ├─ PUT /api/user/tareas/{id}
   ├─ GET /api/user/tareas
   └─ Target: 60% cobertura

3. SEMANA 4 (E2E tests):
   ├─ Login flow completo
   ├─ Crear tarea → Completar tarea
   ├─ Reasignación de tareas
   └─ Target: 20-30% de rutas críticas

4. CI/CD Integration:
   ├─ Tests corren en cada PR
   ├─ Merge bloqueado si falla test
   ├─ Cobertura debe aumentar, nunca bajar
   └─ Report visible en cada commit
```

**Responsable:** QA lead + Dev team  
**Timeline:** 3-4 semanas  
**Verificación:** npm test with 60%+ coverage

---

### R3: Manejo de errores deficiente

**Descripción:**
```
Errores silenciosos, usuarios no saben qué salió mal.
No hay recuperación elegante de fallos.
Debugging difícil en producción.
```

**Probabilidad:** 4/5 (Alta)  
**Impacto:** 4/5 (Alto)  
**Severidad:** P1 (16/25) 🔴

**Escenarios:**

```
Escenario 1: Network error
fetch('/api/user/tareas')
  .then(data => setData(data))
  // Sin catch, error silencioso
↓
Usuario ve pantalla en blanco
Piensa que sistema está caído
Abandona uso

Escenario 2: BD timeout
query.timeout = 30 seg
Si > 30 seg: undefined response
↓
Frontend asume success
Actualiza UI con datos vacíos
↓
Usuario cree que cambios se guardaron
Pero realmente no existe en BD

Escenario 3: Auth error
Token expirado
API retorna 401
Frontend no captura
↓
Usuario logueado localmente
Pero requests fallan
Sin saber por qué
```

**Mitigación:**

```
1. INMEDIATO (Hook centralizado):
   ├─ Crear src/hooks/useApi.js
   ├─ Manejo de error consistente
   ├─ Toast notifications para usuario
   ├─ Logging para debugging
   └─ Auto-retry en fallos de red

2. Frontend side:
   ├─ Validación antes de enviar
   ├─ Spinner/loading state
   ├─ Error message clara
   ├─ Botón "Reintentar"
   └─ Fallback si error persistente

3. Backend side:
   ├─ try-catch en TODOS los endpoints
   ├─ Logging de errores (ver ejemplo)
   ├─ Stack trace en logs, NO en response
   ├─ Código de error genérico al usuario
   └─ Alertas si error rate > 5%

4. Monitoring:
   ├─ Sentry / DataDog para tracking
   ├─ Alert en canal Slack #errors
   ├─ Dashboard de error rate
   └─ Weekly review de top errors
```

**Responsable:** Full stack team  
**Timeline:** 2-3 semanas  
**Verificación:** Error rate < 1%, todos con mensajes claros

---

## 🟠 Riesgos altos (Severidad 7-8)

### R4: N+1 problem en queries

**Descripción:**
```
Queries cargan muchas relaciones.
Ejemplo: 1 tarea hace 5 queries adicionales.
100 tareas = 500 queries.
```

**Probabilidad:** 4/5 (Alta)  
**Impacto:** 3/5 (Medio)  
**Severidad:** P2 (12/25)

**Impacto actual:**
- Queries toman 500-1000ms (vs <100ms óptimo)
- Dashboard lento con > 20 tareas
- Escalabilidad limitada

**Mitigación:**

```
FASE 1: Audit (esta semana)
├─ Identificar queries lentas
├─ Herramienta: Chrome DevTools → Network
├─ Ver cuántos requests a /api/...
└─ Documentar baseline

FASE 2: Optimización (próxima semana)
├─ Usar select específico de columnas
├─ Ejemplo:
   .select(`
     id, titulo, estado_id,
     estado:estados_tarea(nombre)
   `)
├─ Evitar joins innecesarios
└─ Usar join para relaciones 1-a-muchos

FASE 3: Caché (semana 3)
├─ SWR para datos que no cambian frecuente
├─ Revalidar cada 60 segundos
├─ LocalStorage para fallback
└─ Reducir requests en 70%

FASE 4: Índices en BD (semana 4)
├─ Crear índices en columnas FK
├─ CREATE INDEX idx_tareas_asignado_a ON tareas(asignado_a)
├─ Medir impacto: antes/después
└─ Query time: 500ms → <100ms esperado
```

**Responsable:** Backend lead  
**Timeline:** 4 semanas  
**KPI:** Response time (p95) < 200ms

---

### R5: RLS incompleto en Supabase

**Descripción:**
```
Row Level Security deshabilitado en algunas tablas.
Si alguien bypassea API, puede acceder a datos de otros.
```

**Probabilidad:** 2/5 (Baja)  
**Impacto:** 5/5 (Crítico)  
**Severidad:** P1 (10/25) 🔴

**Mitigación:**

```
INMEDIATO:
├─ Verificar todas las tablas en Supabase
├─ Tablas que DEBEN tener RLS:
│  ├─ usuarios
│  ├─ tareas
│  ├─ comentarios
│  └─ (cualquier tabla sensible)
│
├─ Habilitar RLS en cada una:
│  ├─ ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
│  ├─ ALTER TABLE tareas ENABLE ROW LEVEL SECURITY;
│  └─ ALTER TABLE comentarios ENABLE ROW LEVEL SECURITY;
│
└─ Crear policies:
   ├─ Admin: Puede ver TODO
   ├─ User: Puede ver solo sus tareas
   ├─ Supervisor: Puede ver solo tareas de su planta
   └─ Test cada policy

VERIFICACIÓN:
└─ Intentar bypasear desde Postman
   ├─ Sin JWT: debe bloquear
   ├─ Con JWT de otro usuario: debe filtrar
   └─ Si falla: RLS no está configurado
```

**Timeline:** 2 días  
**Verificación:** Security audit

---

### R6: Falta documentación de APIs

**Descripción:**
```
Endpoints documentados solo en README.
Sin parámetros, códigos de error, ejemplos de response.
Nueva dev tarda mucho en entender API.
```

**Probabilidad:** 3/5 (Media)  
**Impacto:** 3/5 (Medio)  
**Severidad:** P3 (9/25)

**Mitigación:**

```
OPCIÓN 1: Swagger/OpenAPI (recomendado)
├─ Instalar: npm install next-swagger-doc
├─ Generar documentación automática
├─ UI en /api-docs
├─ Developers pueden probar endpoints
├─ Esfuerzo: 3-4 horas
└─ ROI: Alto para nuevos devs

OPCIÓN 2: README detallado (si budget limitado)
├─ Listar endpoints
├─ Parámetros
├─ Códigos de error
├─ Ejemplos de request/response
└─ Esfuerzo: 2 horas

Timeline: Hacer antes de que se agreguen más devs
```

---

## 🟡 Riesgos medios (Severidad 5-6)

### R7: Falta de caché

**Descripción:**
```
Cada click recarga datos desde BD.
Dashboard refresh = 5 requests.
Con 100 users simultáneos = 500 queries/min.
```

**Probabilidad:** 5/5  
**Impacto:** 2/5 (Datos de baja frecuencia)  
**Severidad:** P4 (10/25)

**Mitigación:** Implementar SWR en Q2

---

### R8: Logging centralizado ausente

**Descripción:**
```
Errores en console.error() diseminados.
Difícil debuggear en producción.
```

**Probabilidad:** 3/5  
**Impacto:** 2/5  
**Severidad:** P4 (6/25)

**Mitigación:** Logger centralizado + Sentry

---

## 🟢 Riesgos bajos (Severidad 1-4)

### R9-R12: TypeScript, mobile responsiveness, etc.

```
Bajos en severidad, planificar para futuro (Q3+)
No son bloqueantes para producción.
```

---

## 📋 Tabla resumen de riesgos

| ID | Riesgo | Prob | Imp | Sev | Estado | Deadline |
|----|--------|------|-----|-----|--------|----------|
| R1 | Validación APIs | 4 | 5 | 20 | 🔴 P0 | Esta semana |
| R2 | Sin tests | 5 | 5 | 25 | 🔴 P0 | 3 semanas |
| R3 | Manejo errores | 4 | 4 | 16 | 🔴 P0 | 2 semanas |
| R4 | N+1 queries | 4 | 3 | 12 | 🟠 P2 | 4 semanas |
| R5 | RLS incompleto | 2 | 5 | 10 | 🔴 P0 | 2 días |
| R6 | Sin API docs | 3 | 3 | 9 | 🟠 P2 | 3 semanas |
| R7 | Sin caché | 5 | 2 | 10 | 🟡 P3 | 6 semanas |
| R8 | Sin logging | 3 | 2 | 6 | 🟡 P3 | 4 semanas |

---

## 🎯 Plan de ejecución (4 semanas)

### Semana 1 (Seguridad crítica)

```
Lunes:      R5 (RLS), R1 (Zod validación)
Martes:     R3 (useApi hook)
Miércoles:  Tests y integration R5-R3
Jueves:     Code review + deploy staging
Viernes:    Verificación seguridad audit
```

### Semana 2-3 (Testing)

```
R2: Unit tests + Integration tests
├─ Unit tests: permisos.js, auth.js (R2 parte 1)
├─ Integration tests: APIs (R2 parte 2)
└─ Target: 60% coverage
```

### Semana 4 (Optimization)

```
R4: Performance
├─ Optimizar queries
├─ Implementar índices
└─ Target: response time < 200ms

R6: Documentation
├─ Swagger/OpenAPI setup
└─ Documentar todos endpoints
```

---

## 🚨 Activación de crisis

Si ocurre alguno de estos eventos:

```
EVENTO 1: Data breach/Seguridad comprometida
├─ Activar plan de incident response
├─ Notificar a usuarios
├─ Auditoría forense
└─ Mejora seguridad

EVENTO 2: Downtime > 1 hora
├─ Incident commander asignado
├─ Comunicación a stakeholders
├─ Post-mortem en 24 horas
└─ Acción correctiva

EVENTO 3: Data corruption masiva
├─ Restaurar desde backup
├─ Identificar causa raíz
├─ Implementar safeguards
└─ Testing exhaustivo antes de reopen
```

---

## 📊 KPIs de riesgo

```
Monitoreados semanalmente:

Error rate:        < 1% (actualmente desconocido)
Response time:     < 200ms p95 (actualmente 500ms)
Uptime:            > 99% (actualmente 100% pero sin monitoreo)
Test coverage:     > 60% (actualmente 0%)
Security score:    > 9/10 (actualmente 8/10)
User complaints:   < 5/week (establecer baseline)
```

---

## 👥 Responsabilidades

```
Tech Lead:    Supervision y priorización de riesgos
Backend Dev:  R1, R4, R5, R6 (validación, queries, RLS, docs)
Frontend Dev: R3 (error handling), R7 (caché)
QA:           R2 (testing), validación de mitigaciones
DevOps:       R8 (logging), monitoring de KPIs
```

---

**Próxima revisión de riesgos:** Semana 2 de Abril  
**Escalación:** Si cualquier riesgo P1 no está mitigado en deadline asignado
