# Evaluacion Tecnica Profunda - ITFlow

**Fecha:** 18/04/2026 | **Actualizado:** 26/04/2026  
**Base analizada:** codigo fuente actual en `src/`, configuracion del proyecto, APIs activas y smoke test sobre build de produccion local  
**Alcance principal:** roles `admin`, `user` y `supervisor` ✅
**Estado supervisor:** En producción desde 26/04/2026

---

## 1. Objetivo del documento

Este documento registra una evaluacion tecnica profunda del estado real del proyecto, tomando como fuente principal el codigo implementado y no solo la documentacion existente.

El objetivo es:

- establecer una fotografia tecnica confiable del sistema hoy;
- identificar riesgos reales por prioridad;
- separar problemas criticos de mejoras deseables;
- dejar una base para correcciones progresivas sin desestabilizar produccion.

---

## 2. Resumen ejecutivo

El proyecto **si compila** y su base funcional principal esta operativa. El build de produccion completo se ejecuto correctamente y los smoke tests iniciales validaron rutas y endpoints clave de `admin`, `user` y `supervisor`.

La conclusion general es:

- **el sistema esta vivo y funcional** en sus 3 roles principales;
- **no presenta un bloqueo inmediato de compilacion ni de disponibilidad**;
- **si acumula deuda tecnica relevante**, especialmente en autenticacion backend, consistencia entre frontend y documentacion, validacion de entradas, pruebas automatizadas y estandarizacion operativa.

En otras palabras: el proyecto no esta en estado de rescate, pero si necesita una fase ordenada de endurecimiento tecnico.

---

## 3. Alcance de la evaluacion

Se revisaron principalmente estos bloques:

- estructura general del proyecto;
- configuracion de Next.js, ESLint y aliases;
- autenticacion y contexto global;
- control de acceso por rol;
- paginas activas de `admin`, `user` y `supervisor`;
- API routes activas de `admin`, `user` y `supervisor`;
- integracion con Supabase cliente y server-side;
- scripts existentes de prueba;
- estado del build y smoke tests.

No se priorizo como frente de correccion (pero pueden considerarse mejoras futuras):

- ajustes cosmeticos menores de UI;
- automatizacion completa de pruebas E2E;
- refactorizaciones amplias sin impacto directo en estabilidad, seguridad o mantenibilidad.

---

## 4. Estado actual validado

### 4.1 Build de produccion

Se ejecuto `npm run build` y el proyecto compilo correctamente en modo produccion.

Resultado:

- TypeScript completo sin errores bloqueantes;
- build optimizado generado correctamente;
- rutas `admin`, `user` y API routes presentes en salida final.

### 4.2 Smoke test inicial

Se validaron estos puntos:

- `GET /login` responde `200`
- `GET /admin/dashboard` responde `200`
- `GET /admin/tareas` responde `200`
- `GET /user/dashboard` responde `200`
- `GET /user/tareas` responde `200`

### 4.3 Smoke test autenticado - admin

Con autenticacion real contra Supabase:

- `GET /api/admin/paises` -> `200`
- `GET /api/admin/plantas` -> `200`
- `GET /api/admin/usuarios` -> `200`
- `GET /api/admin/tareas` -> `200`
- `GET /api/admin/paises` sin token -> `403`

Lectura general: el backend administrativo critico responde y el control minimo por token existe.

### 4.4 Smoke test autenticado - user

Con autenticacion real contra Supabase:

- `GET /api/user/tareas` -> `200`
- `GET /api/user/tareas` sin token -> `403`

Observacion:

- el usuario probado no tenia tareas asignadas al momento de la prueba, por lo que no fue posible validar en modo lectura el detalle `/api/user/tareas/[id]` ni evidencias `/api/user/tareas/[id]/upload` sin alterar datos reales.

---

## 5. Arquitectura observada

### 5.1 Stack principal

- `Next.js` con `pages router`
- `React 18`
- `Supabase` para autenticacion, base de datos y storage
- `CSS Modules`
- componentes reutilizables para layout, tablas, modales y formularios

### 5.2 Patron general

La aplicacion usa una arquitectura hibrida:

- en algunos puntos el frontend consulta Supabase directamente;
- en otros puntos consume `API Routes` propias de Next.js;
- la autenticacion visual se apoya en `AuthContext`;
- el backend reutiliza un cliente `supabaseAdmin` con `service role`.

