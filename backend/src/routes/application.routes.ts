import { Router } from 'express';
import {
  createApplicationHandler,
  getApplicationsByProjectHandler,
  updateApplicationStatusHandler
} from '@/controllers/application.controller';

const router = Router();

router.post('/', createApplicationHandler);
router.get('/project/:id', getApplicationsByProjectHandler);
router.patch('/:id', updateApplicationStatusHandler);

export default router;
