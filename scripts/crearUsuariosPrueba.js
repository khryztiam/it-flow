/**
 * Script para crear usuarios de prueba en Supabase
 * Ejecutar: node scripts/crearUsuariosPrueba.js
 */

const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

// Cargar variables de entorno desde .env.local
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Faltan variables de entorno requeridas:');
  console.error('   - NEXT_PUBLIC_SUPABASE_URL');
  console.error('   - SUPABASE_SERVICE_ROLE_KEY');
  console.error('\n📋 Configura estas variables en .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function crearUsuariosPrueba() {
  try {
    console.log('🔄 Creando usuarios de prueba...\n');

    // Obtener plantas
    const { data: plantas, error: errPlantas } = await supabase
      .from('plantas')
      .select('id, nombre')
      .limit(3);

    if (errPlantas) throw errPlantas;

    // Obtener roles
    const { data: roles, error: errRoles } = await supabase
      .from('roles')
      .select('id, nombre');

    if (errRoles) throw errRoles;

    // Datos de usuarios a crear (las contraseñas se pasan como env vars)
    const defaultPass = process.env.DEFAULT_TEST_PASSWORD;
    if (!defaultPass) {
      console.error('❌ Error: DEFAULT_TEST_PASSWORD no configurada');
      console.log(
        'ℹ️  Usa: DEFAULT_TEST_PASSWORD=TuPassword123 node scripts/crearUsuariosPrueba.js'
      );
      process.exit(1);
    }

    const usuariosPrueba = [
      {
        email: 'admin@itflowapp.com',
        nombre: 'Administrador General',
        rol: 'admin',
        planta: plantas[0]?.id,
        password: defaultPass,
      },
      {
        email: 'supervisor@itflowapp.com',
        nombre: 'Supervisor Principal',
        rol: 'supervisor',
        planta: plantas[0]?.id,
        password: defaultPass,
      },
      {
        email: 'usuario1@itflowapp.com',
        nombre: 'Usuario Uno',
        rol: 'user',
        planta: plantas[0]?.id,
        password: defaultPass,
      },
      {
        email: 'usuario2@itflowapp.com',
        nombre: 'Usuario Dos',
        rol: 'user',
        planta: plantas[1]?.id || plantas[0]?.id,
        password: defaultPass,
      },
    ];

    for (const usuario of usuariosPrueba) {
      console.log(`➕ Creando ${usuario.email}...`);

      // Crear en auth
      const { data: authData, error: authErr } =
        await supabase.auth.admin.createUser({
          email: usuario.email,
          password: usuario.password,
          email_confirm: true,
        });

      if (authErr) {
        console.error(`  ❌ Error en Auth: ${authErr.message}`);
        continue;
      }

      // Obtener rol_id
      const rolObj = roles.find((r) => r.nombre === usuario.rol);
      if (!rolObj) {
        console.error(`  ❌ Rol ${usuario.rol} no encontrado`);
        continue;
      }

      // Crear en tabla usuarios
      const { error: dbErr } = await supabase.from('usuarios').insert([
        {
          id: authData.user.id,
          email: usuario.email,
          nombre_completo: usuario.nombre,
          planta_id: usuario.planta,
          rol_id: rolObj.id,
          estado: 'activo',
        },
      ]);

      if (dbErr) {
        console.error(`  ❌ Error en BD: ${dbErr.message}`);
        continue;
      }

      console.log(`  ✅ ${usuario.email} creado correctamente`);
      console.log(`     Contraseña: ${usuario.password}`);
    }

    console.log('\n✅ ¡Usuarios de prueba creados!');
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

crearUsuariosPrueba();
