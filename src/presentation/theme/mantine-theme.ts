import { createTheme, MantineColorsTuple } from '@mantine/core';

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

const amarillo: MantineColorsTuple = [
  '#fff9e6',
  '#fff2cc',
  '#ffeb99',
  '#ffe466',
  '#ffdd33',
  '#ffd93d',
  '#ffd11a',
  '#e6c200',
  '#ccad00',
  '#b39900',
];

export const theme = createTheme({
  primaryColor: 'fucsia',
  colors: {
    fucsia,
    cian,
    amarillo,
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
});
