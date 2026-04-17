// Utilidades para verificar permisos según rol

export const ROLES = {
  ADMIN: 'admin',
  SUPERVISOR: 'supervisor',
  USER: 'user',
};

/**
 * Verificar si el usuario es admin
 */
export const esAdmin = (usuarioDetalles) => {
  return usuarioDetalles?.rol?.nombre === ROLES.ADMIN;
};

/**
 * Verificar si el usuario es supervisor
 */
export const esSupervisor = (usuarioDetalles) => {
  return usuarioDetalles?.rol?.nombre === ROLES.SUPERVISOR;
};

/**
 * Verificar si el usuario es un usuario regular
 */
export const esUser = (usuarioDetalles) => {
  return usuarioDetalles?.rol?.nombre === ROLES.USER;
};

/**
 * Verificar si el usuario tiene un rol específico
 */
export const tieneRol = (usuarioDetalles, rol) => {
  return usuarioDetalles?.rol?.nombre === rol;
};

/**
 * Verificar si el usuario puede ver tareas (admin y supervisor ven todas, user ve sus asignadas)
 */
export const puedeVerTareas = (usuarioDetalles) => {
  return tieneRol(usuarioDetalles, ROLES.ADMIN) ||
    tieneRol(usuarioDetalles, ROLES.SUPERVISOR) ||
    tieneRol(usuarioDetalles, ROLES.USER);
};

/**
 * Verificar si el usuario puede crear tareas (solo supervisor y admin)
 */
export const puedeCrearTareas = (usuarioDetalles) => {
  return tieneRol(usuarioDetalles, ROLES.ADMIN) ||
    tieneRol(usuarioDetalles, ROLES.SUPERVISOR);
};

/**
 * Verificar si el usuario puede asignar tareas (solo supervisor y admin)
 */
export const puedeAsignarTareas = (usuarioDetalles) => {
  return tieneRol(usuarioDetalles, ROLES.ADMIN) ||
    tieneRol(usuarioDetalles, ROLES.SUPERVISOR);
};

/**
 * Verificar si el usuario puede revisar tareas (solo supervisor y admin)
 */
export const puedeRevisarTareas = (usuarioDetalles) => {
  return tieneRol(usuarioDetalles, ROLES.ADMIN) ||
    tieneRol(usuarioDetalles, ROLES.SUPERVISOR);
};

/**
 * Verificar si el usuario puede modificar tareas
 */
export const puedeModificarTarea = (usuarioDetalles, tarea) => {
  if (tieneRol(usuarioDetalles, ROLES.ADMIN) ||
    tieneRol(usuarioDetalles, ROLES.SUPERVISOR)) {
    return true;
  }
  // Usuario solo puede modificar sus propias tareas
  if (tieneRol(usuarioDetalles, ROLES.USER)) {
    return tarea.asignado_a?.id === usuarioDetalles?.id;
  }
  return false;
};

/**
 * Verificar si el usuario puede gestionar usuarios (solo admin)
 */
export const puedeGestionarUsuarios = (usuarioDetalles) => {
  return tieneRol(usuarioDetalles, ROLES.ADMIN);
};

/**
 * Verificar si el usuario puede gestionar plantas (solo admin)
 */
export const puedeGestionarPlantas = (usuarioDetalles) => {
  return tieneRol(usuarioDetalles, ROLES.ADMIN);
};

/**
 * Obtener la ruta de acceso según el rol
 */
export const obtenerRutaPrincipal = (usuarioDetalles) => {
  if (esAdmin(usuarioDetalles)) {
    return '/admin/dashboard';
  }
  if (esSupervisor(usuarioDetalles)) {
    return '/supervisor/tareas';
  }
  if (esUser(usuarioDetalles)) {
    return '/user/mis-tareas';
  }
  return '/login';
};
