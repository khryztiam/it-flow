import Layout from '@components/Layout';
import { useUser } from '@hooks/useProtegerRuta';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '@lib/supabase';
import { useAuth } from '@context/AuthContext';
import { formatearFecha } from '@utils/formateo';
import {
  FiArrowLeft,
  FiSend,
  FiUpload,
  FiTrash2,
  FiExternalLink,
  FiImage,
  FiFile,
} from 'react-icons/fi';
import styles from '@styles/TareaDetalle.module.css';

export default function TareaDetalle() {
  const { cargando: cargandoAuth } = useUser();
  const { usuarioDetalles } = useAuth();
  const router = useRouter();
  const { id } = router.query;

  const [tarea, setTarea] = useState(null);
  const [comentarios, setComentarios] = useState([]);
  const [estados, setEstados] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [nuevoComentario, setNuevoComentario] = useState('');
  const [nuevoEstado, setNuevoEstado] = useState('');
  const [nuevoAvance, setNuevoAvance] = useState('');

  // Evidencias
  const [evidencias, setEvidencias] = useState([]);
  const [subiendoEvidencia, setSubiendoEvidencia] = useState(false);
  const [archivoSeleccionado, setArchivoSeleccionado] = useState(null);
  const [descripcionEvidencia, setDescripcionEvidencia] = useState('');
  const inputFileRef = useRef(null);

  useEffect(() => {
    if (!cargandoAuth && usuarioDetalles?.id && id) {
      cargarEstados();
      cargarTarea();
      cargarEvidencias();
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

    const contentType = response.headers.get('content-type') || '';
    let payload = null;

    if (response.status !== 204) {
      if (contentType.includes('application/json')) {
        try {
          payload = await response.json();
        } catch {
          payload = null;
        }
      } else {
        const rawText = await response.text();
        payload = rawText ? { rawText } : null;
      }
    }

    if (!response.ok) {
      const detail =
        payload?.detail ||
        payload?.error ||
        payload?.message ||
        payload?.rawText ||
        response.statusText;

      if (
        response.status === 413 ||
        /request entity too large|body exceeded|too large/i.test(detail)
      ) {
        throw new Error(
          'El archivo es demasiado grande para el servidor. Intenta con una imagen mas liviana.'
        );
      }

      throw new Error(detail);
    }

    return payload;
  };

  const cargarEstados = async () => {
    try {
      const { data } = await supabase
        .from('estados_tarea')
        .select('id, nombre')
        .order('nombre');
      setEstados(data || []);
    } catch (err) {
      console.error('Error cargando estados:', err);
    }
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
      setError('');

      const result = await callAPI(`/api/user/tareas/${id}`, 'POST', {
        contenido: nuevoComentario,
      });

      setComentarios([...comentarios, result.data]);
      setNuevoComentario('');
      setSuccess('Comentario agregado exitosamente');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(`Error al agregar comentario: ${err.message}`);
    } finally {
      setGuardando(false);
    }
  };

  const cargarEvidencias = async () => {
    try {
      const data = await callAPI(`/api/user/tareas/${id}/upload`);
      setEvidencias(data || []);
    } catch (err) {
      console.error('Error cargando evidencias:', err);
    }
  };

  const subirEvidencia = async () => {
    if (!archivoSeleccionado) return;

    const tiposPermitidos = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf',
    ];
    if (!tiposPermitidos.includes(archivoSeleccionado.type)) {
      setError('Tipo de archivo no permitido. Usa JPG, PNG, GIF, WEBP o PDF.');
      return;
    }
    if (archivoSeleccionado.size > 10 * 1024 * 1024) {
      setError('El archivo supera el límite de 10 MB.');
      return;
    }

    try {
      setSubiendoEvidencia(true);
      setError('');

      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const result = await callAPI(
            `/api/user/tareas/${id}/upload`,
            'POST',
            {
              archivoBase64: e.target.result,
              tipoMime: archivoSeleccionado.type,
              nombreOriginal: archivoSeleccionado.name,
              descripcion: descripcionEvidencia,
            }
          );
          setEvidencias((prev) => [result.data, ...prev]);
          setArchivoSeleccionado(null);
          setDescripcionEvidencia('');
          if (inputFileRef.current) inputFileRef.current.value = '';
          setSuccess('Evidencia subida exitosamente');
          setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
          setError(`Error al subir evidencia: ${err.message}`);
        } finally {
          setSubiendoEvidencia(false);
        }
      };
      reader.readAsDataURL(archivoSeleccionado);
    } catch (err) {
      setError(`Error al subir evidencia: ${err.message}`);
      setSubiendoEvidencia(false);
    }
  };

  const eliminarEvidencia = async (evidenciaId) => {
    if (!confirm('¿Eliminar esta evidencia?')) return;
    try {
      setError('');
      await callAPI(`/api/user/tareas/${id}/upload`, 'DELETE', { evidenciaId });
      setEvidencias((prev) => prev.filter((e) => e.id !== evidenciaId));
      setSuccess('Evidencia eliminada');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(`Error al eliminar evidencia: ${err.message}`);
    }
  };

  const actualizarTarea = async () => {
    try {
      setGuardando(true);
      setError('');

      await callAPI(`/api/user/tareas/${id}`, 'PUT', {
        estado_id: nuevoEstado,
        porcentaje_avance: parseInt(nuevoAvance) || 0,
      });

      setSuccess('Tarea actualizada exitosamente');
      setTimeout(() => setSuccess(''), 3000);

      // Recargar tarea
      await cargarTarea();
    } catch (err) {
      setError(`Error al actualizar tarea: ${err.message}`);
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
        {error && <div className={styles.error}>{error}</div>}
        {success && <div className={styles.success}>{success}</div>}

        <button className={styles.btnVolver} onClick={() => router.back()}>
          <FiArrowLeft /> Volver
        </button>

        <div className={styles.principal}>
          {/* COLUMNA IZQUIERDA: Información y Controles */}
          <div
            style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}
          >
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
                    <option value="">Seleccionar estado...</option>
                    {estados.map((est) => (
                      <option key={est.id} value={est.id}>
                        {est.nombre}
                      </option>
                    ))}
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
                  <span
                    className={styles[`estado-${tarea.estado?.nombre || ''}`]}
                  >
                    {tarea.estado?.nombre || '-'}
                  </span>
                </div>
                <div className={styles.item}>
                  <label>Avance Actual</label>
                  <span>{tarea.porcentaje_avance || 0}%</span>
                </div>
                <div className={styles.item}>
                  <label>Días de Retraso</label>
                  <span
                    className={tarea.dias_retraso > 0 ? styles.retraso : ''}
                  >
                    {tarea.dias_retraso || 0} días
                  </span>
                </div>
              </div>
            </section>
          </div>

          {/* COLUMNA DERECHA: Comentarios */}
          <aside className={styles.comentarios}>
            <h3>💬 Comentarios</h3>

            <div className={styles.listaComentarios}>
              {comentarios.length === 0 ? (
                <p className={styles.sinComentarios}>Sin comentarios aún</p>
              ) : (
                comentarios.map((com) => (
                  <div key={com.id} className={styles.comentario}>
                    <strong>{com.usuario?.nombre_completo}</strong>
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
            {/* Evidencias */}
            <div className={styles.separadorLateral} />
            <h3>📎 Evidencias</h3>

            <div className={styles.formEvidencia}>
              <div className={styles.inputFileWrapper}>
                <input
                  ref={inputFileRef}
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp,application/pdf"
                  onChange={(e) =>
                    setArchivoSeleccionado(e.target.files[0] || null)
                  }
                  className={styles.inputFile}
                  id="inputEvidencia"
                />
                <label htmlFor="inputEvidencia" className={styles.labelFile}>
                  <FiUpload />
                  {archivoSeleccionado
                    ? archivoSeleccionado.name
                    : 'Seleccionar archivo (JPG, PNG, PDF — máx. 10 MB)'}
                </label>
              </div>

              <input
                type="text"
                placeholder="Descripción opcional (ej: Captura de instalación)"
                value={descripcionEvidencia}
                onChange={(e) => setDescripcionEvidencia(e.target.value)}
                className={styles.inputDescripcion}
                maxLength={200}
              />

              <button
                className={styles.btnSubir}
                onClick={subirEvidencia}
                disabled={!archivoSeleccionado || subiendoEvidencia}
              >
                {subiendoEvidencia ? (
                  'Subiendo...'
                ) : (
                  <>
                    <FiUpload /> Subir evidencia
                  </>
                )}
              </button>
            </div>

            {evidencias.length === 0 ? (
              <p className={styles.sinEvidencias}>
                Sin evidencias cargadas aún
              </p>
            ) : (
              <div className={styles.listaEvidencias}>
                {evidencias.map((ev) => (
                  <div key={ev.id} className={styles.evidenciaItem}>
                    <div className={styles.evidenciaIcono}>
                      {ev.tipo_mime?.startsWith('image/') ? (
                        <FiImage size={20} />
                      ) : (
                        <FiFile size={20} />
                      )}
                    </div>
                    <div className={styles.evidenciaDatos}>
                      <span className={styles.evidenciaNombre}>
                        {ev.descripcion || ev.archivo_path.split('_').pop()}
                      </span>
                      <span className={styles.evidenciaFecha}>
                        {formatearFecha(ev.fecha_subida)}
                        {ev.tamanio_bytes &&
                          ` · ${(ev.tamanio_bytes / 1024).toFixed(0)} KB`}
                      </span>
                    </div>
                    <div className={styles.evidenciaAcciones}>
                      <a
                        href={ev.archivo_url}
                        target="_blank"
                        rel="noreferrer"
                        className={styles.btnVerEvidencia}
                        title="Ver archivo"
                      >
                        <FiExternalLink size={15} />
                      </a>
                      <button
                        className={styles.btnEliminarEvidencia}
                        onClick={() => eliminarEvidencia(ev.id)}
                        title="Eliminar evidencia"
                      >
                        <FiTrash2 size={15} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </aside>
        </div>
      </div>
    </Layout>
  );
}
