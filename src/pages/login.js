import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@context/AuthContext';
import styles from '@styles/Login.module.css';
import { FiUser, FiLock } from 'react-icons/fi';

const DOMAIN = process.env.NEXT_PUBLIC_APP_DOMAIN || '@itflowapp.com';

export default function Login() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [pass, setPass] = useState('');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');

  const { login, usuarioDetalles, cargando: cargandoAuth } = useAuth();

  // Redirect cuando los detalles estén cargados y login exitoso
  useEffect(() => {
    if (usuarioDetalles && !cargandoAuth) {
      const rol = usuarioDetalles?.rol?.nombre;
      if (rol === 'admin') {
        router.push('/admin/dashboard');
      } else if (rol === 'supervisor') {
        router.push('/supervisor/dashboard');
      } else {
        router.push('/user/dashboard');
      }
    }
  }, [usuarioDetalles, cargandoAuth, router]);

  const manejarEnvio = async (e) => {
    e.preventDefault();
    setCargando(true);
    setError('');

    try {
      const email = username + DOMAIN;
      await login(email, pass);
      // El useEffect detectará cambios en usuarioDetalles y redirigirá
    } catch (err) {
      setError(err.message || 'Usuario o contraseña incorrectos');
      setCargando(false);
    }
  };

  return (
    <div className={styles.contenedor}>
      <div className={styles.card}>
        {/* Logo/Icono */}
        <div className={styles.logoArea}>
          <div className={styles.logo}>⚡</div>
          <h1 className={styles.nombre}>ITFlow</h1>
          <p className={styles.subtitulo}>Iniciar Sesión</p>
        </div>

        {/* Formulario */}
        <form onSubmit={manejarEnvio} className={styles.formulario}>
          {/* Campo Usuario */}
          <div className={styles.grupo}>
            <div className={styles.inputConIcono}>
              <FiUser className={styles.icono} />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="usuario"
                className={styles.entrada}
                required
                disabled={cargando}
              />
              <span className={styles.dominio}>{DOMAIN}</span>
            </div>
          </div>

          {/* Campo Contraseña */}
          <div className={styles.grupo}>
            <div className={styles.inputConIcono}>
              <FiLock className={styles.icono} />
              <input
                type="password"
                value={pass}
                onChange={(e) => setPass(e.target.value)}
                placeholder="••••••••"
                className={styles.entrada}
                required
                disabled={cargando}
              />
            </div>
          </div>

          {/* Mensaje de Error */}
          {error && (
            <div className={`${styles.mensaje} ${styles.error}`}>{error}</div>
          )}

          {/* Botón Enviar */}
          <button type="submit" className={styles.boton} disabled={cargando}>
            {cargando ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>
        {/* Footer */}
        <div className={styles.footer}>
          <p>ITFlow v1.0</p>
        </div>
      </div>
    </div>
  );
}
