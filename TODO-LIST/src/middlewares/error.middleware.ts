import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/AppError";

const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
    let error = err;

    if (!(error instanceof AppError)) {
        const statusCode = error.statusCode || error instanceof SyntaxError ? 400 : 500;
        const message = error.message || "Something went wrong";
        error = new AppError(statusCode, message, error?.errors || [], error.stack);
    }

    const response = {
        ...error,
        message: error.message,
        ...(process.env.NODE_ENV === "development" ? { stack: error.stack } : {}),
    };

    res.status(error.statusCode).json(response);
};

export { errorHandler };
