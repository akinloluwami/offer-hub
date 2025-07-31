export interface Project {
  id: string;
  client_id: string;
  title: string;
  description: string;
  category: string;
  budget: number;
  status: ProjectStatus;
  created_at: string;
}

export interface ProjectWithClient {
  id: string;
  client_id: string;
  title: string;
  description: string;
  category: string;
  budget: number;
  status: ProjectStatus;
  created_at: string;
  client: {
    id: string;
    name: string;
    username: string;
    email: string;
  };
}

export interface CreateProjectDTO {
  client_id: string;
  title: string;
  description: string;
  category: string;
  budget: number;
}

export interface UpdateProjectDTO {
  title?: string;
  description?: string;
  category?: string;
  budget?: number;
  status?: ProjectStatus;
}

export interface ProjectFilters {
  category?: string;
  budget_min?: number;
  budget_max?: number;
  status?: ProjectStatus;
  page?: number;
  limit?: number;
}

export enum ProjectStatus {
  PENDING = "pending",
  IN_PROGRESS = "in_progress",
  COMPLETED = "completed",
  CANCELLED = "cancelled",
}

export const PROJECT_STATUS_TRANSITIONS: Record<
  ProjectStatus,
  ProjectStatus[]
> = {
  [ProjectStatus.PENDING]: [ProjectStatus.IN_PROGRESS, ProjectStatus.CANCELLED],
  [ProjectStatus.IN_PROGRESS]: [
    ProjectStatus.COMPLETED,
    ProjectStatus.CANCELLED,
  ],
  [ProjectStatus.COMPLETED]: [],
  [ProjectStatus.CANCELLED]: [],
};
