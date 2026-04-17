import { useRouter } from 'next/router';
import { useAuth } from '@context/AuthContext';
import styles from '@styles/Layout.module.css';
import Sidebar from './Sidebar';

export default function Layout({ children, titulo, ocultarHeader = false }) {
  const router = useRouter();
  const { usuarioDetalles, logout } = useAuth();

  if (!usuarioDetalles) {
    return <div className={styles.cargando}>Cargando...</div>;
  }

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  return (
    <div className={styles.contenedor}>
      <Sidebar usuarioDetalles={usuarioDetalles} onLogout={handleLogout} />

      {/* MAIN CONTENT */}
      <div className={styles.main}>
        {!ocultarHeader && (
          <header className={styles.header}>
            <h2 className={styles.titulo}>{titulo || 'Dashboard'}</h2>
          </header>
        )}

        <main className={styles.contenido}>{children}</main>
      </div>
    </div>
  );
}
