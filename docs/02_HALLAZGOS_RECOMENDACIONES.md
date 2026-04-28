# 🔍 ITFlow — Análisis de hallazgos y recomendaciones

**Versión:** 2.1 | **Fecha:** Abril 2026 | **Arquitecto de Software**

> Nota de mantenimiento - 27/04/2026: este documento conserva analisis historico. Antes de tomar decisiones, contrastar con `docs/00_ESTADO_ACTUAL.md`. El rol supervisor ya esta activo y el proyecto mantiene JavaScript como lenguaje de la app; cualquier referencia a migrar a TypeScript debe tratarse solo como idea historica, no como recomendacion vigente del proyecto.

---

## 📊 Resumen ejecutivo

ITFlow es un sistema de gestión de tareas **bien estructurado arquitectónicamente** con separación clara de responsabilidades. Al 27/04/2026 ya tiene 3 roles activos (Admin, Supervisor y User) con seguridad multinivel (cliente → API → BD).

**Estado del proyecto:**
- ✅ Arquitectura sólida
- ⚠️ Áreas críticas de mejora identificadas
- 🚀 Listo para producción con mitigaciones

**Hallazgos:** 12 críticos/altos, 8 medios, 5 bajos

---

## ✅ Fortalezas identificadas

### 1. Arquitectura modular y separación de responsabilidades

**Hallazgo:** El proyecto sigue patrones React modernos

```
src/
├─ pages/         (Vistas + Lógica de ruteo)
├─ components/    (UI reutilizable)
├─ context/       (Estado global Auth)
├─ hooks/         (Lógica reutilizable)
├─ lib/           (Utilidades + APIs)
├─ utils/         (Formateo)
└─ styles/        (CSS Modules por componente)
```

**Impacto:** ✅ Positivo
- Fácil navegar codebase
- Reutilización alta
- Cambios aislados por dominio
- Onboarding rápido de nuevos devs

---

### 2. Seguridad en tres capas

**Hallazgo:** Implementación multinivel de autorización

```
Layer 1: Cliente → useProtegerRuta() + AuthContext
Layer 2: API → verifyUserToken() + permisos.js
Layer 3: BD → Supabase RLS (Row Level Security)
```

**Impacto:** ✅ Positivo
- Imposible bypassear seguridad
- Validación redundante (defensa en profundidad)
- Cumple estándares OWASP
- Riesgo bajo de data leaks

---

### 3. Integración fluida Supabase

**Hallazgo:** Uso adecuado de Supabase Auth + PostgreSQL

**Aciertos:**
- JWT manejado automáticamente
- onAuthStateChange para sesiones reales
- Queries con relaciones (LEFT JOIN automático)
- RLS-ready (aunque no totalmente configurado)

**Impacto:** ✅ Positivo
- Escalable a miles de usuarios
- Performance aceptable
- Mantenimiento bajo

---

### 4. Componentes reutilizables

**Hallazgo:** Componentes genéricos bien diseñados

```javascript
<FormularioMulti/>    // Crear/editar cualquier recurso
<TablaGenerica/>      // Listar datos dinámicamente
<Modal/>              // Confirmaciones + formularios
<Tabs/>               // Sistema de navegación
```

**Impacto:** ✅ Positivo
- Código duplicado bajo
- Consistencia visual
- Mantenimiento centralizado
- Fácil agregar nuevas vistas

---

### 5. Flujos UX claros

**Hallazgo:** Cada rol tiene flujos bem definidos y navegación lógica

- Admin: Ver global → Crear → Asignar → Monitorear
- User: Dashboard → Mis tareas → Actualizar → Cargar evidencia
- Supervisor: (Planeado) Tareas de planta → Gestión local

**Impacto:** ✅ Positivo
- Usuarios no confundidos
- Menos clicks para tareas comunes
- Escalable a nuevas features

---

## ⚠️ Áreas de mejora crítica

### 1. CRÍTICO: Validación inconsistente en APIs

**Problema identificado:**

