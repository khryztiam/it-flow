import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '@context/AuthContext';
import styles from '@styles/LayoutAdmin.module.css';
import { obtenerTextoRol } from '@utils/formateo';
import { FiMenu, FiLogOut, FiChevronDown } from 'react-icons/fi';
import { useState } from 'react';

export default function LayoutAdmin({ children, titulo }) {
  const router = useRouter();
  const { usuarioDetalles, logout } = useAuth();
  const [menuAbierto, setMenuAbierto] = useState(false);

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  const rutasAdmin = [
    { label: 'Dashboard', ruta: '/admin/dashboard', icono: '📊' },
    { label: 'Gestión', ruta: '/admin/gestion', icono: '⚙️' },
  ];

  return (
    <div className={styles.contenedor}>
      {/* SIDEBAR */}
      <aside className={styles.sidebar}>
        <div className={styles.logoArea}>
          <h1>ITFlow</h1>
          <p>Admin</p>
        </div>

        <nav className={styles.nav}>
          {rutasAdmin.map((ruta) => (
            <Link key={ruta.ruta} href={ruta.ruta}>
              <a
                className={`${styles.navItem} ${
                  router.pathname === ruta.ruta ? styles.activo : ''
                }`}
              >
                <span>{ruta.icono}</span>
                <span>{ruta.label}</span>
              </a>
            </Link>
          ))}
        </nav>

        <div className={styles.footer}>
          <div className={styles.usuario}>
            <div className={styles.avatar}>
              {usuarioDetalles?.nombre_completo?.split(' ')[0][0]}
            </div>
            <div className={styles.info}>
              <p className={styles.nombre}>{usuarioDetalles?.nombre_completo}</p>
              <p className={styles.rol}>
                {obtenerTextoRol(usuarioDetalles?.rol?.nombre)}
              </p>
            </div>
          </div>
          <button onClick={handleLogout} className={styles.logout} title="Cerrar sesión">
            <FiLogOut />
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <div className={styles.main}>
        <header className={styles.header}>
          <div className={styles.titulo}>
            <h2>{titulo || 'Dashboard'}</h2>
          </div>
          <div className={styles.headerDerechas}>
            <span className={styles.email}>{usuarioDetalles?.email}</span>
          </div>
        </header>

        <main className={styles.contenido}>{children}</main>
      </div>
    </div>
  );
}
