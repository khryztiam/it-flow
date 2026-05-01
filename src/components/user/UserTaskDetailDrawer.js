import { useEffect, useRef, useState } from 'react';
import { supabase } from '@lib/supabase';
import { formatearFecha } from '@utils/formateo';
import {
  FiExternalLink,
  FiFile,
  FiImage,
  FiRefreshCw,
  FiSend,
  FiTrash2,
  FiUpload,
  FiX,
} from 'react-icons/fi';
import styles from '@styles/UserTaskDetailDrawer.module.css';

export default function UserTaskDetailDrawer({
  tareaId,
  tareaInicial = null,
  abierto,
  onClose,
  onTaskUpdated,
}) {
  const [tarea, setTarea] = useState(tareaInicial);
  const [comentarios, setComentarios] = useState([]);
  const [evidencias, setEvidencias] = useState([]);
  const [estados, setEstados] = useState([]);
  const [nuevoEstado, setNuevoEstado] = useState('');
  const [nuevoAvance, setNuevoAvance] = useState(0);
  const [nuevoComentario, setNuevoComentario] = useState('');
  const [archivoSeleccionado, setArchivoSeleccionado] = useState(null);
  const [descripcionEvidencia, setDescripcionEvidencia] = useState('');
  const [cargando, setCargando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [subiendoEvidencia, setSubiendoEvidencia] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const inputFileRef = useRef(null);

  useEffect(() => {
    if (!abierto || !tareaId) return;

    setTarea(tareaInicial);
    setError('');
    setSuccess('');
    cargarDatos();
  }, [abierto, tareaId]);

  const obtenerToken = async () => {
    const { data, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !data?.session?.access_token) {
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

  const cargarDatos = async () => {
    try {
      setCargando(true);
      const [tareaData, estadosData, evidenciasData] = await Promise.all([
        callAPI(`/api/user/tareas/${tareaId}`),
        supabase.from('estados_tarea').select('id, nombre').order('nombre'),
        callAPI(`/api/user/tareas/${tareaId}/upload`),
      ]);

      setTarea(tareaData);
      setComentarios(tareaData?.comentarios || []);
      setNuevoEstado(tareaData?.estado_id || '');
      setNuevoAvance(tareaData?.porcentaje_avance || 0);
      setEstados(estadosData.data || []);
      setEvidencias(evidenciasData || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  };

  const actualizarTarea = async () => {
    try {
      setGuardando(true);
      setError('');

      await callAPI(`/api/user/tareas/${tareaId}`, 'PUT', {
        estado_id: nuevoEstado,
        porcentaje_avance: parseInt(nuevoAvance, 10) || 0,
      });

      setSuccess('Tarea actualizada');
      setTimeout(() => setSuccess(''), 2500);
      await cargarDatos();
      if (onTaskUpdated) onTaskUpdated();
    } catch (err) {
      setError(`Error al actualizar tarea: ${err.message}`);
    } finally {
      setGuardando(false);
    }
  };

  const agregarComentario = async () => {
    if (!nuevoComentario.trim()) return;

    try {
      setGuardando(true);
      setError('');
      const result = await callAPI(`/api/user/tareas/${tareaId}`, 'POST', {
        contenido: nuevoComentario,
      });

      setComentarios((prev) => [result.data, ...prev]);
      setNuevoComentario('');
      setSuccess('Comentario agregado');
      setTimeout(() => setSuccess(''), 2500);
    } catch (err) {
      setError(`Error al agregar comentario: ${err.message}`);
    } finally {
      setGuardando(false);
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
      setError('El archivo supera el limite de 10 MB.');
      return;
    }

    try {
      setSubiendoEvidencia(true);
      setError('');

      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const result = await callAPI(
            `/api/user/tareas/${tareaId}/upload`,
            'POST',
            {
              archivoBase64: event.target.result,
              tipoMime: archivoSeleccionado.type,
              nombreOriginal: archivoSeleccionado.name,
              descripcion: descripcionEvidencia,
            }
          );

          setEvidencias((prev) => [result.data, ...prev]);
          setArchivoSeleccionado(null);
          setDescripcionEvidencia('');
          if (inputFileRef.current) inputFileRef.current.value = '';
          setSuccess('Evidencia subida');
          setTimeout(() => setSuccess(''), 2500);
          if (onTaskUpdated) onTaskUpdated();
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
      await callAPI(`/api/user/tareas/${tareaId}/upload`, 'DELETE', {
        evidenciaId,
      });
      setEvidencias((prev) => prev.filter((ev) => ev.id !== evidenciaId));
      setSuccess('Evidencia eliminada');
      setTimeout(() => setSuccess(''), 2500);
      if (onTaskUpdated) onTaskUpdated();
    } catch (err) {
      setError(`Error al eliminar evidencia: ${err.message}`);
    }
  };

  const normalizarEtiqueta = (texto) => {
    if (!texto) return 'N/A';
    return texto.replaceAll('_', ' ').toUpperCase();
  };

  const obtenerFechaCalendario = (fecha) => {
    if (!fecha) return null;

    const fechaTexto = typeof fecha === 'string' ? fecha : '';
    const partesFecha = fechaTexto.match(/^(\d{4})-(\d{2})-(\d{2})/);

    if (partesFecha) {
      const [, anio, mes, dia] = partesFecha;
      return new Date(Number(anio), Number(mes) - 1, Number(dia));
    }

    const fechaDate = new Date(fecha);
    if (Number.isNaN(fechaDate.getTime())) return null;
    return new Date(
      fechaDate.getFullYear(),
      fechaDate.getMonth(),
      fechaDate.getDate()
    );
  };

  const obtenerDiasRestantes = (fechaLimite) => {
    const limite = obtenerFechaCalendario(fechaLimite);
    if (!limite) return null;

    const ahora = new Date();
    const hoy = new Date(
      ahora.getFullYear(),
      ahora.getMonth(),
      ahora.getDate()
    );

    return Math.round((limite - hoy) / (1000 * 60 * 60 * 24));
  };

  const esEstadoFinal = (nombreEstado) => {
    if (!nombreEstado) return false;
    return nombreEstado.toLowerCase().includes('complet');
  };

  const obtenerRiesgoTarea = () => {
    if (!tarea) return 'N/A';
    if (esEstadoFinal(tarea.estado?.nombre)) return 'Completada';

    const diasRestantes = obtenerDiasRestantes(tarea.fecha_limite);
    if (diasRestantes === null) return 'Sin fecha';
    if (diasRestantes < 0)
      return `Vencida hace ${Math.abs(diasRestantes)} dias`;
    if (diasRestantes === 0) return 'Ultimo dia';
    if (diasRestantes <= 3) return 'Por vencer';
    return 'En tiempo';
  };

  const nombreArchivo = (ev) =>
    ev.descripcion || ev.archivo_path?.split('_').pop() || 'Evidencia';

  if (!abierto) return null;

  return (
    <div className={styles.drawerOverlay}>
      <aside className={styles.drawer} aria-label="Detalle de tarea">
        <header className={styles.drawerHeader}>
          <div>
            <p className={styles.drawerEyebrow}>Detalle de tarea</p>
            <h2>{tarea?.titulo || tareaInicial?.titulo || 'Tarea'}</h2>
          </div>
          <div className={styles.drawerAcciones}>
            <button
              type="button"
              className={styles.drawerBtnPrimario}
              onClick={actualizarTarea}
              disabled={guardando || cargando || !tarea}
            >
              <FiRefreshCw />
              {guardando ? 'Guardando...' : 'Guardar cambios'}
            </button>
            <button
              type="button"
              className={styles.drawerBtnSecundario}
              onClick={onClose}
              aria-label="Cerrar detalle"
            >
              <FiX />
              Cerrar
            </button>
          </div>
        </header>

        <div className={styles.drawerBody}>
          {error && <div className={styles.alertaError}>{error}</div>}
          {success && <div className={styles.alertaOk}>{success}</div>}

          {cargando && !tarea ? (
            <div className={styles.estadoCarga}>Cargando detalle...</div>
          ) : (
            <div className={styles.drawerGrid}>
              <div className={styles.drawerColumna}>
                <section className={styles.drawerSeccion}>
                  <h3>Resumen</h3>
                  <div className={styles.drawerResumenGrid}>
                    <div>
                      <span>Prioridad</span>
                      <strong>
                        {normalizarEtiqueta(tarea?.prioridad?.nombre)}
                      </strong>
                    </div>
                    <div>
                      <span>Estado</span>
                      <strong>
                        {normalizarEtiqueta(tarea?.estado?.nombre)}
                      </strong>
                    </div>
                    <div>
                      <span>Planta</span>
                      <strong>{tarea?.planta?.nombre || 'N/A'}</strong>
                    </div>
                    <div>
                      <span>Pais</span>
                      <strong>{tarea?.planta?.pais?.nombre || 'N/A'}</strong>
                    </div>
                    <div>
                      <span>Fecha inicio</span>
                      <strong>{formatearFecha(tarea?.fecha_inicio)}</strong>
                    </div>
                    <div>
                      <span>Fecha limite</span>
                      <strong>{formatearFecha(tarea?.fecha_limite)}</strong>
                    </div>
                    <div>
                      <span>Progreso</span>
                      <strong>{tarea?.porcentaje_avance || 0}%</strong>
                    </div>
                    <div>
                      <span>Riesgo</span>
                      <strong>{obtenerRiesgoTarea()}</strong>
                    </div>
                  </div>
                </section>

                <section className={styles.drawerSeccion}>
                  <h3>Descripcion</h3>
                  <p className={styles.drawerDescripcion}>
                    {tarea?.descripcion || 'Sin descripcion registrada.'}
                  </p>
                </section>

                <section className={styles.drawerSeccion}>
                  <h3>Actualizar progreso</h3>
                  <div className={styles.campo}>
                    <label className={styles.label}>Estado</label>
                    <select
                      className={styles.select}
                      value={nuevoEstado}
                      onChange={(e) => setNuevoEstado(e.target.value)}
                    >
                      <option value="">Seleccionar estado...</option>
                      {estados.map((estado) => (
                        <option key={estado.id} value={estado.id}>
                          {normalizarEtiqueta(estado.nombre)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className={styles.campo}>
                    <label className={styles.label}>Progreso</label>
                    <div className={styles.progresoControl}>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        step="5"
                        value={nuevoAvance}
                        onChange={(e) => setNuevoAvance(e.target.value)}
                      />
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={nuevoAvance}
                        onChange={(e) => setNuevoAvance(e.target.value)}
                      />
                    </div>
                  </div>
                </section>
              </div>

              <div className={styles.drawerColumna}>
                <section className={styles.drawerSeccion}>
                  <div className={styles.drawerSeccionHeader}>
                    <h3>Comentarios</h3>
                    <span>{comentarios.length}</span>
                  </div>

                  {comentarios.length === 0 ? (
                    <p className={styles.textoSecundario}>
                      Sin comentarios registrados.
                    </p>
                  ) : (
                    <div className={styles.comentariosLista}>
                      {comentarios.map((comentario) => (
                        <div
                          key={comentario.id}
                          className={styles.comentarioItem}
                        >
                          <div className={styles.comentarioCabecera}>
                            <strong>
                              {comentario.usuario?.nombre_completo || 'Usuario'}
                            </strong>
                            <span>
                              {formatearFecha(
                                comentario.fecha_creacion ||
                                  comentario.created_at
                              )}
                            </span>
                          </div>
                          <p>{comentario.contenido || '-'}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className={styles.formComentario}>
                    <textarea
                      placeholder="Agregar comentario..."
                      value={nuevoComentario}
                      onChange={(e) => setNuevoComentario(e.target.value)}
                      className={styles.textarea}
                      maxLength={500}
                      disabled={guardando}
                    />
                    <div className={styles.pieFormulario}>
                      <span>{nuevoComentario.length}/500</span>
                      <button
                        type="button"
                        onClick={agregarComentario}
                        disabled={guardando || !nuevoComentario.trim()}
                        className={styles.btnEnviar}
                      >
                        <FiSend />
                        Enviar
                      </button>
                    </div>
                  </div>
                </section>

                <section className={styles.drawerSeccion}>
                  <div className={styles.drawerSeccionHeader}>
                    <h3>Evidencias</h3>
                    <span>{evidencias.length}</span>
                  </div>

                  <div className={styles.formEvidencia}>
                    <input
                      ref={inputFileRef}
                      type="file"
                      accept="image/jpeg,image/png,image/gif,image/webp,application/pdf"
                      onChange={(e) =>
                        setArchivoSeleccionado(e.target.files[0] || null)
                      }
                      className={styles.inputFile}
                      id={`input-evidencia-${tareaId}`}
                    />
                    <label
                      htmlFor={`input-evidencia-${tareaId}`}
                      className={styles.labelFile}
                    >
                      <FiUpload />
                      {archivoSeleccionado
                        ? archivoSeleccionado.name
                        : 'Seleccionar archivo'}
                    </label>
                    <input
                      type="text"
                      placeholder="Descripcion opcional"
                      value={descripcionEvidencia}
                      onChange={(e) => setDescripcionEvidencia(e.target.value)}
                      className={styles.inputDescripcion}
                      maxLength={200}
                    />
                    <button
                      type="button"
                      className={styles.btnSubir}
                      onClick={subirEvidencia}
                      disabled={!archivoSeleccionado || subiendoEvidencia}
                    >
                      <FiUpload />
                      {subiendoEvidencia ? 'Subiendo...' : 'Subir evidencia'}
                    </button>
                  </div>

                  {evidencias.length === 0 ? (
                    <p className={styles.textoSecundario}>
                      Sin evidencias subidas aun.
                    </p>
                  ) : (
                    <div className={styles.evidenciasLista}>
                      {evidencias.map((ev) => (
                        <div key={ev.id} className={styles.evidenciaItem}>
                          <span className={styles.evidenciaIcono}>
                            {ev.tipo_mime?.startsWith('image/') ? (
                              <FiImage />
                            ) : (
                              <FiFile />
                            )}
                          </span>
                          <div className={styles.evidenciaDatos}>
                            <span title={nombreArchivo(ev)}>
                              {nombreArchivo(ev)}
                            </span>
                            <small>
                              {formatearFecha(ev.fecha_subida)}
                              {ev.tamanio_bytes &&
                                ` · ${(ev.tamanio_bytes / 1024).toFixed(0)} KB`}
                            </small>
                          </div>
                          <div className={styles.evidenciaAcciones}>
                            <a
                              href={ev.archivo_url}
                              target="_blank"
                              rel="noreferrer"
                              className={styles.btnIcono}
                              title="Ver archivo"
                            >
                              <FiExternalLink />
                            </a>
                            <button
                              type="button"
                              className={`${styles.btnIcono} ${styles.btnEliminar}`}
                              onClick={() => eliminarEvidencia(ev.id)}
                              title="Eliminar evidencia"
                            >
                              <FiTrash2 />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              </div>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}
