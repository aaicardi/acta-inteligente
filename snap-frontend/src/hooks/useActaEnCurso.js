import { useCallback, useRef } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as api from '../lib/api';

const CLAVE_ACTA_EN_CURSO = ['actaEnCurso'];
const DEBOUNCE_MS = 400;

// Los fallos de red (sin señal) van a "en_cola" para reintentar solos al
// reconectar. Cualquier otro fallo (backend caído, IA sin configurar, límite
// de la API) va a "revisar" con el motivo visible.
function esFalloDeRed(err) {
  return err instanceof TypeError;
}

function actualizarItemEnCache(queryClient, actaId, itemId, cambiosOFn) {
  queryClient.setQueryData(CLAVE_ACTA_EN_CURSO, (prev) => {
    if (!prev) return prev;
    return {
      ...prev,
      items: prev.items.map((it) => {
        if (it.id !== itemId) return it;
        return typeof cambiosOFn === 'function' ? cambiosOFn(it) : { ...it, ...cambiosOFn };
      }),
    };
  });
}

// Centraliza todo el estado de servidor y las mutaciones del acta que el
// inspector esta diligenciando: antes vivia como ~10 useState + callbacks
// sueltos en App.jsx, mezclando estado de servidor con estado de UI. Aqui
// solo el primero; useState de UI (que modal esta abierto, etc.) se queda en
// App.jsx porque React Query no es el lugar para eso.
export function useActaEnCurso(sesionActiva) {
  const queryClient = useQueryClient();
  const debounceRef = useRef({});

  const { data: acta, isLoading } = useQuery({
    queryKey: CLAVE_ACTA_EN_CURSO,
    queryFn: () => api.obtenerActaEnCurso(),
    enabled: sesionActiva,
    // null (sin acta en curso) es una respuesta valida, no un error: no debe
    // reintentar como si algo hubiera fallado.
    staleTime: Infinity,
  });

  const crear = useMutation({
    mutationFn: () => api.crearActa(),
    onSuccess: (nueva) => {
      queryClient.setQueryData(CLAVE_ACTA_EN_CURSO, { ...nueva, items: [] });
    },
  });

  // Debounce local (no de React Query, que no lo ofrece nativo): actualiza la
  // cache al instante para que el input se sienta inmediato, y solo llama al
  // backend 400ms despues del ultimo cambio.
  const actualizarEncabezado = useCallback(
    (campo, valor) => {
      queryClient.setQueryData(CLAVE_ACTA_EN_CURSO, (prev) => (prev ? { ...prev, [campo]: valor } : prev));
      clearTimeout(debounceRef.current[campo]);
      debounceRef.current[campo] = setTimeout(() => {
        const actaId = queryClient.getQueryData(CLAVE_ACTA_EN_CURSO)?.id;
        if (actaId) api.actualizarEncabezado(actaId, { [campo]: valor }).catch(() => {});
      }, DEBOUNCE_MS);
    },
    [queryClient]
  );

  const analizarYActualizar = useCallback(
    async (itemId, fotosParaAnalizar) => {
      const actaId = acta.id;
      try {
        // POST /analizar responde 202 con el item ya en 'analizando' (el
        // analisis real corre en segundo plano en el backend); se refleja
        // ese estado de inmediato y se hace polling hasta el resultado final.
        const marcado = await api.analizarItem(actaId, itemId, fotosParaAnalizar);
        actualizarItemEnCache(queryClient, actaId, itemId, marcado);

        const final = await api.esperarAnalisis(actaId, itemId);
        if (final) actualizarItemEnCache(queryClient, actaId, itemId, final);
      } catch (err) {
        actualizarItemEnCache(queryClient, actaId, itemId, (item) =>
          esFalloDeRed(err)
            ? { ...item, estado: 'en_cola', motivoRevision: 'Sin conexión; se reintentará automáticamente.' }
            : { ...item, estado: 'revisar', motivoRevision: err.message }
        );
      }
    },
    [acta, queryClient]
  );

  const agregarItem = useCallback(
    async ({ fotos, cantidad, numero }) => {
      const numeroLimpio = Number(numero);
      if (!numero || Number.isNaN(numeroLimpio)) {
        throw new Error('Ingresa el número de ítem de la factura.');
      }
      if (acta.items.some((it) => Number(it.orden) === numeroLimpio)) {
        throw new Error(`El ítem ${numeroLimpio} ya existe. Usa otro número.`);
      }

      const creado = await api.agregarItem(acta.id, { orden: numeroLimpio });
      const nuevo = { ...creado, fotos, cantidad, estado: 'analizando' };
      queryClient.setQueryData(CLAVE_ACTA_EN_CURSO, (prev) => ({ ...prev, items: [...prev.items, nuevo] }));

      await analizarYActualizar(creado.id, fotos);

      if (cantidad !== '' && cantidad !== undefined) {
        try {
          await api.actualizarItem(acta.id, creado.id, { cantidad });
        } catch {
          // El item ya quedo creado y se esta analizando; la cantidad se
          // puede completar despues a mano si esta llamada falla.
        }
      }
    },
    [acta, queryClient, analizarYActualizar]
  );

  const reintentarItem = useCallback(
    (itemId) => {
      const item = acta.items.find((it) => it.id === itemId);
      if (!item) return;
      actualizarItemEnCache(queryClient, acta.id, itemId, { estado: 'analizando' });
      analizarYActualizar(itemId, item.fotos || []);
    },
    [acta, queryClient, analizarYActualizar]
  );

  const actualizarItem = useCallback(
    (itemId, cambios) => {
      actualizarItemEnCache(queryClient, acta.id, itemId, cambios);
      const key = `item-${itemId}`;
      clearTimeout(debounceRef.current[key]);
      debounceRef.current[key] = setTimeout(() => {
        api.actualizarItem(acta.id, itemId, cambios).catch(() => {});
      }, DEBOUNCE_MS);
    },
    [acta, queryClient]
  );

  // No se puede repetir número de ítem: valida contra el resto de la lista
  // antes de pedirlo al backend, y devuelve el mensaje de error para
  // mostrarlo en el formulario (o '' si quedó bien).
  const actualizarNumero = useCallback(
    async (itemId, numero) => {
      const numeroLimpio = Number(numero);
      if (numero === '' || numero === null || numero === undefined || Number.isNaN(numeroLimpio)) {
        return 'Ingresa un número de ítem.';
      }
      const duplicado = acta.items.some((it) => it.id !== itemId && Number(it.orden) === numeroLimpio);
      if (duplicado) {
        return `El ítem ${numeroLimpio} ya existe.`;
      }
      try {
        await api.actualizarNumeroItem(acta.id, itemId, numeroLimpio);
        actualizarItemEnCache(queryClient, acta.id, itemId, { orden: numeroLimpio });
        return '';
      } catch (err) {
        return err.message;
      }
    },
    [acta, queryClient]
  );

  const eliminarItem = useCallback(
    async (itemId) => {
      await api.eliminarItem(acta.id, itemId);
      queryClient.setQueryData(CLAVE_ACTA_EN_CURSO, (prev) => ({
        ...prev,
        items: prev.items.filter((it) => it.id !== itemId),
      }));
    },
    [acta, queryClient]
  );

  // Al recuperar señal, reintenta solos todos los ítems "en_cola". Se expone
  // para que App.jsx lo enganche al evento 'online' del navegador (efecto de
  // window, no de datos: se queda fuera del hook de datos).
  const reintentarEnCola = useCallback(() => {
    (acta?.items || []).filter((it) => it.estado === 'en_cola').forEach((it) => reintentarItem(it.id));
  }, [acta, reintentarItem]);

  const generar = useCallback(async () => {
    const blob = await api.generarActa(acta.id);
    const nombreArchivo = `acta_${acta.doNo || 'sin_do'}.xlsx`;
    const resumen = { doNo: acta.doNo, archivo: nombreArchivo, items: acta.items.length, bultos: acta.bultos, peso: acta.peso };
    queryClient.setQueryData(CLAVE_ACTA_EN_CURSO, null);
    queryClient.invalidateQueries({ queryKey: ['historico'] });
    return { blob, resumen };
  }, [acta, queryClient]);

  const abrirActaExistente = useCallback(
    (actaExistente) => {
      queryClient.setQueryData(CLAVE_ACTA_EN_CURSO, actaExistente);
    },
    [queryClient]
  );

  return {
    acta,
    cargando: isLoading,
    crearActa: crear.mutateAsync,
    actualizarEncabezado,
    agregarItem,
    actualizarItem,
    actualizarNumero,
    eliminarItem,
    reintentarItem,
    reintentarEnCola,
    generar,
    abrirActaExistente,
  };
}
