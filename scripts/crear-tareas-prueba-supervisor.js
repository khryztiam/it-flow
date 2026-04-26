#!/usr/bin/env node
/**
 * Script para crear tareas de prueba para el supervisor
 * Uso: node scripts/crear-tareas-prueba-supervisor.js
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Faltan variables de entorno SUPABASE');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  try {
    // 1. Obtener el supervisor (el que está logeado)
    const supervisorId = '393e0dcc-b338-46f2-9600-89c2be13b070'; // El del screenshot
    const plantaId = 'e2798888-dac7-479d-8fd7-6bd6db21bf1f'; // Extraído del log

    console.log(
      `\n📋 Creando tareas de prueba para supervisor: ${supervisorId}`
    );
    console.log(`   Planta: ${plantaId}\n`);

    // 2. Verificar que el supervisor existe
    const { data: supervisor, error: errSuper } = await supabase
      .from('usuarios')
      .select('id, nombre_completo, planta_id')
      .eq('id', supervisorId)
      .single();

    if (errSuper || !supervisor) {
      console.error('❌ Supervisor no encontrado:', errSuper?.message);
      process.exit(1);
    }
    console.log(`✅ Supervisor encontrado: ${supervisor.nombre_completo}`);

    // 3. Obtener usuarios subordinados
    const { data: usuariosSupervisados, error: errUsuarios } = await supabase
      .from('usuarios')
      .select('id, nombre_completo')
      .eq('supervisor_id', supervisorId)
      .eq('planta_id', plantaId)
      .limit(1);

    if (errUsuarios) {
      console.error('❌ Error obteniendo usuarios:', errUsuarios.message);
      process.exit(1);
    }

    if (!usuariosSupervisados || usuariosSupervisados.length === 0) {
      console.warn(
        '⚠️  No hay usuarios subordinados. Creando tarea SIN asignación.'
      );
    } else {
      console.log(
        `✅ Usuarios subordinados encontrados: ${usuariosSupervisados.length}`
      );
      usuariosSupervisados.forEach((u) =>
        console.log(`   - ${u.nombre_completo}`)
      );
    }

    // 4. Obtener estados y prioridades
    const { data: estados } = await supabase
      .from('estados_tarea')
      .select('id, nombre')
      .limit(1);

    const { data: prioridades } = await supabase
      .from('prioridades')
      .select('id, nombre')
      .limit(1);

    if (!estados || !prioridades) {
      console.error('❌ No hay estados o prioridades en BD');
      process.exit(1);
    }

    // 5. Crear tarea 1: Creada por el supervisor
    const tarea1 = {
      titulo: '[PRUEBA] Revisar reportes',
      descripcion: 'Esta es una tarea de prueba creada por el supervisor',
      planta_id: plantaId,
      creado_por: supervisorId,
      estado_id: estados[0].id,
      prioridad_id: prioridades[0].id,
      fecha_inicio: new Date().toISOString().split('T')[0],
      fecha_limite: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0],
      porcentaje_avance: 0,
      asignado_a: null,
      supervisado_por: null,
    };

    const { data: createdTarea1, error: err1 } = await supabase
      .from('tareas')
      .insert([tarea1])
      .select('id, titulo');

    if (err1) {
      console.error('❌ Error creando tarea 1:', err1.message);
    } else {
      console.log(
        `✅ Tarea 1 creada: ${createdTarea1[0].titulo} (${createdTarea1[0].id})`
      );
    }

    // 6. Crear tarea 2: Asignada a un subordinado
    if (usuariosSupervisados && usuariosSupervisados.length > 0) {
      const usuarioAsignado = usuariosSupervisados[0];
      const tarea2 = {
        titulo: '[PRUEBA] Verificar inventario',
        descripcion: `Esta es una tarea asignada a ${usuarioAsignado.nombre_completo}`,
        planta_id: plantaId,
        creado_por: supervisorId,
        asignado_a: usuarioAsignado.id,
        estado_id: estados[0].id,
        prioridad_id: prioridades[0].id,
        fecha_inicio: new Date().toISOString().split('T')[0],
        fecha_limite: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split('T')[0],
        porcentaje_avance: 25,
        supervisado_por: null,
      };

      const { data: createdTarea2, error: err2 } = await supabase
        .from('tareas')
        .insert([tarea2])
        .select('id, titulo');

      if (err2) {
        console.error('❌ Error creando tarea 2:', err2.message);
      } else {
        console.log(
          `✅ Tarea 2 creada: ${createdTarea2[0].titulo} (${createdTarea2[0].id})`
        );
      }
    }

    console.log(
      '\n✅ Proceso completado. Recarga la página para ver los cambios.\n'
    );
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

main();
