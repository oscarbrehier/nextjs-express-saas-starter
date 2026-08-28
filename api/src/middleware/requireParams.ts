/**
 * Rejects the request with 400 if any of the named route params is missing
 * or blank. Guards handlers that would otherwise call downstream services
 * (GitHub API, PDF generation) with an empty/undefined value.
 */
import { Request, Response, NextFunction } from "express";
import { createHttpError } from "./errorHandler";

export function requireParams(...names: string[]) {
	return (req: Request, res: Response, next: NextFunction): void => {
		for (const name of names) {
			const value = req.params[name];
			if (typeof value !== "string" || !value.trim()) {
				next(createHttpError(400, `Missing required parameter: ${name}`, "MISSING_PARAM"));
				return;
			}
		}
		next();
	};
}
