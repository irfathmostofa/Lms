export const HERO_LAYOUTS = [
  {
    value: 'images',
    label: 'Images only',
    hint: 'Full-bleed photo slider with a light caption',
  },
  {
    value: 'text',
    label: 'Text with images',
    hint: 'Headline, search and a featured course image',
  },
  {
    value: 'courses',
    label: 'Course row',
    hint: 'Featured courses shown in a horizontal row',
  },
] as const;

export type HeroLayout = (typeof HERO_LAYOUTS)[number]['value'];

export const DEFAULT_HERO_LAYOUT: HeroLayout = 'text';

const LAYOUT_VALUES = new Set<string>(HERO_LAYOUTS.map((item) => item.value));

export function isHeroLayout(value: string | null | undefined): value is HeroLayout {
  return Boolean(value && LAYOUT_VALUES.has(value));
}

export function resolveHeroLayout(value: string | null | undefined): HeroLayout {
  return isHeroLayout(value) ? value : DEFAULT_HERO_LAYOUT;
}

export function heroLayoutLabel(value: string | null | undefined) {
  const layout = HERO_LAYOUTS.find((item) => item.value === value);
  return layout?.label ?? 'Text with images';
}
