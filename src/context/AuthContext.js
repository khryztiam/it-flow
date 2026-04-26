import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@lib/supabase';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [usuario, setUsuario] = useState(null);
  const [usuarioDetalles, setUsuarioDetalles] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const obtenerSesion = async (desdeEvento = false) => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        setUsuario(session?.user || null);

        if (session?.user) {
          const { data, error: err } = await supabase
            .from('usuarios')
            .select(
              `
              id,
              email,
              nombre_completo,
              estado,
              supervisor_id,
              rol:roles(id, nombre, descripcion),
              planta:plantas(id, nombre, pais:paises(id, nombre))
            `
            )
            .eq('id', session.user.id)
            .single();

          if (data) {
            setUsuarioDetalles(data);
          } else if (!desdeEvento) {
            console.error('Error cargando detalles usuario:', err);
          }
        } else {
          setUsuarioDetalles(null);
        }
      } catch (err) {
        if (!desdeEvento) {
          setError(err.message);
        }
      } finally {
        if (!desdeEvento) {
          setCargando(false);
        }
      }
    };

    obtenerSesion();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_evento, session) => {
      setUsuario(session?.user || null);
      if (session?.user) {
        obtenerSesion(true);
      } else {
        setUsuarioDetalles(null);
      }
    });

    return () => subscription?.unsubscribe();
  }, []);

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
