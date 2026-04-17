import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { useAuth } from '@context/AuthContext';
import styles from '@styles/Home.module.css';

export default function Home() {
  const { usuario, cargando } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!cargando && !usuario) {
      router.push('/login');
    }
  }, [usuario, cargando, router]);

  if (cargando) {
    return <div>Cargando...</div>;
  }

  if (!usuario) {
    return null;
  }

  return (
    <div>
      <h1>Bienvenido a ITFlow</h1>
      <p>Email: {usuario.email}</p>
      <button onClick={() => router.push('/login')}>Cerrar sesión</button>
    </div>
  );
}
