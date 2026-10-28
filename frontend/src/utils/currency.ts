/**
 * Formateador de moneda oficial para Pesos Colombianos (COP)
 * Protegido contra valores nulos o NaN.
 */
export function formatCOP(val?: number | null): string {
  if (val === undefined || val === null || isNaN(val)) {
    return '$ 0';
  }
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(val);
}
