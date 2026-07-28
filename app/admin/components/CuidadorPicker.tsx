'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Select, MultiSelect, Loader } from '@mantine/core';

export interface CuidadorOpcion {
  id: string;
  nombreCompleto: string;
}

const DEBOUNCE_MS = 350;
const LIMITE = 20;

/**
 * Busca cuidadores contra la API en vez de traerlos todos de una.
 *
 * El texto tipeado se manda con debounce: sin eso cada tecla dispara un
 * request. Los nombres ya vistos se recuerdan en `conocidos` porque cuando la
 * búsqueda cambia, la opción que estaba seleccionada desaparece del listado y
 * Mantine mostraría el uuid crudo en lugar del nombre.
 */
export function useBusquedaCuidadores(iniciales: CuidadorOpcion[] = []) {
  const [busqueda, setBusqueda] = useState('');
  const [resultados, setResultados] = useState<CuidadorOpcion[]>([]);
  const [buscando, setBuscando] = useState(false);
  const conocidos = useRef(new Map<string, string>());

  for (const c of iniciales) conocidos.current.set(c.id, c.nombreCompleto);

  useEffect(() => {
    let cancelado = false;
    const controller = new AbortController();

    const timer = setTimeout(async () => {
      setBuscando(true);
      try {
        const params = new URLSearchParams({ all: 'true', take: String(LIMITE) });
        if (busqueda.trim()) params.set('search', busqueda.trim());

        const res = await fetch(`/api/v1/cuidadores?${params.toString()}`, { signal: controller.signal });
        const data = await res.json();
        if (cancelado || !data.ok || !Array.isArray(data.data)) return;

        const lista: CuidadorOpcion[] = data.data.map((c: CuidadorOpcion) => ({
          id: c.id,
          nombreCompleto: c.nombreCompleto,
        }));
        for (const c of lista) conocidos.current.set(c.id, c.nombreCompleto);
        setResultados(lista);
      } catch {
        // Abort de una búsqueda vieja o error de red: se ignora, la próxima tecla reintenta.
      } finally {
        if (!cancelado) setBuscando(false);
      }
    }, busqueda ? DEBOUNCE_MS : 0);

    return () => {
      cancelado = true;
      controller.abort();
      clearTimeout(timer);
    };
  }, [busqueda]);

  /** Opciones para Mantine, con los ids seleccionados siempre presentes. */
  const opciones = useCallback(
    (seleccionados: string[], excluir?: (id: string) => boolean) => {
      const mapa = new Map<string, string>();
      for (const c of resultados) {
        if (excluir?.(c.id)) continue;
        mapa.set(c.id, c.nombreCompleto);
      }
      for (const id of seleccionados) {
        if (!mapa.has(id)) mapa.set(id, conocidos.current.get(id) ?? 'Cuidador seleccionado');
      }
      return Array.from(mapa, ([value, label]) => ({ value, label }));
    },
    [resultados]
  );

  return { busqueda, setBusqueda, buscando, resultados, opciones };
}

interface SelectProps {
  label?: string;
  description?: string;
  placeholder?: string;
  required?: boolean;
  clearable?: boolean;
  value: string | null;
  onChange: (value: string | null) => void;
  /** Nombre del valor ya elegido, para no mostrar el uuid mientras se busca. */
  iniciales?: CuidadorOpcion[];
  /** Devolver true para ocultar un cuidador (ej: ya tiene usuario asignado). */
  excluir?: (id: string) => boolean;
  style?: React.CSSProperties;
}

export function CuidadorSelect({
  label = 'Cuidador',
  description,
  placeholder = 'Buscar cuidador...',
  required,
  clearable,
  value,
  onChange,
  iniciales = [],
  excluir,
  style,
}: SelectProps) {
  const { setBusqueda, buscando, opciones } = useBusquedaCuidadores(iniciales);
  const data = useMemo(() => opciones(value ? [value] : [], excluir), [opciones, value, excluir]);

  return (
    <Select
      label={label}
      description={description}
      placeholder={placeholder}
      required={required}
      clearable={clearable}
      searchable
      data={data}
      value={value}
      onChange={onChange}
      onSearchChange={setBusqueda}
      rightSection={buscando ? <Loader size={14} /> : undefined}
      nothingFoundMessage={buscando ? 'Buscando...' : 'Sin resultados'}
      filter={({ options }) => options} // el filtrado lo hace el backend
      style={style}
    />
  );
}

interface MultiProps {
  label?: string;
  placeholder?: string;
  value: string[];
  onChange: (value: string[]) => void;
  iniciales?: CuidadorOpcion[];
  clearable?: boolean;
}

export function CuidadorMultiSelect({
  label = 'Cuidadores',
  placeholder = 'Todos',
  value,
  onChange,
  iniciales = [],
  clearable = true,
}: MultiProps) {
  const { setBusqueda, buscando, opciones } = useBusquedaCuidadores(iniciales);
  const data = useMemo(() => opciones(value), [opciones, value]);

  return (
    <MultiSelect
      label={label}
      placeholder={value.length === 0 ? placeholder : ''}
      searchable
      clearable={clearable}
      data={data}
      value={value}
      onChange={onChange}
      onSearchChange={setBusqueda}
      rightSection={buscando ? <Loader size={14} /> : undefined}
      nothingFoundMessage={buscando ? 'Buscando...' : 'Sin resultados'}
      filter={({ options }) => options}
    />
  );
}
