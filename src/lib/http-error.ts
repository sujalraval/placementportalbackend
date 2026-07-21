/// Anything thrown that isn't an ApiError becomes a 500 with no detail
/// leaked. Throw these for anything the client is allowed to see.
export class ApiError extends Error {
  constructor(
    readonly status: number,
    override readonly message: string,
    readonly code: string,
    readonly details?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }

  static badRequest(message = 'Bad request', details?: unknown) {
    return new ApiError(400, message, 'BAD_REQUEST', details);
  }

  static unauthorized(message = 'Authentication required') {
    return new ApiError(401, message, 'UNAUTHORIZED');
  }

  static forbidden(message = 'You do not have access to this resource') {
    return new ApiError(403, message, 'FORBIDDEN');
  }

  static notFound(message = 'Not found') {
    return new ApiError(404, message, 'NOT_FOUND');
  }

  static conflict(message = 'Conflict', details?: unknown) {
    return new ApiError(409, message, 'CONFLICT', details);
  }

  static unprocessable(message = 'Unprocessable', details?: unknown) {
    return new ApiError(422, message, 'UNPROCESSABLE', details);
  }

  static internal(message = 'Internal server error', details?: unknown) {
    return new ApiError(500, message, 'INTERNAL_SERVER_ERROR', details);
  }
}
