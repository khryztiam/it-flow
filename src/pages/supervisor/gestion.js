import Layout from '@components/Layout';
import { useSupervisor } from '@hooks/useProtegerRuta';
import { useAuth } from '@context/AuthContext';
import { supabase } from '@lib/supabase';
import { useEffect, useMemo, useState } from 'react';
import {
  FiCheckSquare,
  FiRefreshCcw,
  FiShare2,
  FiUsers,
  FiX,
} from 'react-icons/fi';
import styles from '@styles/GestionSupervisor.module.css';

export default function GestionSupervisor() {
  const { cargando: cargandoAuth } = useSupervisor();
  const { usuarioDetalles } = useAuth();
  const [usuarios, setUsuarios] = useState([]);
  const [plantas, setPlantas] = useState([]);
  const [asignaciones, setAsignaciones] = useState({});
  const [seleccionados, setSeleccionados] = useState(new Set());
  const [guardando, setGuardando] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!cargandoAuth) {
      cargarDatos();
    }
  }, [cargandoAuth]);

  const obtenerToken = async () => {
    const { data, error } = await supabase.auth.getSession();
    if (error || !data?.session?.access_token) {
      throw new Error('No autenticado');
    }
    return data.session.access_token;
  };

  const callAPI = async (url, method = 'GET', body = null) => {
    const token = await obtenerToken();
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: body ? JSON.stringify(body) : null,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || error.error || response.statusText);
    }

    return response.json();
  };

  const cargarDatos = async () => {
    try {
      setCargando(true);
      setError('');
      setSuccess('');

      const [usuariosRes, plantasRes] = await Promise.all([
        callAPI('/api/admin/usuarios'),
        callAPI('/api/admin/plantas'),
      ]);

      const usuariosOperativos = (usuariosRes.data || []).filter(
        (usuario) =>
          usuario.id !== usuarioDetalles?.id && usuario.rol?.nombre === 'user'
      );

      // Estado inicial: mapear supervisor_id para cada usuario
      const asignacionesIniciales = usuariosOperativos.reduce(
        (acc, usuario) => ({
          ...acc,
          [usuario.id]: usuario.supervisor_id || null,
        }),
        {}
      );

      setUsuarios(usuariosOperativos);
      setPlantas(plantasRes.data || []);
      setAsignaciones(asignacionesIniciales);
      setSeleccionados(new Set());
    } catch (err) {
      setError(`Error cargando gestion: ${err.message}`);
    } finally {
      setCargando(false);
    }
  };

  const plantasPorId = useMemo(
    () => new Map(plantas.map((planta) => [planta.id, planta])),
    [plantas]
  );

  // Usuarios sin asignar (no tienen supervisor)
  const usuariosSinAsignar = usuarios.filter((u) => !asignaciones[u.id]);

  // Usuarios asignados a este supervisor
  const usuariosAsignados = usuarios.filter(
    (u) => asignaciones[u.id] === usuarioDetalles?.id
  );

  // Toggle checkbox
  const toggleSeleccionar = (usuarioId) => {
    const nuevo = new Set(seleccionados);
    if (nuevo.has(usuarioId)) {
      nuevo.delete(usuarioId);
    } else {
      nuevo.add(usuarioId);
    }
    setSeleccionados(nuevo);
  };

  // Seleccionar todos los sin asignar
  const seleccionarTodosSinAsignar = () => {
    if (seleccionados.size === usuariosSinAsignar.length) {
      setSeleccionados(new Set());
    } else {
      setSeleccionados(new Set(usuariosSinAsignar.map((u) => u.id)));
    }
  };

  // Asignar masivo
  const asignarMasivo = async () => {
    if (seleccionados.size === 0) return;

    try {
      setGuardando('masivo');
      setError('');
      setSuccess('');

      const promesas = Array.from(seleccionados).map((usuarioId) =>
        callAPI(`/api/admin/usuarios/${usuarioId}`, 'PUT', {
          supervisor_id: usuarioDetalles?.id,
        })
      );

      const resultados = await Promise.all(promesas);

      // Actualizar estado local
      const nuevasAsignaciones = { ...asignaciones };
      resultados.forEach((result) => {
        nuevasAsignaciones[result.data.id] = result.data.supervisor_id;
      });

      setAsignaciones(nuevasAsignaciones);
      setSeleccionados(new Set());
      setSuccess(`${seleccionados.size} usuario(s) asignado(s) exitosamente`);
      setTimeout(() => setSuccess(''), 2500);
    } catch (err) {
      setError(`Error asignando masivo: ${err.message}`);
    } finally {
      setGuardando(null);
    }
  };

  // Asignar individual
  const asignarIndividual = async (usuarioId) => {
    try {
      setGuardando(usuarioId);
      setError('');

      const result = await callAPI(`/api/admin/usuarios/${usuarioId}`, 'PUT', {
        supervisor_id: usuarioDetalles?.id,
      });

      setAsignaciones((actuales) => ({
        ...actuales,
        [usuarioId]: result.data.supervisor_id,
      }));
      setSuccess('Usuario asignado exitosamente');
      setTimeout(() => setSuccess(''), 2500);
    } catch (err) {
      setError(`Error asignando: ${err.message}`);
    } finally {
      setGuardando(null);
    }
  };

  // Desasignar individual
  const desasignarUsuario = async (usuarioId) => {
    try {
      setGuardando(usuarioId);
      setError('');

      const result = await callAPI(`/api/admin/usuarios/${usuarioId}`, 'PUT', {
        supervisor_id: null,
      });

      setAsignaciones((actuales) => ({
        ...actuales,
        [usuarioId]: null,
      }));
      setSuccess('Usuario desasignado');
      setTimeout(() => setSuccess(''), 2500);
    } catch (err) {
      setError(`Error desasignando: ${err.message}`);
    } finally {
      setGuardando(null);
    }
  };

  if (cargandoAuth || cargando) {
    return <Layout titulo="Gestión de usuarios">Cargando...</Layout>;
  }

  return (
    <Layout titulo="Gestión de usuarios" ocultarHeader>
      <section className={styles.hero}>
        <div>
          <p className={styles.heroKicker}>ASIGNACIÓN DE USUARIOS</p>
          <h1 className={styles.heroTitulo}>Gestion de usuarios</h1>
          <p className={styles.heroSubtitulo}>
            Asigna usuarios operativos bajo tu supervisión. Solo ves usuarios
            sin asignar o los que ya tienes asignados.
          </p>
        </div>

        <div className={styles.heroHighlights}>
          <div className={styles.highlightBox}>
            <FiUsers />
            <div>
              <strong>{usuariosSinAsignar.length}</strong>
              <span>sin asignar</span>
            </div>
          </div>
          <div className={styles.highlightBox}>
            <FiCheckSquare />
            <div>
              <strong>{usuariosAsignados.length}</strong>
              <span>tus usuarios</span>
            </div>
          </div>
          <div className={styles.highlightBox}>
            <FiRefreshCcw />
            <div>
              <strong>{seleccionados.size}</strong>
              <span>seleccionados</span>
            </div>
          </div>
        </div>
      </section>

      {error && <div className={styles.error}>{error}</div>}
      {success && <div className={styles.success}>{success}</div>}

      {/* Usuarios Sin Asignar */}
      <section className={styles.panel}>
        <div className={styles.encabezado}>
          <div>
            <p className={styles.eyebrow}>Disponibles para reclamar</p>
            <h3>Usuarios sin supervisor</h3>
          </div>
          <button className={styles.botonSecundario} onClick={cargarDatos}>
            <FiRefreshCcw />
            Actualizar
          </button>
        </div>

        {usuariosSinAsignar.length === 0 ? (
          <div className={styles.vacio}>No hay usuarios disponibles.</div>
        ) : (
          <>
            <div className={styles.accionesGrupales}>
              <label className={styles.checkboxGrupal}>
                <input
                  type="checkbox"
                  checked={seleccionados.size === usuariosSinAsignar.length}
                  onChange={seleccionarTodosSinAsignar}
                />
                <span>Seleccionar todos ({usuariosSinAsignar.length})</span>
              </label>
              <button
                className={styles.botonPrimario}
                onClick={asignarMasivo}
                disabled={seleccionados.size === 0 || guardando === 'masivo'}
              >
                <FiShare2 />
                {guardando === 'masivo'
                  ? 'Asignando...'
                  : `Asignarme ${seleccionados.size > 0 ? `(${seleccionados.size})` : ''}`}
              </button>
            </div>

            <div className={styles.tabla}>
              {usuariosSinAsignar.map((usuario) => (
                <div key={usuario.id} className={styles.filaUsuario}>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                    <label className={styles.checkbox}>
                      <input
                        type="checkbox"
                        checked={seleccionados.has(usuario.id)}
                        onChange={() => toggleSeleccionar(usuario.id)}
                      />
                    </label>
                    <div className={styles.infoUsuario}>
                      <strong>{usuario.nombre_completo}</strong>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <span className={styles.badge}>{usuario.rol?.nombre}</span>
                    <span className={styles.planta}>
                      {usuario.planta?.nombre || 'Sin planta'}
                    </span>
                  </div>
                  <button
                    className={styles.botonAsignarIndividual}
                    onClick={() => asignarIndividual(usuario.id)}
                    disabled={guardando !== null}
                  >
                    {guardando === usuario.id ? 'Asignando...' : 'Asignarme'}
                  </button>
                </div>
              ))}
            </div>
          </>
        )}
      </section>

      {/* Usuarios Asignados */}
      {usuariosAsignados.length > 0 && (
        <section className={styles.panel}>
          <div className={styles.encabezado}>
            <div>
              <p className={styles.eyebrow}>Tu equipo</p>
              <h3>Usuarios bajo tu supervisión</h3>
            </div>
          </div>

          <div className={styles.tabla}>
            {usuariosAsignados.map((usuario) => (
              <div key={usuario.id} className={styles.filaUsuarioAsignado}>
                <div className={styles.infoUsuario}>
                  <strong>{usuario.nombre_completo}</strong>
                </div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <span className={styles.badge}>{usuario.rol?.nombre}</span>
                  <span className={styles.planta}>
                    {usuario.planta?.nombre || 'Sin planta'}
                  </span>
                </div>
                <button
                  className={styles.botonDesasignar}
                  onClick={() => desasignarUsuario(usuario.id)}
                  disabled={guardando === usuario.id}
                  title="Desasignar este usuario"
                >
                  <FiX />
                  {guardando === usuario.id ? 'Desasignando...' : 'Desasignar'}
                </button>
              </div>
            ))}
          </div>
        </section>
      )}
    </Layout>
  );
}