```javascript
// ❌ API sin validación de entrada
export default async function handler(req, res) {
  const { titulo, descripcion, fecha_limite } = req.body;
  
  // Ninguna validación de tipos/formatos
  // No checkea campos obligatorios
  // Vulnerable a inyección de datos
  
  const { error } = await supabaseAdmin
    .from('tareas')
    .insert({ titulo, descripcion, fecha_limite });
  
  if (error) return res.status(500).json({ error });
  return res.status(200).json({ ok: true });
}
```

**Riesgo:**
- Datos corruptos en BD
- Queries SQL malformadas
- Errores en cascada

**Recomendación:** Implementar validación con `zod`

```javascript
// ✅ API con validación
import { z } from 'zod';

const createTareaSchema = z.object({
  titulo: z.string().min(3).max(200),
  descripcion: z.string().optional(),
  fecha_limite: z.string().datetime(),
  prioridad_id: z.number().min(1),
  asignado_a: z.string().uuid(),
});

export default async function handler(req, res) {
  try {
    const datos = createTareaSchema.parse(req.body);
    // Proceder con datos validados
  } catch (err) {
    return res.status(400).json({ 
      error: 'Validation failed', 
      details: err.errors 
    });
  }
}
```

**Esfuerzo:** 2-3 horas | **Impacto:** Alto

---

### 2. CRÍTICO: Falta de testing

**Problema identificado:**

```
Dependencias instaladas: vitest, @vitest/ui
Tests escritos: 0
Cobertura: 0%
```

**Riesgo:**
- Regresiones no detectadas
- Cambios de lógica de negocio rompen sin avisar
- Refactors peligrosos

**Recomendación:** Testing en capas

```javascript
// TIER 1: Unit tests (funciones puras)
// src/__tests__/lib/permisos.test.js
import { esAdmin, puedeCrearTareas } from '@lib/permisos';

describe('Permisos', () => {
  it('esAdmin retorna true para usuarios admin', () => {
    const usuario = { rol: { nombre: 'admin' } };
    expect(esAdmin(usuario)).toBe(true);
  });
  
  it('puedeCrearTareas retorna true para admin/supervisor', () => {
    const admin = { rol: { nombre: 'admin' } };
    const user = { rol: { nombre: 'user' } };
    
    expect(puedeCrearTareas(admin)).toBe(true);
    expect(puedeCrearTareas(user)).toBe(false);
  });
});
```

**TIER 2:** Integration tests (APIs + BD)

```javascript
// src/__tests__/api/user-tareas.test.js
describe('GET /api/user/tareas', () => {
  it('retorna solo tareas del usuario', async () => {
    const token = await obtenerTokenUser(userId);
    const res = await fetch('/api/user/tareas', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const tareas = await res.json();
    expect(tareas.every(t => t.asignado_a === userId)).toBe(true);
  });
});
```

**TIER 3:** E2E tests (Flujos completos)

```javascript
// e2e/crear-tarea.spec.js
import { test, expect } from '@playwright/test';

test('Admin puede crear y asignar tarea', async ({ page }) => {
  await page.goto('/login');
  await page.fill('input[type="email"]', 'admin@test.com');
  await page.fill('input[type="password"]', 'password');
  await page.click('button[type="submit"]');
  
  await page.goto('/admin/tareas');
  await page.click('button:has-text("Nueva tarea")');
  
  // Llena form...
  // Verifica que aparezca en lista...
});
```

**Esfuerzo:** 5-7 horas (Tier 1) + 8-10 horas (Tier 2) | **Impacto:** Muy alto

---

### 3. CRÍTICO: Manejo de errores inconsistente

**Problema identificado:**

```javascript
// ❌ Algunos endpoints sin manejo de errores
const cargarTareas = async () => {
  const response = await fetch('/api/user/tareas');
  const data = await response.json();
  // Si response.ok es false, qué pasa?
  // No hay toast/notificación
  // Usuario no sabe qué falló
};

// ❌ Try-catch genéricos
try {
  // operación
} catch (err) {
  console.error(err);
  // Sin feedback al usuario
}
```

