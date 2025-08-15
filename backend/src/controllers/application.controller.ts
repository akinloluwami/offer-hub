import { Request, Response } from 'express';
import {
  createApplication,
  getApplicationsByProject,
  updateApplicationStatus
} from '../services/application.service';

export const createApplicationHandler = async (req: Request, res: Response) => {

    const { project_id, freelancer_id, message } = req.body;
    const application = await createApplication({
      project_id,
      freelancer_id,
      message
    });
    res.status(201).json(application);
 
};

export const getApplicationsByProjectHandler = async (req: Request, res: Response) => {
  
    const { id } = req.params;
    const applications = await getApplicationsByProject(id);
    res.json(applications);

};

export const updateApplicationStatusHandler = async (req: Request, res: Response) => {

    const { id } = req.params;
    const { status } = req.body;
    const application = await updateApplicationStatus(id, status);
    res.json(application);
  
};
