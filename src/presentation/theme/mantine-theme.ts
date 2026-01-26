import { createTheme, MantineColorsTuple } from '@mantine/core';

// Colores del logo: Teal (#2C8894) y Gold (#D4AF37)
const primary: MantineColorsTuple = [
  '#e0f2f4',
  '#b3dde2',
  '#80c8d0',
  '#4db3be',
  '#2C8894', // Primary teal
  '#1E5F66',
  '#1a5560',
  '#154a55',
  '#103f4a',
  '#0b343f',
];

const secondary: MantineColorsTuple = [
  '#faf7e8',
  '#f5ecc5',
  '#f0e1a2',
  '#ebd67f',
  '#D4AF37', // Gold/Yellow
  '#B5952F',
  '#a68a2a',
  '#967f25',
  '#867420',
  '#76691b',
];

const fucsia: MantineColorsTuple = [
  '#ffeef5',
  '#ffd9e8',
  '#ffb3d1',
  '#ff8cb9',
  '#ff6b9d',
  '#ff4d85',
  '#ff3d75',
  '#e62d66',
  '#cc1f55',
  '#b31447',
];

const cian: MantineColorsTuple = [
  '#e0f9ff',
  '#b3f0ff',
  '#80e6ff',
  '#4ddcff',
  '#1ad2ff',
  '#00c9ff',
  '#00d9ff',
  '#00b8e6',
  '#00a3cc',
  '#008fb3',
];

export const theme = createTheme({
  primaryColor: 'primary',
  colors: {
    primary,
    secondary,
    fucsia,
    cian,
  },
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  headings: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    fontWeight: '600',
  },
  defaultRadius: 'md',
  spacing: {
    xs: '0.5rem',
    sm: '0.75rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
  },
  other: {
    dimmed: '#4a5568', // Color más oscuro para mejor legibilidad (antes era muy claro)
  },
});
