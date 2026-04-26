const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

// Cargar variables de entorno desde .env.local
dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌ Faltan variables de entorno requeridas:');
  console.error('   - NEXT_PUBLIC_SUPABASE_URL');
  console.error('   - SUPABASE_SERVICE_ROLE_KEY');
  console.error('\n📋 Configura estas variables en .env.local');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function crearAdminItFlow() {
  try {
    const username = 'admin_itflow';
    const contrasena = 'Admin2026+';
    const email = username + '@itflowapp.com';

    console.log(`🚀 Configurando usuario admin: ${email}`);

    // 1. Intentar obtener el usuario existente o crear uno nuevo
    let userId;
    const { data: existente } = await supabase.auth.admin.listUsers();
    const usuarioExistente = existente?.users?.find((u) => u.email === email);

    if (usuarioExistente) {
      userId = usuarioExistente.id;
      console.log(`✅ Usuario encontrado en auth: ${userId}`);
    } else {
      const { data: authData, error: authError } =
        await supabase.auth.admin.createUser({
          email: email,
          password: contrasena,
          email_confirm: true,
        });

      if (authError) {
        throw new Error(`Error en auth: ${authError.message}`);
      }

      userId = authData.user.id;
      console.log(`✅ Usuario creado en auth: ${userId}`);
    }

    // 2. Obtener el ID del rol admin
    const { data: roles, error: rolesError } = await supabase
      .from('roles')
      .select('id')
      .eq('nombre', 'admin')
      .single();

    if (rolesError) {
      throw new Error(`Error obteniendo rol admin: ${rolesError.message}`);
    }

    const rolAdminId = roles.id;
    console.log(`✅ Rol admin encontrado: ${rolAdminId}`);

    // 3. Obtener la primera planta para asignar (o usar NULL)
    const { data: plantas, error: plantasError } = await supabase
      .from('plantas')
      .select('id')
      .limit(1)
      .single();

    let plantaId = null;
    if (!plantasError && plantas) {
      plantaId = plantas.id;
      console.log(`✅ Planta asignada: ${plantaId}`);
    } else {
      console.log(`⚠️  No hay plantas disponibles, asignando NULL`);
    }

    // 4. Insertar o actualizar en tabla usuarios
    const { data: usuarioExisteEnBD } = await supabase
      .from('usuarios')
      .select('id')
      .eq('id', userId)
      .single();

    if (usuarioExisteEnBD) {
      console.log(`✅ Usuario ya existe en BD, actualizando...`);
      const { error: updateError } = await supabase
        .from('usuarios')
        .update({
          email: email,
          nombre_completo: 'Admin ITFlow',
          planta_id: plantaId,
          rol_id: rolAdminId,
          estado: 'activo',
        })
        .eq('id', userId);

      if (updateError) {
        throw new Error(`Error actualizando usuario: ${updateError.message}`);
      }
    } else {
      const { data: usuario, error: usuarioError } = await supabase
        .from('usuarios')
        .insert([
          {
            id: userId,
            email: email,
            nombre_completo: 'Admin ITFlow',
            planta_id: plantaId,
            rol_id: rolAdminId,
            estado: 'activo',
          },
        ])
        .select();

      if (usuarioError) {
        throw new Error(
          `Error creando registro usuario: ${usuarioError.message}`
        );
      }
    }

    console.log(`✅ Usuario admin creado exitosamente!`);
    console.log(`\n📋 Credenciales de acceso:`);
    console.log(`   Username: ${username}`);
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${contrasena}`);
    console.log(`   Role: admin`);
  } catch (error) {
    console.error(`❌ Error:`, error.message);
    process.exit(1);
  }
}

crearAdminItFlow();
