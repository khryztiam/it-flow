import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { useAuth } from '@context/AuthContext';
import { obtenerRutaPrincipal } from '@lib/permisos';

export default function Home() {
  const { usuarioDetalles, cargando } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!cargando) {
      if (usuarioDetalles) {
        // Redirigir al dashboard apropiado según el rol del usuario
        const ruta = obtenerRutaPrincipal(usuarioDetalles);
        router.push(ruta);
      } else {
        // Redirigir a login si no hay usuario
        router.push('/login');
      }
    }
  }, [usuarioDetalles, cargando, router]);

  if (cargando) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
        }}
      >
        <p>Cargando...</p>
      </div>
    );
  }

  return null;
}
