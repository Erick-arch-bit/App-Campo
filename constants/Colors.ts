// constants/Colors.ts — COLORES INSTITUCIONALES GOBIERNO DE HIDALGO

export const Colors = {
  // ── Primarios institucionales ─────────────────────────────
  guinda:        '#621132',   // Pantone 7421 — color dominante
  guindaDark:    '#3d0b20',   // Hover / pressed
  guindaLight:   '#a02555',   // Variante clara
  guinda50:      '#fff5f7',   // Background suave
  guinda100:     '#fdf0f3',   // Row hover
  guinda200:     '#f3c8d5',   // Bordes suaves

  dorado:        '#b38e5d',   // Pantone 465 — acentos
  doradoDark:    '#7d5f30',   // Dorado oscuro
  doradoLight:   '#c9a87a',   // Dorado claro
  dorado100:     '#f8f0e4',   // Fondo crema

  // ── Neutros ───────────────────────────────────────────────
  blanco:        '#FFFFFF',
  fondoApp:      '#F9FAFB',   // Fondo general de pantallas
  fondoCard:     '#FFFFFF',   // Cards y formularios
  borde:         '#E5E7EB',   // Separadores
  textoMain:     '#111827',   // Texto principal
  textoSecundario:'#4B5563',  // Texto secundario
  textoPlaceholder:'#9CA3AF', // Placeholders

  // ── Semánticos ────────────────────────────────────────────
  success:       '#16a34a',
  successBg:     '#dcfce7',
  warning:       '#d97706',
  warningBg:     '#fef9c3',
  danger:        '#dc2626',
  dangerBg:      '#fee2e2',
  info:          '#2563eb',
  infoBg:        '#dbeafe',
} as const
