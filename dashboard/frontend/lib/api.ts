/**
 * API client for backend communication
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export type Issue = {
  id: string;
  image_id: string | null;  // URL to image in Supabase storage
  group_id: number | null;
  description: string | null;
  geolocation: string | null;
  timestamp: string;
  status: 'complete' | 'incomplete' | null;
  priority: number | null;  // 1 = Low, 2 = Medium, 3 = High
  uid?: string | null;  // User ID who created the issue
};

export type IssueStats = {
  total_issues: number;
  resolved: number;
  resolution_rate: number;
  in_progress: number;
  critical: number;
};

export type Group = {
  id: number;
  name: string;
  created_at?: string;
};

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: response.statusText }));
        throw new Error(error.detail || `HTTP ${response.status}`);
      }

      return response.json();
    } catch (error) {
      console.error(`API request failed: ${endpoint}`, error);
      throw error;
    }
  }

  // Issues endpoints
  async getIssues(params?: { status?: string; limit?: number }): Promise<Issue[]> {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append('status', params.status);
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    
    const query = queryParams.toString();
    return this.request<Issue[]>(`/api/issues${query ? `?${query}` : ''}`);
  }

  async getIssueStats(): Promise<IssueStats> {
    return this.request<IssueStats>('/api/issues/stats');
  }

  async getIssue(issueId: string): Promise<Issue> {
    return this.request<Issue>(`/api/issues/${issueId}`);
  }

  async getGroups(): Promise<Group[]> {
    return this.request<Group[]>('/api/issues/groups/all');
  }

  async updateIssue(issueId: string, updates: Partial<Issue>): Promise<Issue> {
    return this.request<Issue>(`/api/issues/${issueId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  }

  async deleteIssue(issueId: string): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>(`/api/issues/${issueId}`, {
      method: 'DELETE',
    });
  }
}

export const apiClient = new ApiClient();

