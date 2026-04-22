# 🚀 ITFlow — Guía de instalación y deployment

**Versión:** 2.2 | **Fecha:** Abril 2026 | **Público:** DevOps, desarrolladores

---

## 📋 Requisitos previos

### Hardware

```
Desarrollo local:
├─ RAM: 4GB mínimo (8GB recomendado)
├─ Espacio disco: 2GB disponibles
└─ Conexión: Internet estable

Servidor producción:
├─ RAM: 4GB mínimo (8GB+ recomendado)
├─ CPU: 2 cores mínimo
├─ Espacio: 10GB disponibles
└─ BD: PostgreSQL 14+ externo (Supabase)
```

### Software

```
Node.js:   18.x o superior
npm:       9.x o superior
Git:       2.30 o superior
Docker:    20.10+ (opcional, para contenedor)
```

### Cuentas necesarias

```
1. GitHub
   └─ Para clonar repositorio

2. Supabase
   └─ Para base de datos, auth, storage

3. Proveedor hosting (Vercel, Netlify, Digital Ocean, etc)
   └─ Para ejecutar aplicación en producción

4. (Opcional) SendGrid / Mailgun
   └─ Para envío de emails
```

---

## 🛠️ Instalación local

### Paso 1: Clonar repositorio

```bash
# Clonar desde GitHub
git clone https://github.com/tuempresa/itflow.git

# Entrar al directorio
cd itflow

# Ver rama actual (debe ser main o develop)
git branch
```

### Paso 2: Instalar dependencias

```bash
# Instalar todas las dependencias
npm install

# Verificar que no hay vulnerabilidades críticas
npm audit

# Si hay vulnerabilidades:
npm audit fix          # Intenta corregir automáticamente
npm audit fix --force  # Fuerza actualizaciones (cuidado)
```

**Salida esperada:**

```
added 287 packages in 45s

up to date in 2m 3s
```

### Paso 3: Configurar variables de entorno

```bash
# Copiar archivo de ejemplo
cp .env.example .env.local

# Editar con tus datos
nano .env.local  (Linux/Mac) o notepad .env.local (Windows)
```

**Contenido de `.env.local`:**

```env
# Supabase API Keys (desde tu proyecto en Supabase)
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Service Role Key (SOLO en servidor, NUNCA en cliente)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Node environment
NODE_ENV=development

# (Opcional) URLs de API personalizadas
NEXT_PUBLIC_API_URL=http://localhost:3000/api

# (Opcional) Envío de emails
SENDGRID_API_KEY=SG.xxxxxxxxxxxx
SENDGRID_FROM_EMAIL=noreply@empresa.com

# (Opcional) Logging
LOG_LEVEL=info
```

**¿Dónde obtener las keys?**

```
1. Ir a dashboard.supabase.com
2. Seleccionar proyecto
3. Settings → API
4. Copiar:
   ├─ Project URL → NEXT_PUBLIC_SUPABASE_URL
   ├─ Anon key → NEXT_PUBLIC_SUPABASE_ANON_KEY
   └─ Service role key → SUPABASE_SERVICE_ROLE_KEY
```

### Paso 4: Inicializar base de datos

```bash
# Conectarse a Supabase y crear tablas
npm run db:init

# Si no existe ese script, hacerlo manualmente:
# 1. Ir a SQL Editor en Supabase
# 2. Copiar contenido de scripts/init-db.sql
# 3. Ejecutar en Supabase console
```

**Si es primera vez, ejecutar:**

```bash
# Script de inicialización (si existe)
npm run db:seed   # Carga datos de prueba
```

### Paso 5: Iniciar servidor de desarrollo

```bash
npm run dev

# Servidor iniciará en: http://localhost:3000
```

**Salida esperada:**

```
> itflow@1.0.0 dev
> next dev

▲ Next.js 16.0.0
- Local:        http://localhost:3000
- Environments: .env.local

✓ Ready in 2.5s
```

### Paso 6: Verificar instalación

```
1. Abre navegador: http://localhost:3000
2. Deberías ver página de login
3. Intenta login con:
   Email: admin@test.com
   Contraseña: password123
```

**Si todo funciona:**

```
✓ Dashboard visible
✓ Puedes ver tareas
✓ Instalación exitosa
```

**Si hay errores:**

```
❌ "Cannot find module 'react'"
   → npm install (incompleto)
   → npm ci (si viene de CI/CD)

❌ "Supabase connection failed"
   → Verifica NEXT_PUBLIC_SUPABASE_URL
   → Verifica conectividad a internet

❌ "401 Unauthorized"
   → Verifica NEXT_PUBLIC_SUPABASE_ANON_KEY
   → Confirma que existe usuario test en BD
```

---

## 🗄️ Configuración de Supabase

