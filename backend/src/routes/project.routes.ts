import { Router } from 'express';
import {
  createProjectHandler,
  getAllProjectsHandler,
  getProjectByIdHandler,
  updateProjectHandler,
  deleteProjectHandler
} from '@/controllers/project.controller';

const router = Router();

router.post('/', createProjectHandler);
router.get('/', getAllProjectsHandler);
router.get('/:id', getProjectByIdHandler);
router.patch('/:id', updateProjectHandler);
router.delete('/:id', deleteProjectHandler);

export default router;