### 5.3 Lectura tecnica de esta arquitectura

Esta mezcla es valida para salir rapido, pero trae tres efectos:

1. la seguridad queda repartida entre frontend, API y RLS;
2. la logica de acceso a datos queda duplicada en varios puntos;
3. las reglas de negocio pueden divergir con el tiempo entre cliente y servidor.

No es un problema insoluble, pero si una fuente clara de deuda tecnica.

---

## 6. Fortalezas encontradas

### 6.1 Base funcional ya establecida

Aunque el proyecto salio con premura, no se encontro una base caotica. Hay una separacion razonable entre:

- paginas;
- componentes;
- hooks;
- contexto;
- librerias de integracion;
- estilos.

### 6.2 Navegacion por rol comprensible

La separacion por `admin`, `user` y `supervisor` hace facil ubicar flujos y responsabilidades.

### 6.3 Componentes reutilizables utiles

`Layout`, `Modal`, `TablaGenerica` y `FormularioMulti` aceleran cambios funcionales y ayudan a mantener consistencia visual.

### 6.4 APIs claves activas y funcionales

Las APIs principales revisadas responden bien en lectura y permiten inferir que el sistema esta operando sobre una base funcional utilizable.

### 6.5 Build sano

El hecho de que el build de produccion complete correctamente es una senal fuerte de que no hay una ruptura estructural inmediata.

---

## 7. Hallazgos tecnicos priorizados

## 7.1 Critico - validacion insegura del token en backend

**Ubicacion principal:** `src/lib/auth.js`

### Hallazgo

Las funciones `verifyAdminToken`, `verifyAdminOrSupervisorToken` y `verifyUserToken` decodifican el JWT manualmente leyendo el payload y usando el `email`, pero no validan firma criptografica, expiracion ni integridad real del token con Supabase.

### Impacto

Este es el hallazgo tecnico mas importante de toda la revision. Aunque existe una comprobacion posterior contra la tabla `usuarios`, el backend esta confiando en informacion de un token no verificado criptograficamente.

### Riesgo

- bypass parcial o total de autorizacion, segun contexto;
- mayor superficie de ataque en endpoints protegidos;
- falsa sensacion de seguridad por existencia de `Bearer token`.

### Recomendacion

Reemplazar esta estrategia por validacion real del JWT usando Supabase de forma oficial en servidor o validacion robusta del token firmado antes de autorizar cualquier endpoint.

### Prioridad

**Inmediata**

---

## 7.2 Alta - inconsistencia entre rutas reales y rutas derivadas por rol

**Ubicacion principal:** `src/lib/permisos.js`

### Hallazgo

`obtenerRutaPrincipal()` devuelve `'/user/mis-tareas'`, pero esa ruta no existe en `src/pages/user/`. Las rutas reales activas son `'/user/dashboard'` y `'/user/tareas'`.

### Impacto

Puede generar redirecciones rotas desde `/` dependiendo del flujo de acceso.

### Riesgo

- experiencia inconsistente para usuario;
- errores de navegacion;
- diferencias entre lo que hace `login.js` y lo que hace `index.js`.

### Prioridad

**Alta**

---

## 7.3 Alta - mezcla de acceso directo a Supabase y consumo de APIs

**Ubicaciones observadas:** dashboards, gestion admin, modulos de tareas, `src/lib/supabase.js`

### Hallazgo

Parte del frontend usa APIs propias, mientras otra parte hace consultas directas a Supabase desde cliente.

### Impacto

La logica de negocio, filtros y permisos no esta totalmente centralizada.

### Riesgo

- comportamiento inconsistente;
- duplicacion de consultas;
- mas dificultad para auditar permisos;
- dependencia fuerte de que RLS este perfecta en todos los casos.

### Recomendacion

Definir una estrategia:

- o se centralizan los flujos criticos en API routes;
- o se acota claramente que consultas pueden vivir en cliente y cuales no.

### Prioridad

**Alta**

---

## 7.4 Alta - validacion de entradas insuficiente en APIs

**Ubicaciones observadas:** `src/pages/api/admin/*`, `src/pages/api/user/*`

### Hallazgo

