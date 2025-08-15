import { Router } from 'express';
import { ConversationController } from '@/controllers/conversation.controller';

const router = Router();


router.post('/', ConversationController.createConversation);

router.get('/user/:userId', ConversationController.getConversationsByUserId);

router.get('/:conversationId', ConversationController.getConversationById);

export default router;