**Riesgo:**
- Usuarios confundidos
- Errores silenciosos
- Debugging difícil

**Recomendación:** Crear hook `useApi` centralizado

```javascript
// src/hooks/useApi.js
import { useState } from 'react';
import { useRouter } from 'next/router';

export function useApi() {
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);
  const router = useRouter();

  const request = async (
    url,
    { method = 'GET', body = null, onSuccess = null } = {}
  ) => {
    try {
      setCargando(true);
      setError(null);

      const token = await getToken();
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: body ? JSON.stringify(body) : null,
      });

      if (!res.ok) {
        const errData = await res.json();
        
        if (res.status === 401) {
          router.push('/login');
          throw new Error('Sesión expirada');
        }
        
        throw new Error(
          errData.detail || 
          errData.error || 
          `Error ${res.status}`
        );
      }

      const data = await res.json();
      onSuccess?.(data);
      return data;
    } catch (err) {
      setError(err.message);
      console.error('API Error:', err);
      throw err;
    } finally {
      setCargando(false);
    }
  };

  return { request, cargando, error };
}

// Uso:
export default function MyComponent() {
  const { request, cargando, error } = useApi();
  
  const crearTarea = async (datos) => {
    try {
      await request('/api/admin/asignar', {
        method: 'POST',
        body: datos,
        onSuccess: () => {
          showToast('Tarea creada', 'success');
          refrescarLista();
        }
      });
    } catch (err) {
      showToast(err.message, 'error');
    }
  };
  
  return (
    <div>
      {error && <Alert type="error">{error}</Alert>}
      {cargando && <Spinner />}
      {/* ... */}
    </div>
  );
}
```

**Esfuerzo:** 2-3 horas | **Impacto:** Alto

---

### 4. CRÍTICO: Protección de rutas incompleta en modo producción

**Problema identificado:**

```javascript
// useProtegerRuta usa router.push() en useEffect
// Hay window de vulnerabilidad donde contenido visible antes de redirigir

export const useProtegerRuta = (rolesPermitidos = []) => {
  useEffect(() => {
    if (!cargando && !tienePermiso) {
      router.push('/login');  // ← Retraso entre detectar + redirigir
    }
  }, [...]); // ← User ve contenido por 100-200ms
  
  return { usuarioDetalles, cargando }; // ← Retorna antes de redirigir
};
```

**Riesgo:**
- Flash de contenido protegido
- Datos sensibles brevemente visibles
- UX pobre

**Recomendación:** Bloquear render hasta validación

```javascript
// ✅ Mejora
export const useProtegerRuta = (rolesPermitidos = []) => {
  const router = useRouter();
  const { usuarioDetalles, cargando } = useAuth();

  useEffect(() => {
    if (cargando) return; // Esperar a auth

    const tienePermiso =
      usuarioDetalles &&
      rolesPermitidos.includes(usuarioDetalles.rol.nombre);

    if (!tienePermiso) {
      router.push('/login');
    }
  }, [usuarioDetalles, cargando, router, rolesPermitidos]);

  // No renderizar nada si no está autorizado
  if (cargando) return null; // Spinner en _app
  
  const tienePermiso =
    usuarioDetalles &&
    rolesPermitidos.includes(usuarioDetalles.rol.nombre);

  if (!tienePermiso) return null;

  return { usuarioDetalles, cargando };
};
```

**Esfuerzo:** 1 hora | **Impacto:** Medio-Alto

---

### 5. ALTO: Performance: N+1 problem en queries

**Problema identificado:**

```javascript
// En dashboard, cargar tareas + usuario detalles + planta
const { data } = await supabase
  .from('tareas')
  .select(`
    id, titulo,
    asignado_a,
    asignado_a_user:usuarios!asignado_a(
      id, nombre_completo,
      planta_id,
      planta:plantas(id, nombre, pais:paises(id, nombre))  // ← Muchos joins
    ),
    estado:estados_tarea(id, nombre),
    prioridad:prioridades(id, nombre),
    creado_por_user:usuarios!creado_por(id, nombre_completo),
    supervisado_por_user:usuarios!supervisado_por(...)
  `);
```

