import type { NextFunction, Request, RequestHandler, Response } from "express";
import { getSupabaseServerClient, isSupabaseServerConfigured } from "../services/supabase-server-client";

function unauthorized(res: Response): void {
  res.status(401).json({ error: "Authentication required" });
}

export const requireSupabaseAuth: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (!isSupabaseServerConfigured()) {
    res.status(503).json({ error: "Authentication service is not configured" });
    return;
  }

  const authorization = req.get("authorization") ?? "";
  const match = authorization.match(/^Bearer\s+(.+)$/i);
  if (!match?.[1]) {
    unauthorized(res);
    return;
  }

  const supabase = getSupabaseServerClient();
  if (!supabase) {
    res.status(503).json({ error: "Authentication service is not configured" });
    return;
  }

  try {
    const { data, error } = await supabase.auth.getUser(match[1]);
    if (error || !data.user) {
      unauthorized(res);
      return;
    }

    res.locals.supabaseUser = data.user;
    next();
  } catch {
    unauthorized(res);
  }
};
