# ITFlow - Indice maestro de documentacion

**Fecha de revision:** 27 de abril de 2026
**Version app:** `1.4.1`
**Estado:** documentacion en proceso de consolidacion

---

## Leer Primero

| Documento | Para quien | Uso recomendado |
| --- | --- | --- |
| `00_ESTADO_ACTUAL.md` | Todos | Fuente corta y actual del estado real del proyecto |
| `README.md` | Usuarios nuevos y equipo tecnico | Presentacion amigable, instalacion y resumen funcional |
| `CHANGELOG.md` | Equipo tecnico | Historial por version |

---

## Guias por Rol

| Documento | Estado | Comentario |
| --- | --- | --- |
| `03_GUIA_ADMIN.md` | Vigente, revisar contra UI actual | Admin ya tiene dashboard, estadisticas, gestion, tareas y asignaciones |
| `04_GUIA_USER.md` | Vigente, revisar contra UI actual | User trabaja con dashboard, lista personal, detalle, evidencias y comentarios |
| `05_GUIA_SUPERVISOR.md` | Vigente, revisar contra UI actual | Supervisor ya esta activo en produccion; no debe tratarse como rol futuro |

---

## Documentacion Tecnica

| Documento | Uso |
| --- | --- |
| `01_FLUJOS_DETALLADOS.md` | Entender login, roles, tareas, realtime y flujos por pantalla |
| `SUPABASE_ESQUEMA_Y_FLUJOS.md` | Tablas, permisos, storage, realtime y riesgos de Supabase |
| `06_INSTALACION_DEPLOYMENT.md` | Instalacion, variables de entorno y despliegue |
| `10_EVALUACION_TECNICA_PROFUNDA.md` | Revision tecnica y riesgos observados |
| `11_GUIA_VALIDACION_RAPIDA.md` | Pruebas rapidas para validar accesos por rol |
| `12_VALIDACION_VISIBILIDAD_ACCESO.md` | Validacion de acceso por rol y casos de prueba |
| `13_VULNERABILIDADES_ACTUALES.md` | Detalle vigente de `npm audit` |

---

## Documentos de Analisis y Riesgo

| Documento | Estado recomendado |
| --- | --- |
| `02_HALLAZGOS_RECOMENDACIONES.md` | Usar como referencia tecnica, pero contrastar contra `00_ESTADO_ACTUAL.md` |
| `07_MATRIZ_RIESGOS.md` | Usar como checklist de riesgos, no como foto exacta si no fue actualizado |
| `08_RESUMEN_EJECUTIVO.md` | Actualizado a una version mas corta y alineada al estado actual |

---

## Archivos Conservados Fuera de Git

Los `.md` antiguos de la raiz se movieron a `.analysis/root-md-historico/`. Esa carpeta esta ignorada por Git y sirve solo como respaldo local.

| Archivo movido | Motivo |
| --- | --- |
| `ANALISIS_DISCREPANCIAS_v2.md` | Historico del estado previo; contradice el estado actual de supervisor |
| `ARQUITECTURA.md` | Arquitectura historica; reemplazada por `00_ESTADO_ACTUAL.md` y `SUPABASE_ESQUEMA_Y_FLUJOS.md` |
| `CLAUDE.md` | Instrucciones de agente, no documentacion de producto |
| `GUIA_USUARIOS_ITFlow.md` | Guia amplia duplicada con README y guias por rol |
| `INSTRUCCIONES_USO.md` / `INSTRUCCIONES_USO_v2.md` | Guias antiguas sin supervisor activo |
| `SEGURIDAD_AUDIT.md` | Auditoria vieja; reemplazada por vulnerabilidades actuales en README y `00_ESTADO_ACTUAL.md` |
| `supabase-mcp-autoconfig.md` | Nota local de tooling, no necesaria para entender la app |

---

## Criterio de Consolidacion

Para evitar duplicidad:

1. Usar `README.md` como entrada principal.
2. Usar `docs/00_ESTADO_ACTUAL.md` como foto tecnica actual.
3. Mantener las guias por rol solo para instrucciones detalladas.
4. No duplicar tablas de paquetes o vulnerabilidades en multiples archivos; enlazar al README o al estado actual.
5. Mantener material historico/privado en `.analysis/`, no en la raiz.

---

## Mantenimiento

Actualizar documentacion cuando cambie:

- Una ruta visible.
- Un permiso por rol.
- Una tabla o columna usada por APIs.
- Un flujo de evidencias, comentarios o alertas.
- La version en `package.json`.
- El resultado de `npm audit`.

Validacion recomendada despues de cambios de documentacion:

- Revisar que las rutas mencionadas existan en `src/pages`.
- Revisar que versiones coincidan con `package.json`.
- Revisar que seguridad no contradiga `AuthContext.js`, `useProtegerRuta.js` ni `src/lib/auth.js`.
