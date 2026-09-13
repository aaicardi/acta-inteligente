import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as api from '../lib/api';

export function useUsuarios() {
  const queryClient = useQueryClient();

  const { data: usuarios = [], isLoading, error } = useQuery({
    queryKey: ['usuarios'],
    queryFn: api.listarUsuarios,
  });

  const crear = useMutation({
    mutationFn: api.crearUsuario,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['usuarios'] }),
  });

  const actualizar = useMutation({
    mutationFn: ({ id, cambios }) => api.actualizarUsuario(id, cambios),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['usuarios'] }),
  });

  return {
    usuarios,
    cargando: isLoading,
    error: error?.message || '',
    crear,
    actualizar,
  };
}

export function useConsumoIa() {
  return useQuery({
    queryKey: ['consumoIa'],
    queryFn: () => api.obtenerConsumoIa(),
  });
}

export function useAuditoria() {
  return useQuery({
    queryKey: ['auditoria'],
    queryFn: () => api.listarAuditoria({ limite: 50 }),
  });
}

export function usePlantilla() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['plantilla'],
    queryFn: api.obtenerEstadoPlantilla,
  });

  const subir = useMutation({
    mutationFn: api.subirPlantilla,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['plantilla'] }),
  });

  const restaurar = useMutation({
    mutationFn: api.restaurarPlantilla,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['plantilla'] }),
  });

  return {
    personalizada: data?.personalizada || false,
    cargando: isLoading,
    subir,
    restaurar,
  };
}
