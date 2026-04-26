# Skill — Frontend UI UX

## Cuándo usarla

Usar esta skill cuando la tarea implique:

- crear, modificar o revisar componentes React,
- cambios en HTML o JSX,
- ajustes de layout,
- mejoras visuales o UX,
- cambios en CSS Modules,
- responsive,
- formularios, tablas, cards, modales o paneles,
- revisión visual para no romper flujos existentes.

---

## Qué revisar primero

1. El componente actual.
2. El CSS Module asociado.
3. El componente padre si afecta props, estado o layout.
4. Si existe ya otro componente similar reutilizable.
5. Si el cambio impacta escritorio, móvil o ambos.
6. Si el ajuste es puntual o realmente requiere tocar estructura.

---

## Archivos clave

Revisar según aplique:

- `src/components/**`
- `src/pages/**`
- `src/styles/**`
- hooks usados por el componente
- contextos o providers que alimentan props/estado
- componentes padre o wrappers visuales

---

## Riesgos frecuentes

- romper responsive mientras se arregla escritorio,
- tocar markup y romper estilos existentes,
- duplicar clases o lógica visual innecesariamente,
- introducir estilos inline cuando ya existe CSS Module,
- alterar props o estado y generar regresiones,
- rediseñar más de lo pedido,
- perder consistencia visual con la app actual.

---

## Estrategia recomendada

1. Entender qué parte exacta de la UI necesita cambiar.
2. Revisar primero si el ajuste puede resolverse con CSS o estructura mínima.
3. Mantener consistencia con componentes y estilos existentes.
4. Reutilizar clases y patrones ya presentes.
5. Cambiar solo lo necesario para resolver el problema pedido.
6. Explicar el impacto visual y cómo validarlo.

---

## Checklist de validación

- ¿El componente sigue renderizando correctamente?
- ¿No se rompió el flujo de props o estado?
- ¿El cambio funciona en desktop?
- ¿El cambio funciona en mobile si aplica?
- ¿Se mantuvo CSS Modules?
- ¿No se agregaron librerías UI innecesarias?
- ¿La solución es consistente con el diseño existente?
- ¿El ajuste fue puntual y no un rediseño completo accidental?

---

## Qué no hacer

- No migrar a Tailwind.
- No introducir librerías UI nuevas sin necesidad real.
- No rediseñar pantallas completas si solo se pidió un ajuste puntual.
- No usar estilos inline salvo necesidad concreta.
- No duplicar componentes por comodidad.
- No romper responsive para arreglar solo una vista.
- No cambiar estructura de props sin explicar el impacto.
