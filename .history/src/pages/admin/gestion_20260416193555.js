import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Layout from '@components/Layout';
import TablaGenerica from '@components/TablaGenerica';
import Modal from '@components/Modal';
import FormularioMulti from '@components/FormularioMulti';
import { useAdmin } from '@hooks/useProtegerRuta';
import {
  obtenerPaises,
  obtenerPlantasPorPais,
  obtenerTodasLasPlantas,
  obtenerUsuariosPorPlanta,
  supabase,
} from '@lib/supabaseClient';
import { formatearFechaHora, obtenerTextoPrioridad } from '@utils/formateo';
import styles from '@styles/GestionAdmin.module.css';

const MAPEO_ROLES = {
  admin: 'Administrador',
  supervisor: 'Supervisor',
  user: 'Usuario',
};

const MAPEO_BANDERAS = {
  colombia: '🇨🇴',
  argentina: '🇦🇷',
  perú: '🇵🇪',
  méxico: '🇲🇽',
  chile: '🇨🇱',
  brasil: '🇧🇷',
  españa: '🇪🇸',
  el salvador: '🇸🇻',
  nicaragua: '🇳🇮',
  honduras: '🇭🇳',
  guatemala: '🇬🇹',
  costa rica: '🇨🇷',
  panamá: '🇵🇦',
  venezuela: '🇻🇪',
  ecuador: '🇪🇨',
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

  const cargarDatos = async () => {
    try {
      setCargando(true);
      setError('');

      // Cargar SIEMPRE los 3 tipos de datos en paralelo
      const [paisesData, plantasData, usuariosResponse] = await Promise.all([
        obtenerPaises(),
        obtenerTodasLasPlantas(),
        supabase
          .from('usuarios')
          .select('id, email, nombre_completo, estado, rol_id, planta_id')
          .order('nombre_completo', { ascending: true }),
      ]);

      setPaises(paisesData);
      setPlantas(plantasData);

      if (usuariosResponse.error) throw usuariosResponse.error;
      setUsuarios(usuariosResponse.data || []);
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

  const handleGuardar = async () => {
    try {
      setCargandoFormulario(true);
      setError('');

      if (tipoFormulario === 'paises') {
        if (modoFormulario === 'crear') {
          const { error: err } = await supabase
            .from('paises')
            .insert([{ nombre: valores.nombre }]);
          if (err) throw err;
        } else {
          const { error: err } = await supabase
            .from('paises')
            .update({ nombre: valores.nombre })
            .eq('id', valores.id);
          if (err) throw err;
        }
      } else if (tipoFormulario === 'plantas') {
        if (modoFormulario === 'crear') {
          const { error: err } = await supabase.from('plantas').insert([
            {
              nombre: valores.nombre,
              pais_id: valores.pais_id,
            },
          ]);
          if (err) throw err;
        } else {
          const { error: err } = await supabase
            .from('plantas')
            .update({ nombre: valores.nombre, pais_id: valores.pais_id })
            .eq('id', valores.id);
          if (err) throw err;
        }
      } else if (tipoFormulario === 'usuarios') {
        // Generar email si es creación
        let email = valores.email;
        if (modoFormulario === 'crear') {
          const dominio =
            process.env.NEXT_PUBLIC_APP_DOMAIN || '@itflowapp.com';
          email = `${valores.username}${dominio}`;

          // Crear usuario en auth
          const { data: authData, error: authErr } =
            await supabase.auth.admin.createUser({
              email: email,
              password: Math.random().toString(36).slice(-12), // Contraseña temporal
              email_confirm: true,
            });

          if (authErr) throw authErr;

          // Crear registro en tabla usuarios
          const { error: dbErr } = await supabase.from('usuarios').insert([
            {
              id: authData.user.id,
              email,
              nombre_completo: valores.nombre_completo,
              planta_id: valores.planta_id,
              rol_id: valores.rol_id,
              estado: 'activo',
            },
          ]);

          if (dbErr) throw dbErr;
        } else {
          // Solo actualizar en tabla usuarios (admin, no puede cambiar auth desde acá)
          const { error: err } = await supabase
            .from('usuarios')
            .update({
              nombre_completo: valores.nombre_completo,
              planta_id: valores.planta_id,
              rol_id: valores.rol_id,
              estado: valores.estado,
            })
            .eq('id', valores.id);

          if (err) throw err;
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
                <p style={{ color: '#999', fontSize: '12px', gridColumn: '1/-1' }}>
                  No hay plantas
                </p>
              ) : (
                plantas.map((planta) => (
                  <div
                    key={planta.id}
                    className={styles.itemSidebar}
                    onClick={() => handleEditar(planta, 'plantas')}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, color: '#1e293b', marginBottom: '4px' }}>
                        {planta.nombre}
                      </div>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>
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
                      style={{ marginTop: '4px', alignSelf: 'flex-end' }}
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
                <p style={{ color: '#999', fontSize: '12px' }}>No hay países</p>
              ) : (
                paises.map((pais) => (
                  <div key={pais.id} className={styles.itemSidebar}>
                    <span className={styles.itemTexto}>{pais.nombre}</span>
                    <div className={styles.itemAcciones}>
                      <button
                        className={styles.btnEditar}
                        onClick={() => handleEditar(pais, 'paises')}
                        title="Editar"
                      >
                        ✏️
                      </button>
                    </div>
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
