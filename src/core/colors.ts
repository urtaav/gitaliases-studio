export type ColorAttr = 'bold' | 'dim' | 'italic' | 'ul' | 'reverse' | 'strike';

export const COLOR_ATTRS: readonly ColorAttr[] = ['bold', 'dim', 'italic', 'ul', 'reverse', 'strike'];

const BASE = ['black', 'red', 'green', 'yellow', 'blue', 'magenta', 'cyan', 'white'] as const;

export const GIT_NAMED_COLORS: readonly string[] = [
  'normal',
  ...BASE,
  ...BASE.map((c) => `bright${c}`),
];

/** Approximate RGB of the 16 named colors, used only to draw the preview. */
export const NAMED_RGB: Record<string, string> = {
  black: '#000000', red: '#CD3131', green: '#0DBC79', yellow: '#E5E510',
  blue: '#2472C8', magenta: '#BC3FBC', cyan: '#11A8CD', white: '#E5E5E5',
  brightblack: '#666666', brightred: '#F14C4C', brightgreen: '#23D18B',
  brightyellow: '#F5F543', brightblue: '#3B8EEA', brightmagenta: '#D670D6',
  brightcyan: '#29B8DB', brightwhite: '#FFFFFF',
};

const ATTR_SGR: Record<ColorAttr, string> = {
  bold: '1', dim: '2', italic: '3', ul: '4', reverse: '7', strike: '9',
};

export const isHex = (c: string): boolean => /^#[0-9A-Fa-f]{6}$/.test(c);

/** `%C(...)` for git's format string. '' means "use the terminal's color". */
export function gitColorSpec(color: string, attrs: ColorAttr[]): string {
  if (color === 'auto') return '%C(auto)';
  const parts = [...attrs, ...(color && color !== 'normal' ? [color] : [])];
  return parts.length ? `%C(${parts.join(' ')})` : '';
}

export function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('').toUpperCase();
}

/** SGR parameters (the part between `ESC[` and `m`) for the sed-injected colors. */
export function toSgr(color: string, attrs: ColorAttr[]): string {
  const codes = attrs.map((a) => ATTR_SGR[a]);
  if (isHex(color)) {
    codes.push(`38;2;${hexToRgb(color).join(';')}`);
  } else if (color.startsWith('bright') && BASE.includes(color.slice(6) as (typeof BASE)[number])) {
    codes.push(String(90 + BASE.indexOf(color.slice(6) as (typeof BASE)[number])));
  } else if (BASE.includes(color as (typeof BASE)[number])) {
    codes.push(String(30 + BASE.indexOf(color as (typeof BASE)[number])));
  }
  return codes.join(';');
}

/** Inverse of toSgr, for reading designer aliases back. */
export function fromSgr(sgr: string): { color: string; attrs: ColorAttr[] } {
  const codes = sgr.split(';').filter(Boolean).map(Number);
  const attrs: ColorAttr[] = [];
  let color = '';
  for (let i = 0; i < codes.length; i++) {
    const c = codes[i]!;
    const attr = (Object.keys(ATTR_SGR) as ColorAttr[]).find((a) => ATTR_SGR[a] === String(c));
    if (attr) attrs.push(attr);
    else if (c === 38 && codes[i + 1] === 2) {
      color = rgbToHex(codes[i + 2] ?? 0, codes[i + 3] ?? 0, codes[i + 4] ?? 0);
      i += 4;
    } else if (c >= 30 && c <= 37) color = BASE[c - 30]!;
    else if (c >= 90 && c <= 97) color = `bright${BASE[c - 90]}`;
  }
  return { color, attrs };
}

/** CSS color for the preview; '' keeps the terminal foreground. */
export function cssColor(color: string): string | undefined {
  if (isHex(color)) return color;
  return NAMED_RGB[color];
}
