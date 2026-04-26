#!/usr/bin/env node

/**
 * Script de Validación de Visibilidad y Acceso Cruzado
 *
 * Este script valida que los endpoints respeten los controles de acceso.
 *
 * Uso:
 *   node test-acceso-simple.js
 *
 * Requiere:
 *   - Servidor Next.js corriendo en http://localhost:3000
 *   - Usuarios de test existentes (ver config abajo)
 *   - Token JWT válido para cada usuario
 */

const BASE_URL = 'http://localhost:3000';

// ────────────────────────────────────────────────────────────────────────────
// CONFIGURACIÓN DE USUARIOS DE TEST
// ────────────────────────────────────────────────────────────────────────────
//
// Estos tokens deben obtenerse previamente. Opciones:
// 1. Login manual en la app y copiar del localStorage (clave 'sb-token')
// 2. Usar Supabase CLI para generar tokens
// 3. Login programático si cuentas existen
//

const TEST_CONFIG = {
  // Cambia estos valores según tus usuarios reales
  USUARIO_NORMAL: {
    email: 'user@example.com',
    token: process.env.USER_TOKEN || null,
  },
  SUPERVISOR: {
    email: 'supervisor@example.com',
    token: process.env.SUPERVISOR_TOKEN || null,
  },
  ADMIN: {
    email: 'admin@example.com',
    token: process.env.ADMIN_TOKEN || null,
  },
};

// ────────────────────────────────────────────────────────────────────────────
// UTILS
// ────────────────────────────────────────────────────────────────────────────

async function callAPI(endpoint, token, method = 'GET', body = null) {
  const url = `${BASE_URL}${endpoint}`;
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  };

  if (token) {
    options.headers.Authorization = `Bearer ${token}`;
  }

  if (body) {
    options.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(url, options);
    const data = await response.json().catch(() => ({}));

    return {
      status: response.status,
      data,
    };
  } catch (err) {
    return {
      status: 0,
      error: err.message,
    };
  }
}

function log(msg) {
  console.log(msg);
}

function logTest(name) {
  log(`\n${'─'.repeat(70)}`);
  log(`TEST: ${name}`);
  log('─'.repeat(70));
}

function logPass(msg) {
  log(`  ✓ PASS: ${msg}`);
}

function logFail(msg) {
  log(`  ✗ FAIL: ${msg}`);
}

function logInfo(msg) {
  log(`  ℹ INFO: ${msg}`);
}

// ────────────────────────────────────────────────────────────────────────────
// TESTS
// ────────────────────────────────────────────────────────────────────────────

let passed = 0;
let failed = 0;

async function test1_usuario_ve_sus_tareas() {
  logTest('Usuario normal puede ver sus tareas');

  const { token, email } = TEST_CONFIG.USUARIO_NORMAL;
  if (!token) {
    logInfo(`Saltado (sin token para ${email})`);
    return;
  }

  const { status, data, error } = await callAPI('/api/user/tareas', token);

  if (error) {
    logFail(`Error de conexión: ${error}`);
    failed++;
    return;
  }

  if (status === 200 && Array.isArray(data)) {
    logPass(
      `GET /api/user/tareas devuelve tareas (${data.length} encontradas)`
    );
    passed++;
  } else {
    logFail(`Status ${status}, esperaba 200. Data: ${JSON.stringify(data)}`);
    failed++;
  }
}

async function test2_usuario_rechazado_supervisor() {
  logTest('Usuario normal es rechazado en /api/supervisor/tareas');

  const { token, email } = TEST_CONFIG.USUARIO_NORMAL;
  if (!token) {
    logInfo(`Saltado (sin token para ${email})`);
    return;
  }

  const { status, data } = await callAPI('/api/supervisor/tareas', token);

  if (status === 403) {
    logPass(
      `GET /api/supervisor/tareas rechazado con 403: "${
        data?.detail || data?.error
      }"`
    );
    passed++;
  } else {
    logFail(
      `Status ${status}, esperaba 403. Usuario NO debe acceder a supervisor`
    );
    failed++;
  }
}

async function test3_supervisor_ve_sus_tareas() {
  logTest('Supervisor ve tareas de sus subordinados');

  const { token, email } = TEST_CONFIG.SUPERVISOR;
  if (!token) {
    logInfo(`Saltado (sin token para ${email})`);
    return;
  }

  const { status, data, error } = await callAPI(
    '/api/supervisor/tareas',
    token
  );

  if (error) {
    logFail(`Error de conexión: ${error}`);
    failed++;
    return;
  }

  if (status === 200 && Array.isArray(data)) {
    logPass(
      `GET /api/supervisor/tareas devuelve tareas (${data.length} encontradas)`
    );
    passed++;
  } else {
    logFail(`Status ${status}, esperaba 200. Data: ${JSON.stringify(data)}`);
    failed++;
  }
}