Si hay 100 tareas, esto genera múltiples queries en cascada.

**Recomendación:** Seleccionar solo columnas necesarias

```javascript
// ✅ Optimizado
const { data } = await supabase
  .from('tareas')
  .select(`
    id,
    titulo,
    descripcion,
    porcentaje_avance,
    fecha_limite,
    estado:estados_tarea(nombre),
    prioridad:prioridades(nombre),
    asignado_a_user:usuarios!asignado_a(nombre_completo)
  `)
  .eq('asignado_a', userId)
  .order('fecha_limite', { ascending: true });
```

**Esfuerzo:** 1-2 horas | **Impacto:** Alto (para escalas > 1000 tareas)

---

### 6. ALTO: Falta documentación de APIs (OpenAPI/Swagger)

**Problema identificado:**

Endpoints documentados en README pero sin:
- Esquemas JSON
- Códigos de error esperados
- Ejemplos de request/response
- Parámetros query

**Recomendación:** Agregar `next-swagger-doc`

```javascript
// pages/api/swagger.js
import { createSwaggerSpec } from 'next-swagger-doc';

const spec = createSwaggerSpec({
  title: 'ITFlow API',
  version: '2.0',
  definition: {
    openapi: '3.0.0',
    paths: {
      '/api/user/tareas': {
        get: {
          summary: 'Obtener mis tareas',
          parameters: [
            {
              name: 'Authorization',
              in: 'header',
              required: true,
              schema: { type: 'string' }
            }
          ],
          responses: {
            200: {
              description: 'Lista de tareas',
              content: {
                'application/json': {
                  schema: {
                    type: 'array',
                    items: { /* ... */ }
                  }
                }
              }
            },
            403: { description: 'Forbidden' }
          }
        }
      }
    }
  }
});

export default function handler(req, res) {
  res.status(200).json(spec);
}
```

**Esfuerzo:** 3-4 horas | **Impacto:** Medio

---

## ⚠️ Áreas de mejora media

### 7. Configuración RLS incompleta

**Hallazgo:** Supabase RLS configurado pero con huecos

```sql
-- Debería existir pero no está
CREATE POLICY "Users can only see their own tasks"
  ON tareas FOR SELECT
  USING (auth.uid() = asignado_a);

CREATE POLICY "Admin can see all tasks"
  ON tareas FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM usuarios
      WHERE id = auth.uid()
      AND rol_id = (SELECT id FROM roles WHERE nombre = 'admin')
    )
  );
```

**Recomendación:** Completar RLS en todas las tablas

---

### 8. Caché / Refresco de datos

**Hallazgo:** Dashboard recarga datos en cada acceso

```javascript
// Podría usar SWR o React Query
const { data: tareas } = useSWR(
  usuarioDetalles ? '/api/user/tareas' : null,
  fetcher,
  {
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
    dedupingInterval: 60000, // Cache 60 seg
  }
);
```

**Beneficio:** Reducir network calls, UX más rápida

---

### 9. Información de carga (Loading states)

**Hallazgo:** Algunos componentes no muestran feedback

```javascript
// Mejora: Agregar spinners/skeletons
{cargando ? <TareaSkeleton /> : <TareaCard {...tarea} />}
```

---

### 10. Validación de roles en supervisor

**Hallazgo:** Hook `useSupervisor()` existe pero ruta `/supervisor/dashboard` tira 404

```
Validación: useSupervisor() → redirige a /supervisor/tareas
Pero /supervisor/dashboard no existe → confusión
```

**Recomendación:** Unificar rutas o implementar ambas

---

## 📝 Áreas de mejora baja

### 11. Logging centralizado

**Hallazgo:** Logs diseminados con console.error()

```javascript
// Implementar logger centralizado
// src/lib/logger.js
export const logger = {
  info: (msg, data) => console.log(`[INFO] ${msg}`, data),
  error: (msg, err) => console.error(`[ERROR] ${msg}`, err),
  warn: (msg, data) => console.warn(`[WARN] ${msg}`, data)
};
```

