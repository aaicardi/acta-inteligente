import { useCallback, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import * as api from '../lib/api';

const DEBOUNCE_MS = 400;

// El listado del historico (para el contador "N guardadas" del TabBar y la
// pantalla de Actas) y el detalle de una acta puntual.
export function useHistorico(sesionActiva) {
  const queryClient = useQueryClient();
  const [busqueda, setBusqueda] = useState('');
  const [busquedaDebounced, setBusquedaDebounced] = useState('');
  const debounceRef = useRef(null);

  // El contador del TabBar necesita el conteo desde el arranque, no solo
  // cuando el inspector entra a la pestaña Histórico — por eso enabled:
  // sesionActiva en vez de una carga manual on-demand.
  const {
    data: actas = [],
    isLoading: cargando,
    error,
  } = useQuery({
    queryKey: ['historico', busquedaDebounced],
    queryFn: () => api.listarActas(busquedaDebounced ? { q: busquedaDebounced } : {}),
    enabled: sesionActiva,
    placeholderData: (prev) => prev,
  });

  const cambiarBusqueda = useCallback((valor) => {
    setBusqueda(valor);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setBusquedaDebounced(valor), DEBOUNCE_MS);
  }, []);

  const refrescar = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['historico'] });
  }, [queryClient]);

  return {
    actas,
    cargando,
    error: error?.message || '',
    busqueda,
    onBusqueda: cambiarBusqueda,
    refrescar,
  };
}

export function useActaDetalle(actaId) {
  return useQuery({
    queryKey: ['actaDetalle', actaId],
    queryFn: () => api.obtenerActaDetalle(actaId),
    enabled: actaId != null,
  });
}
