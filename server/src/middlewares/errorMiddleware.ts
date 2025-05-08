import { Request, Response, NextFunction } from "express";

// Define a custom error class (optional, for type safety)
class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = "HttpError";
  }
}

// Error-handling middleware
export const errorHandler = (
  err: Error | HttpError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Extract status code and message
  const status = err instanceof HttpError ? err.status : 500;
  const message = err.message || "Internal Server Error";

  // Log the error (optional, can integrate with Morgan or a custom logger)
  console.error(`[ERROR] ${req.method} ${req.url} - ${status} - ${message}`);

  // Send JSON response to client
  res.status(status).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }), // Include stack trace in dev
  });
};

// Utility to throw custom errors (optional)
export const throwError = (status: number, message: string) => {
  throw new HttpError(status, message);
};