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
}
