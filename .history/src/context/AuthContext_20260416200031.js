import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@lib/supabase';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [usuario, setUsuario] = useState(null);
  const [usuarioDetalles, setUsuarioDetalles] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Obtener sesión actual y cargar detalles del usuario
    const obtenerSesion = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session?.user) {
          setUsuario(session.user);
          // Cargar detalles del usuario (rol, planta, país)
          await cargarDetallesUsuario(session.user.id);
        } else {
          setUsuario(null);
          setUsuarioDetalles(null);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setCargando(false);
      }
    };

    obtenerSesion();

    // Escuchar cambios de autenticación
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (evento, session) => {
      if (session?.user) {
        setUsuario(session.user);
        await cargarDetallesUsuario(session.user.id);
      } else {
        setUsuario(null);
        setUsuarioDetalles(null);
      }
    });

    return () => subscription?.unsubscribe();
  }, []);

  // Cargar detalles del usuario desde tabla usuarios
  const cargarDetallesUsuario = async (userId) => {
    try {
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

      if (err) {
        console.error('Error cargando detalles usuario:', err);
        throw err;
      }

      setUsuarioDetalles(data);
    } catch (err) {
      console.error('Error:', err.message);
      setError(err.message);
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
