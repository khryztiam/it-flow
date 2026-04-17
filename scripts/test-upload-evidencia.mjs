/**
 * Test de carga de evidencias
 * Ejecutar con el servidor corriendo: node scripts/test-upload-evidencia.mjs
 * O contra producción: BASE_URL=https://itflow-app.vercel.app node scripts/test-upload-evidencia.mjs
 */
import { createClient } from '@supabase/supabase-js';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

const supabase = createClient(
  'https://hmjxrtscfsgjqdfaqxiw.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhtanhydHNjZnNnanFkZmFxeGl3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYyMjA1MDYsImV4cCI6MjA2MTc5NjUwNn0.Iv8j52dTePCY2XZnGBWZeeHnhkY59xvLK6bf1Mu2s48'
);

// PNG 1x1 píxel rojo (formato válido, ~68 bytes)
const PNG_1X1_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwADhQGAWjR9awAAAABJRU5ErkJggg==';

async function test() {
  console.log(`\n🧪 Test de carga de evidencias → ${BASE_URL}\n`);

  const loginEmail = process.env.TEST_EMAIL;
  const loginPass = process.env.TEST_PASSWORD;

  if (!loginEmail || !loginPass) {
    console.error('❌ Error: Credenciales no configuradas');
    console.log(
      'ℹ️  Usa: TEST_EMAIL=x@example.com TEST_PASSWORD=y node scripts/test-upload-evidencia.mjs'
    );
    process.exit(1);
  }

  // Tarea fija de christian.diaz (única tarea asignada)
  const TAREA_FIJA = {
    id: '644c4c0d-1f8e-461a-98b1-65db6f6fd913',
    titulo: 'Aplicativo de Flujos de Trabajo IT',
  };

  // 1. Login
  console.log(`1️⃣  Login como ${loginEmail}...`);
  const { data: authData, error: authErr } =
    await supabase.auth.signInWithPassword({
      email: loginEmail,
      password: loginPass,
    });

  if (authErr) {
    console.error('❌ Error de login:', authErr.message);
    console.log(
      'ℹ️  Pasa credenciales: TEST_EMAIL=x TEST_PASSWORD=y node scripts/test-upload-evidencia.mjs'
    );
    process.exit(1);
  }

  const token = authData.session.access_token;
  const userId = authData.user.id;
  console.log(`✅ Login OK — userId: ${userId}\n`);

  // 2. Confirmar tarea
  console.log('2️⃣  Usando tarea fija de christian.diaz...');
  const tarea = TAREA_FIJA;
  console.log(`✅ Tarea: "${tarea.titulo}" (${tarea.id})\n`);

  // 3. Test GET — listar evidencias (esperamos 0 o las que existan)
  console.log('3️⃣  GET /api/user/tareas/[id]/upload — listar evidencias...');
  const getRes = await fetch(`${BASE_URL}/api/user/tareas/${tarea.id}/upload`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const getData = await getRes.json();
  if (getRes.ok) {
    console.log(`✅ OK — ${getData.data?.length ?? 0} evidencias existentes\n`);
  } else {
    console.error(`❌ ${getRes.status} — ${getData.error}\n`);
  }

  // 4. Test POST — subir PNG 1×1
  console.log('4️⃣  POST /api/user/tareas/[id]/upload — subir PNG de prueba...');
  const postRes = await fetch(
    `${BASE_URL}/api/user/tareas/${tarea.id}/upload`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        archivoBase64: PNG_1X1_BASE64,
        nombreOriginal: 'test-evidencia-1x1.png',
        tipoMime: 'image/png',
        descripcion: 'Imagen de prueba automatizada (1×1 px)',
      }),
    }
  );
  const postData = await postRes.json();

  if (postRes.ok) {
    console.log(`✅ OK — Archivo subido`);
    console.log(`   URL: ${postData.data?.archivo_url}`);
    console.log(`   ID:  ${postData.data?.id}\n`);

    // 5. Test DELETE — eliminar la evidencia recién subida
    const evidenciaId = postData.data?.id;
    if (evidenciaId) {
      console.log(
        `5️⃣  DELETE /api/user/tareas/[id]/upload — eliminar evidencia ${evidenciaId}...`
      );
      const delRes = await fetch(
        `${BASE_URL}/api/user/tareas/${tarea.id}/upload`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ evidenciaId }),
        }
      );
      const delData = await delRes.json();
      if (delRes.ok) {
        console.log('✅ Evidencia eliminada correctamente\n');
      } else {
        console.error(`❌ ${delRes.status} — ${delData.error}\n`);
      }
    }
  } else {
    console.error(`❌ ${postRes.status} — ${postData.error}\n`);
  }

  // 6. Test rechazo — intentar subir un .txt (debe fallar)
  console.log('6️⃣  POST — intentar subir archivo .txt (debe rechazarse)...');
  const txtContent = btoa('Este es un archivo de texto de prueba');
  const rejectRes = await fetch(
    `${BASE_URL}/api/user/tareas/${tarea.id}/upload`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        archivoBase64: txtContent,
        nombreOriginal: 'test.txt',
        tipoMime: 'text/plain',
        descripcion: 'Debe ser rechazado',
      }),
    }
  );
  const rejectData = await rejectRes.json();
  if (!rejectRes.ok) {
    console.log(`✅ Rechazado correctamente — ${rejectData.error}\n`);
  } else {
    console.warn('⚠️  Debería haber sido rechazado pero fue aceptado\n');
  }

  console.log('🏁 Test completado');
}

test().catch((err) => {
  console.error('Error inesperado:', err.message);
  process.exit(1);
});
