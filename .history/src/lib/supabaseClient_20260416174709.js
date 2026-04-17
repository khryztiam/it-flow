import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ========== HELPERS DE QUERIES ==========

// Obtener usuario completo con detalles
export const obtenerUsuarioConDetalles = async (userId) => {
  const { data, error } = await supabase
    .from('usuarios')
    .select(
      `
      id,
      email,
      nombre_completo,
      estado,
      rol:roles(id, nombre, descripcion),
      planta:plantas(id, nombre, pais:paises(id, nombre))
    `
    )
    .eq('id', userId)
    .single();

  if (error) throw error;
  return data;
};

// Obtener lista de países
export const obtenerPaises = async () => {
  const { data, error } = await supabase
    .from('paises')
    .select('*')
    .order('nombre', { ascending: true });

  if (error) throw error;
  return data;
};

// Obtener plantas por país
export const obtenerPlantasPorPais = async (paisId) => {
  const { data, error } = await supabase
    .from('plantas')
    .select('*')
    .eq('pais_id', paisId)
    .order('nombre', { ascending: true });

  if (error) throw error;
  return data;
};

// Obtener usuarios de una planta
export const obtenerUsuariosPorPlanta = async (plantaId) => {
  const { data, error } = await supabase
    .from('usuarios')
    .select('id, email, nombre_completo, rol:roles(nombre), estado')
    .eq('planta_id', plantaId)
    .order('nombre_completo', { ascending: true });

  if (error) throw error;
  return data;
};

// Obtener tareas por planta
export const obtenerTareasPorPlanta = async (plantaId, options = {}) => {
  let query = supabase
    .from('tareas')
    .select(
      `
      id,
      titulo,
      descripcion,
      fecha_inicio,
      fecha_limite,
      fecha_cierre,
      dias_retraso,
      porcentaje_avance,
      estado:estados_tarea(id, nombre, color_hex),
      prioridad:prioridades(id, nombre, orden, color_hex),
      asignado_a:usuarios!asignado_a(id, nombre_completo, email),
      creado_por:usuarios!creado_por(id, nombre_completo),
      planta:plantas(id, nombre, pais:paises(id, nombre))
    `
    )
    .eq('planta_id', plantaId);

  // Filtros opcionales
  if (options.estado) {
    query = query.eq('estado:estados_tarea.nombre', options.estado);
  }
  if (options.prioridad) {
    query = query.eq('prioridad:prioridades.nombre', options.prioridad);
  }
  if (options.asignadoA) {
    query = query.eq('asignado_a', options.asignadoA);
  }

  const { data, error } = await query.order('fecha_limite', {
    ascending: true,
  });

  if (error) throw error;
  return data;
};

// Obtener tareas del usuario (asignadas a él)
export const obtenerMisTareas = async (userId) => {
  const { data, error } = await supabase
    .from('tareas')
    .select(
      `
      id,
      titulo,
      descripcion,
      fecha_limite,
      dias_retraso,
      porcentaje_avance,
      estado:estados_tarea(id, nombre, color_hex),
      prioridad:prioridades(id, nombre, orden, color_hex),
      planta:plantas(id, nombre)
    `
    )
    .eq('asignado_a', userId)
    .order('fecha_limite', { ascending: true });

  if (error) throw error;
  return data;
};

// Obtener detalle de una tarea
export const obtenerTarea = async (tareaId) => {
  const { data, error } = await supabase
    .from('tareas')
    .select(
      `
      *,
      estado:estados_tarea(id, nombre, color_hex),
      prioridad:prioridades(id, nombre, orden, color_hex),
      asignado_a:usuarios!asignado_a(id, nombre_completo, email),
      creado_por:usuarios!creado_por(id, nombre_completo, email),
      supervisado_por:usuarios!supervisado_por(id, nombre_completo),
      planta:plantas(id, nombre, pais:paises(id, nombre))
    `
    )
    .eq('id', tareaId)
    .single();

  if (error) throw error;
  return data;
};

// Obtener comentarios de una tarea
export const obtenerComentariosTarea = async (tareaId) => {
  const { data, error } = await supabase
    .from('comentarios_tarea')
    .select(
      `
      id,
      contenido,
      created_at,
      usuario:usuarios(id, nombre_completo, email)
    `
    )
    .eq('tarea_id', tareaId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
};

// Crear comentario
export const crearComentario = async (tareaId, contenido) => {
  const { data, error } = await supabase
    .from('comentarios_tarea')
    .insert([
      {
        tarea_id: tareaId,
        usuario_id: (await supabase.auth.getUser()).data.user.id,
        contenido,
      },
    ])
    .select();

  if (error) throw error;
  return data[0];
};

// Obtener roles
export const obtenerRoles = async () => {
  const { data, error } = await supabase
    .from('roles')
    .select('*')
    .order('nombre', { ascending: true });

  if (error) throw error;
  return data;
};
