# Instrucciones para Copilot — ITFlow

## Objetivo

Trabajar sobre la base de código existente de forma segura, quirúrgica y consistente con el stack actual. Priorizar mantenimiento, corrección de bugs y evolución incremental sin refactors innecesarios.

---

## Stack técnico

- **Framework**: Next.js 14+ con **Pages Router**
- **UI**: React 18+
- **Lenguaje**: JavaScript (**sin TypeScript**)
- **Backend**: Supabase (`@supabase/supabase-js`, `@supabase/ssr`)
- **Estilos**: CSS Modules (**sin Tailwind**)
- **Iconos**: `react-icons`, `lucide-react`
- **Linting / formato**: ESLint + Prettier
- **Package manager**: npm

---

## Reglas base

- Mantener el stack actual.
- Preferir cambios pequeños, claros y fáciles de validar.
- Editar sobre lo existente antes de crear nuevas capas de abstracción.
- No reescribir archivos completos sin necesidad.
- No cambiar arquitectura para resolver bugs puntuales.
- No introducir nuevas dependencias si el problema puede resolverse con el stack actual.
- No inventar tablas, columnas, rutas, variables de entorno o flujos que no existan en el proyecto.
- Mantener compatibilidad con la estructura actual del código.

---

## Convenciones de código

### Nombres

- **Componentes React**: `PascalCase`
- **Hooks personalizados**: prefijo `use`
- **Variables y funciones**: `camelCase`
- Mantener el **idioma dominante del archivo existente**
- Evitar mezclar español e inglés sin necesidad
- Los comentarios deben estar en **español**

### Estilo

- No usar `var`; usar `const` y `let`
- Usar arrow functions en componentes funcionales
- Desestructurar props y objetos siempre que sea razonable
- Mantener importaciones ordenadas al inicio del archivo
- Evitar comentarios triviales
- Comentar solo lógica no obvia, decisiones de negocio o restricciones técnicas

### Ejemplo

```javascript
const FormularioUsuario = ({ usuario, onSave }) => {
  const { nombre, email } = usuario;

  const manejarGuardar = async () => {
    // lógica relevante
  };

  return <form>{/* contenido */}</form>;
};
```

### Estructura de carpetas esperada

```text
src/
├── pages/           # Rutas y API routes de Next.js (Pages Router)
├── components/      # Componentes reutilizables
├── hooks/           # Hooks personalizados
├── lib/             # Configuración, auth, clientes, helpers base
├── context/         # Contextos React
├── styles/          # CSS Modules
└── utils/           # Utilidades auxiliares
```

### Regla de organización

- Respetar la estructura existente antes de proponer mover archivos.
- No crear archivos nuevos si el cambio cabe claramente en uno existente.
- Crear un archivo nuevo solo si aporta reutilización real, separación clara de responsabilidades o lo exige el framework.

---

## Flujo obligatorio antes de editar

1. Leer primero los archivos directamente relacionados con el cambio.
2. Identificar si el problema es de:
   - frontend,
   - backend,
   - auth,
   - sesión,
   - rutas,
   - estado,
   - Supabase,
   - CSS / layout.
3. Reutilizar lógica existente antes de proponer nueva.
4. Antes de tocar autenticación o sesión, revisar:
   - `src/context/AuthContext.js`
   - `src/lib/auth.js`
   - `src/lib/supabaseClient.js`
   - `src/pages/api/**` involucradas
5. Antes de tocar UI, revisar:
   - componente actual,
   - componente padre,
   - CSS Module asociado,
   - flujo de props / estado.
6. Antes de tocar Supabase, revisar:
   - esquema,
   - relaciones,
   - políticas RLS,
   - queries existentes similares.

---

## Reglas de modificación

- Editar de forma **quirúrgica**.
- No renombrar funciones, props, archivos o endpoints sin justificación clara.
- No cambiar firmas públicas de componentes o funciones sin explicar el impacto.
- No mover archivos entre carpetas sin necesidad real.
- No reemplazar un patrón existente por otro distinto solo por preferencia.
- No migrar de Pages Router a App Router.
- No agregar TypeScript.
- No migrar CSS Modules a Tailwind.
- No crear documentación nueva salvo que el usuario lo pida o sea estrictamente necesaria para el cambio solicitado.

