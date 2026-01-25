'use client';

import { Group, SegmentedControl } from '@mantine/core';
import { IconLayoutList, IconLayoutGrid } from '@tabler/icons-react';
import { useState, useEffect } from 'react';

type ViewMode = 'list' | 'cards';

interface ViewToggleProps {
  value: ViewMode;
  onChange: (value: ViewMode) => void;
}

export function ViewToggle({ value, onChange }: ViewToggleProps) {
  return (
    <SegmentedControl
      value={value}
      onChange={(val) => onChange(val as ViewMode)}
      data={[
        { 
          label: (
            <>
              <IconLayoutList size={16} style={{ marginRight: 4 }} />
              Lista
            </>
          ), 
          value: 'list' 
        },
        { 
          label: (
            <>
              <IconLayoutGrid size={16} style={{ marginRight: 4 }} />
              Tarjetas
            </>
          ), 
          value: 'cards' 
        },
      ]}
      size="sm"
    />
  );
}

export function useViewMode(defaultMode: ViewMode = 'list'): [ViewMode, (mode: ViewMode) => void] {
  const [viewMode, setViewMode] = useState<ViewMode>(defaultMode);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // En mobile, default es tarjetas; en desktop, default es lista
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
    const savedMode = typeof window !== 'undefined' ? localStorage.getItem('viewMode') as ViewMode | null : null;
    
    // En mobile, siempre usar 'cards' como default (ignorar defaultMode y localStorage si es 'list')
    // En desktop, usar el defaultMode pasado (que debería ser 'list') o el modo guardado
    if (isMobile) {
      // En mobile, forzar 'cards' como default
      if (savedMode === 'cards') {
        setViewMode('cards');
      } else {
        // Si no hay modo guardado o es 'list', usar 'cards' en mobile
        setViewMode('cards');
      }
    } else {
      // En desktop, usar el modo guardado o el defaultMode
      if (savedMode && (savedMode === 'list' || savedMode === 'cards')) {
        setViewMode(savedMode);
      } else {
        setViewMode(defaultMode);
      }
    }
  }, [defaultMode]);

  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    if (typeof window !== 'undefined') {
      const isMobile = window.innerWidth < 768;
      // En mobile, solo guardar si es 'cards' (no guardar 'list' en mobile)
      // En desktop, guardar cualquier modo
      if (isMobile && mode === 'list') {
        // No guardar 'list' en mobile, para que siempre vuelva a 'cards' por defecto
        localStorage.removeItem('viewMode');
      } else {
        localStorage.setItem('viewMode', mode);
      }
    }
  };

  return [mounted ? viewMode : defaultMode, handleViewModeChange];
}
