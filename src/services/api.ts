import type {
  ApiResponse,
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  GoogleAuthRequest,
  User,
  Conversation,
  ConversationsResponse,
  Message,
  MessagesResponse,
  ProfileUpdateRequest,
  ExportDataResponse,
} from '@/types';

// Base API URL - Replace with your backend URL
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

// Helper function for API calls
async function apiCall<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const token = localStorage.getItem('auth_token');
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.error || 'An error occurred' };
    }

    return { success: true, data };
  } catch (error) {
    return { success: false, error: 'Network error. Please try again.' };
  }
}

// Auth API
export const authApi = {
  login: (credentials: LoginRequest) =>
    apiCall<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    }),

  register: (data: RegisterRequest) =>
    apiCall<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  googleAuth: (data: GoogleAuthRequest) =>
    apiCall<AuthResponse>('/auth/google', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  logout: () =>
    apiCall<void>('/auth/logout', {
      method: 'POST',
    }),

  forgotPassword: (email: string) =>
    apiCall<void>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  resetPassword: (token: string, password: string) =>
    apiCall<void>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, password }),
    }),
};

// User API
export const userApi = {
  getProfile: () => apiCall<User>('/user/profile'),

  updateProfile: (data: ProfileUpdateRequest) =>
    apiCall<User>('/user/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  exportData: () => apiCall<ExportDataResponse>('/user/export'),

  deleteAccount: () =>
    apiCall<void>('/user/delete', {
      method: 'DELETE',
    }),

  updatePassword: (currentPassword: string, newPassword: string) =>
    apiCall<void>('/user/password', {
      method: 'PUT',
      body: JSON.stringify({ currentPassword, newPassword }),
    }),
};

// Conversations API
export const conversationsApi = {
  getAll: () => apiCall<ConversationsResponse>('/conversations'),

  create: (title?: string) =>
    apiCall<Conversation>('/conversations', {
      method: 'POST',
      body: JSON.stringify({ title }),
    }),

  delete: (id: string) =>
    apiCall<void>(`/conversations/${id}`, {
      method: 'DELETE',
    }),

  deleteAll: () =>
    apiCall<void>('/conversations', {
      method: 'DELETE',
    }),

  getMessages: (id: string) =>
    apiCall<MessagesResponse>(`/conversations/${id}/messages`),

  // Streaming message - returns a ReadableStream
  sendMessage: async (conversationId: string, content: string): Promise<Response> => {
    const token = localStorage.getItem('auth_token');
    
    return fetch(`${API_BASE_URL}/conversations/${conversationId}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: JSON.stringify({ content }),
    });
  },
};

// Expected API Response Structures (for your backend reference)
export const apiResponseStructures = {
  // POST /auth/login
  loginResponse: {
    user: {
      id: 'string',
      email: 'string',
      name: 'string',
      avatar: 'string (optional)',
      createdAt: 'ISO date string',
    },
    token: 'JWT token string',
  },

  // POST /auth/register
  registerResponse: {
    user: {
      id: 'string',
      email: 'string',
      name: 'string',
      createdAt: 'ISO date string',
    },
    token: 'JWT token string',
  },

  // GET /conversations
  conversationsResponse: {
    conversations: [
      {
        id: 'string',
        title: 'string',
        createdAt: 'ISO date string',
        updatedAt: 'ISO date string',
        preview: 'string (first message preview)',
      },
    ],
  },

  // GET /conversations/:id/messages
  messagesResponse: {
    messages: [
      {
        id: 'string',
        conversationId: 'string',
        role: "'user' | 'assistant'",
        content: 'string',
        createdAt: 'ISO date string',
      },
    ],
  },

  // POST /conversations/:id/messages (Streaming Response)
  // Returns a stream of Server-Sent Events (SSE):
  // data: {"content": "Hello", "done": false}
  // data: {"content": " world", "done": false}
  // data: {"content": "", "done": true}
  streamingFormat: 'Server-Sent Events (SSE) with JSON chunks',

  // GET /user/export
  exportResponse: {
    conversations: 'Array of all conversations',
    messages: 'Array of all messages',
    exportedAt: 'ISO date string',
  },
};
