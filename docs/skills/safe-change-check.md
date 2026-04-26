# Skill — Safe Change Check

## Cuándo usarla

Usar esta skill cuando la tarea implique:

- revisar código nuevo antes de integrarlo,
- modificar lógica existente sin romper flujos,
- validar regresiones,
- confirmar que un cambio no afecte auth, UI, API o Supabase,
- hacer revisiones de seguridad funcional antes de cerrar una tarea.

---

## Qué revisar primero

1. Qué flujo funcional toca el cambio.
2. Qué archivos dependen directa o indirectamente de esa lógica.
3. Qué componentes, hooks, contextos o endpoints consumen ese comportamiento.
4. Si el cambio afecta:
   - auth,
   - roles,
   - sesión,
   - rutas,
   - Supabase,
   - UI compartida,
   - contratos de API.
5. Si existe riesgo de regresión por renombres, firmas o estructura de datos.

---

## Archivos clave

Dependen del cambio, pero normalmente revisar:

- archivo modificado,
- componentes padre/hijo relacionados,
- hooks o utils asociados,
- `src/context/AuthContext.js` si toca sesión o roles,
- `src/lib/auth.js`,
- `src/lib/supabaseClient.js`,
- `src/pages/api/**` si toca integración backend,
- documentación técnica relacionada si existe.

---

## Riesgos frecuentes

- romper flujos que no eran el objetivo del cambio,
- cambiar una firma y afectar consumidores existentes,
- modificar estructura de respuesta y romper UI,
- introducir efectos colaterales en auth o sesión,
- alterar estilos compartidos por accidente,
- mezclar arreglo funcional con refactor no pedido,
- validar solo el caso feliz y olvidar regresiones.

---

## Estrategia recomendada

1. Identificar el flujo exacto afectado.
2. Delimitar el cambio al alcance mínimo.
3. Revisar consumidores directos e indirectos.
4. Verificar compatibilidad hacia atrás cuando aplique.
5. Separar claramente:
   - cambio funcional,
   - refactor,
   - documentación.
6. Explicar qué puede romperse y cómo se validó que no se rompiera.

---

## Checklist de validación

- ¿Se entiende exactamente qué flujo cambia?
- ¿Se revisaron consumidores del cambio?
- ¿Se mantuvo compatibilidad con el resto del proyecto?
- ¿No se tocaron piezas no relacionadas sin necesidad?
- ¿Se revisó impacto en auth, roles, sesión o RLS si aplica?
- ¿Se validó UI, API o datos afectados?
- ¿La solución fue mínima y controlada?
- ¿Quedó claro cómo probar regresiones?

---

## Qué no hacer

- No mezclar un bugfix con un refactor grande sin pedirlo.
- No renombrar funciones, props o endpoints sin revisar impactos.
- No cambiar estructura de datos sin revisar consumidores.
- No declarar que “no rompe nada” sin haber revisado dependencias.
- No asumir que un cambio local no tiene efectos globales.
- No tocar arquitectura por preferencia personal.
