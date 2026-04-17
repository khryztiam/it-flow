import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@lib/supabaseClient';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [usuario, setUsuario] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Obtener sesión actual
    const obtenerSesion = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        setUsuario(session?.user || null);
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
    } = supabase.auth.onAuthStateChange((evento, session) => {
      setUsuario(session?.user || null);
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
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const valor = {
    usuario,
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
