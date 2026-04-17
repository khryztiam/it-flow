# Supabase MCP Auto-config — Agente por proyecto

Configura `.vscode/mcp.json` automáticamente extrayendo el `project_ref` desde
`NEXT_PUBLIC_SUPABASE_URL` en el `.env`, con test de conexión incluido.

Se invoca manualmente como una tarea desde VS Code, sin necesidad de abrir ni
cerrar nada.

---

## Requisitos

- Node.js disponible en el PATH
- `.env` en la raíz del proyecto con:
  ```env
  NEXT_PUBLIC_SUPABASE_URL=https://<project_ref>.supabase.co
  ```

---

## Archivos a crear en cada proyecto

### `.vscode/setup-mcp.js`

```js
const fs   = require("fs");
const path = require("path");
const https = require("https");

const envPath = path.resolve(__dirname, "../.env");
const mcpPath = path.resolve(__dirname, "mcp.json");

// 1. Leer .env
if (!fs.existsSync(envPath)) {
  console.error("❌ No se encontró .env en la raíz del proyecto");
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, "utf-8");

// 2. Extraer project_ref del subdominio
const match = envContent.match(
  /^NEXT_PUBLIC_SUPABASE_URL\s*=\s*["']?https?:\/\/([^.]+)\.supabase\.co/m
);

if (!match) {
  console.error("❌ NEXT_PUBLIC_SUPABASE_URL no encontrada o con formato inesperado");
  console.error("   Esperado: https://<project_ref>.supabase.co");
  process.exit(1);
}

const projectRef = match[1];
console.log(`🔍 project_ref encontrado: ${projectRef}`);

// 3. Test de conexión
const testUrl = `https://mcp.supabase.com/mcp?project_ref=${projectRef}`;
console.log(`🌐 Probando conexión → ${testUrl}`);

const req = https.request(testUrl, { method: "GET" }, (res) => {
  // 200 OK o 405 Method Not Allowed = endpoint existe y el ref es válido
  if (res.statusCode === 200 || res.statusCode === 405) {
    console.log(`✅ Conexión OK (HTTP ${res.statusCode})`);
    writeMcp(projectRef);
  } else {
    console.error(`❌ Conexión fallida (HTTP ${res.statusCode})`);
    console.error("   Verifica el project_ref o tu conexión a internet");
    process.exit(1);
  }
});

req.on("error", (err) => {
  console.error(`❌ Error de red: ${err.message}`);
  process.exit(1);
});

req.end();

// 4. Generar mcp.json
function writeMcp(ref) {
  const mcp = {
    servers: {
      "com.supabase/mcp": {
        type: "http",
        url: `https://mcp.supabase.com/mcp?project_ref=${ref}`,
        gallery: "https://api.mcp.github.com",
        version: "0.7.0"
      }
    },
    inputs: []
  };

  fs.writeFileSync(mcpPath, JSON.stringify(mcp, null, 2));
  console.log("✅ .vscode/mcp.json generado correctamente");
  console.log("👉 Ctrl+Shift+P → MCP: Restart Server");
}
```

---

### `.vscode/tasks.json`

```jsonc
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "🔧 Setup Supabase MCP",
      "type": "shell",
      "command": "node .vscode/setup-mcp.js",
      "presentation": {
        "reveal": "always",
        "panel": "shared",
        "clear": true
      },
      "problemMatcher": []
    }
  ]
}
```

---

## Cómo invocarlo

Desde VS Code, en cualquier momento:

```
Ctrl+Shift+P → Tasks: Run Task → 🔧 Setup Supabase MCP
```

El terminal integrado mostrará el resultado paso a paso y te indicará si debes
recargar el servidor MCP.

---

## Flujo completo

```
Ctrl+Shift+P → Tasks: Run Task → 🔧 Setup Supabase MCP
        ↓
Lee .env → extrae project_ref
        ↓
Prueba conexión a mcp.supabase.com
        ↓
Genera .vscode/mcp.json ✅
        ↓
Ctrl+Shift+P → MCP: Restart Server
```

---

## .gitignore

```gitignore
.vscode/mcp.json
```

El script `setup-mcp.js` y `tasks.json` sí se pueden commitear — son seguros
porque no contienen el ID directamente.

---

## Contexto para Copilot

En `.github/copilot-instructions.md`:

```markdown
## Supabase MCP
- `project_ref` se extrae de `NEXT_PUBLIC_SUPABASE_URL` en `.env` (subdominio de `.supabase.co`)
- `.vscode/mcp.json` es generado por `.vscode/setup-mcp.js`, no editar a mano
- Para reconfigurar: `Ctrl+Shift+P → Tasks: Run Task → Setup Supabase MCP`
- Después regenerar: `Ctrl+Shift+P → MCP: Restart Server`
```

---

## Troubleshooting

| Problema | Causa | Solución |
|---|---|---|
| `❌ No se encontró .env` | Proyecto sin `.env` | Crear `.env` con `NEXT_PUBLIC_SUPABASE_URL` |
| `❌ NEXT_PUBLIC_SUPABASE_URL no encontrada` | Nombre distinto o faltante | Verificar nombre exacto en `.env` |
| `❌ HTTP 401 / 403` | Auth no configurada en VS Code | El ref es válido — procede a `MCP: Restart Server` |
| `❌ Error de red` | Sin internet | Verificar conexión antes de correr la tarea |
| MCP no conecta tras restart | Token de Supabase no vinculado | Autenticarse en VS Code con cuenta Supabase |
