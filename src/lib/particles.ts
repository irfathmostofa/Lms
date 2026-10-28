export const PARTICLE_STYLES = [
  { value: 'orbs', label: 'Glowing orbs', hint: 'Soft drifting lights over the image' },
  { value: 'constellation', label: 'Constellation', hint: 'Connected dots that form a network' },
  { value: 'stars', label: 'Starfield', hint: 'Twinkling stars across a night sky' },
  { value: 'snow', label: 'Snowfall', hint: 'Gentle flakes falling slowly' },
  { value: 'sparks', label: 'Rising sparks', hint: 'Warm embers floating upward' },
  { value: 'bubbles', label: 'Bubbles', hint: 'Translucent bubbles drifting up' },
  { value: 'waves', label: 'Wave field', hint: 'Particles moving on sine waves' },
  { value: 'mesh', label: 'Geometric mesh', hint: 'A pulsing hexagonal grid' },
  { value: 'aurora', label: 'Aurora', hint: 'Flowing color ribbons' },
  { value: 'confetti', label: 'Confetti dust', hint: 'Tiny colorful specks in motion' },
] as const;

export type ParticleStyle = (typeof PARTICLE_STYLES)[number]['value'];

export const DEFAULT_PARTICLE_STYLE: ParticleStyle = 'orbs';

const STYLE_VALUES = new Set<string>(PARTICLE_STYLES.map((item) => item.value));

export function isParticleStyle(value: string | null | undefined): value is ParticleStyle {
  return Boolean(value && STYLE_VALUES.has(value));
}

export function resolveParticleStyle(value: string | null | undefined): ParticleStyle {
  return isParticleStyle(value) ? value : DEFAULT_PARTICLE_STYLE;
}

export function particleStyleLabel(value: string | null | undefined) {
  const style = PARTICLE_STYLES.find((item) => item.value === value);
  return style?.label ?? 'Glowing orbs';
}
