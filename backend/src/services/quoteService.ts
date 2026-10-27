import { PrismaClient, RoomSize } from '@prisma/client';
import { calculatePricing, validateSchedule } from '../domain/quoter';

const prisma = new PrismaClient();

export async function processQuote(data: { roomSize?: RoomSize; roomId?: number; date: string; startTime: string; durationHours: number }) {
  // 1. Validar reglas estructurales de horario
  const validation = validateSchedule(data.date, data.startTime, data.durationHours);
  if (!validation.isValid) {
    return { isAvailable: false, reason: validation.reason };
  }

  // 2. Buscar la sala por tamaño o ID
  let room = null;
  if (data.roomId) {
    room = await prisma.room.findUnique({ where: { id: data.roomId } });
  } else if (data.roomSize) {
    room = await prisma.room.findUnique({ where: { size: data.roomSize } });
  }

  if (!room) {
    return { isAvailable: false, reason: 'La sala seleccionada no existe.' };
  }

  // 3. Calcular fechas de inicio y fin (Timezone Colombia UTC-5)
  const startsAt = new Date(`${data.date}T${data.startTime}:00-05:00`);
  const endsAt = new Date(startsAt.getTime() + data.durationHours * 3600 * 1000);

  // 4. Verificar disponibilidad (cruces con reservas CONFIRMED)
  const overlappingBooking = await prisma.booking.findFirst({
    where: {
      roomId: room.id,
      status: 'CONFIRMED',
      AND: [
        { startsAt: { lt: endsAt } },
        { endsAt: { gt: startsAt } }
      ]
    }
  });

  const pricing = calculatePricing(room.size, data.durationHours, validation.isSaturday!);

  if (overlappingBooking) {
    // Buscar siguiente horario disponible el mismo día
    const suggestedStartTime = await findNextAvailableSlot(room.id, data.date, data.durationHours);
    return {
      isAvailable: false,
      reason: `La sala ${room.name} ya se encuentra reservada en el horario solicitado.`,
      suggestedNextSlot: suggestedStartTime,
      ...pricing
    };
  }

  return {
    roomId: room.id,
    roomName: room.name,
    isAvailable: true,
    ...pricing
  };
}

async function findNextAvailableSlot(roomId: number, dateStr: string, durationHours: number): Promise<string | null> {
  // Horario operativo de 07:00 (420 min) a 21:00 (1260 min) en bloques de 30 min
  const openingMinutes = 7 * 60;
  const closingMinutes = 21 * 60;
  const durationMinutes = durationHours * 60;

  for (let currentMin = openingMinutes; currentMin + durationMinutes <= closingMinutes; currentMin += 30) {
    const hours = Math.floor(currentMin / 60).toString().padStart(2, '0');
    const mins = (currentMin % 60).toString().padStart(2, '0');
    const startTimeStr = `${hours}:${mins}`;

    const startsAt = new Date(`${dateStr}T${startTimeStr}:00-05:00`);
    const endsAt = new Date(startsAt.getTime() + durationMinutes * 1000);

    const overlap = await prisma.booking.findFirst({
      where: {
        roomId,
        status: 'CONFIRMED',
        AND: [
          { startsAt: { lt: endsAt } },
          { endsAt: { gt: startsAt } }
        ]
      }
    });

    if (!overlap) {
      return startTimeStr;
    }
  }

  return null;
}
