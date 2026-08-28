import { Request } from "express";

/** Supabase JWT payload decoded by our auth middleware. */
export interface SupabaseJwtPayload {
  sub: string;        // user UUID
  email?: string;
  role?: string;      // 'authenticated' from Supabase, NOT app-level role
  aud: string;
  exp: number;
  iat: number;
}

/** Extended Express Request that carries the verified Supabase user. */
export interface AuthedRequest extends Request {
  user: SupabaseJwtPayload;
}

/** Row shape of our `profiles` table in Supabase. */
export interface Profile {
  id: string;
  email: string;
  role: "user" | "admin";
  stripe_customer_id: string | null;
  subscription_status: "free" | "active" | "past_due" | "canceled";
  created_at: string;
}

/** Normalized GitHub user stats returned by our service. */
export interface GitHubUserStats {
  login: string;
  name: string | null;
  avatarUrl: string;
  bio: string | null;
  publicRepos: number;
  followers: number;
  following: number;
  createdAt: string;
  /** Top repos by star count (limited for free tier). */
  topRepos: GitHubRepo[];
  /** Language breakdown across public repos. */
  languages: Record<string, number>;
}

export interface GitHubRepo {
  name: string;
  fullName: string;
  description: string | null;
  stars: number;
  forks: number;
  language: string | null;
  url: string;
  updatedAt: string;
}

export interface GHRepoHealth {
  total: number;
  breakdown: {
    recency: number;
    regularity: number;
    description: number;
    readme: number;
    license: number;
  };
};

/** Normalized repo insights returned by our service. */
export interface RepoInsights {
  fullName: string;
  description: string | null;
  stars: number;
  forks: number;
  openIssues: number;
  defaultBranch: string;
  languages: Record<string, number>;
  /** Recent commit activity (last N weeks). */
  weeklyCommits: number[];
  contributors: RepoContributor[];
  healthScore: GHRepoHealth;
}

export interface RepoContributor {
  login: string;
  avatarUrl: string;
  contributions: number;
}

/** Generic API error shape. */
export interface ApiError {
  message: string;
  code?: string;
  status: number;
}
