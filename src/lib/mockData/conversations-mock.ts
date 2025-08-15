import { Conversation } from '@/types/messaging';

export const conversations: Conversation[] = [
  { id: 'c1', participants: ['u1', 'u2'], lastMessageId: 'm2', unreadCount: 0 },
  { id: 'c2', participants: ['u1', 'u3'], lastMessageId: 'm3', unreadCount: 1 },
];