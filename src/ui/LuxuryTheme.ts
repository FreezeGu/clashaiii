/**
 * Luxury "watchmaker" UI: deep green/charcoal, gold accents, Inter, small caps.
 */
export const COLORS = {
  bgDark: '#0a0f0a',
  bgCard: '#0d1510',
  bgElevated: '#111a12',
  gold: '#c9a227',
  goldLight: '#e5c84a',
  goldDark: '#8b7312',
  ivory: '#f5f0e6',
  ivoryDim: '#b8b0a0',
  border: 'rgba(201, 162, 39, 0.35)',
  shadow: 'rgba(0,0,0,0.4)',
  invalid: '#a03030',
  valid: '#308030',
};

export const FONT = {
  family: "'Inter', sans-serif",
  sizeTitle: 28,
  sizeHeading: 20,
  sizeBody: 16,
  sizeSmall: 12,
  letterSpacing: '0.04em',
  smallCaps: 'small-caps',
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

export function getButtonStyle(): Phaser.Types.GameObjects.Text.TextStyle {
  return {
    fontFamily: FONT.family,
    fontSize: `${FONT.sizeBody}px`,
    color: COLORS.ivory,
    align: 'center',
  };
}

export function getTitleStyle(): Phaser.Types.GameObjects.Text.TextStyle {
  return {
    fontFamily: FONT.family,
    fontSize: `${FONT.sizeTitle}px`,
    color: COLORS.gold,
    align: 'center',
  };
}
