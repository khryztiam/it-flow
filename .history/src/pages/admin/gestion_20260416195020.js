import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Layout from '@components/Layout';
import TablaGenerica from '@components/TablaGenerica';
import Modal from '@components/Modal';
import FormularioMulti from '@components/FormularioMulti';
import { useAdmin } from '@hooks/useProtegerRuta';
import { supabase } from '@lib/supabaseClient';
import { formatearFechaHora, obtenerTextoPrioridad } from '@utils/formateo';
import styles from '@styles/GestionAdmin.module.css';

const MAPEO_ROLES = {
  admin: 'Administrador',
  supervisor: 'Supervisor',
  user: 'Usuario',
};

export default function GestionAdmin() {
  const router = useRouter();
  const { cargando: cargandoAuth } = useAdmin();

  const [cargando, setCargando] = useState(true);

  // Estados para datos
  const [paises, setPaises] = useState([]);
  const [plantas, setPlantas] = useState([]);
  const [usuarios, setUsuarios] = useState([]);

  // Modal y formulario
  const [modalAbierta, setModalAbierta] = useState(false);
  const [modoFormulario, setModoFormulario] = useState('crear');
  const [tipoFormulario, setTipoFormulario] = useState('usuarios');
  const [registroSeleccionado, setRegistroSeleccionado] = useState(null);
  const [error, setError] = useState('');
  const [cargandoFormulario, setCargandoFormulario] = useState(false);

  // Valores del formulario
  const [valores, setValores] = useState({});

  // Cargar datos al montar
  useEffect(() => {
    if (!cargandoAuth) {
      cargarDatos();
    }
  }, [cargandoAuth]);

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

    return response.json();
  };

  const cargarDatos = async () => {
    try {
      setCargando(true);
      setError('');

      // Cargar datos desde APIs
      const [paisesRes, plantasRes, usuariosRes] = await Promise.all([
        callAPI('/api/admin/paises'),
        callAPI('/api/admin/plantas'),
        callAPI('/api/admin/usuarios'),
      ]);

      setPaises(paisesRes.data || []);
      setPlantas(plantasRes.data || []);
      setUsuarios(usuariosRes.data || []);
    } catch (err) {
      setError(err.message || 'Error cargando datos');
    } finally {
      setCargando(false);
    }
  };

  const handleNuevo = (tipo = 'usuarios') => {
    setTipoFormulario(tipo);
    setModoFormulario('crear');
    setRegistroSeleccionado(null);
    setValores({});
    setError('');
    setModalAbierta(true);
  };

  const handleEditar = (registro, tipo = 'usuarios') => {
    setTipoFormulario(tipo);
    setModoFormulario('editar');
    setRegistroSeleccionado(registro);
    setValores(registro);
    setError('');
    setModalAbierta(true);
  };

  const handleCambioFormulario = (field, value) => {
    setValores({ ...valores, [field]: value });
  };

  const handleEliminar = async (registro, tipo = 'usuarios') => {
    if (!confirm(`¿Eliminar ${tipo.slice(0, -1).toLowerCase()}?`)) return;

    try {
      setCargandoFormulario(true);
      setError('');

      const endpoint =
        tipo === 'usuarios'
          ? `/api/admin/usuarios/${registro.id}`
          : tipo === 'plantas'
            ? `/api/admin/plantas/${registro.id}`
            : `/api/admin/paises/${registro.id}`;

      await callAPI(endpoint, 'DELETE');
      cargarDatos();
    } catch (err) {
      setError(err.message || 'Error eliminando registro');
    } finally {
      setCargandoFormulario(false);
    }
  };

  const handleGuardar = async () => {
    try {
      setCargandoFormulario(true);
      setError('');

      if (tipoFormulario === 'paises') {
        if (modoFormulario === 'crear') {
          await callAPI('/api/admin/paises', 'POST', {
            nombre: valores.nombre,
          });
        } else {
          await callAPI(`/api/admin/paises/${valores.id}`, 'PUT', {
            nombre: valores.nombre,
          });
        }
      } else if (tipoFormulario === 'plantas') {
        if (modoFormulario === 'crear') {
          await callAPI('/api/admin/plantas', 'POST', {
            nombre: valores.nombre,
            pais_id: valores.pais_id,
          });
        } else {
          await callAPI(`/api/admin/plantas/${valores.id}`, 'PUT', {
            nombre: valores.nombre,
            pais_id: valores.pais_id,
          });
        }
      } else if (tipoFormulario === 'usuarios') {
        if (modoFormulario === 'crear') {
          const dominio =
            process.env.NEXT_PUBLIC_APP_DOMAIN || '@itflowapp.com';
          const email = `${valores.username}${dominio}`;

          await callAPI('/api/admin/usuarios', 'POST', {
            email,
            nombre_completo: valores.nombre_completo,
            username: valores.username,
            planta_id: valores.planta_id,
            rol_id: valores.rol_id,
          });
        } else {
          await callAPI(`/api/admin/usuarios/${valores.id}`, 'PUT', {
            nombre_completo: valores.nombre_completo,
            username: valores.username,
            planta_id: valores.planta_id,
            rol_id: valores.rol_id,
            estado: valores.estado,
          });
        }
      }

      setModalAbierta(false);
      cargarDatos();
    } catch (err) {
      setError(err.message || 'Error guardando datos');
    } finally {
      setCargandoFormulario(false);
    }
  };

  if (cargandoAuth) {
    return <div>Cargando...</div>;
  }

  return (
    <Layout titulo="Gestión de Configuración">
      {error && <div className={styles.errorGlobal}>{error}</div>}

      <div className={styles.contenido}>
        {/* MAIN - Usuarios */}
        <div className={styles.main}>
          <div className={styles.encabezado}>
            <h3>👥 Usuarios</h3>
            <button
              onClick={() => handleNuevo('usuarios')}
              className={styles.btnNuevo}
            >
              + Agregar Usuario
            </button>
          </div>

          <TablaGenerica
            columnas={[
              { key: 'email', label: 'Email' },
              { key: 'nombre_completo', label: 'Nombre' },
              {
                key: 'rol_id',
                label: 'Rol',
                render: (v) => MAPEO_ROLES[v] || '-',
              },
              {
                key: 'planta_id',
                label: 'Planta',
                render: (v) => {
                  const planta = plantas.find((p) => p.id === v);
                  return planta?.nombre || '-';
                },
              },
              { key: 'estado', label: 'Estado' },
            ]}
            datos={usuarios}
            acciones={[
              {
                label: '✏️',
                onClick: (registro) => handleEditar(registro, 'usuarios'),
                color: 'warning',
              },
            ]}
            cargando={cargando}
          />
        </div>

        {/* SIDEBAR */}
        <div className={styles.sidebar}>
          {/* Plantas */}
          <div className={styles.seccion}>
            <h4 className={styles.seccionTitulo}>
              🏭 Plantas ({plantas.length})
            </h4>
            <div className={styles.seccionContenido}>
              {plantas.length === 0 ? (
                <p
                  style={{
                    color: '#999',
                    fontSize: '12px',
                    gridColumn: '1/-1',
                  }}
                >
                  No hay plantas
                </p>
              ) : (
                plantas.map((planta) => (
                  <div
                    key={planta.id}
                    className={styles.itemSidebar}
                    onClick={() => handleEditar(planta, 'plantas')}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontWeight: 600,
                          color: '#1e293b',
                          fontSize: '12px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {planta.nombre}
                      </div>
                      <div
                        style={{
                          fontSize: '10px',
                          color: '#94a3b8',
                        }}
                      >
                        {planta.pais?.nombre || '-'}
                      </div>
                    </div>
                    <button
                      className={styles.btnEditar}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditar(planta, 'plantas');
                      }}
                      title="Editar"
                      style={{ alignSelf: 'flex-end', marginTop: '2px' }}
                    >
                      ✏️
                    </button>
                  </div>
                ))
              )}
            </div>
            <button
              className={styles.btnAgregarSidebar}
              onClick={() => handleNuevo('plantas')}
            >
              + Agregar Planta
            </button>
          </div>

          {/* Países */}
          <div className={styles.seccion}>
            <h4 className={styles.seccionTitulo}>
              🌍 Países ({paises.length})
            </h4>
            <div className={styles.seccionContenido}>
              {paises.length === 0 ? (
                <p
                  style={{
                    color: '#999',
                    fontSize: '12px',
                    gridColumn: '1/-1',
                  }}
                >
                  No hay países
                </p>
              ) : (
                paises.map((pais) => (
                  <div
                    key={pais.id}
                    className={styles.itemSidebar}
                    onClick={() => handleEditar(pais, 'paises')}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontWeight: 600,
                          color: '#1e293b',
                          fontSize: '12px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {pais.nombre}
                      </div>
                    </div>
                    <button
                      className={styles.btnEditar}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditar(pais, 'paises');
                      }}
                      title="Editar"
                      style={{ alignSelf: 'flex-end' }}
                    >
                      ✏️
                    </button>
                  </div>
                ))
              )}
            </div>
            <button
              className={styles.btnAgregarSidebar}
              onClick={() => handleNuevo('paises')}
            >
              + Agregar País
            </button>
          </div>
        </div>
      </div>

      {/* Modal y Formulario */}
      <Modal
        abierto={modalAbierta}
        onCerrar={() => setModalAbierta(false)}
        titulo={
          modoFormulario === 'crear'
            ? `Crear ${
                tipoFormulario === 'paises'
                  ? 'País'
                  : tipoFormulario === 'plantas'
                    ? 'Planta'
                    : 'Usuario'
              }`
            : `Editar ${
                tipoFormulario === 'paises'
                  ? 'País'
                  : tipoFormulario === 'plantas'
                    ? 'Planta'
                    : 'Usuario'
              }`
        }
        onAceptar={handleGuardar}
        cargando={cargandoFormulario}
        modo={modoFormulario}
      >
        <FormularioMulti
          modo={modoFormulario}
          campos={
            tipoFormulario === 'paises'
              ? [
                  {
                    name: 'nombre',
                    label: 'Nombre del País',
                    type: 'text',
                    required: true,
                    placeholder: 'Ej: Colombia',
                  },
                ]
              : tipoFormulario === 'plantas'
                ? [
                    {
                      name: 'nombre',
                      label: 'Nombre de la Planta',
                      type: 'text',
                      required: true,
                      placeholder: 'Ej: Planta Bogotá',
                    },
                    {
                      name: 'pais_id',
                      label: 'País',
                      type: 'select',
                      required: true,
                      options: paises.map((p) => ({
                        id: p.id,
                        label: p.nombre,
                      })),
                    },
                  ]
                : [
                    {
                      name: 'nombre_completo',
                      label: 'Nombre Completo',
                      type: 'text',
                      required: true,
                      placeholder: 'Ej: Juan Pérez',
                      disabled: modoFormulario === 'editar',
                    },
                    {
                      name: 'username',
                      label: 'Usuario (Email)',
                      type: 'text',
                      required: true,
                      placeholder: 'Ej: juan.perez',
                      disabled: modoFormulario === 'editar',
                      ayuda: 'Parte del email antes de @itflowapp.com',
                      mostrarEn: ['crear'],
                    },
                    {
                      name: 'email',
                      label: 'Email',
                      type: 'email',
                      disabled: true,
                      ayuda: 'Se genera automáticamente a partir del usuario',
                      mostrarEn: ['editar', 'ver'],
                    },
                    {
                      name: 'rol_id',
                      label: 'Rol',
                      type: 'select',
                      required: true,
                      options: [
                        { id: 'admin', label: 'Administrador' },
                        { id: 'supervisor', label: 'Supervisor' },
                        { id: 'user', label: 'Usuario' },
                      ],
                    },
                    {
                      name: 'planta_id',
                      label: 'Planta Asignada',
                      type: 'select',
                      required: true,
                      options: plantas.map((p) => ({
                        id: p.id,
                        label: p.nombre,
                      })),
                    },
                    {
                      name: 'estado',
                      label: 'Estado',
                      type: 'select',
                      options: [
                        { id: 'activo', label: 'Activo' },
                        { id: 'inactivo', label: 'Inactivo' },
                      ],
                      mostrarEn: ['editar'],
                    },
                  ]
          }
          valores={valores}
          onCambio={handleCambioFormulario}
          cargando={cargandoFormulario}
          error={error}
        />
      </Modal>
    </Layout>
  );
}
