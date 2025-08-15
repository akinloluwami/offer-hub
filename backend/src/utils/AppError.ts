import express from "express";

import { Request, Response, NextFunction } from "express";
export class AppError extends Error {
	public statusCode: number;
	constructor(message: string, statusCode = 400) {
		super(message);
		this.statusCode = statusCode;
		Error.captureStackTrace(this, this.constructor);
	}
}
export class NotFoundError extends AppError {
	constructor(message: string) {
		super(message, 404);
	}
}
export class BadRequestError extends AppError {
	constructor(message: string) {
		super(message, 400);
	}
}
export class InternalServerError extends AppError {
	constructor(message: string) {
		super(message, 500);
	}
}

export class ConflictError extends AppError {
	constructor(message: string) {
		super(message, 409);
	}
}

export class RequiredFieldsError extends AppError {
	constructor(message: string) {
		super(message, 422);
	}
}

export class ValidationError extends AppError {
	constructor(message: string) {
		super(message, 422);
	}
}

export class InvalidPayloadError extends AppError {
	constructor(message: string) {
		super(message, 400);
	}
}

export class MissingFieldsError extends AppError {
	constructor(message: string) {
		super(message, 422);
	}
}

export class ForbiddenError extends AppError {
	constructor(message: string) {
		super(message, 403);
	}
}

export class UnauthorizedError extends AppError {
	constructor(message: string) {
		super(message, 401);
	}
}

  
  export function ErrorHandler(
    err: unknown,
    req: Request,
    res: Response,
    _next: NextFunction
  ) {
    let statusCode = 500;
    let message = "Internal server error";
  
    if (err instanceof AppError) {
      statusCode = err.statusCode;
      message = err.message;
    } else if (err instanceof Error) {
      message = err.message;
    }
  
    return res.status(statusCode).json({
      success: false,
      status: statusCode,
      message,
      ...(process.env.NODE_ENV === "development" && { stack: (err as Error).stack }),
      timestamp: new Date().toISOString(),
    });
  }
  