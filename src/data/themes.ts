import type { Theme, ThemeName } from '../types';

export const THEMES: Record<ThemeName, Theme> = {
  tomato:  { from: '#DD512D', to: '#F0764B', dark: '#6B2110', soft: '#FFE0D2' },
  sage:    { from: '#739979', to: '#9DB89F', dark: '#385139', soft: '#DFE9DD' },
  mustard: { from: '#C9913A', to: '#DFAE6B', dark: '#6E4A14', soft: '#F4E2C0' },
  berry:   { from: '#9F5D7C', to: '#BD8AA6', dark: '#56263F', soft: '#EDD9E2' },
  peach:   { from: '#D9784F', to: '#E89E7C', dark: '#7A3013', soft: '#F7DCCC' },
  ocean:   { from: '#5688AC', to: '#8AAEC6', dark: '#2A4860', soft: '#DBE5EE' },
  forest:  { from: '#5A7A5F', to: '#8AA38E', dark: '#2A4030', soft: '#D6E0D5' },
  rose:    { from: '#C66374', to: '#DD9AA5', dark: '#6F2A36', soft: '#F2D7DC' },
};
