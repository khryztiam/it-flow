import Layout from '@components/Layout';
import { useUser } from '@hooks/useProtegerRuta';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '@lib/supabase';
import { useAuth } from '@context/AuthContext';
import { formatearFecha } from '@utils/formateo';
import { FiArrowLeft, FiSend } from 'react-icons/fi';
import styles from '@styles/TareaDetalle.module.css';

export default function TareaDetalle() {
  const { cargando: cargandoAuth } = useUser();
  const { usuarioDetalles } = useAuth();
  const router = useRouter();
  const { id } = router.query;

  const [tarea, setTarea] = useState(null);
  const [comentarios, setComentarios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [nuevoComentario, setNuevoComentario] = useState('');
  const [nuevoEstado, setNuevoEstado] = useState('');
  const [nuevoAvance, setNuevoAvance] = useState('');

  useEffect(() => {
    if (!cargandoAuth && usuarioDetalles?.id && id) {
      cargarTarea();
    }
  }, [cargandoAuth, usuarioDetalles?.id, id]);

  // Obtener token del usuario actual
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

    if (response.status === 204) return null;
    return response.json();
  };

  const cargarTarea = async () => {
    try {
      setCargando(true);
      setError('');
      const tareaData = await callAPI(`/api/user/tareas/${id}`);

      if (!tareaData) {
        router.push('/user/tareas');
        return;
      }

      setTarea(tareaData);
      setComentarios(tareaData.comentarios || []);
      setNuevoEstado(tareaData.estado_id || '');
      setNuevoAvance(tareaData.porcentaje_avance || 0);
    } catch (err) {
      setError(err.message);
      console.error('Error cargando tarea:', err);
    } finally {
      setCargando(false);
    }
  };

  const agregarComentario = async () => {
    if (!nuevoComentario.trim()) return;

    try {
      setGuardando(true);
      const { error: err } = await supabase.from('comentarios_tarea').insert({
        tarea_id: id,
        autor_id: usuarioDetalles.id,
        contenido: nuevoComentario,
        fecha_creacion: new Date().toISOString(),
      });

      if (err) throw err;
      setNuevoComentario('');
      await cargarComentarios();
    } catch (err) {
      console.error('Error agregando comentario:', err);
      alert('Error al agregar comentario');
    } finally {
      setGuardando(false);
    }
  };

  const actualizarTarea = async () => {
    try {
      setGuardando(true);
      const { error: err } = await supabase
        .from('tareas')
        .update({
          estado: nuevoEstado,
          porcentaje_avance: parseInt(nuevoAvance) || 0,
          fecha_cierre:
            nuevoEstado === 'completado' ? new Date().toISOString() : null,
        })
        .eq('id', id);

      if (err) throw err;
      await cargarTarea();
      alert('Tarea actualizada correctamente');
    } catch (err) {
      console.error('Error actualizando tarea:', err);
      alert('Error al actualizar tarea');
    } finally {
      setGuardando(false);
    }
  };

  if (cargandoAuth || cargando) {
    return (
      <Layout titulo="Detalle de Tarea">
        <div style={{ padding: '2rem', textAlign: 'center' }}>Cargando...</div>
      </Layout>
    );
  }

  if (!tarea) {
    return (
      <Layout titulo="Detalle de Tarea">
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          Tarea no encontrada
        </div>
      </Layout>
    );
  }

  return (
    <Layout titulo="Detalle de Tarea">
      <div className={styles.contenedor}>
        <button className={styles.btnVolver} onClick={() => router.back()}>
          <FiArrowLeft /> Volver
        </button>

        <div className={styles.principal}>
          {/* Información Principal */}
          <section className={styles.seccion}>
            <h2>{tarea.titulo}</h2>
            <p className={styles.descripcion}>{tarea.descripcion}</p>

            <div className={styles.gridInfo}>
              <div className={styles.item}>
                <label>Prioridad</label>
                <span
                  className={styles[`prioridad-${tarea.prioridad?.nombre}`]}
                >
                  {tarea.prioridad?.nombre || '-'}
                </span>
              </div>
              <div className={styles.item}>
                <label>Planta</label>
                <span>{tarea.planta?.nombre || '-'}</span>
              </div>
              <div className={styles.item}>
                <label>País</label>
                <span>{tarea.planta?.pais?.nombre || '-'}</span>
              </div>
              <div className={styles.item}>
                <label>Creado Por</label>
                <span>{tarea.creado_por_user?.nombre_completo || '-'}</span>
              </div>
              <div className={styles.item}>
                <label>Fecha Inicio</label>
                <span>{formatearFecha(tarea.fecha_inicio)}</span>
              </div>
              <div className={styles.item}>
                <label>Fecha Límite</label>
                <span
                  className={
                    new Date(tarea.fecha_limite) < new Date()
                      ? styles.vencido
                      : ''
                  }
                >
                  {formatearFecha(tarea.fecha_limite)}
                </span>
              </div>
            </div>
          </section>

          {/* Actualización de Estado y Avance */}
          <section className={styles.seccion}>
            <h3>Actualizar Progreso</h3>
            <div className={styles.controles}>
              <div className={styles.grupo}>
                <label>Estado</label>
                <select
                  value={nuevoEstado}
                  onChange={(e) => setNuevoEstado(e.target.value)}
                  className={styles.select}
                >
                  <option value="pending">⏳ Pendiente</option>
                  <option value="en_proceso">⚙️ En Proceso</option>
                  <option value="en_revision">👀 En Revisión</option>
                  <option value="completado">✅ Completado</option>
                  <option value="detenido">❌ Detenido</option>
                </select>
              </div>

              <div className={styles.grupo}>
                <label>Porcentaje de Avance: {nuevoAvance}%</label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={nuevoAvance}
                  onChange={(e) => setNuevoAvance(e.target.value)}
                  className={styles.slider}
                />
              </div>

              <button
                className={styles.btnGuardar}
                onClick={actualizarTarea}
                disabled={guardando}
              >
                {guardando ? 'Guardando...' : '💾 Guardar Cambios'}
              </button>
            </div>
          </section>

          {/* Información Adicional */}
          <section className={styles.seccion}>
            <div className={styles.gridInfo}>
              <div className={styles.item}>
                <label>Estado Actual</label>
                <span className={styles[`estado-${tarea.estado}`]}>
                  {tarea.estado}
                </span>
              </div>
              <div className={styles.item}>
                <label>Avance Actual</label>
                <span>{tarea.porcentaje_avance || 0}%</span>
              </div>
              <div className={styles.item}>
                <label>Días de Retraso</label>
                <span className={tarea.dias_retraso > 0 ? styles.retraso : ''}>
                  {tarea.dias_retraso || 0} días
                </span>
              </div>
            </div>
          </section>
        </div>

        {/* Sidebar de Comentarios */}
        <aside className={styles.comentarios}>
          <h3>💬 Comentarios</h3>

          <div className={styles.listaComentarios}>
            {comentarios.length === 0 ? (
              <p className={styles.sinComentarios}>Sin comentarios aún</p>
            ) : (
              comentarios.map((com) => (
                <div key={com.id} className={styles.comentario}>
                  <strong>{com.autor?.nombre_completo}</strong>
                  <span className={styles.fecha}>
                    {formatearFecha(com.fecha_creacion)}
                  </span>
                  <p>{com.contenido}</p>
                </div>
              ))
            )}
          </div>

          <div className={styles.formComentario}>
            <textarea
              placeholder="Agregar comentario..."
              value={nuevoComentario}
              onChange={(e) => setNuevoComentario(e.target.value)}
              className={styles.textarea}
              maxLength={500}
            />
            <div className={styles.pieFormulario}>
              <span className={styles.contador}>
                {nuevoComentario.length}/500
              </span>
              <button
                onClick={agregarComentario}
                disabled={guardando || !nuevoComentario.trim()}
                className={styles.btnEnviar}
              >
                <FiSend /> Enviar
              </button>
            </div>
          </div>
        </aside>
      </div>
    </Layout>
  );
}
