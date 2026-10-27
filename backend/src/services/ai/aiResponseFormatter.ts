import { QuoteServiceResult } from '../quoteService';
import { formatCOP } from '../../utils/formatters';

export interface QuoteDisplayData {
  roomName: string;
  date: string;
  startTime: string;
  durationHours: number;
  baseAmount: number;
  discountAmount: number;
  surchargeAmount: number;
  totalAmount: number;
}

/**
 * Formatea la respuesta en Markdown cuando una sala está disponible y cotizada.
 */
export function formatAvailableQuoteReply(data: QuoteDisplayData): string {
  const discountLine =
    data.discountAmount > 0
      ? `• **Descuento por duración:** -${formatCOP(data.discountAmount)}\n`
      : '';
  const surchargeLine =
    data.surchargeAmount > 0
      ? `• **Recargo Sábado:** +${formatCOP(data.surchargeAmount)}\n`
      : '';

  return (
    `He cotizado tu solicitud en nuestro sistema:\n` +
    `• **Sala:** ${data.roomName}\n` +
    `• **Fecha y Hora:** ${data.date} a las ${data.startTime} (${data.durationHours}h)\n` +
    `• **Tarifa Base:** ${formatCOP(data.baseAmount)}\n` +
    discountLine +
    surchargeLine +
    `• **Total Estimado:** **${formatCOP(data.totalAmount)}**\n\n` +
    `¡La sala se encuentra disponible! Para generar tu borrador de reserva, por favor confírmame tu nombre y correo electrónico.`
  );
}

/**
 * Formatea la respuesta en Markdown cuando una sala no está disponible o existe solapamiento.
 */
export function formatUnavailableQuoteReply(quote: QuoteServiceResult): string {
  const reason = quote.reason || 'Horario no disponible';
  const suggested = quote.suggestedNextSlot;

  if (suggested) {
    return (
      `No es posible reservar en ese horario. Motivo: ${reason}\n` +
      `💡 Sin embargo, hay disponibilidad hoy mismo a partir de las **${suggested}**. ¿Deseas que cotice a esa hora?`
    );
  }

  return (
    `No es posible reservar en ese horario. Motivo: ${reason}\n` +
    `Por favor indícame otro horario o fecha de tu preferencia.`
  );
}

/**
 * Formatea la confirmación de creación de borrador (DRAFT).
 */
export function formatDraftCreatedReply(
  bookingId: number,
  roomName: string,
  date: string,
  startTime: string
): string {
  return (
    `¡Excelente! He creado tu reserva en **Borrador (DRAFT)** con el código **#${bookingId}**.\n\n` +
    `📋 **Resumen:** ${roomName} para el ${date} a las ${startTime}.\n\n` +
    `⚠️ **Importante:** Por políticas del coworking, el asistente no confirma reservas directamente. Para asegurar tu espacio, haz clic en el botón **'Confirmar Reserva'** en la pantalla.`
  );
}

