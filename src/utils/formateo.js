// Utilidades de formateo para estados, prioridades, fechas, etc.

import { format, formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

/**
 * Formatear fecha en formato legible
 */
export const formatearFecha = (fecha) => {
  if (!fecha) return '-';
  return format(new Date(fecha), 'dd/MM/yyyy', { locale: es });
};

/**
 * Formatear fecha y hora
 */
export const formatearFechaHora = (fecha) => {
  if (!fecha) return '-';
  return format(new Date(fecha), 'dd/MM/yyyy HH:mm', { locale: es });
};

/**
 * Formatear fecha relativa (ej: "hace 2 horas")
 */
export const formatearFechaRelativa = (fecha) => {
  if (!fecha) return '-';
  return formatDistanceToNow(new Date(fecha), { locale: es, addSuffix: true });
};

/**
 * Obtener clase CSS o estilo según estado de tarea
 */
export const obtenerColorEstado = (estado) => {
  const colores = {
    pendiente: '#FFC107',
    en_proceso: '#2196F3',
    detenido: '#F44336',
    en_revision: '#FF9800',
    completado: '#4CAF50',
  };
  return colores[estado] || '#cccccc';
};

/**
 * Obtener clase CSS o estilo según prioridad
 */
export const obtenerColorPrioridad = (prioridad) => {
  const colores = {
    baja: '#4CAF50',
    media: '#FFC107',
    alta: '#FF9800',
    urgente: '#F44336',
  };
  return colores[prioridad] || '#cccccc';
};

/**
 * Determinar alerta visual según estado y fechas
 */
export const obtenerAlertaVisual = (tarea) => {
  const ahora = new Date();
  const fechaLimite = new Date(tarea.fecha_limite);
  const mañana = new Date(ahora);
  mañana.setDate(mañana.getDate() + 1);

  // Verde: Completado y a tiempo
  if (tarea.estado?.nombre === 'completado') {
    if (new Date(tarea.fecha_cierre) <= fechaLimite) {
      return { tipo: 'success', icono: '✓', texto: 'Completado a tiempo' };
    }
    return { tipo: 'warning', icono: '⚠', texto: 'Completado con retraso' };
  }

  // Rojo: Vencida
  if (tarea.dias_retraso > 0) {
    return {
      tipo: 'danger',
      icono: '!',
      texto: `${tarea.dias_retraso} días de retraso`,
    };
  }

  // Amarillo: Vence hoy o mañana
  if (fechaLimite <= mañana) {
    const diasRestantes = Math.ceil(
      (fechaLimite - ahora) / (1000 * 60 * 60 * 24)
    );
    if (diasRestantes === 0) {
      return { tipo: 'warning', icono: '⚠', texto: 'Vence hoy' };
    }
    if (diasRestantes === 1) {
      return { tipo: 'warning', icono: '⚠', texto: 'Vence mañana' };
    }
  }

  // Azul: En proceso
  return { tipo: 'info', icono: 'o', texto: 'En progreso' };
};

/**
 * Formatear porcentaje de avance
 */
export const formatearPorcentaje = (valor) => {
  if (typeof valor !== 'number') return '-';
  return `${Math.min(100, Math.max(0, valor))}%`;
};

/**
 * Obtener texto amigable para estado
 */
export const obtenerTextoEstado = (estado) => {
  const textos = {
    pendiente: 'Pendiente',
    en_proceso: 'En Proceso',
    detenido: 'Detenido',
    en_revision: 'En Revisión',
    completado: 'Completado',
  };
  return textos[estado] || estado;
};

/**
 * Obtener texto amigable para prioridad
 */
export const obtenerTextoPrioridad = (prioridad) => {
  const textos = {
    baja: 'Baja',
    media: 'Media',
    alta: 'Alta',
    urgente: 'Urgente',
  };
  return textos[prioridad] || prioridad;
};

/**
 * Obtener texto amigable para rol
 */
export const obtenerTextoRol = (rol) => {
  const textos = {
    admin: 'Administrador',
    supervisor: 'Supervisor',
    user: 'Usuario',
  };
  return textos[rol] || rol;
};

/**
 * Truncar texto
 */
export const truncarTexto = (texto, longitud = 50) => {
  if (!texto) return '-';
  if (texto.length <= longitud) return texto;
  return texto.substring(0, longitud) + '...';
};

/**
 * Obtener iniciales de nombre
 */
export const obtenerIniciales = (nombre) => {
  if (!nombre) return '?';
  return nombre
    .split(' ')
    .map((palabra) => palabra[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);
};
