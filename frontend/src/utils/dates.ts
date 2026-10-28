export const BOGOTA_TIMEZONE = 'America/Bogota';

export function formatDate(dateStr?: string | null): string {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('es-CO', {
      timeZone: BOGOTA_TIMEZONE,
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return String(dateStr);
  }
}

export function formatBookingDate(dateStr?: string | null): string {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    const formatted = d.toLocaleDateString('es-CO', {
      timeZone: BOGOTA_TIMEZONE,
      weekday: 'long',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
    return formatted.charAt(0).toUpperCase() + formatted.slice(1);
  } catch {
    return String(dateStr);
  }
}

export function formatTime(dateStr?: string | null): string {
  if (!dateStr) return '--:--';
  try {
    const d = new Date(dateStr);
    return d.toLocaleTimeString('es-CO', {
      timeZone: BOGOTA_TIMEZONE,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  } catch {
    return '--:--';
  }
}

export function formatTimeRange(
  startsAt?: string | null,
  endsAt?: string | null,
  durationHours?: number
): string {
  if (!startsAt) return '--:--';
  const start = formatTime(startsAt);
  if (endsAt) {
    const end = formatTime(endsAt);
    return `${start} - ${end}`;
  }
  if (durationHours) {
    try {
      const d = new Date(startsAt);
      const endD = new Date(d.getTime() + durationHours * 3600 * 1000);
      const end = formatTime(endD.toISOString());
      return `${start} - ${end}`;
    } catch {
      return start;
    }
  }
  return start;
}

export function formatDateTime(dateStr?: string | null): string {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    return d.toLocaleString('es-CO', {
      timeZone: BOGOTA_TIMEZONE,
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  } catch {
    return String(dateStr);
  }
}
