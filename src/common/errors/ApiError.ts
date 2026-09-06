/** Typed HTTP error. The central handler in `src/app.ts` reads `status`. */
export class ApiError extends Error {
  readonly status: number;
  readonly details?: unknown;

  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }

  static badRequest(message: string, details?: unknown): ApiError {
    return new ApiError(400, message, details);
  }

  static unauthorized(message = "Unauthorized. Please login on your account."): ApiError {
    return new ApiError(401, message);
  }

  static forbidden(message = "Forbidden."): ApiError {
    return new ApiError(403, message);
  }

  static notFound(message = "Not found."): ApiError {
    return new ApiError(404, message);
  }

  static tooManyRequests(message: string, details?: unknown): ApiError {
    return new ApiError(429, message, details);
  }
}
