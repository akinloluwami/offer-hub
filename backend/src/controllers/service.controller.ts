import { Request, Response, NextFunction } from "express";
import { serviceService } from "@/services/service.service";
import {
  CreateServiceDTO,
  UpdateServiceDTO,
  ServiceFilters,
} from "@/types/service.types";

export const createServiceHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => { 
    const serviceData: CreateServiceDTO = req.body;

    // Validate required fields
    const { user_id, title, description, category, min_price, max_price } =
      serviceData;

    if (
      !user_id ||
      !title ||
      !description ||
      !category ||
      min_price === undefined ||
      max_price === undefined
    ) {
      res.status(400).json({
        success: false,
        message:
          "Missing required fields: user_id, title, description, category, min_price, max_price",
      });
      return;
    }

    // Validate price range
    if (min_price < 0 || max_price < 0 || min_price > max_price) {
      res.status(400).json({
        success: false,
        message:
          "Invalid price range. min_price and max_price must be positive, and min_price must be less than or equal to max_price",
      });
      return;
    }

    const newService = await serviceService.createService(serviceData);

    res.status(201).json({
      success: true,
      message: "Service created successfully",
      data: newService,
    });
  
};

export const getAllServicesHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {

    const filters: ServiceFilters = {
      category: req.query.category as string,
      min_price: req.query.min
        ? parseFloat(req.query.min as string)
        : undefined,
      max_price: req.query.max
        ? parseFloat(req.query.max as string)
        : undefined,
      keyword: req.query.keyword as string,
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

    const result = await serviceService.getAllServices(filters);

    res.status(200).json({
      success: true,
      message: "Services retrieved successfully",
      data: result.services,
      pagination: {
        current_page: filters.page || 1,
        total_pages: Math.ceil(result.total / (filters.limit || 10)),
        total_services: result.total,
        per_page: filters.limit || 10,
      },
    });
 
};

export const getServiceByIdHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {

    const { id } = req.params;

    // Validate UUID format
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      res.status(400).json({
        success: false,
        message: "Invalid service ID format",
      });
      return;
    }

    const service = await serviceService.getServiceById(id);

    if (!service) {
      res.status(404).json({
        success: false,
        message: "Service not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Service retrieved successfully",
      data: service,
    });
 
};

export const updateServiceHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {

    const { id } = req.params;
    const updateData: UpdateServiceDTO = req.body;

    // Validate UUID format
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      res.status(400).json({
        success: false,
        message: "Invalid service ID format",
      });
      return;
    }

    // Validate price range if provided
    if (
      updateData.min_price !== undefined &&
      updateData.max_price !== undefined
    ) {
      if (
        updateData.min_price < 0 ||
        updateData.max_price < 0 ||
        updateData.min_price > updateData.max_price
      ) {
        res.status(400).json({
          success: false,
          message:
            "Invalid price range. Prices must be positive, and min_price must be less than or equal to max_price",
        });
        return;
      }
    }

    const updatedService = await serviceService.updateService(id, updateData);

    if (!updatedService) {
      res.status(404).json({
        success: false,
        message: "Service not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Service updated successfully",
      data: updatedService,
    });
  
};

export const deleteServiceHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {

    const { id } = req.params;
    // const userId = req.body.user_id;

    // Validate UUID format
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      res.status(400).json({
        success: false,
        message: "Invalid service ID format",
      });
      return;
    }

    const deleted = await serviceService.deleteService(id,);

    if (!deleted) {
      res.status(404).json({
        success: false,
        message: "Service not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Service deleted successfully",
    });
 
};
