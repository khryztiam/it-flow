-- Script SQL para crear datos de prueba para el supervisor test 01
-- Copiar y ejecutar en Supabase SQL Editor

-- Este script crea tareas que:
-- 1. Son creadas por el supervisor test 01 (393e0dcc-b338-46f2-9600-89c2be13b070)
-- 2. Están asignadas a su subordinado existente: adolfo.vargas@itflowapp.com
-- 3. Pertenecen a la planta: e2798888-dac7-479d-8fd7-6bd6db21bf1f

-- 1. Crear una tarea CREADA por el supervisor
INSERT INTO tareas (
  titulo,
  descripcion,
  planta_id,
  creado_por,
  estado_id,
  prioridad_id,
  fecha_inicio,
  fecha_limite,
  porcentaje_avance,
  created_at,
  updated_at
)
SELECT
  '[PRUEBA] Revisar reportes mensuales',
  'Esta es una tarea de prueba creada por el supervisor para verificar que la vista funciona correctamente.',
  'e2798888-dac7-479d-8fd7-6bd6db21bf1f',
  '393e0dcc-b338-46f2-9600-89c2be13b070',
  (SELECT id FROM estados_tarea WHERE nombre = 'pendiente' LIMIT 1),
  (SELECT id FROM prioridades WHERE nombre = 'Alta' LIMIT 1),
  CURRENT_DATE,
  CURRENT_DATE + INTERVAL '7 days',
  0,
  NOW(),
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM tareas 
  WHERE titulo = '[PRUEBA] Revisar reportes mensuales'
);

-- 2. Crear una tarea asignada al subordinado existente
INSERT INTO tareas (
  titulo,
  descripcion,
  planta_id,
  creado_por,
  asignado_a,
  estado_id,
  prioridad_id,
  fecha_inicio,
  fecha_limite,
  porcentaje_avance,
  created_at,
  updated_at
)
SELECT
  '[PRUEBA] Verificar inventario',
  'Tarea asignada a Adolfo Vargas (subordinado) para verificar que aparece en la lista del supervisor.',
  'e2798888-dac7-479d-8fd7-6bd6db21bf1f',
  '393e0dcc-b338-46f2-9600-89c2be13b070',
  (SELECT id FROM usuarios WHERE email = 'adolfo.vargas@itflowapp.com' LIMIT 1),
  (SELECT id FROM estados_tarea WHERE nombre = 'en progreso' LIMIT 1),
  (SELECT id FROM prioridades WHERE nombre = 'Media' LIMIT 1),
  CURRENT_DATE,
  CURRENT_DATE + INTERVAL '3 days',
  25,
  NOW(),
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM tareas 
  WHERE titulo = '[PRUEBA] Verificar inventario'
);

-- 3. Crear una tercera tarea de prueba (estado diferente)
INSERT INTO tareas (
  titulo,
  descripcion,
  planta_id,
  creado_por,
  asignado_a,
  estado_id,
  prioridad_id,
  fecha_inicio,
  fecha_limite,
  porcentaje_avance,
  created_at,
  updated_at
)
SELECT
  '[PRUEBA] Completar documentación',
  'Tarea en progreso asignada a Adolfo para probar diferentes estados.',
  'e2798888-dac7-479d-8fd7-6bd6db21bf1f',
  '393e0dcc-b338-46f2-9600-89c2be13b070',
  (SELECT id FROM usuarios WHERE email = 'adolfo.vargas@itflowapp.com' LIMIT 1),
  (SELECT id FROM estados_tarea WHERE nombre = 'completado' LIMIT 1),
  (SELECT id FROM prioridades WHERE nombre = 'Baja' LIMIT 1),
  CURRENT_DATE - INTERVAL '10 days',
  CURRENT_DATE - INTERVAL '2 days',
  100,
  NOW(),
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM tareas 
  WHERE titulo = '[PRUEBA] Completar documentación'
);
