import { API_BASE_URL, API_ENDPOINTS, PAGINATION } from '../constants/config';

// API Types
export interface User {
  id: number;
  username: string;
  rating: number;
}

export interface UserWithRank extends User {
  globalRank: number;
}

export interface LeaderboardResponse {
  users: UserWithRank[];
  totalUsers: number;
  page: number;
  pageSize: number;
}

export interface SearchResponse {
  users: UserWithRank[];
  count: number;
}

// API Client
class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  async getLeaderboard(page: number = 1, pageSize: number = PAGINATION.pageSize): Promise<LeaderboardResponse> {
    const url = `${this.baseUrl}${API_ENDPOINTS.leaderboard}?page=${page}&size=${pageSize}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch leaderboard: ${response.statusText}`);
    }

    return response.json();
  }

  async searchUsers(username: string): Promise<SearchResponse> {
    const url = `${this.baseUrl}${API_ENDPOINTS.search}?username=${encodeURIComponent(username)}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Failed to search users: ${response.statusText}`);
    }

    return response.json();
  }

  async simulateUpdate(): Promise<void> {
    const url = `${this.baseUrl}${API_ENDPOINTS.simulateUpdate}`;
    const response = await fetch(url, { method: 'POST' });
    
    if (!response.ok) {
      throw new Error(`Failed to simulate update: ${response.statusText}`);
    }
  }

  async checkHealth(): Promise<any> {
    const url = `${this.baseUrl}${API_ENDPOINTS.health}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Health check failed: ${response.statusText}`);
    }

    return response.json();
  }
}

export const apiClient = new ApiClient(API_BASE_URL);
