/*
 * Script de prueba rápida para crear tareas en Supabase
 * Ejecutar: npx node-esm scripts/crear-datos-test.mjs
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error('❌ Faltan variables');
  process.exit(1);
}

const supabase = createClient(url, key);

async function run() {
  // IDs extraídos de los logs
  const supervisorId = '393e0dcc-b338-46f2-9600-89c2be13b070';
  const plantaId = 'e2798888-dac7-479d-8fd7-6bd6db21bf1f';

  try {
    // Verificar si existen estados y prioridades
    const { data: estados } = await supabase
      .from('estados_tarea')
      .select('id')
      .limit(1);

    const { data: prioridades } = await supabase
      .from('prioridades')
      .select('id')
      .limit(1);

    if (!estados?.length || !prioridades?.length) {
      console.error('❌ No hay estados o prioridades');
      process.exit(1);
    }

    // Crear tarea de prueba
    const { data, error } = await supabase
      .from('tareas')
      .insert({
        titulo: '[PRUEBA] Revisar reportes mensuales',
        descripcion: 'Tarea de prueba creada por el supervisor',
        planta_id: plantaId,
        creado_por: supervisorId,
        estado_id: estados[0].id,
        prioridad_id: prioridades[0].id,
        fecha_inicio: new Date().toISOString().split('T')[0],
        fecha_limite: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split('T')[0],
        porcentaje_avance: 0,
      })
      .select();

    if (error) {
      console.error('❌ Error:', error.message);
      process.exit(1);
    }

    console.log('✅ Tarea creada:', data[0].titulo);
    process.exit(0);
  } catch (err) {
    console.error('❌ Exception:', err.message);
    process.exit(1);
  }
}

run();
