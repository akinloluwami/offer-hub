import { Request, Response, NextFunction } from "express";
import { projectService } from "@/services/project.service";
import {
  CreateProjectDTO,
  UpdateProjectDTO,
  ProjectFilters,
  ProjectStatus,
} from "@/types/project.types";

export const createProjectHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const projectData: CreateProjectDTO = req.body;

    // Validate required fields
    const { client_id, title, description, category, budget } = projectData;

    if (
      !client_id ||
      !title ||
      !description ||
      !category ||
      budget === undefined
    ) {
      res.status(400).json({
        success: false,
        message:
          "Missing required fields: client_id, title, description, category, budget",
      });
      return;
    }

    // Validate budget
    if (budget < 0) {
      res.status(400).json({
        success: false,
        message: "Budget must be a positive number",
      });
      return;
    }

    const newProject = await projectService.createProject(projectData);

    res.status(201).json({
      success: true,
      message: "Project created successfully",
      data: newProject,
    });
  } catch (error: any) {
    if (error.message === "Only clients can create projects") {
      res.status(403).json({
        success: false,
        message: "Only clients can create projects",
      });
      return;
    }

    if (error.message === "User not found") {
      res.status(404).json({
        success: false,
        message: "User not found",
      });
      return;
    }

    next(error);
  }
};

export const getAllProjectsHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const filters: ProjectFilters = {
      category: req.query.category as string,
      budget_min: req.query.budget_min
        ? parseFloat(req.query.budget_min as string)
        : undefined,
      budget_max: req.query.budget_max
        ? parseFloat(req.query.budget_max as string)
        : undefined,
      status: req.query.status as ProjectStatus,
      page: req.query.page ? parseInt(req.query.page as string) : 1,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 10,
    };

    // Validate pagination parameters
    if (filters.page && filters.page < 1) {
      res.status(400).json({
        success: false,
        message: "Page number must be greater than 0",
      });
      return;
    }

    if (filters.limit && (filters.limit < 1 || filters.limit > 50)) {
      res.status(400).json({
        success: false,
        message: "Limit must be between 1 and 50",
      });
      return;
    }

    // Validate status if provided
    if (
      filters.status &&
      !Object.values(ProjectStatus).includes(filters.status)
    ) {
      res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${Object.values(
          ProjectStatus
        ).join(", ")}`,
      });
      return;
    }

    const result = await projectService.getAllProjects(filters);

    res.status(200).json({
      success: true,
      message: "Projects retrieved successfully",
      data: result.projects,
      pagination: {
        current_page: filters.page || 1,
        total_pages: Math.ceil(result.total / (filters.limit || 10)),
        total_projects: result.total,
        per_page: filters.limit || 10,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getProjectByIdHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    // Validate UUID format
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      res.status(400).json({
        success: false,
        message: "Invalid project ID format",
      });
      return;
    }

    const project = await projectService.getProjectById(id);

    if (!project) {
      res.status(404).json({
        success: false,
        message: "Project not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Project retrieved successfully",
      data: project,
    });
  } catch (error) {
    next(error);
  }
};

export const updateProjectHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const updateData: UpdateProjectDTO = req.body;

    // Validate UUID format
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      res.status(400).json({
        success: false,
        message: "Invalid project ID format",
      });
      return;
    }

    // Validate budget if provided
    if (updateData.budget !== undefined && updateData.budget < 0) {
      res.status(400).json({
        success: false,
        message: "Budget must be a positive number",
      });
      return;
    }

    // Validate status if provided
    if (
      updateData.status &&
      !Object.values(ProjectStatus).includes(updateData.status)
    ) {
      res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${Object.values(
          ProjectStatus
        ).join(", ")}`,
      });
      return;
    }

    const updatedProject = await projectService.updateProject(id, updateData);

    if (!updatedProject) {
      res.status(404).json({
        success: false,
        message: "Project not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Project updated successfully",
      data: updatedProject,
    });
  } catch (error: any) {
    if (
      error.message === "Unauthorized: You can only update your own projects"
    ) {
      res.status(403).json({
        success: false,
        message: "You can only update your own projects",
      });
      return;
    }

    if (error.message.includes("Invalid status transition")) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
      return;
    }

    next(error);
  }
};

export const deleteProjectHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    // Validate UUID format
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      res.status(400).json({
        success: false,
        message: "Invalid project ID format",
      });
      return;
    }

    const deleted = await projectService.deleteProject(id);

    if (!deleted) {
      res.status(404).json({
        success: false,
        message: "Project not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Project deleted successfully",
    });
  } catch (error: any) {
    if (
      error.message === "Unauthorized: You can only delete your own projects"
    ) {
      res.status(403).json({
        success: false,
        message: "You can only delete your own projects",
      });
      return;
    }

    if (error.message === "Can only delete projects that are still pending") {
      res.status(400).json({
        success: false,
        message: "Can only delete projects that are still pending",
      });
      return;
    }

    next(error);
  }
};
