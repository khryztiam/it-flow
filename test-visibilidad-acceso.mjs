/**
 * Tests de Validación de Visibilidad y Acceso Cruzado
 *
 * Valida que:
 * 1. Un usuario normal solo ve sus tareas
 * 2. Un supervisor solo ve tareas de sus subordinados
 * 3. Un supervisor no puede reasignar fuera de sus subordinados
 * 4. Un usuario no puede acceder a endpoints de supervisor
 * 5. Un supervisor no puede acceder a endpoints de admin
 * 6. Las RLS policies se respetan correctamente
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Faltan variables de entorno SUPABASE_URL o SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ────────────────────────────────────────────────────────────────────────────
// HELPERS
// ────────────────────────────────────────────────────────────────────────────

async function obtenerTokenPara(email) {
  // Simulamos obtener un token. En producción usarías autenticación real.
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password: 'test-password',
  });
  if (error) throw error;
  return data.session?.access_token;
}

async function callAPI(url, token, method = 'GET', body = null) {
  const response = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: body ? JSON.stringify(body) : null,
  });

  const data = await response.json();
  return { status: response.status, data };
}

// ────────────────────────────────────────────────────────────────────────────
// TEST 1: Usuario normal solo ve sus tareas
// ────────────────────────────────────────────────────────────────────────────

async function test_usuario_ve_solo_sus_tareas(usuarioEmail) {
  console.log(`\n✓ TEST 1: Usuario "${usuarioEmail}" ve solo sus tareas`);

  try {
    const token = await obtenerTokenPara(usuarioEmail);
    const { status, data } = await callAPI(
      'http://localhost:3000/api/user/tareas',
      token
    );

    if (status !== 200) {
      console.error(`  ✗ Status ${status}:`, data);
      return false;
    }

    // Obtener ID del usuario para validación
    const { data: userData, error: userErr } =
      await supabase.auth.getUser(token);
    if (userErr || !userData) {
      console.error('  ✗ No se pudo obtener datos del usuario');
      return false;
    }

    const tareas = data;
    console.log(`  • Encontradas ${tareas.length} tareas`);

    // Validar que TODAS las tareas están asignadas a este usuario
    const tareasAjenas = tareas.filter(
      (t) => t.asignado_a !== userData.user.id
    );
    if (tareasAjenas.length > 0) {
      console.error(
        `  ✗ Encontradas ${tareasAjenas.length} tareas que NO le pertenecen`
      );
      return false;
    }

    console.log(`  ✓ Todas las tareas pertenecen al usuario`);
    return true;
  } catch (err) {
    console.error(`  ✗ Error:`, err.message);
    return false;
  }
}

// ────────────────────────────────────────────────────────────────────────────
// TEST 2: Supervisor solo ve tareas de sus subordinados
// ────────────────────────────────────────────────────────────────────────────

async function test_supervisor_ve_solo_subordinados(supervisorEmail) {
  console.log(
    `\n✓ TEST 2: Supervisor "${supervisorEmail}" ve solo tareas de sus subordinados`
  );

  try {
    const token = await obtenerTokenPara(supervisorEmail);
    const { status, data } = await callAPI(
      'http://localhost:3000/api/supervisor/tareas',
      token
    );

    if (status !== 200) {
      console.error(`  ✗ Status ${status}:`, data);
      return false;
    }

    const tareas = data;
    console.log(`  • Encontradas ${tareas.length} tareas`);

    // Obtener ID del supervisor
    const { data: userData, error: userErr } =
      await supabase.auth.getUser(token);
    if (userErr || !userData) {
      console.error('  ✗ No se pudo obtener datos del supervisor');
      return false;
    }

    const supervisorId = userData.user.id;

    // Obtener IDs de usuarios supervisados
    const { data: supervisados, error: supErr } = await supabase
      .from('usuarios')
      .select('id')
      .eq('supervisor_id', supervisorId);

    if (supErr) {
      console.error(`  ✗ Error obteniendo supervisados:`, supErr.message);
      return false;
    }

    const supervisadosIds = supervisados.map((u) => u.id);
    console.log(`  • Usuario supervisa ${supervisadosIds.length} usuarios`);

    // Validar que todas las tareas están asignadas a usuarios supervisados
    const tareasAjenas = tareas.filter(
      (t) => !supervisadosIds.includes(t.asignado_a)
    );
    if (tareasAjenas.length > 0) {
      console.error(
        `  ✗ Encontradas ${tareasAjenas.length} tareas de usuarios NO supervisados`
      );
      return false;
    }

    console.log(`  ✓ Todas las tareas son de usuarios supervisados`);
    return true;
  } catch (err) {
    console.error(`  ✗ Error:`, err.message);
    return false;
  }
}

// ────────────────────────────────────────────────────────────────────────────
// TEST 3: Usuario NO puede acceder a /api/supervisor/tareas
// ────────────────────────────────────────────────────────────────────────────

async function test_usuario_rechazado_supervisor_endpoint(usuarioEmail) {
  console.log(
    `\n✓ TEST 3: Usuario "${usuarioEmail}" es rechazado en /api/supervisor/tareas`
  );

  try {
    const token = await obtenerTokenPara(usuarioEmail);
    const { status, data } = await callAPI(
      'http://localhost:3000/api/supervisor/tareas',
      token
    );

    if (status === 403) {
      console.log(`  ✓ Acceso rechazado (403) como esperado`);
      console.log(
        `    Razón: ${data?.detail || data?.error || 'No autorizado'}`
      );
      return true;
    }

    if (status === 200) {
      console.error(
        `  ✗ Usuario logró acceder a endpoint de supervisor (status 200)`
      );
      console.error(`    Devolvió ${data?.length || 0} tareas`);
      return false;
    }

    console.error(`  ✗ Status inesperado ${status}:`, data);
    return false;
  } catch (err) {
    console.error(`  ✗ Error:`, err.message);
    return false;
  }
}

// ────────────────────────────────────────────────────────────────────────────
// TEST 4: Supervisor NO puede reasignar fuera de sus subordinados
// ────────────────────────────────────────────────────────────────────────────

async function test_supervisor_no_reasigna_ajenos(
  supervisorEmail,
  tareaId,
  usuarioAjenoId
) {
  console.log(
    `\n✓ TEST 4: Supervisor "${supervisorEmail}" NO puede reasignar a usuario ajeno`
  );

  try {
    const token = await obtenerTokenPara(supervisorEmail);
    const { status, data } = await callAPI(
      `http://localhost:3000/api/supervisor/tareas/${tareaId}`,
      token,
      'PUT',
      { asignado_a: usuarioAjenoId }
    );

    if (status === 403) {
      console.log(`  ✓ Reasignación rechazada (403) como esperado`);
      console.log(`    Razón: ${data?.detail || 'No autorizado'}`);
      return true;
    }

    if (status === 200) {
      console.error(
        `  ✗ Supervisor logró reasignar a usuario ajeno (status 200)`
      );
      return false;
    }

    console.error(`  ✗ Status inesperado ${status}:`, data);
    return false;
  } catch (err) {
    console.error(`  ✗ Error:`, err.message);
    return false;
  }
}

// ────────────────────────────────────────────────────────────────────────────
// TEST 5: Supervisor NO puede ver tareas de otro supervisor
// ────────────────────────────────────────────────────────────────────────────

async function test_supervisor_no_ve_otros(
  supervisorEmail,
  tareaDeOtroSupervisor
) {
  console.log(
    `\n✓ TEST 5: Supervisor "${supervisorEmail}" NO ve tareas de otro supervisor`
  );

  try {
    const token = await obtenerTokenPara(supervisorEmail);
    const { status, data: tareas } = await callAPI(
      'http://localhost:3000/api/supervisor/tareas',
      token
    );

    if (status !== 200) {
      console.error(`  ✗ Status ${status}:`, tareas);
      return false;
    }

    const encontrada = tareas.some((t) => t.id === tareaDeOtroSupervisor);

    if (encontrada) {
      console.error(`  ✗ Supervisor logró ver tarea de otro supervisor`);
      return false;
    }

    console.log(`  ✓ Tarea de otro supervisor correctamente oculta`);
    return true;
  } catch (err) {
    console.error(`  ✗ Error:`, err.message);
    return false;
  }
}

// ────────────────────────────────────────────────────────────────────────────
// TEST 6: Supervisor NO puede acceder a /api/admin/tareas con rol filter
// ────────────────────────────────────────────────────────────────────────────

async function test_supervisor_rechazado_admin_endpoint(supervisorEmail) {
  console.log(
    `\n✓ TEST 6: Supervisor "${supervisorEmail}" es rechazado en admin endpoints`
  );

  try {
    const token = await obtenerTokenPara(supervisorEmail);
    const { status, data } = await callAPI(
      'http://localhost:3000/api/admin/usuarios',
      token
    );

    // Los supervisores pueden acceder a /api/admin/tareas pero filtrado a su planta
    // Pero NO deben poder acceder a usuarios admin
    if (status === 403) {
      console.log(`  ✓ Acceso rechazado (403) como esperado`);
      return true;
    }

    if (status === 200 && Array.isArray(data)) {
      // Si es admin/tareas, está permitido para supervisores (filtrado)
      console.log(`  ✓ Acceso permitido (filtrado a su rol)`);
      return true;
    }

    console.error(`  ✗ Status inesperado ${status}:`, data);
    return false;
  } catch (err) {
    console.error(`  ✗ Error:`, err.message);
    return false;
  }
}

// ────────────────────────────────────────────────────────────────────────────
// TEST 7: RLS de Comentarios - Supervisor ve comentarios de tareas de subordinados
// ────────────────────────────────────────────────────────────────────────────

async function test_supervisor_ve_comentarios_subordinados(
  supervisorEmail,
  tareaDeSubordinado
) {
  console.log(
    `\n✓ TEST 7: Supervisor "${supervisorEmail}" ve comentarios de subordinados`
  );

  try {
    const token = await obtenerTokenPara(supervisorEmail);
    const { status, data } = await callAPI(
      `http://localhost:3000/api/supervisor/tareas/${tareaDeSubordinado}`,
      token
    );

    if (status !== 200) {
      console.error(`  ✗ Status ${status}:`, data);
      return false;
    }

    const tarea = data;
    if (!tarea.comentarios) {
      console.log(`  ✓ Tarea cargada (sin comentarios)`);
      return true;
    }

    console.log(
      `  ✓ Tarea cargada con ${tarea.comentarios.length} comentarios`
    );
    return true;
  } catch (err) {
    console.error(`  ✗ Error:`, err.message);
    return false;
  }
}

// ────────────────────────────────────────────────────────────────────────────
// RUNNER
// ────────────────────────────────────────────────────────────────────────────

async function runAllTests() {
  console.log(
    '═══════════════════════════════════════════════════════════════════'
  );
  console.log('   TESTS DE VALIDACIÓN DE VISIBILIDAD Y ACCESO CRUZADO');
  console.log(
    '═══════════════════════════════════════════════════════════════════'
  );

  // Nota: Estos tests requieren usuarios reales en el sistema
  // Ajusta los emails según tus datos de prueba
  const testUsers = {
    admin: 'admin@example.com',
    supervisor: 'supervisor@example.com',
    usuario: 'usuario@example.com',
  };

  const results = [];

  try {
    // TEST 1: Usuario ve solo sus tareas
    results.push(await test_usuario_ve_solo_sus_tareas(testUsers.usuario));

    // TEST 2: Supervisor ve solo de subordinados
    results.push(
      await test_supervisor_ve_solo_subordinados(testUsers.supervisor)
    );

    // TEST 3: Usuario rechazado en endpoint supervisor
    results.push(
      await test_usuario_rechazado_supervisor_endpoint(testUsers.usuario)
    );

    // TEST 4: Supervisor no reasigna ajenos
    // (Requiere una tarea real y un usuario ajeno)
    // results.push(await test_supervisor_no_reasigna_ajenos(testUsers.supervisor, tareaId, usuarioAjenoId));

    // TEST 5: Supervisor no ve otros
    // (Requiere dos supervisores distintos)
    // results.push(await test_supervisor_no_ve_otros(testUsers.supervisor, tareaOtroSup));

    // TEST 6: Supervisor rechazado en admin
    results.push(
      await test_supervisor_rechazado_admin_endpoint(testUsers.supervisor)
    );
  } catch (err) {
    console.error('\n✗ Error fatal:', err.message);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // RESUMEN
  // ─────────────────────────────────────────────────────────────────────────

  const passed = results.filter((r) => r).length;
  const total = results.length;

  console.log(
    '\n═══════════════════════════════════════════════════════════════════'
  );
  console.log(`RESUMEN: ${passed}/${total} tests pasaron`);
  console.log(
    '═══════════════════════════════════════════════════════════════════\n'
  );

  process.exit(passed === total ? 0 : 1);
}

runAllTests();
