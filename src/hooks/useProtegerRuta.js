import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { useAuth } from '@context/AuthContext';
import { ROLES } from '@lib/permisos';

/**
 * Hook para proteger rutas por rol
 * Redirige a login si no hay autenticación
 * Redirige a home si no tiene permisos
 */
export const useProtegerRuta = (rolesPermitidos = []) => {
  const router = useRouter();
  const { usuarioDetalles, cargando } = useAuth();

  useEffect(() => {
    if (!cargando) {
      // Si no hay usuario, redirigir a login
      if (!usuarioDetalles) {
        router.push('/login');
        return;
      }

      // Si hay restricción de roles y el usuario no está en la lista
      if (rolesPermitidos.length > 0) {
        const tienePermiso = rolesPermitidos.includes(
          usuarioDetalles?.rol?.nombre
        );
        if (!tienePermiso) {
          router.push('/');
          return;
        }
      }
    }
  }, [usuarioDetalles, cargando, router, rolesPermitidos]);

  return { usuarioDetalles, cargando };
};

/**
 * Hook para redirigir solo a admin
 */
export const useAdmin = () => {
  return useProtegerRuta([ROLES.ADMIN]);
};

/**
 * Hook para redirigir solo a supervisor
 */
export const useSupervisor = () => {
  return useProtegerRuta([ROLES.SUPERVISOR]);
};

/**
 * Hook para redirigir solo a usuario regular
 */
export const useUser = () => {
  return useProtegerRuta([ROLES.USER]);
};

/**
 * Hook para permitir admin y supervisor
 */
export const useAdminOSupervisor = () => {
  return useProtegerRuta([ROLES.ADMIN, ROLES.SUPERVISOR]);
};
