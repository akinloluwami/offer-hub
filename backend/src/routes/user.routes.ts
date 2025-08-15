import { Router } from 'express';
import {
  createUserHandler,
  getUserByIdHandler,
  updateUserHandler
} from '@/controllers/user.controller';

const router = Router();

router.post('/', createUserHandler);
router.get('/:id', getUserByIdHandler);
router.patch('/:id', updateUserHandler);

export default router;