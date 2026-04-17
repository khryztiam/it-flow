import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { supabase } from '@lib/supabase';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [usuario, setUsuario] = useState(null);
  const [usuarioDetalles, setUsuarioDetalles] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const montadoRef = useRef(true);
  const peticionActualRef = useRef(null);

  useEffect(() => {
    montadoRef.current = true;

    // Obtener sesión actual y cargar detalles del usuario
    const obtenerSesion = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session?.user && montadoRef.current) {
          setUsuario(session.user);
          // Cargar detalles del usuario (rol, planta, país)
          await cargarDetallesUsuario(session.user.id);
        } else if (montadoRef.current) {
          setUsuario(null);
          setUsuarioDetalles(null);
        }
      } catch (err) {
        if (montadoRef.current) {
          setError(err.message);
        }
      } finally {
        if (montadoRef.current) {
          setCargando(false);
        }
      }
    };

    obtenerSesion();

    // Escuchar cambios de autenticación
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (evento, session) => {
      if (montadoRef.current) {
        // Cancelar petición anterior si existe
        peticionActualRef.current?.abort();

        if (session?.user) {
          setUsuario(session.user);
          await cargarDetallesUsuario(session.user.id);
        } else {
          setUsuario(null);
          setUsuarioDetalles(null);
          setCargando(false);
        }
      }
    });

    return () => {
      montadoRef.current = false;
      subscription?.unsubscribe();
      peticionActualRef.current?.abort();
    };
  }, []);

  // Cargar detalles del usuario desde tabla usuarios
  const cargarDetallesUsuario = async (userId) => {
    // Cancelar petición anterior
    peticionActualRef.current?.abort();

    try {
      if (montadoRef.current) {
        setCargando(true);
      }

      // Crear nuevo AbortController para esta petición
      peticionActualRef.current = new AbortController();
      const controller = peticionActualRef.current;

      const { data, error: err } = await supabase
        .from('usuarios')
        .select(
          `
          id,
          email,
          nombre_completo,
          estado,
          rol:roles(id, nombre, descripcion),
          planta:plantas(id, nombre, pais:paises(id, nombre))
        `
        )
        .eq('id', userId)
        .single();

      // Verificar si la petición fue cancelada o el context se desmontó
      if (!montadoRef.current || controller.signal.aborted) {
        return;
      }

      if (err) {
        console.error('Error cargando detalles usuario:', err);
        throw err;
      }

      if (montadoRef.current) {
        setUsuarioDetalles(data);
        setCargando(false);
      }
    } catch (err) {
      // No actualizar si fue cancelado o context desmontado
      if (err.name === 'AbortError' || !montadoRef.current) {
        return;
      }
      console.error('Error:', err.message);
      if (montadoRef.current) {
        setError(err.message);
        setCargando(false);
      }
    }
  };

  const login = async (email, contrasenya) => {
    try {
      setError(null);
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password: contrasenya,
      });
      if (error) throw error;
      // cargarDetallesUsuario se ejecutará automáticamente por el listener
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const registro = async (email, contrasenya) => {
    try {
      setError(null);
      const { error } = await supabase.auth.signUp({
        email,
        password: contrasenya,
      });
      if (error) throw error;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const logout = async () => {
    try {
      setError(null);
      await supabase.auth.signOut();
      setUsuarioDetalles(null);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const valor = {
    usuario,
    usuarioDetalles,
    cargando,
    error,
    login,
    registro,
    logout,
  };

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const contexto = useContext(AuthContext);
  if (!contexto) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }
  return contexto;
};
