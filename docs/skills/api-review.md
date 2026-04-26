# Skill — API Review

## Cuándo usarla

Usar esta skill cuando la tarea implique:

- crear o modificar rutas en `pages/api`,
- revisar contratos de entrada y salida,
- validar estructura JSON,
- revisar permisos o seguridad,
- manejar errores de backend,
- revisar integración entre frontend y API.

---

## Qué revisar primero

1. La ruta actual o la más parecida existente.
2. El contrato esperado:
   - input,
   - output,
   - método HTTP,
   - códigos de estado.
3. Si requiere autenticación o privilegios elevados.
4. Si la ruta toca Supabase, servicios externos o lógica sensible.
5. Si ya existe middleware, helper o validador reutilizable.

---

## Archivos clave

Revisar según aplique:

- `src/pages/api/**`
- `src/lib/**`
- `src/context/AuthContext.js`
- `src/lib/auth.js`
- helpers de validación
- componentes o hooks que consumen la API

---

## Riesgos frecuentes

- cambiar el contrato y romper frontend existente,
- devolver JSON inconsistente,
- no validar input,
- filtrar errores internos al cliente,
- usar cliente público donde se necesita contexto seguro,
- omitir control de permisos,
- mezclar lógica de negocio y parsing sin estructura clara.

---

## Estrategia recomendada

1. Confirmar qué espera exactamente el consumidor de la API.
2. Mantener la respuesta consistente y predecible.
3. Validar entrada antes de ejecutar lógica.
4. Manejar errores de forma clara, sin exponer detalles sensibles.
5. Si la ruta toca datos sensibles, revisar auth, permisos y contexto de ejecución.
6. Explicar claramente:
   - qué cambia,
   - qué recibe,
   - qué devuelve,
   - cómo se prueba.

---

## Checklist de validación

- ¿El método HTTP es correcto?
- ¿La entrada está validada?
- ¿El JSON de salida es consistente?
- ¿Los códigos de estado tienen sentido?
- ¿El frontend consumidor sigue siendo compatible?
- ¿Se manejan errores sin filtrar información sensible?
- ¿Se revisó auth/permisos si aplica?
- ¿La ruta usa el cliente correcto según el nivel de acceso?

---

## Qué no hacer

- No cambiar contratos de API sin explicarlo.
- No devolver respuestas ambiguas o inconsistentes.
- No omitir validación de entrada.
- No exponer errores internos completos al cliente.
- No usar lógica privilegiada en contexto inseguro.
- No mezclar refactor estético con cambio funcional si no fue pedido.