---

## Supabase

### Reglas generales

- El cliente público debe mantenerse en `lib/supabaseClient.js`
- Código admin solo en backend seguro
- Variables de entorno en `.env.local`
- No exponer `service_role` ni secretos en frontend
- No asumir nombres de tablas o columnas; confirmarlos en código o documentación
- Toda propuesta de `select`, `insert`, `update` o `delete` debe considerar RLS

### Seguridad y arquitectura

- No usar lógica admin en cliente
- Si una operación requiere permisos elevados, resolverla en API route o backend seguro
- Validar siempre impacto en:
  - autenticación,
  - sesión,
  - permisos,
  - RLS,
  - consistencia de datos

### Tablas y consultas

Consultar `docs/SUPABASE_ESQUEMA_Y_FLUJOS.md` para entender:

- estructura de tablas,
- relaciones,
- convenciones de datos,
- flujos principales.

---

## UI y estilos

- Mantener CSS Modules
- Reutilizar clases existentes antes de crear nuevas
- Evitar estilos inline salvo necesidad puntual
- Mantener consistencia visual con el resto de la app
- Priorizar responsive sin romper escritorio
- No introducir librerías de UI nuevas sin petición explícita
- No rediseñar pantallas completas cuando solo se pidió ajuste puntual

---

## Debugging

### Enfoque

- No proponer refactor grande como primera solución a un bug
- Priorizar este orden:
  1. reproducir,
  2. aislar,
  3. corregir,
  4. validar

### Cuando haya varias causas posibles

- Enumerar solo las **2 o 3 causas más probables**
- Empezar por la más barata de validar
- No disparar cambios masivos sin evidencia

### En bugs de auth o sesión

Validar especialmente:

- login,
- logout,
- persistencia de sesión,
- protección de rutas,
- recuperación de perfil,
- permisos por rol.

---

## Validación mínima antes de dar algo por bueno

- Ejecutar `npm run lint` si existe
- Ejecutar `npm run build` si el cambio afecta:
  - rutas,
  - configuración,
  - imports,
  - páginas,
  - compilación general
- Si el cambio toca auth, validar:
  - login,
  - logout,
  - persistencia de sesión,
  - rutas protegidas
- Si el cambio toca Supabase, validar:
  - tablas reales,
  - columnas reales,
  - relaciones,
  - permisos/RLS
- No declarar algo como “listo” sin una validación razonable

---

## Cómo responder

Cuando propongas o apliques una solución:

1. Resume el problema en pocas líneas
2. Indica la causa probable
3. Lista los archivos a modificar
4. Aplica el cambio mínimo necesario
5. Explica cómo validar el resultado

### Estilo de respuesta

- Ser claro, técnico y directo
- No dar explicaciones largas sin necesidad
- No meter relleno
- Si falta información crítica, hacer **una sola pregunta clara**
- Si la ambigüedad no bloquea, hacer la mejor suposición razonable y declararla

---

## Cuando estés atascado

1. Buscar código similar ya existente
2. Revisar archivos relacionados antes de inventar una estructura nueva
3. Consultar `docs/` solo si aporta contexto real al cambio
4. Pedir aclaración solo si falta información crítica para no romper algo

---

## No hacer

- No agregar TypeScript sin consentimiento
- No cambiar a Tailwind
- No reescribir código que funciona sin motivo real
- No crear archivos innecesarios
- No usar comentarios triviales
- No ignorar la estructura existente
- No inventar tablas, columnas, rutas o variables de entorno
- No cambiar arquitectura por preferencia
- No declarar algo como validado sin haberlo comprobado de forma razonable

---

## Prioridades del agente

1. **Seguridad**
2. **No romper flujos existentes**
3. **Compatibilidad con la arquitectura actual**
4. **Cambios mínimos y mantenibles**
5. **Claridad del código**
6. **Validación antes de cerrar**

---

**Última actualización:** 22 de abril de 2026
