import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '@components/Layout';
import Tabs from '@components/Tabs';
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

const TABS = [
  { id: 'paises', label: 'Países', icono: '🌍' },
  { id: 'plantas', label: 'Plantas', icono: '🏭' },
  { id: 'usuarios', label: 'Usuarios', icono: '👥' },
];

const MAPEO_ROLES = {
  admin: 'Administrador',
  supervisor: 'Supervisor',
  user: 'Usuario',
};

export default function GestionAdmin() {
  const router = useRouter();
  const { cargando: cargandoAuth } = useAdmin();

  const [tabActivo, setTabActivo] = useState('paises');
  const [cargando, setCargando] = useState(true);

  // Estados para datos
  const [paises, setPaises] = useState([]);
  const [plantas, setPlantas] = useState([]);
  const [usuarios, setUsuarios] = useState([]);

  // Modal y formulario
  const [modalAbierta, setModalAbierta] = useState(false);
  const [modoFormulario, setModoFormulario] = useState('crear'); // crear, editar, ver
  const [registroSeleccionado, setRegistroSeleccionado] = useState(null);
  const [error, setError] = useState('');
  const [cargandoFormulario, setCargandoFormulario] = useState(false);

  // Valores del formulario
  const [valores, setValores] = useState({});

  // Cargar datos según tab activo
  useEffect(() => {
    if (!cargandoAuth) {
      cargarDatos();
    }
  }, [cargandoAuth, tabActivo]);

  const cargarDatos = async () => {
    try {
      setCargando(true);
      setError('');

      // Siempre cargar países como base
      const paisesData = await obtenerPaises();
      setPaises(paisesData);

      if (tabActivo === 'paises') {
        // Ya están cargados los países
      } else if (tabActivo === 'plantas') {
        // Admin ve TODAS las plantas sin restricción
        const plantasData = await obtenerTodasLasPlantas();
        setPlantas(plantasData);
      } else if (tabActivo === 'usuarios') {
        const { data: usuariosData, error: err } = await supabase
          .from('usuarios')
          .select('id, email, nombre_completo, estado, rol_id, planta_id')
          .order('nombre_completo', { ascending: true });

        if (err) throw err;
        setUsuarios(usuariosData || []);
      }
    } catch (err) {
      setError(err.message || 'Error cargando datos');
    } finally {
      setCargando(false);
    }
  };

  const handleNuevo = () => {
    setModoFormulario('crear');
    setRegistroSeleccionado(null);
    setValores({});
    setError('');
    setModalAbierta(true);
  };

  const handleEditar = (registro) => {
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

      if (tabActivo === 'paises') {
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
      } else if (tabActivo === 'plantas') {
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
      } else if (tabActivo === 'usuarios') {
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
      <Tabs tabs={TABS} activo={tabActivo} onChange={setTabActivo} />

      <div className={styles.contenido}>
        {error && <div className={styles.errorGlobal}>{error}</div>}

        <div className={styles.encabezado}>
          <h3>
            {tabActivo === 'paises' && 'Países'}
            {tabActivo === 'plantas' && 'Plantas'}
            {tabActivo === 'usuarios' && 'Usuarios'}
          </h3>
          <button onClick={handleNuevo} className={styles.btnNuevo}>
            + Nuevo
          </button>
        </div>

        {tabActivo === 'paises' && (
          <TablaGenerica
            columnas={[
              { key: 'nombre', label: 'Nombre' },
              {
                key: 'created_at',
                label: 'Creado',
                render: (v) => formatearFechaHora(v),
              },
            ]}
            datos={paises}
            acciones={[
              {
                label: '✏️',
                onClick: handleEditar,
                color: 'warning',
              },
            ]}
            cargando={cargando}
          />
        )}

        {tabActivo === 'plantas' && (
          <TablaGenerica
            columnas={[
              { key: 'nombre', label: 'Nombre' },
              {
                key: 'pais',
                label: 'País',
                render: (v, fila) => {
                  // Si vienen datos con relación anidada (pais.nombre)
                  if (typeof v === 'object' && v?.nombre) {
                    return v.nombre;
                  }
                  // Si viene solo pais_id
                  const pais = paises.find((p) => p.id === fila.pais_id);
                  return pais?.nombre || '-';
                },
              },
            ]}
            datos={plantas}
            acciones={[
              {
                label: '✏️',
                onClick: handleEditar,
                color: 'warning',
              },
            ]}
            cargando={cargando}
          />
        )}

        {tabActivo === 'usuarios' && (
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
                onClick: handleEditar,
                color: 'warning',
              },
            ]}
            cargando={cargando}
          />
        )}
      </div>

      {/* Modal y Formulario */}
      <Modal
        abierto={modalAbierta}
        onCerrar={() => setModalAbierta(false)}
        titulo={
          modoFormulario === 'crear'
            ? `Crear ${tabActivo === 'paises' ? 'País' : tabActivo === 'plantas' ? 'Planta' : 'Usuario'}`
            : `Editar ${tabActivo === 'paises' ? 'País' : tabActivo === 'plantas' ? 'Planta' : 'Usuario'}`
        }
        onAceptar={handleGuardar}
        cargando={cargandoFormulario}
        modo={modoFormulario}
      >
        <FormularioMulti
          modo={modoFormulario}
          campos={
            tabActivo === 'paises'
              ? [
                  {
                    name: 'nombre',
                    label: 'Nombre del País',
                    type: 'text',
                    required: true,
                    placeholder: 'Ej: Colombia',
                  },
                ]
              : tabActivo === 'plantas'
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