async function test4_supervisor_rechazado_admin() {
  logTest('Supervisor es rechazado en /api/admin/usuarios');

  const { token, email } = TEST_CONFIG.SUPERVISOR;
  if (!token) {
    logInfo(`Saltado (sin token para ${email})`);
    return;
  }

  const { status, data } = await callAPI('/api/admin/usuarios', token);

  if (status === 403) {
    logPass(
      `GET /api/admin/usuarios rechazado con 403: "${
        data?.detail || data?.error
      }"`
    );
    passed++;
  } else {
    logInfo(
      `Status ${status}. Nota: Supervisores pueden ver /api/admin/tareas filtrado, pero no /api/admin/usuarios`
    );
    if (status === 200) {
      logFail(`Supervisor logró acceder a recursos de admin sin filtro`);
      failed++;
    }
  }
}

async function test5_admin_ve_todo() {
  logTest('Admin puede ver todas las tareas');

  const { token, email } = TEST_CONFIG.ADMIN;
  if (!token) {
    logInfo(`Saltado (sin token para ${email})`);
    return;
  }

  const { status, data, error } = await callAPI('/api/admin/tareas', token);

  if (error) {
    logFail(`Error de conexión: ${error}`);
    failed++;
    return;
  }

  if (status === 200 && Array.isArray(data)) {
    logPass(
      `GET /api/admin/tareas devuelve todas las tareas (${data.length} encontradas)`
    );
    passed++;
  } else {
    logFail(`Status ${status}, esperaba 200. Data: ${JSON.stringify(data)}`);
    failed++;
  }
}

async function test6_sin_token_rechazado() {
  logTest('Request sin token es rechazado');

  const { status, data } = await callAPI('/api/user/tareas', null);

  if (status === 403) {
    logPass(`Sin token: status 403 como esperado`);
    passed++;
  } else {
    logFail(`Sin token: status ${status}, esperaba 403`);
    failed++;
  }
}

async function test7_token_invalido() {
  logTest('Request con token inválido es rechazado');

  const { status, data } = await callAPI(
    '/api/user/tareas',
    'Bearer INVALID_TOKEN'
  );

  if (status === 403) {
    logPass(`Token inválido: status 403 como esperado`);
    passed++;
  } else {
    logFail(`Token inválido: status ${status}, esperaba 403`);
    failed++;
  }
}

// ────────────────────────────────────────────────────────────────────────────
// MAIN
// ────────────────────────────────────────────────────────────────────────────

async function main() {
  log('\n' + '═'.repeat(70));
  log('  VALIDACIÓN DE VISIBILIDAD Y ACCESO CRUZADO');
  log('═'.repeat(70));

  log('\n📋 Configuración:');
  log(`  • Base URL: ${BASE_URL}`);
  log(
    `  • Usuario: ${TEST_CONFIG.USUARIO_NORMAL.token ? '✓ Token disponible' : '✗ Sin token'}`
  );
  log(
    `  • Supervisor: ${TEST_CONFIG.SUPERVISOR.token ? '✓ Token disponible' : '✗ Sin token'}`
  );
  log(
    `  • Admin: ${TEST_CONFIG.ADMIN.token ? '✓ Token disponible' : '✗ Sin token'}`
  );

  if (
    !TEST_CONFIG.USUARIO_NORMAL.token &&
    !TEST_CONFIG.SUPERVISOR.token &&
    !TEST_CONFIG.ADMIN.token
  ) {
    log('\n⚠️  ADVERTENCIA: No hay tokens configurados.');
    log('\nPara obtener tokens:');
    log('  1. Login manual en http://localhost:3000');
    log('  2. Abre DevTools → Console');
    log('  3. Copia el token: localStorage.getItem("sb-token")');
    log('  4. Establece variables de entorno:');
    log('       export USER_TOKEN="..."');
    log('       export SUPERVISOR_TOKEN="..."');
    log('       export ADMIN_TOKEN="..."');
    log('  5. Ejecuta nuevamente este script\n');
    process.exit(1);
  }

  // Ejecutar tests
  await test1_usuario_ve_sus_tareas();
  await test2_usuario_rechazado_supervisor();
  await test3_supervisor_ve_sus_tareas();
  await test4_supervisor_rechazado_admin();
  await test5_admin_ve_todo();
  await test6_sin_token_rechazado();
  await test7_token_invalido();

  // Resumen
  log('\n' + '═'.repeat(70));
  log(`  RESUMEN: ${passed} pasados, ${failed} fallidos`);
  log('═'.repeat(70) + '\n');

  process.exit(failed > 0 ? 1 : 0);
}

main();
