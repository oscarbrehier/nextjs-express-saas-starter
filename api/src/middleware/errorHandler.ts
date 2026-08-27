import { Request, Response, NextFunction } from "express";

/** Lightweight HTTP error with a status code. */
export class HttpError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly code?: string
  ) {
    super(message);
    this.name = "HttpError";
  }
}

/** Factory so call-sites stay terse. */
export function createHttpError(
  status: number,
  message: string,
  code?: string
): HttpError {
  return new HttpError(status, message, code);
}

/** Central error handler — must be registered last in app.ts. */
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof HttpError) {
    res.status(err.status).json({
      error: { message: err.message, code: err.code ?? null },
    });
    return;
  }

  // Unknown error — log it and return a generic 500.
  console.error("[error]", err);
  res.status(500).json({
    error: { message: "Internal server error", code: null },
  });
}
