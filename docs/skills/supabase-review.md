# Skill — Supabase Review

## Cuándo usarla

Usar esta skill cuando la tarea implique cualquiera de estos puntos:

- consultas SQL o queries desde cliente/backend,
- tablas, vistas, funciones o RPC,
- políticas RLS,
- relaciones entre tablas,
- inserts, updates, deletes o selects sensibles,
- validación de nombres de columnas, filtros o joins,
- revisión de seguridad o permisos de acceso.

---

## Qué revisar primero

1. Confirmar la tabla, vista o función real involucrada.
2. Confirmar columnas, relaciones y filtros reales.
3. Confirmar si la operación debe correr en:
   - cliente,
   - API route,
   - backend seguro,
   - o contexto admin.
4. Confirmar si aplica RLS.
5. Revisar si ya existe una query, helper o patrón similar en el proyecto.
6. Revisar si el cambio impacta auth, roles, sesión o datos sensibles.

---

## Archivos clave

Revisar según aplique:

- `src/lib/supabaseClient.js`
- `src/lib/auth.js`
- `src/context/AuthContext.js`
- `src/pages/api/**`
- `docs/SUPABASE_ESQUEMA_Y_FLUJOS.md`
- hooks, utils o services que ya consulten Supabase
- componentes que dependan del resultado de la query

---

## Riesgos frecuentes

- usar nombres de tabla o columna incorrectos,
- romper una query existente por cambiar filtros o alias,
- usar lógica admin en cliente,
- ignorar políticas RLS,
- asumir relaciones que no existen,
- mezclar contexto de usuario autenticado con operaciones privilegiadas,
- introducir consultas que funcionan en local pero fallan en producción,
- devolver estructuras inconsistentes a la UI.

---

## Estrategia recomendada

1. Leer una implementación similar ya existente.
2. Confirmar estructura real antes de escribir la consulta.
3. Mantener el cambio mínimo necesario.
4. Reutilizar helpers, patrones o wrappers existentes.
5. Si la operación requiere privilegios elevados, moverla a backend seguro o API route.
6. Explicar claramente:
   - tabla o función afectada,
   - columnas involucradas,
   - filtro usado,
   - impacto esperado.

---

## Checklist de validación

- ¿La tabla o función existe realmente?
- ¿Las columnas usadas existen?
- ¿Los filtros coinciden con el caso real?
- ¿La operación debe ejecutarse en cliente o backend?
- ¿RLS permite esta operación?
- ¿La respuesta devuelve exactamente lo que la UI o API espera?
- ¿Se revisó impacto en auth, roles y sesión?
- ¿No se expusieron secrets ni lógica admin en frontend?

---

## Qué no hacer

- No inventar tablas, columnas, joins o funciones.
- No asumir que el usuario autenticado tiene permisos suficientes.
- No usar `service_role` ni secretos en frontend.
- No meter lógica admin en cliente.
- No cambiar una query estable por una versión más compleja si no hace falta.
- No tocar RLS sin explicar el impacto.
- No declarar una consulta como correcta si no se validó contra el esquema real.
