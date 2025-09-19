export class ApiError extends Error {
  constructor(status, code, message, details) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
  static badRequest(message = 'Bad Request', details) { return new ApiError(400, 'BAD_REQUEST', message, details); }
  static unauthorized(message = 'Unauthorized') { return new ApiError(401, 'UNAUTHORIZED', message); }
  static forbidden(message = 'Forbidden') { return new ApiError(403, 'FORBIDDEN', message); }
  static notFound(message = 'Not Found') { return new ApiError(404, 'NOT_FOUND', message); }
  static conflict(message = 'Conflict') { return new ApiError(409, 'CONFLICT', message); }
  static tooMany(message = 'Too Many Requests') { return new ApiError(429, 'TOO_MANY_REQUESTS', message); }
  static internal(message = 'Internal Server Error') { return new ApiError(500, 'INTERNAL_SERVER_ERROR', message); }
}

export function mapError(err) {
  if (err instanceof ApiError) return err;
  return ApiError.internal();
}
