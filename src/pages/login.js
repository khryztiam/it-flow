import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@context/AuthContext';
import styles from '@styles/Login.module.css';
import { FiUser, FiLock } from 'react-icons/fi';
import packageInfo from '../../package.json';

const DOMAIN = process.env.NEXT_PUBLIC_APP_DOMAIN || '@itflowapp.com';
const APP_VERSION = `v${packageInfo.version}`;

function LoginBrandMark() {
  return (
    <svg
      width="92"
      height="92"
      viewBox="0 0 92 92"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={styles.logoSvg}
    >
      <defs>
        <linearGradient
          id="loginBrandGradient"
          x1="20"
          y1="14"
          x2="76"
          y2="78"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#1E3A8A" />
          <stop offset="1" stopColor="#3B82F6" />
        </linearGradient>
      </defs>

      <rect x="2" y="2" width="88" height="88" rx="24" fill="#EEF2FF" />
      <rect
        x="18"
        y="20"
        width="10"
        height="52"
        rx="5"
        fill="url(#loginBrandGradient)"
      />
      <rect
        x="18"
        y="20"
        width="42"
        height="10"
        rx="5"
        fill="url(#loginBrandGradient)"
      />
      <rect
        x="40"
        y="20"
        width="10"
        height="52"
        rx="5"
        fill="url(#loginBrandGradient)"
      />
      <rect
        x="52"
        y="20"
        width="24"
        height="10"
        rx="5"
        fill="url(#loginBrandGradient)"
      />
      <rect
        x="52"
        y="39"
        width="20"
        height="10"
        rx="5"
        fill="url(#loginBrandGradient)"
      />
      <path
        d="M63 63L69.5 69.5L82 55"
        stroke="#22C55E"
        strokeWidth="7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function Login() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [pass, setPass] = useState('');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');

  const { login, usuarioDetalles, cargando: cargandoAuth } = useAuth();

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
    } catch (err) {
      setError(err.message || 'Usuario o contrasena incorrectos');
      setCargando(false);
    }
  };

  return (
    <div className={styles.contenedor}>
      <div className={styles.card}>
        <div className={styles.logoArea}>
          <div className={styles.logoBadge}>
            <LoginBrandMark />
          </div>
          <h1 className={styles.nombre}>
            <span className={styles.nombreIt}>IT</span>
            <span className={styles.nombreFlow}>Flow</span>
          </h1>
          <p className={styles.subtitulo}>Inicia sesion para continuar</p>
        </div>

        <form onSubmit={manejarEnvio} className={styles.formulario}>
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

          <div className={styles.grupo}>
            <div className={styles.inputConIcono}>
              <FiLock className={styles.icono} />
              <input
                type="password"
                value={pass}
                onChange={(e) => setPass(e.target.value)}
                placeholder="contrasena"
                className={styles.entrada}
                required
                disabled={cargando}
              />
            </div>
          </div>

          {error && (
            <div className={`${styles.mensaje} ${styles.error}`}>{error}</div>
          )}

          <button type="submit" className={styles.boton} disabled={cargando}>
            {cargando ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>

        <div className={styles.footer}>
          <p>ITFlow {APP_VERSION}</p>
        </div>
      </div>
    </div>
  );
}
