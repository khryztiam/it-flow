# 🔐 Auditoría de Seguridad — ITFlow

**Fecha:** 17/04/2026 | **Versión:** 2.0 (Actualizado)  
**Herramienta:** `npm audit`  
**Total dependencias:** 509 (77 producción, 432 desarrollo)

---

## 📊 Resumen ejecutivo

**Acción ejecutada:** Remover `@supabase/ssr@0.4.1` (dependencia innecesaria)

| Métrica                | Antes | Después | Cambio |
| ---------------------- | ----- | ------- | ------ |
| Total vulnerabilidades | 7     | 5       | ✅ -2  |
| Críticas               | 0     | 0       | —      |
| Altas                  | 0     | 0       | —      |
| Moderadas              | 5     | 5       | —      |
| Bajas                  | 2     | 0       | ✅ -2  |

**Acción tomada:** Remover dependencia `@supabase/ssr@0.4.1` (innecesaria)

---

## 🚨 Vulnerabilidades restantes (5)

### 1. 🟠 **esbuild** ≤ 0.24.2 — MODERATE

**CVE:** GHSA-67mh-4wv8-2f99  
**CWE:** CWE-346 (Missing Origin Validation)  
**CVSS Score:** 5.3

**Descripción:**

> Esbuild permite que sitios web externos envíen requests al servidor de desarrollo y lean las respuestas.

**Impacto:**

- **Severidad actual:** Moderada (desarrollo solamente)
- **Afectados:** Devs que usan `npm run dev`
- **Riesgo:** Exposición de datos al debuguear en red pública

**Ruta de dependencia:**

```
vitest@1.1.0
  → vite@6.4.1 (o superior vulnerable)
    → esbuild@0.24.2 (o inferior)
```

**Remediación:**

```bash
# Actualizar cuando sea necesario
npm audit fix --force
# Nota: Breaking change, requiere tests
```

**Recomendación:** 🟡 **Baja prioridad** — Solo en desarrollo

---

### 2. 🟠 **vite** ≤ 6.4.1 — MODERATE

**CVE:** GHSA-4w7w-66w2-5vf9  
**CWE:** CWE-22, CWE-200 (Path Traversal + Information Exposure)

**Descripción:**

> Vite es vulnerable a path traversal en manejo de `.map` en dependencias optimizadas.

**Impacto:**

- **Severidad:** Moderada (desarrollo solamente)
- **Afectados:** Devs que debuguean en navegador
- **Riesgo:** Acceso a archivos de source maps en desarrollo

**Ruta de dependencia:**

```
vitest@1.1.0
  → vite@6.4.1 (o superior vulnerable)
  → vite-node@2.2.0-beta.2 (o superior vulnerable)
```

**Remediación:**

```bash
npm audit fix --force  # Actualiza a vite@≥6.5.0
```

**Recomendación:** 🟡 **Baja prioridad** — Solo en desarrollo

---

### 3. 🟠 **vite-node** ≤ 2.2.0-beta.2 — MODERATE

**Descripción:**

> Vite-node depende de vite vulnerable.

**Ruta de dependencia:**

```
vitest@1.1.0
  → vite-node@2.2.0-beta.2 (o superior vulnerable)
    → vite (vulnerable)
```

**Remediación:** Se resuelve actualizando vite

---

### 4. 🟠 **vitest** 0.0.1 - 2.2.0-beta.2 || 4.0.0-beta — MODERATE

**Descripción:**

> Vitest depende de vite, vite-node y @vitest/ui vulnerables.

**Impacto:**

- Instalado en devDependencies
- Usado para testing
- **No afecta código de producción**

**Ruta de dependencia:**

```
@vitest/ui@1.1.0
  → vitest@1.1.0
    → vite (vulnerable)
    → vite-node (vulnerable)
    → @vitest/ui (vulnerable)
```

---

### 5. 🟠 **@vitest/ui** ≤ 0.0.122 || 0.31.0 - 2.2.0-beta.2 — MODERATE

**Descripción:**

> @vitest/ui depende de vitest vulnerable.

**Ruta de dependencia:**

