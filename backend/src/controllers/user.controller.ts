import { Request, Response, NextFunction } from "express";
import { userService } from "@/services/user.service";
import { AppError, MissingFieldsError, NotFoundError, ValidationError } from "@/utils/AppError";

const uuidRegex =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const createUserHandler = async (req: Request, res: Response, next: NextFunction) => {

    const { wallet_address, username, name, bio, email, is_freelancer } = req.body;

    if (!wallet_address || !username) {
      throw new MissingFieldsError("Missing_required_fields");
    }

    const user = await userService.createUser({
      wallet_address,
      username,
      name,
      bio,
      email,
      is_freelancer,
    });

    res.status(201).json({
      success: true,
      message: "User_created_successfully",
      data: user,
    });
};

export const getUserByIdHandler = async (req: Request, res: Response, next: NextFunction) => {

    const { id } = req.params;

    if (!id) {
      throw new ValidationError("User_ID_is_required");
    }

    if (!uuidRegex.test(id)) {
      throw new ValidationError("Invalid_user_ID_format");
    }

    const user = await userService.getUserById(id);
    if (!user) throw new NotFoundError("User_not_found");

    res.status(200).json({
      success: true,
      message: "User_fetched_successfully",
      data: user,
    });
  
};

export const updateUserHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {

    const { id } = req.params;

    if (!id) throw new MissingFieldsError("User_ID_is_required");
    
    if (!uuidRegex.test(id)) throw new ValidationError("Invalid_user_ID_format");

    const updateData = req.body;
    const updatedUser = await userService.updateUser(id, updateData);

    if (!updatedUser) throw new NotFoundError("User_not_found");

    // Prepare response with only changed fields
    const changedFields: Record<string, any> = {};
    for (const key of Object.keys(updateData)) {
      if (updatedUser[key] !== undefined) {
        changedFields[key] = updatedUser[key];
      }
    }

    res.status(200).json({
      success: true,
      message: "User_updated_successfully",
      data: changedFields,
    });

};