### Crear proyecto

```
1. Ir a supabase.com
2. Click "New Project"
3. Seleccionar región (más cerca = mejor)
4. Nombre: "itflow-prod" o similar
5. Contraseña BD: Genera contraseña fuerte
6. Click "Create new project"
```

### Habilitar autenticación

```
En Supabase Dashboard:
1. Authentication → Providers
2. Email: Habilitar
3. Settings → Policies
   ├─ Habilitar confirmación por email (opcional)
   ├─ Auto-confirm users (para desarrollo)
   └─ Guardar
```

### Crear tablas

Antes de ejecutar SQL manual, considera correr primero las migraciones del repositorio en `scripts/sql/` para mantener el esquema alineado con el frontend y APIs actuales.

```sql
-- Ejecutar en SQL Editor de Supabase

-- Tabla: ROLES
CREATE TABLE roles (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(50) UNIQUE NOT NULL,
  descripcion TEXT
);

-- Tabla: PAISES
CREATE TABLE paises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre VARCHAR(100) UNIQUE NOT NULL
);

-- Tabla: PLANTAS
CREATE TABLE plantas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre VARCHAR(100) NOT NULL,
  pais_id UUID REFERENCES paises(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabla: USUARIOS
CREATE TABLE usuarios (
  id UUID PRIMARY KEY DEFAULT auth.uid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  nombre_completo VARCHAR(200),
  estado VARCHAR(20) DEFAULT 'activo',
  rol_id INTEGER REFERENCES roles(id),
  planta_id UUID REFERENCES plantas(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabla: ESTADOS_TAREA
CREATE TABLE estados_tarea (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(50) UNIQUE NOT NULL,
  color_hex VARCHAR(7) DEFAULT '#000000'
);

-- Tabla: PRIORIDADES
CREATE TABLE prioridades (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(50) UNIQUE NOT NULL
);

-- Tabla: TAREAS (la más importante)
CREATE TABLE tareas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo VARCHAR(300) NOT NULL,
  descripcion TEXT,
  estado_id INTEGER REFERENCES estados_tarea(id),
  prioridad_id INTEGER REFERENCES prioridades(id),
  asignado_a UUID REFERENCES usuarios(id),
  creado_por UUID REFERENCES usuarios(id),
  supervisado_por UUID REFERENCES usuarios(id),
  planta_id UUID REFERENCES plantas(id),
  porcentaje_avance INTEGER DEFAULT 0 CHECK (porcentaje_avance >= 0 AND porcentaje_avance <= 100),
  observaciones TEXT,
  evidencia TEXT,
  revisado BOOLEAN DEFAULT false,
  fecha_inicio TIMESTAMP NOT NULL,
  fecha_limite TIMESTAMP NOT NULL,
  fecha_cierre TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT fecha_limite_after_inicio CHECK (fecha_limite > fecha_inicio)
);

-- Tabla: COMENTARIOS (opcional, para futuro)
CREATE TABLE comentarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tarea_id UUID REFERENCES tareas(id) ON DELETE CASCADE,
  usuario_id UUID REFERENCES usuarios(id),
  contenido TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_tareas_asignado_a ON tareas(asignado_a);
CREATE INDEX idx_tareas_planta_id ON tareas(planta_id);
CREATE INDEX idx_tareas_estado_id ON tareas(estado_id);
CREATE INDEX idx_usuarios_rol_id ON usuarios(rol_id);
CREATE INDEX idx_usuarios_planta_id ON usuarios(planta_id);
CREATE INDEX idx_comentarios_tarea_id ON comentarios(tarea_id);
```

### Migraciones de alertas admin → user (abril 2026)

Ejecuta estos scripts en orden desde `scripts/sql/`:

```sql
-- 1) Flujo completo de alertas
-- scripts/sql/2026-04-21_alertas_usuario_flujo.sql

-- 2) Publicación realtime para postgres_changes
-- scripts/sql/2026-04-22_enable_realtime_alertas_usuario.sql
```

Estos scripts agregan:

```
OBJETOS DE DATOS
├─ Tabla: public.alertas_usuario
└─ Vista: public.vw_alertas_usuario_estado

FUNCIONES / RPC
├─ public.crear_alerta_usuario(uuid, uuid, text)
├─ public.confirmar_alerta_usuario(uuid, uuid)
├─ public.es_admin_itflow(uuid)
├─ public.es_user_itflow(uuid)
└─ public.tg_alertas_usuario_validar()

TRIGGERS
├─ trg_alertas_usuario_updated_at
└─ trg_alertas_usuario_validar

SEGURIDAD Y REALTIME
├─ RLS + policies sobre alertas_usuario
└─ publication supabase_realtime incluye alertas_usuario
```

### Insertar datos iniciales

