import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '@context/AuthContext';
import styles from '@styles/Layout.module.css';
import { obtenerTextoRol } from '@utils/formateo';
import { FiLogOut, FiChevronRight } from 'react-icons/fi';
import {
  FiBarChart2,
  FiSettings,
  FiUsers,
  FiCheckSquare,
  FiShare2,
  FiBox,
} from 'react-icons/fi';

export default function Layout({ children, titulo }) {
  const router = useRouter();
  const { usuarioDetalles, logout } = useAuth();

  if (!usuarioDetalles) {
    return <div className={styles.cargando}>Cargando...</div>;
  }

  const rol = usuarioDetalles?.rol?.nombre;

  // Definir menús por rol
  const getMenuPorRol = () => {
    switch (rol) {
      case 'admin':
        return {
          secciones: [
            {
              titulo: 'ADMINISTRACIÓN',
              items: [
                {
                  label: 'Dashboard',
                  ruta: '/admin/dashboard',
                  icono: FiBarChart2,
                },
                { label: 'Gestión', ruta: '/admin/gestion', icono: FiSettings },
                { label: 'Usuarios', ruta: '/admin/usuarios', icono: FiUsers },
              ],
            },
          ],
        };

      case 'supervisor':
        return {
          secciones: [
            {
              titulo: 'OPERACIONES',
              items: [
                {
                  label: 'Dashboard',
                  ruta: '/supervisor/dashboard',
                  icono: FiBarChart2,
                },
                {
                  label: 'Mis Tareas',
                  ruta: '/supervisor/tareas',
                  icono: FiCheckSquare,
                },
                {
                  label: 'Asignaciones',
                  ruta: '/supervisor/asignaciones',
                  icono: FiShare2,
                },
              ],
            },
          ],
        };

      case 'user':
      default:
        return {
          secciones: [
            {
              titulo: 'MIS ACTIVIDADES',
              items: [
                {
                  label: 'Dashboard',
                  ruta: '/user/dashboard',
                  icono: FiBarChart2,
                },
                {
                  label: 'Mis Tareas',
                  ruta: '/user/tareas',
                  icono: FiCheckSquare,
                },
              ],
            },
          ],
        };
    }
  };

  const menu = getMenuPorRol();

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  const isActivo = (ruta) => router.pathname === ruta;

  return (
    <div className={styles.contenedor}>
      {/* SIDEBAR */}
      <aside className={styles.sidebar}>
        {/* Logo */}
        <div className={styles.logoArea}>
          <div className={styles.logo}>⚡</div>
          <h1 className={styles.appNombre}>ITFlow</h1>
          <p className={styles.rolLabel}>{obtenerTextoRol(rol)}</p>
        </div>

        {/* Menú */}
        <nav className={styles.nav}>
          {menu.secciones.map((seccion, idx) => (
            <div key={idx} className={styles.seccion}>
              <div className={styles.seccionTitulo}>{seccion.titulo}</div>
              {seccion.items.map((item) => {
                const IconComponent = item.icono;
                return (
                  <Link key={item.ruta} href={item.ruta}>
                    <a
                      className={`${styles.navItem} ${
                        isActivo(item.ruta) ? styles.activo : ''
                      }`}
                    >
                      <IconComponent className={styles.icono} />
                      <span className={styles.label}>{item.label}</span>
                      {isActivo(item.ruta) && (
                        <FiChevronRight className={styles.indicador} />
                      )}
                    </a>
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Footer con usuario */}
        <div className={styles.footer}>
          <div className={styles.usuarioArea}>
            <div className={styles.avatar}>
              {usuarioDetalles?.nombre_completo?.charAt(0).toUpperCase()}
            </div>
            <div className={styles.usuarioInfo}>
              <p className={styles.usuarioNombre}>
                {usuarioDetalles?.nombre_completo}
              </p>
              <p className={styles.usuarioEmail}>{usuarioDetalles?.email}</p>
            </div>
            <button
              onClick={handleLogout}
              className={styles.btnLogout}
              title="Cerrar sesión"
            >
              <FiLogOut />
            </button>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <div className={styles.main}>
        <header className={styles.header}>
          <h2 className={styles.titulo}>{titulo || 'Dashboard'}</h2>
        </header>

        <main className={styles.contenido}>{children}</main>
      </div>
    </div>
  );
}
