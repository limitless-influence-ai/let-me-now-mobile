/**
 * Palette « Refined Street ».
 *
 * Les clés historiques (agression/homophobe/pickpocket/cactus, background, text,
 * textSecondary, border, primary) sont conservées pour ne pas casser les imports
 * existants — leurs valeurs sont alignées sur le nouveau design system.
 */
export const COLORS = {
  // ── Marque ──
  turquoise: '#4FC3C7', // interactif, navigation active, FAB, branding
  turquoiseDark: '#3BA8AC', // turquoise pour le TEXTE (contraste AA)
  rose: '#F5B5C8', // accents doux
  corail: '#FF8A65', // accent alerte / gyrophare logo

  // ── Types d'alerte ──
  agression: '#E53935',
  homophobe: '#8E24AA',
  pickpocket: '#FB8C00',
  cactus: '#43A047',
  lostLuggage: '#1E3A8A', // bleu marine — type « Bagage oublié » [V1.5, preview]
  abduction: '#B45309', // ocre — type « Enlèvement » [V2, preview]
  childSafety: '#831843', // bordeaux — type « Comportement suspect envers mineurs » [V2, preview]

  // ── Neutres ──
  noir: '#1A1A1A', // CTA, texte fort
  text: '#1A1A1A', // (compat) texte principal
  grisTexte: '#4A4A4A', // corps de texte
  textSecondary: '#8E8E93', // (compat) labels, hints
  border: '#E5E5E7', // (compat) bordures
  handle: '#D1D1D6', // poignée des bottom sheets

  surface: '#FFFFFF', // cards, modales
  background: '#FFFFFF', // (compat) = surface blanche
  fond: '#FAFAFA', // fond d'écran

  primary: '#1A1A1A', // (compat) noir CTA
} as const;