Los endpoints validan presencia basica de campos, pero no usan esquemas formales ni controles consistentes de:

- tipos;
- rangos;
- longitud;
- relaciones entre campos;
- estados permitidos;
- transiciones validas de negocio.

### Impacto

La API acepta payloads validos "por forma" pero debiles a nivel de negocio.

### Riesgo

- datos inconsistentes;
- errores silenciosos;
- mayor fragilidad ante cambios futuros;
- mas dificultad para depurar.

### Recomendacion

Introducir validacion con esquemas, por ejemplo `zod`, en endpoints criticos primero.

### Prioridad

**Alta**

---

## 7.5 Media - configuracion de lint rota

**Ubicacion principal:** `package.json`, `.eslintrc.json`

### Hallazgo

`npm run lint` falla porque el proyecto usa `ESLint 9`, pero sigue configurado con `.eslintrc.json`. La version instalada espera `eslint.config.js`.

### Impacto

No hay validacion automatica de calidad basica via lint.

### Riesgo

- deuda tecnica acumulandose sin barreras;
- cambios futuros sin chequeos minimos;
- falsa idea de disponer de una herramienta de calidad que hoy no corre.

### Prioridad

**Media-Alta**

---

## 7.6 Media - ausencia de pruebas automatizadas reales

### Hallazgo

Aunque hay dependencias de `Vitest` y scripts de prueba, no se encontraron suites formales dentro de `src/` que cubran logica critica.

### Impacto

El proyecto depende casi por completo de validacion manual.

### Riesgo

- regresiones no detectadas;
- lentitud para corregir;
- mayor nerviosismo al tocar codigo en produccion.

### Prioridad

**Media-Alta**

---

## 7.7 Media - documentacion desalineada con el codigo real

### Hallazgo

Se encontraron diferencias entre docs y codigo, por ejemplo:

- referencias a estados de implementacion no del todo alineadas;
- stack documentado distinto del `package.json`;
- rutas o flujos descritos que no coinciden exactamente con implementacion actual.

### Impacto

La documentacion actual sirve como referencia historica, pero no siempre como verdad operativa.

### Recomendacion

Mantener los docs existentes como historial y crear documentos nuevos de referencia basados en el sistema real, comenzando por este.

### Prioridad

**Media**

---

## 7.8 Media - inconsistencias menores de modelo y nombres

### Hallazgos observados

- uso de nombres de campos distintos segun modulo;
- dependencia de textos exactos como `completado`, `en_proceso`, etc.;
- referencias a fechas como `fecha_creacion` frente a campos como `created_at` en otros puntos;
- uso de columnas adicionales como `revisado_en` sin una capa uniforme de modelo.

### Impacto

No rompe por si solo el sistema, pero hace mas fragil la evolucion.

### Prioridad

**Media**

---

## 7.9 Media - operaciones de escritura aun no validadas en smoke test

### Hallazgo

Por cautela, en esta fase no se ejecutaron `POST`, `PUT` ni `DELETE` sobre datos reales de produccion.

### Impacto

No hay aun evidencia directa en esta evaluacion de que:

- crear tarea;
- editar tarea;
- actualizar avance;
- comentar;
- subir evidencia;
- eliminar evidencia

esten funcionando end-to-end hoy en entorno real.

### Lectura correcta

Esto **no significa** que esten fallando. Significa que **todavia no se validaron con un smoke test controlado de escritura**.

### Prioridad

**Media**

---

## 8. Observaciones por modulo

## 8.1 Autenticacion y contexto

`AuthContext` resuelve bien la carga de sesion y datos del usuario, y el patron general es claro. El principal problema no esta en el contexto cliente sino en la validacion server-side del token.

## 8.2 Paginas de usuario

La pagina [src/pages/user/dashboard.js](/c:/Proyectos/ITFlow/src/pages/user/dashboard.js) muestra una estructura razonable y una UX clara. La implementacion sugiere un estado funcional real, con filtros, resumenes y modal de detalle.

Puntos a favor:

- logica de presentacion entendible;
- manejo de estados visuales aceptable;
- integracion con tareas reales.

Puntos a mejorar:

- muchas reglas de negocio se interpretan por nombre textual de estado;
- manejo de errores visible pero no centralizado;
- dependencia de fetch manual repetido.