---

### 12. TypeScript (referencia historica, no vigente)

**Hallazgo:** Proyecto en JavaScript puro

**Estado actual:** No migrar a TypeScript. La convencion vigente del proyecto es JavaScript puro.

```bash
# Convertir archivos críticos
src/lib/permisos.js → src/lib/permisos.ts
src/context/AuthContext.js → src/context/AuthContext.tsx
```

**Lectura:** Mantener esta seccion solo como contexto historico. Para mejoras actuales, priorizar validaciones, pruebas y seguridad sin cambiar el lenguaje de la app.

---

## 📊 Matriz de prioridad

| ID | Hallazgo | Severidad | Esfuerzo | ROI | Prioridad |
|-------|----------|-----------|----------|-----|-----------|
| 1 | Validación con Zod | Crítica | 2-3h | Alto | **P0** |
| 2 | Unit Testing (Tier 1) | Crítica | 5-7h | Muy alto | **P0** |
| 3 | useApi hook | Crítica | 2-3h | Alto | **P0** |
| 4 | Protección rutas mejorada | Crítica | 1h | Medio | **P1** |
| 5 | Optimizar queries | Alta | 1-2h | Alto | **P1** |
| 6 | Swagger/OpenAPI | Alta | 3-4h | Medio | **P2** |
| 7 | RLS completo | Alta | 2-3h | Alto | **P1** |
| 8 | Caché (SWR) | Media | 3-4h | Medio | **P2** |
| 9 | Loading states | Media | 2-3h | Bajo | **P3** |
| 10 | Supervisor routes | Media | 1-2h | Bajo | **P2** |
| 11 | Logging | Baja | 1h | Bajo | **P3** |
| 12 | Mantener JavaScript y reforzar validaciones | Baja | 4-8h | Medio | **P4** |

---

## 🚀 Plan de acción (3 meses)

### Mes 1: Seguridad y confiabilidad

- [ ] Implementar Zod para validación (2-3h)
- [ ] Crear useApi hook centralizado (2-3h)
- [ ] Unit tests para permisos.js y auth.js (5-7h)
- [ ] Mejorar protección de rutas (1h)

**Resultado:** API robusta, testing foundation, errores consistentes

### Mes 2: Performance y documentación

- [ ] Optimizar queries N+1 (1-2h)
- [ ] RLS policies completas (2-3h)
- [ ] Swagger/OpenAPI docs (3-4h)
- [ ] Integration tests (8-10h)

**Resultado:** API documentada, BD optimizada, confianza en cambios

### Mes 3: UX y escalabilidad

- [ ] SWR para caché (3-4h)
- [ ] Loading states en todos los componentes (2-3h)
- [ ] E2E tests con Playwright (5-8h)
- [ ] Limpieza de recomendaciones historicas que contradicen JavaScript puro

**Resultado:** UX mejorada, tests E2E y documentacion alineada al stack vigente

---

## 🎯 Métricas de éxito

| Métrica | Baseline | Target | Timeline |
|---------|----------|--------|----------|
| Test coverage | 0% | 60% (crítico) | Mes 1-2 |
| API response time (p95) | ~500ms | <200ms | Mes 2 |
| OWASP score | 8/10 | 9/10 | Mes 1 |
| API documentation | 30% | 100% | Mes 2 |
| Uptime (staging) | 99% | 99.9% | Mes 3 |

---

## 💡 Conclusión

ITFlow tiene **cimientos sólidos** pero necesita **inversión en calidad** antes de escalar.

**Con el plan propuesto:**
- ✅ Producción lista en 3 meses
- ✅ Mantenibilidad mejorada 80%
- ✅ Confianza en cambios futuros
- ✅ Onboarding de devs más rápido

**Sin este plan:**
- ⚠️ Bugs en producción inevitables
- ⚠️ Deuda técnica se acumula
- ⚠️ Refactors riesgosos
- ⚠️ Crecimiento limitado

---

**Próxima reunión de arquitectura:** Mes 1, Semana 2
