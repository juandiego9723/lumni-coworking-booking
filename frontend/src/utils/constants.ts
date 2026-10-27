import { RoomSize } from '../types';

export const ROOMS_CATALOG = [
  { id: 1, size: 'SMALL' as RoomSize, name: 'Sala Pequeña', capacity: '1 - 4 personas', rate: 40000, color: 'emerald' },
  { id: 2, size: 'MEDIUM' as RoomSize, name: 'Sala Mediana', capacity: '5 - 8 personas', rate: 70000, color: 'blue' },
  { id: 3, size: 'LARGE' as RoomSize, name: 'Sala Grande', capacity: '9 - 16 personas', rate: 120000, color: 'purple' },
];

export const SERVICE_PRICES = {
  projector: 20000,
  coffee: 10000,
};

export const LOCAL_STORAGE_KEYS = {
  DRAFT_ID: 'lumni_active_draft_id',
  AI_CHAT_SESSION_ID: 'lumni_ai_chat_session_id',
  ACTIVE_ROLE: 'lumni_active_role',
};

