import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import LayoutAdmin from '@components/LayoutAdmin';
import Tabs from '@components/Tabs';
import TablaGenerica from '@components/TablaGenerica';
import Modal from '@components/Modal';
import FormularioMulti from '@components/FormularioMulti';
import { useAdmin } from '@hooks/useProtegerRuta';
import {
  obtenerPaises,
  obtenerPlantasPorPais,
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

  // Cargar datos iniciales
  useEffect(() => {
    if (!cargandoAuth) {
      cargarDatos();
    }
  }, [cargandoAuth, tabActivo]);

  const cargarDatos = async () => {
    try {
      setCargando(true);
      setError('');

      if (tabActivo === 'paises') {
        const data = await obtenerPaises();
        setPaises(data);
      } else if (tabActivo === 'plantas') {
        const data = await obtenerPaises();
        setPaises(data);
        // Cargar plantas del primer país
        if (data.length > 0) {
          const plantas = await obtenerPlantasPorPais(data[0].id);
          setPlantas(plantas);
        }
      } else if (tabActivo === 'usuarios') {
        const { data: usuariosData, error: err } = await supabase
          .from('usuarios')
          .select(
            `
            id,
            email,
            nombre_completo,
            estado,
            rol:roles(nombre),
            planta:plantas(nombre)
          `
          )
          .order('nombre_completo', { ascending: true });

        if (err) throw err;
        setUsuarios(usuariosData);
      }
    } catch (err) {
      setError(err.message);
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
          const dominio = process.env.NEXT_PUBLIC_APP_DOMAIN || '@itflowapp.com';
          const emailBase = valores.nombre_completo
            .toLowerCase()
            .replace(/\s+/g, '.')
            .replace(/[^a-z.]/g, '');
          email = `${emailBase}${dominio}`;

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
    <LayoutAdmin titulo="Gestión de Configuración">
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
              { key: 'id', label: 'ID', ancho: '200px' },
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
              { key: 'id', label: 'ID', ancho: '200px' },
              { key: 'nombre', label: 'Nombre' },
              {
                key: 'pais_id',
                label: 'País',
                render: (v) => {
                  const pais = paises.find((p) => p.id === v);
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
                key: 'rol',
                label: 'Rol',
                render: (v) => v?.nombre || '-',
              },
              {
                key: 'planta',
                label: 'Planta',
                render: (v) => v?.nombre || '-',
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
                      options: paises.map((p) => ({ id: p.id, label: p.nombre })),
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
                      name: 'email',
                      label: 'Email (Auto-generado)',
                      type: 'email',
                      disabled: true,
                      ayuda: 'Se genera automáticamente a partir del nombre',
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
                      options: plantas.map((p) => ({ id: p.id, label: p.nombre })),
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
          onEnviar={handleGuardar}
          onCancelar={() => setModalAbierta(false)}
          cargando={cargandoFormulario}
          error={error}
        />
      </Modal>
    </LayoutAdmin>
  );
}
