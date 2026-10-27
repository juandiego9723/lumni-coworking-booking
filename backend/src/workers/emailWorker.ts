import { PrismaClient, EmailStatus } from '@prisma/client';

const prisma = new PrismaClient();

export const MAX_EMAIL_ATTEMPTS = 5;
export const BASE_BACKOFF_MS = 5000; // 5 segundos base

/**
 * Calcula el tiempo de espera con backoff exponencial.
 * Intento 1: 5s, Intento 2: 10s, Intento 3: 20s, Intento 4: 40s...
 */
export function calculateBackoffMs(attempts: number, baseMs: number = BASE_BACKOFF_MS): number {
  return baseMs * Math.pow(2, Math.max(0, attempts - 1));
}

// Buzón en memoria para captura local de envíos (auditoría e inspección en tests/desarrollo)
export interface CapturedEmail {
  id: number;
  bookingId: number;
  recipientEmail: string;
  subject: string;
  body: string;
  sentAt: Date;
}

export const capturedEmailsLog: CapturedEmail[] = [];

/**
 * Simula el envío de correo. Puede inyectarse un transportador personalizado o simular fallos.
 */
export async function sendEmailTransport(recipient: string, subject: string, body: string): Promise<boolean> {
  // Simulación: Si el correo contiene 'fail' en su dirección, simula un error de red del proveedor
  if (recipient.includes('fail@')) {
    throw new Error('Simulated SMTP connection failure: Connection timed out');
  }

  // Registro en consola estructurado
  console.log(`\n================== [CORREO SALIENTE] ==================`);
  console.log(`Para: ${recipient}`);
  console.log(`Asunto: ${subject}`);
  console.log(`Cuerpo:\n${body}`);
  console.log(`=======================================================\n`);

  return true;
}

/**
 * Procesa un lote de correos pendientes en EmailOutbox con soporte de reintentos exponenciales.
 */
export async function processPendingEmails(limit = 10): Promise<{ processed: number; succeeded: number; failed: number }> {
  const now = new Date();

  // Buscar correos PENDING listos para envío según su nextRetryAt
  const pendingEmails = await prisma.emailOutbox.findMany({
    where: {
      status: EmailStatus.PENDING,
      attempts: { lt: MAX_EMAIL_ATTEMPTS },
      nextRetryAt: { lte: now },
    },
    take: limit,
  });

  let succeeded = 0;
  let failed = 0;

  for (const item of pendingEmails) {
    const currentAttempt = item.attempts + 1;

    try {
      await sendEmailTransport(item.recipientEmail, item.subject, item.body);

      // Éxito: Marcar como SENT
      await prisma.emailOutbox.update({
        where: { id: item.id },
        data: {
          status: EmailStatus.SENT,
          sentAt: new Date(),
          attempts: currentAttempt,
          lastError: null,
        },
      });

      capturedEmailsLog.push({
        id: item.id,
        bookingId: item.bookingId,
        recipientEmail: item.recipientEmail,
        subject: item.subject,
        body: item.body,
        sentAt: new Date(),
      });

      succeeded++;
    } catch (error: any) {
      failed++;
      const errorMessage = error?.message || 'Error desconocido al enviar correo';

      if (currentAttempt >= MAX_EMAIL_ATTEMPTS) {
        // Superó el límite de reintentos: pasa a FAILED y será visible en el dashboard del admin
        await prisma.emailOutbox.update({
          where: { id: item.id },
          data: {
            status: EmailStatus.FAILED,
            attempts: currentAttempt,
            lastError: `Superó el límite de ${MAX_EMAIL_ATTEMPTS} reintentos. Último error: ${errorMessage}`,
          },
        });
        console.error(`[EMAIL WORKER] Correo ID ${item.id} (Booking #${item.bookingId}) falló definitivamente tras ${MAX_EMAIL_ATTEMPTS} intentos.`);
      } else {
        // Programar siguiente reintento con backoff exponencial
        const backoffMs = calculateBackoffMs(currentAttempt);
        const nextRetryDate = new Date(Date.now() + backoffMs);

        await prisma.emailOutbox.update({
          where: { id: item.id },
          data: {
            attempts: currentAttempt,
            nextRetryAt: nextRetryDate,
            lastError: `Intento ${currentAttempt} fallido: ${errorMessage}. Reintentando en ${backoffMs / 1000}s`,
          },
        });
        console.warn(`[EMAIL WORKER] Correo ID ${item.id} falló en intento ${currentAttempt}. Siguiente reintento programado para: ${nextRetryDate.toISOString()}`);
      }
    }
  }

  return { processed: pendingEmails.length, succeeded, failed };
}

let workerInterval: NodeJS.Timeout | null = null;

/**
 * Inicia el worker en segundo plano con polling periódico.
 */
export function startEmailWorker(pollIntervalMs = 5000): void {
  if (workerInterval) return;

  console.log(`[EMAIL WORKER] Servicio iniciado. Verificando outbox cada ${pollIntervalMs / 1000} segundos.`);

  workerInterval = setInterval(async () => {
    try {
      await processPendingEmails();
    } catch (err) {
      console.error('[EMAIL WORKER] Error no controlado en ciclo de polling:', err);
    }
  }, pollIntervalMs);
}

/**
 * Detiene el worker (útil para pruebas y graceful shutdown).
 */
export function stopEmailWorker(): void {
  if (workerInterval) {
    clearInterval(workerInterval);
    workerInterval = null;
    console.log('[EMAIL WORKER] Servicio detenido.');
  }
}

