# Skill — Documentation Sync

## Cuándo usarla

Usar esta skill cuando la tarea implique:

- crear documentación nueva sobre una funcionalidad real,
- actualizar documentación tras cambios en código,
- corregir documentación desalineada con implementación,
- documentar flujos, APIs, tablas, UI o decisiones técnicas,
- asegurar que lo documentado coincida exactamente con lo creado o modificado.

---

## Qué revisar primero

1. Qué se creó, modificó o corrigió realmente.
2. Qué archivo de documentación debe actualizarse.
3. Qué nombres reales usa el código:
   - archivos,
   - endpoints,
   - props,
   - tablas,
   - columnas,
   - funciones.
4. Si la documentación actual ya contiene secciones obsoletas.
5. Si la documentación debe cubrir uso, flujo, validación o restricciones.

---

## Archivos clave

Revisar según aplique:

- archivo o módulo realmente modificado,
- `docs/**`,
- `README.md`,
- `docs/SUPABASE_ESQUEMA_Y_FLUJOS.md`,
- rutas API relevantes,
- componentes o páginas implicadas,
- cualquier guía técnica existente relacionada.

---

## Riesgos frecuentes

- documentar cosas que no existen realmente,
- dejar pasos incompletos,
- usar nombres desactualizados,
- describir un flujo ideal distinto al implementado,
- duplicar documentación en varios lugares sin sincronía,
- exagerar validaciones o capacidades que no se implementaron.

---

## Estrategia recomendada

1. Basar la documentación solo en lo confirmado en el código.
2. Usar nombres exactos del proyecto.
3. Documentar alcance real, no supuestos.
4. Si algo no quedó implementado, no documentarlo como hecho.
5. Mantener la documentación clara, breve y útil.
6. Si se actualiza una sección, revisar si hay otras referencias que quedaron obsoletas.

---

## Checklist de validación

- ¿La documentación coincide con el código real?
- ¿Los nombres de archivos, props, rutas o tablas son exactos?
- ¿Se documentó solo lo implementado?
- ¿Se actualizaron referencias obsoletas?
- ¿El flujo descrito es verificable?
- ¿La documentación ayuda realmente a usar o mantener la funcionalidad?
- ¿No se duplicó información sin necesidad?

---

## Qué no hacer

- No inventar pasos, endpoints, tablas o capacidades.
- No documentar planes futuros como si ya existieran.
- No copiar texto genérico que no aplica al proyecto.
- No dejar nombres viejos cuando el código ya cambió.
- No crear documentación innecesaria si el usuario no la pidió.
- No afirmar que algo está validado o probado si no se comprobó.