```
@vitest/ui@1.1.0
  → vitest (vulnerable)
```

---

## ✅ Vulnerabilidades removidas

### ❌ **cookie** < 0.7.0 — LOW (REMOVIDA)

**CVE:** GHSA-pxg6-pf52-xh8x  
**CWE:** CWE-74 (Improper Neutralization)

**Descripción:**

> Cookie accepts cookie name, path, and domain with out of bounds characters.

**Acción:** Removida junto con `@supabase/ssr`

---

### ❌ **@supabase/ssr** ≤ 0.5.2-rc.7 — LOW (REMOVIDA)

**Descripción:**

> Dependencia de cookie vulnerable.

**Acción:** ✅ **REMOVIDA** `npm uninstall @supabase/ssr`

**Justificación:**

- No se usa en el proyecto
- Todo manejo de SSR es manual
- Solo agregaba vulnerabilidades
- Cero impacto en funcionalidad

---

## 📋 Dependencias afectadas

```
Development Dependencies (DEVS solamente):
├── vitest@1.1.0 (dependencia directa)
│   ├── vite@6.4.1 (vulnerable)
│   └── vite-node@2.2.0-beta.2 (vulnerable)
├── @vitest/ui@1.1.0 (dependencia directa)
│   └── vitest (vulnerable)
└── esbuild@0.24.2 (transitiva)
    └── vite (vulnerable)

Production Dependencies:
└── ✅ TODAS SEGURAS (sin vulnerabilidades modernas)
```

---

## 🛡️ Mitigación y recomendaciones

### Inmediato (Realizado)

- ✅ Remover `@supabase/ssr` innecesario
- ✅ Reducir de 7 a 5 vulnerabilidades

### Corto plazo (1-2 semanas)

- ⏳ Evaluar actualizar `vitest` a v2+ (breaking change)
- ⏳ Evaluar actualizar `vite` a v7+ (si aplica)
- ⏳ Correr tests después de actualización

### Mediano plazo (1 mes)

- ⏳ Establecer CI/CD con `npm audit` en pipeline
- ⏳ Implementar Dependabot o Renovate para actualización automática
- ⏳ Review mensual de vulnerabilidades

### Largo plazo (3+ meses)

- ⏳ Migrar a TypeScript (reduce errores tipografía)
- ⏳ Implementar SBOM (Software Bill of Materials)
- ⏳ Auditoría de seguridad externa anual

---

## 🔄 Proceso de actualización segura

Si necesitas actualizar:

```bash
# 1. Crear rama feature
git checkout -b security/update-deps

# 2. Hacer backup de versiones actuales
npm list --depth=0 > deps-backup.txt

# 3. Ejecutar audit fix --force (breaking changes)
npm audit fix --force

# 4. Instalar nuevamente
npm install

# 5. Correr tests
npm test

# 6. Testing manual de features críticas
# (Login, Dashboard Admin, Crear tarea, etc.)

# 7. Si todo bien, hacer commit
git add .
git commit -m "chore: security update dependencies"

# 8. Si hay errores, revertir
git revert HEAD
```

---

## 📊 Impacto en producción

```
┌─────────────────────────────────────────────────┐
│  PRODUCCIÓN (Build final)                       │
├─────────────────────────────────────────────────┤
│                                                 │
│  Dependencias incluidas:  77                    │
│  Vulnerabilidades:        ✅ 0                 │
│                                                 │
│  Motivo: Vite, vitest, esbuild NO se incluyen  │
│  en build de producción ("devDependencies")    │
│                                                 │
└─────────────────────────────────────────────────┘
```

**Conclusión:** ✅ **PRODUCCIÓN SEGURA**

---

## 📞 Contacto y escalation

**Si encuentras vulnerabilidad nueva:**

1. No publiques detalles en público
2. Contacta al equipo de desarrollo
3. Proporciona:
   - CVE o link a advisory
   - Versión afectada
   - Impacto potencial

---

**Auditado por:** Sistema automático npm  
**Próxima auditoría:** Mensual o con cambios de deps  
**Responsable:** DevOps / Team Lead
