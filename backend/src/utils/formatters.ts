/**
 * Utilidades puras de formateo reutilizables en todo el backend (DRY).
 */

export function formatCOP(amount: number): string {
  return `$${amount.toLocaleString('es-CO')} COP`;
}

