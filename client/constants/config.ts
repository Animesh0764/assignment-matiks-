export const API_BASE_URL = 
  process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8080';

export const API_ENDPOINTS = {
  leaderboard: '/api/leaderboard',
  search: '/api/search',
  simulateUpdate: '/api/simulate-update',
  health: '/api/health',
};

export const PAGINATION = {
  pageSize: 50,
};

export const COLORS = {
  primary: '#6366f1',
  secondary: '#8b5cf6',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  background: '#f9fafb',
  backgroundDark: '#111827',
  card: '#ffffff',
  cardDark: '#1f2937',
  text: '#111827',
  textDark: '#f9fafb',
  textSecondary: '#6b7280',
  border: '#e5e7eb',
  borderDark: '#374151',

  // Rank colors
  rank1: '#fbbf24', // Gold
  rank2: '#94a3b8', // Silver
  rank3: '#f97316', // Bronze
};
