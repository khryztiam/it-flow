import { useState } from 'react';
import { useAuth } from '@context/AuthContext';
import styles from '@styles/Login.module.css';
import { FiUser, FiLock } from 'react-icons/fi';

const DOMAIN = process.env.NEXT_PUBLIC_APP_DOMAIN || '@itflowapp.com';

export default function Login() {
  const [username, setUsername] = useState('');
  const [pass, setPass] = useState('');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');

  const { login } = useAuth();

  const manejarEnvio = async (e) => {
    e.preventDefault();
    setCargando(true);
    setError('');

    try {
      const email = username + DOMAIN;
      await login(email, pass);
      // El AuthContext redirigirá automáticamente tras login exitoso
    } catch (err) {
      setError(err.message || 'Usuario o contraseña incorrectos');
    } finally {
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
          <p className={styles.subtitulo}>
            {esRegistro ? 'Crear Cuenta' : 'Iniciar Sesión'}
          </p>
        </div>

        {/* Formulario */}
        <form onSubmit={manejarEnvio} className={styles.formulario}>
          {/* Campo Email */}
          <div className={styles.grupo}>
            <div className={styles.inputConIcono}>
              <FiMail className={styles.icono} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                className={styles.entrada}
                required
                disabled={cargando}
              />
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
            {esRegistro && <p className={styles.ayuda}>Mínimo 8 caracteres</p>}
          </div>

          {/* Mensaje de Error o Éxito */}
          {error && (
            <div
              className={`${styles.mensaje} ${
                error.includes('✅') ? styles.exito : styles.error
              }`}
            >
              {error}
            </div>
          )}

          {/* Botón Enviar */}
          <button type="submit" className={styles.boton} disabled={cargando}>
            {cargando
              ? 'Procesando...'
              : esRegistro
                ? 'Registrarse'
                : 'Ingresar'}
          </button>
        </form>

        {/* Toggle Registro/Login */}
        <div className={styles.toggle}>
          {esRegistro ? (
            <>
              <p>¿Ya tienes cuenta?</p>
              <button
                type="button"
                onClick={() => {
                  setEsRegistro(false);
                  setError('');
                  setEmail('');
                  setPass('');
                }}
                className={styles.enlace}
              >
                Inicia sesión
              </button>
            </>
          ) : (
            <>
              <p>¿No tienes cuenta?</p>
              <button
                type="button"
                onClick={() => {
                  setEsRegistro(true);
                  setError('');
                  setEmail('');
                  setPass('');
                }}
                className={styles.enlace}
              >
                Regístrate aquí
              </button>
            </>
          )}
        </div>

        {/* Footer */}
        <div className={styles.footer}>
          <p>ITFlow v1.0</p>
        </div>
      </div>
    </div>
  );
}
