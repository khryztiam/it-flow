import { useEffect, useRef, useState } from 'react';

/**
 * Hook personalizado para manejo seguro de carga de datos con limpieza
 * Evita actualizar estado en componentes desmontados
 */
export const useCargaDatos = (funcionCarga, dependencias = []) => {
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const montadoRef = useRef(true);
  const controladorRef = useRef(null);

  useEffect(() => {
    montadoRef.current = true;
    controladorRef.current = new AbortController();

    const ejecutar = async () => {
      try {
        setCargando(true);
        setError('');
        const resultado = await funcionCarga(controladorRef.current.signal);

        // Solo actualizar si el componente sigue montado y no fue cancelado
        if (montadoRef.current && resultado !== undefined) {
          return resultado;
        }
      } catch (err) {
        // No actualizar si fue cancelado o el componente fue desmontado
        if (err.name === 'AbortError' || !montadoRef.current) {
          return;
        }
        if (montadoRef.current) {
          setError(err.message || 'Error desconocido');
        }
      } finally {
        if (montadoRef.current) {
          setCargando(false);
        }
      }
    };

    ejecutar();

    // Limpieza al desmontar
    return () => {
      montadoRef.current = false;
      controladorRef.current?.abort();
    };
  }, dependencias);

  return { cargando, error };
};
