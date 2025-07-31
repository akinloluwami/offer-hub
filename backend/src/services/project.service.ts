import { supabase } from "@/lib/supabase/supabase";
import {
  CreateProjectDTO,
  UpdateProjectDTO,
  ProjectFilters,
  Project,
  ProjectWithClient,
  ProjectStatus,
  PROJECT_STATUS_TRANSITIONS,
} from "@/types/project.types";

class ProjectService {
  async createProject(projectData: CreateProjectDTO): Promise<Project> {
    const { client_id, title, description, category, budget } = projectData;

    // First, verify that the user exists and is a client
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id, is_freelancer")
      .eq("id", client_id)
      .single();

    if (userError || !user) {
      throw new Error("User not found");
    }

    if (user.is_freelancer) {
      throw new Error("Only clients can create projects");
    }

    // Create the project
    const { data: project, error } = await supabase
      .from("projects")
      .insert({
        client_id,
        title: title.trim(),
        description: description.trim(),
        category: category.trim(),
        budget,
        status: ProjectStatus.PENDING,
      })
      .select(
        `
        id,
        client_id,
        title,
        description,
        category,
        budget,
        status,
        created_at
      `
      )
      .single();

    if (error) {
      throw new Error(`Failed to create project: ${error.message}`);
    }

    return project;
  }

  async getAllProjects(
    filters: ProjectFilters
  ): Promise<{ projects: ProjectWithClient[]; total: number }> {
    const {
      category,
      budget_min,
      budget_max,
      status,
      page = 1,
      limit = 10,
    } = filters;

    let query = supabase.from("projects").select(
      `
        id,
        client_id,
        title,
        description,
        category,
        budget,
        status,
        created_at,
        users!inner (
          id,
          name,
          username,
          email
        )
      `,
      { count: "exact" }
    );

    // Apply filters
    if (category) {
      query = query.ilike("category", `%${category}%`);
    }

    if (budget_min !== undefined) {
      query = query.gte("budget", budget_min);
    }

    if (budget_max !== undefined) {
      query = query.lte("budget", budget_max);
    }

    if (status) {
      query = query.eq("status", status);
    }

    // Add pagination
    const offset = (page - 1) * limit;
    query = query.range(offset, offset + limit - 1);

    // Order by creation date (newest first)
    query = query.order("created_at", { ascending: false });

    const { data: projects, error, count } = await query;

    if (error) {
      throw new Error(`Failed to fetch projects: ${error.message}`);
    }

    // Transform the data to include client info
    const projectsWithClient: ProjectWithClient[] = (projects || []).map(
      (project) => {
        const user = Array.isArray(project.users)
          ? project.users[0]
          : project.users;

        return {
          id: project.id,
          client_id: project.client_id,
          title: project.title,
          description: project.description,
          category: project.category,
          budget: project.budget,
          status: project.status,
          created_at: project.created_at,
          client: {
            id: user?.id,
            name: user?.name,
            username: user?.username,
            email: user?.email,
          },
        };
      }
    );

    return {
      projects: projectsWithClient,
      total: count || 0,
    };
  }

  async getProjectById(projectId: string): Promise<ProjectWithClient | null> {
    const { data: project, error } = await supabase
      .from("projects")
      .select(
        `
        id,
        client_id,
        title,
        description,
        category,
        budget,
        status,
        created_at,
        users!inner (
          id,
          name,
          username,
          email
        )
      `
      )
      .eq("id", projectId)
      .single();

    if (error || !project) {
      return null;
    }

    const user = Array.isArray(project.users)
      ? project.users[0]
      : project.users;

    return {
      id: project.id,
      client_id: project.client_id,
      title: project.title,
      description: project.description,
      category: project.category,
      budget: project.budget,
      status: project.status,
      created_at: project.created_at,
      client: {
        id: user?.id,
        name: user?.name,
        username: user?.username,
        email: user?.email,
      },
    };
  }

  async updateProject(
    projectId: string,
    updateData: UpdateProjectDTO,
    clientId?: string
  ): Promise<Project | null> {
    // First, check if the project exists and get the owner
    const { data: existingProject, error: fetchError } = await supabase
      .from("projects")
      .select("id, client_id, status")
      .eq("id", projectId)
      .single();

    if (fetchError || !existingProject) {
      return null;
    }

    // If clientId is provided, check ownership
    if (clientId && existingProject.client_id !== clientId) {
      throw new Error("Unauthorized: You can only update your own projects");
    }

    // Validate status transition if status is being updated
    if (updateData.status && updateData.status !== existingProject.status) {
      const allowedTransitions =
        PROJECT_STATUS_TRANSITIONS[existingProject.status as ProjectStatus];
      if (!allowedTransitions.includes(updateData.status)) {
        throw new Error(
          `Invalid status transition from ${existingProject.status} to ${updateData.status}`
        );
      }
    }

    // Prepare update data
    const updatedData: any = {
      ...updateData,
    };

    // Remove undefined values
    Object.keys(updatedData).forEach((key) => {
      if (updatedData[key] === undefined) {
        delete updatedData[key];
      }
    });

    // Trim string fields
    if (updatedData.title) updatedData.title = updatedData.title.trim();
    if (updatedData.description)
      updatedData.description = updatedData.description.trim();
    if (updatedData.category)
      updatedData.category = updatedData.category.trim();

    const { data: project, error } = await supabase
      .from("projects")
      .update(updatedData)
      .eq("id", projectId)
      .select(
        `
        id,
        client_id,
        title,
        description,
        category,
        budget,
        status,
        created_at
      `
      )
      .single();

    if (error) {
      throw new Error(`Failed to update project: ${error.message}`);
    }

    return project;
  }

  async deleteProject(projectId: string, clientId?: string): Promise<boolean> {
    // First, check if the project exists and get the owner
    const { data: existingProject, error: fetchError } = await supabase
      .from("projects")
      .select("id, client_id, status")
      .eq("id", projectId)
      .single();

    if (fetchError || !existingProject) {
      return false;
    }

    // If clientId is provided, check ownership
    if (clientId && existingProject.client_id !== clientId) {
      throw new Error("Unauthorized: You can only delete your own projects");
    }

    // Only allow deletion if project is still pending
    if (existingProject.status !== ProjectStatus.PENDING) {
      throw new Error("Can only delete projects that are still pending");
    }

    // Soft delete by setting status to cancelled
    const { error } = await supabase
      .from("projects")
      .update({
        status: ProjectStatus.CANCELLED,
      })
      .eq("id", projectId);

    if (error) {
      throw new Error(`Failed to delete project: ${error.message}`);
    }

    return true;
  }

  // Additional utility methods
  async getProjectsByClientId(clientId: string): Promise<Project[]> {
    const { data: projects, error } = await supabase
      .from("projects")
      .select(
        `
        id,
        client_id,
        title,
        description,
        category,
        budget,
        status,
        created_at
      `
      )
      .eq("client_id", clientId)
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch client projects: ${error.message}`);
    }

    return projects || [];
  }

  async getProjectCategories(): Promise<string[]> {
    const { data: categories, error } = await supabase
      .from("projects")
      .select("category")
      .neq("status", ProjectStatus.CANCELLED);

    if (error) {
      throw new Error(`Failed to fetch categories: ${error.message}`);
    }

    // Get unique categories
    const uniqueCategories = [
      ...new Set(categories?.map((item) => item.category) || []),
    ];
    return uniqueCategories.sort();
  }
}

export const projectService = new ProjectService();
