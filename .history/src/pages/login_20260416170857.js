import { useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@context/AuthContext';
import styles from '@styles/Home.module.css';

export default function Login() {
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  const [esRegistro, setEsRegistro] = useState(false);

  const { login, registro } = useAuth();
  const router = useRouter();

  const manejarEnvio = async (e) => {
    e.preventDefault();
    setCargando(true);
    setError('');

    try {
      if (esRegistro) {
        await registro(email, pass);
        setEmail('');
        setPass('');
        setEsRegistro(false);
        setError('Verifica tu email para confirmar el registro');
      } else {
        await login(email, pass);
        router.push('/');
      }
    } catch (err) {
      setError(err.message || 'Ocurrió un error');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className={styles.mainContent}>
      <div className={styles.card}>
        <h1 className={styles.titulo}>
          {esRegistro ? 'Crear Cuenta' : 'Iniciar Sesión'}
        </h1>

        <form onSubmit={manejarEnvio} className={styles.formulario}>
          <div className={styles.grupo}>
            <label className={styles.etiqueta}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
              className={styles.entrada}
              required
            />
          </div>

          <div className={styles.grupo}>
            <label className={styles.etiqueta}>Contraseña</label>
            <input
              type="password"
              value={pass}
              onChange={(e) => setPass(e.target.value)}
              placeholder="••••••••"
              className={styles.entrada}
              required
            />
          </div>

          {error && <div className={styles.error}>{error}</div>}

          <button type="submit" className={styles.boton} disabled={cargando}>
            {cargando
              ? 'Procesando...'
              : esRegistro
                ? 'Registrarse'
                : 'Iniciar Sesión'}
          </button>
        </form>

        <div className={styles.enlace}>
          {esRegistro ? (
            <>
              ¿Ya tienes cuenta?{' '}
              <a onClick={() => setEsRegistro(false)}>Inicia sesión</a>
            </>
          ) : (
            <>
              ¿No tienes cuenta?{' '}
              <a onClick={() => setEsRegistro(true)}>Regístrate</a>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