```sql
-- Insertar roles
INSERT INTO roles (nombre, descripcion) VALUES
  ('admin', 'Administrador del sistema'),
  ('supervisor', 'Supervisor de planta'),
  ('user', 'Usuario operario');

-- Insertar prioridades
INSERT INTO prioridades (nombre) VALUES
  ('Baja'),
  ('Media'),
  ('Alta'),
  ('Urgente');

-- Insertar estados
INSERT INTO estados_tarea (nombre, color_hex) VALUES
  ('Pendiente', '#FF6B6B'),
  ('En Proceso', '#FFD93D'),
  ('Completada', '#6BCB77'),
  ('Pausada', '#4D96FF'),
  ('Cancelada', '#CCCCCC');

-- Insertar país (ejemplo)
INSERT INTO paises (nombre) VALUES
  ('El Salvador'),
  ('Guatemala'),
  ('Honduras');

-- Insertar planta (ejemplo)
INSERT INTO plantas (nombre, pais_id) VALUES
  ('Santa Tecla - SV', (SELECT id FROM paises WHERE nombre = 'El Salvador')),
  ('Guatemala City - GT', (SELECT id FROM paises WHERE nombre = 'Guatemala'));
```

### Habilitar Row Level Security (RLS)

```sql
-- Habilitar RLS en tablas críticas
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE tareas ENABLE ROW LEVEL SECURITY;
ALTER TABLE comentarios ENABLE ROW LEVEL SECURITY;

-- Política: Admins ven todo
CREATE POLICY "Admin can see all"
  ON tareas FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM usuarios
      WHERE usuarios.id = auth.uid()
      AND usuarios.rol_id = (SELECT id FROM roles WHERE nombre = 'admin')
    )
  );

-- Política: Users ven solo sus tareas
CREATE POLICY "Users see own tasks"
  ON tareas FOR SELECT
  USING (asignado_a = auth.uid());

-- Política: Supervisores ven tareas de su planta
CREATE POLICY "Supervisor see plant tasks"
  ON tareas FOR SELECT
  USING (
    planta_id IN (
      SELECT planta_id FROM usuarios
      WHERE usuarios.id = auth.uid()
      AND rol_id = (SELECT id FROM roles WHERE nombre = 'supervisor')
    )
  );
```

---

## 🌐 Deployment en Vercel

### Opción más rápida para producción

### Paso 1: Preparar repositorio

```bash
# Asegúrate que todo está en git
git add .
git commit -m "Preparado para producción"
git push origin main
```

### Paso 2: Conectar con Vercel

```
1. Ir a vercel.com
2. Click "New Project"
3. Seleccionar repositorio GitHub
4. Click "Import"
```

### Paso 3: Variables de entorno

```
En Vercel dashboard:
1. Project Settings → Environment Variables
2. Agregar:
   ├─ NEXT_PUBLIC_SUPABASE_URL=...
   ├─ NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   ├─ SUPABASE_SERVICE_ROLE_KEY=...
   └─ NODE_ENV=production
3. Click "Save"
```

### Paso 4: Deploy

```
1. Click "Deploy"
2. Espera ~2-3 minutos
3. Vercel construye y despliega
4. Obtiendes URL: https://itflow-xxxxx.vercel.app
```

### Paso 5: Verificar producción

```bash
# Visita la URL en navegador
https://itflow-xxxxx.vercel.app

# Prueba login
Email: admin@test.com
Contraseña: password123

# Si funciona: ¡Estás en producción!
```

---

## 🐳 Deployment con Docker (opcional)

### Crear imagen Docker

```bash
# Crear Dockerfile
cat > Dockerfile << 'EOF'
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY .next ./
COPY public ./public
COPY .env.production .env.production.local

EXPOSE 3000
CMD ["npm", "start"]
EOF
```

### Construir imagen

```bash
# Build
docker build -t itflow:latest .

# Ejecutar container
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_SUPABASE_URL=https://... \
  -e NEXT_PUBLIC_SUPABASE_ANON_KEY=... \
  -e SUPABASE_SERVICE_ROLE_KEY=... \
  itflow:latest
```

### Subir a Docker Hub (opcional)

```bash
# Login a Docker Hub
docker login

# Tag
docker tag itflow:latest tuusuario/itflow:latest

# Push
docker push tuusuario/itflow:latest

# Descargar en servidor:
docker pull tuusuario/itflow:latest
docker run -p 3000:3000 tuusuario/itflow:latest
```

---

## 📊 Monitoreo en producción

### Logs en Vercel

```
1. Vercel Dashboard
2. Seleccionar proyecto
3. Deployments → Click en deployment
4. Logs → Ver logs en tiempo real
```

### Métricas

```
1. Analytics → Ver:
   ├─ Response time
   ├─ Error rate
   ├─ Requests/min
   └─ Uptime
```

