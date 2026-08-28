/** Mirror of the API's public types — kept in sync manually. */

export interface GitHubUserStats {
  login: string;
  name: string | null;
  avatarUrl: string;
  bio: string | null;
  publicRepos: number;
  followers: number;
  following: number;
  createdAt: string;
  topRepos: GitHubRepo[];
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
}

export interface RepoInsights {
  fullName: string;
  description: string | null;
  stars: number;
  forks: number;
  openIssues: number;
  defaultBranch: string;
  languages: Record<string, number>;
  weeklyCommits: number[];
  contributors: RepoContributor[];
  healthScore: GHRepoHealth;
}

export interface RepoContributor {
  login: string;
  avatarUrl: string;
  contributions: number;
}

export type SubscriptionStatus = "free" | "active" | "past_due" | "canceled";

export interface Profile {
  id: string;
  email: string;
  role: "user" | "admin";
  stripe_customer_id: string | null;
  subscription_status: SubscriptionStatus;
  created_at: string;
}

export interface ApiResponse<T> {
  data: T;
  tier: "free" | "pro";
}
