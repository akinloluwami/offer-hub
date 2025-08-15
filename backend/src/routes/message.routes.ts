import { Router } from 'express';
import { MessageController } from '@/controllers/message.controller';

const router = Router();


router.post('/', MessageController.sendMessage);

router.get('/conversation/:conversationId', MessageController.getMessagesByConversationId);

router.get('/:messageId', MessageController.getMessageById);

router.put('/:conversationId/mark-read', MessageController.markMessagesAsRead);

export default router;