### Alertas

```
Settings → Alerts
├─ Notificar si error rate > 5%
├─ Notificar si response time > 2s
└─ Notificar si deployment falla
```

---

## 🔄 Actualizar aplicación en producción

### Con Vercel (recomendado)

```bash
# Hacer cambios en código
git commit -am "Agregar feature X"
git push origin main

# Vercel automáticamente:
├─ Detecta push
├─ Construye aplicación
├─ Ejecuta tests
├─ Despliega a producción

# URL sigue siendo la misma
# Solo cambia el código backend/frontend
```

### Manual

```bash
# SSH al servidor
ssh usuario@servidor.com

# Dentro del servidor:
cd /app/itflow
git pull origin main
npm install
npm run build
npm restart  # Reiniciar servicio

# Verificar
curl http://localhost:3000
```

---

## 🚨 Troubleshooting

### Problema: "Supabase connection refused"

```
Causa: No hay conectividad a Supabase
Solución:
1. Verifica NEXT_PUBLIC_SUPABASE_URL es correcto
2. Verifica que proyecto está activo en Supabase
3. Prueba conectividad: curl https://tu-url.supabase.co
4. Si sigue fallando: contacta a Supabase support
```

### Problema: "Error 500 en /api/..."

```
Causa: Error en API backend
Solución:
1. Revisa logs en Vercel/servidor
2. Verifica SUPABASE_SERVICE_ROLE_KEY en production
3. Prueba API localmente: npm run dev
4. Debug: console.log() y revisa logs
```

### Problema: "401 Unauthorized"

```
Causa: JWT inválido o expirado
Solución:
1. Usuario intenta hacer llamada sin JWT
2. O JWT está mal formato en header
3. O JWT expiró (Supabase: máx 1 hora por defecto)

Check: Verifica Authorization header en Network tab del navegador
```

### Problema: "Slow performance"

```
Causa: Queries N+1 o demasiados datos
Solución:
1. Usar herramienta de profiling: npm run profile
2. Revisar Network tab en DevTools
3. Optimizar queries en APIs
4. Agregar índices en BD
5. Implementar caché (SWR/React Query)
```

---

## ✅ Checklist pre-producción

```
[ ] Base de datos creada en Supabase
[ ] Todas las tablas existen
[ ] `alertas_usuario` y `vw_alertas_usuario_estado` creadas
[ ] RLS habilitado y configurado
[ ] RPCs `crear_alerta_usuario` y `confirmar_alerta_usuario` disponibles
[ ] Trigger de validación y updated_at activos
[ ] `alertas_usuario` agregado a `supabase_realtime`
[ ] Variables de entorno configuradas
[ ] HTTPS habilitado (automático en Vercel)
[ ] Backups automáticos configurados
[ ] Monitoreo y alertas activos
[ ] Tests locales pasando (npm test)
[ ] Build sin errores (npm run build)
[ ] Revisión de seguridad completada
[ ] Documentación actualizada
[ ] Equipo capacitado en uso
[ ] Plan de rollback disponible
```

---

## 📈 Escalabilidad futura

### Si llegan miles de usuarios

```
Consideraciones:
├─ Supabase soporta até 1M requests/día en free tier
├─ Considerar plan pagado si excedes
├─ Implementar caché (Redis)
├─ CDN para assets estáticos
├─ Database replication para redundancia
└─ Monitoring avanzado (DataDog, New Relic)
```

### Arquitectura recomendada

```
Usuarios
  ↓
CDN (Cloudflare)
  ↓
Load Balancer
  ↓
[Vercel Instances] ← Auto-scaling
  ↓
API Gateway
  ↓
[Supabase] + [Redis Cache]
  ↓
PostgreSQL (replicado)
```

---

## 🔐 Checklist de seguridad

```
[ ] API keys NUNCA en frontend
[ ] SUPABASE_SERVICE_ROLE_KEY solo en .env.local (gitignored)
[ ] HTTPS forzado en producción
[ ] Rate limiting en APIs
[ ] SQL injection prevention (prepared statements)
[ ] CORS correctamente configurado
[ ] Validación de input en backend
[ ] OWASP Top 10 checklist revisado
[ ] Penetration test (en roadmap)
```

---

## 📞 Soporte

**Problema técnico de Supabase:**
```
Dashboard → Help → Contact support
o: support@supabase.com
```

**Problema técnico de Vercel:**
```
Dashboard → Help → Contact support
o: https://vercel.com/support
```

**Problema con ITFlow mismo:**
```
GitHub Issues: github.com/tuempresa/itflow/issues
```

---

**Última actualización:** 22/04/2026  
**Próxima revisión:** Q3 2026 (cuando implementemos CI/CD completo)