## 8.3 Paginas admin

Las paginas de `admin` estan mas cargadas de logica y muestran mas deuda por crecimiento organico:

- consultas complejas en cliente;
- transformaciones manuales de datos;
- varias responsabilidades en un mismo archivo;
- flujo de formulario y gestion mezclados con acceso a datos.

Funcionan, pero son candidatas claras a refactorizacion gradual.

## 8.4 API routes

Las APIs cumplen su rol, pero todavia reflejan un estilo de implementacion rapido:

- validaciones basicas;
- poca estandarizacion de respuestas;
- logica repetida entre endpoints;
- seguridad backend mejorable.

## 8.5 Integracion con evidencias

El flujo de evidencias tiene una base buena:

- whitelist de MIME;
- limite de tamano;
- rollback si falla la insercion en BD.

Aun asi, sigue dependiendo de la fortaleza global de autenticacion y autorizacion server-side.

---

## 9. Riesgo tecnico por categoria

### Seguridad

**Nivel:** Alto

Motivo principal:

- validacion insegura del JWT en backend.

### Estabilidad operativa

**Nivel:** Medio

Motivo principal:

- build sano y endpoints clave respondiendo;
- pero sin pruebas automatizadas ni smoke tests de escritura todavia.

### Mantenibilidad

**Nivel:** Medio-Alto

Motivo principal:

- mezcla de patrones de acceso a datos;
- validaciones repetidas;
- documentacion desalineada;
- modulos grandes en frontend.

### Calidad de desarrollo

**Nivel:** Medio

Motivo principal:

- lint roto;
- tests casi inexistentes;
- herramientas presentes pero no consolidadas.

---

## 10. Recomendacion de plan por fases

## Fase 1 - endurecimiento minimo sin mover demasiado la funcionalidad

Objetivo: reducir riesgo inmediato.

Acciones:

- corregir validacion server-side del token;
- arreglar `obtenerRutaPrincipal()` y rutas inconsistentes;
- restaurar `npm run lint`;
- crear una checklist formal de smoke test;
- documentar el flujo real de login y roles activos.

## Fase 2 - estabilizacion de capa API

Objetivo: ordenar el backend aplicativo.

Acciones:

- introducir esquemas de validacion en endpoints criticos;
- homogeneizar respuestas de API;
- revisar flujos `admin` y `user` de escritura;
- definir que consultas se permiten directo a Supabase y cuales deben pasar por API.

## Fase 3 - cobertura minima de pruebas

Objetivo: reducir regresiones.

Acciones:

- tests unitarios para `permisos.js` y utilidades criticas;
- tests de integracion para APIs de `admin/tareas` y `user/tareas`;
- smoke tests automatizados basicos para login y lectura por rol.

## Fase 4 - refactorizacion gradual de modulos grandes

Objetivo: mejorar mantenibilidad sin frenar operacion.

Acciones:

- dividir paginas grandes de `admin`;
- extraer fetch helpers o un hook comun para requests;
- centralizar reglas de negocio de estado/prioridad;
- reducir duplicacion entre cliente y servidor.

---

## 11. Prioridades concretas recomendadas

Si hubiera que elegir solo cinco frentes iniciales, el orden recomendado es:

1. validacion real del token en backend;
2. correccion de rutas derivadas por rol;
3. recuperar lint operativo;
4. formalizar smoke test de lectura y luego uno controlado de escritura;
5. agregar validacion por esquema en endpoints criticos.

---

## 12. Conclusion

ITFlow ya tiene una base funcional suficiente para evolucionar, y eso es importante. La evaluacion no muestra un sistema roto, sino un sistema que salio rapido y ahora necesita consolidacion tecnica.

La buena noticia es que el proyecto:

- compila;
- responde en produccion local;
- autentica correctamente en los flujos probados;
- expone APIs criticas operativas.

La mala noticia, o mejor dicho el punto de atencion, es que la deuda tecnica mas importante esta en seguridad backend y en disciplina de calidad.

La recomendacion general es avanzar por capas:

- primero seguridad y consistencia minima;
- despues calidad de APIs;
- luego pruebas;
- y finalmente refactorizacion gradual.

Ese orden permite mejorar el sistema sin castigar la operacion actual.
