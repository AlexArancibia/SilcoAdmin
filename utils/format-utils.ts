// Format currency
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: "PEN",
    minimumFractionDigits: 2,
  }).format(amount)
}

// Chart colors
export const COLORS = {
  primary: "#7b8af9",
  secondary: "#9e77ed",
  accent: "#f0abfc",
  success: "#34d399",
  warning: "#fbbf24",
  danger: "#f87171",
  info: "#60a5fa",
  muted: "#94a3b8",

  // Nuevos colores
  background: "#f9fafb",
  surface: "#ffffff",
  black: "#000000",
  white: "#ffffff",
  gray: "#6b7280",
  dark: "#1f2937",
  light: "#f3f4f6",
  primaryDark: "#4f46e5",
  secondaryDark: "#7c3aed",
  accentDark: "#c084fc",
  successDark: "#059669",
  warningDark: "#d97706",
  dangerDark: "#dc2626",
  infoDark: "#2563eb",
  border: "#e5e7eb",
  highlight: "#fde68a",
  shadow: "#00000033",
}

