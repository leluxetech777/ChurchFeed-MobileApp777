import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { logger } from '../lib/logger';

class ApiClient {
  private baseURL: string;

  constructor() {
    this.baseURL = this.getBaseURL();
    logger.log('🌍 API Client initialized with URL:', this.baseURL);
  }

  private getBaseURL(): string {
    // Development mode: Prioritize Stripe testing tunnel, then fall back to LAN
    const stripeTestingUrl = process.env.EXPO_PUBLIC_STRIPE_TUNNEL_URL;
    const apiUrl = process.env.EXPO_PUBLIC_API_URL;
    
    if (stripeTestingUrl && stripeTestingUrl.trim() !== '') {
      logger.log('🔴 Using Stripe Testing Tunnel:', stripeTestingUrl);
      return stripeTestingUrl.trim();
    }
    
    if (!apiUrl) {
      throw new Error('EXPO_PUBLIC_API_URL is not configured');
    }
    
    logger.log('🏠 Using Development LAN:', apiUrl);
    return apiUrl;
  }


  // Method to refresh base URL (useful for hot reload scenarios)
  refreshBaseURL(): void {
    const newBaseURL = this.getBaseURL();
    if (newBaseURL !== this.baseURL) {
      logger.log('🔄 Base URL changed from', this.baseURL, 'to', newBaseURL);
      this.baseURL = newBaseURL;
    }
  }

  private async request(endpoint: string, options: RequestInit = {}): Promise<Response> {
    // Refresh URL before each request to support hot reload
    this.refreshBaseURL();
    
    const url = `${this.baseURL}${endpoint}`;
    
    const defaultHeaders = {
      'Content-Type': 'application/json',
      'User-Agent': 'ChurchFeed-Mobile-App/1.0.0',
    };

    const config: RequestInit = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...(options.headers || {}),
      },
    };

    logger.log('🚀 Making API request to:', url);
    logger.log('🔧 Method:', config.method || 'GET');
    
    try {
      const response = await fetch(url, config);
      logger.log('✅ Response status:', response.status);
      return response;
    } catch (error) {
      logger.error('💥 API Request failed:', error);
      throw error;
    }
  }

  async get(endpoint: string, options?: RequestInit): Promise<Response> {
    return this.request(endpoint, { ...options, method: 'GET' });
  }

  async post(endpoint: string, data?: any, options?: RequestInit): Promise<Response> {
    return this.request(endpoint, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put(endpoint: string, data?: any, options?: RequestInit): Promise<Response> {
    return this.request(endpoint, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete(endpoint: string, options?: RequestInit): Promise<Response> {
    return this.request(endpoint, { ...options, method: 'DELETE' });
  }

  // Helper method to get the current base URL (useful for debugging)
  getBaseUrl(): string {
    return this.baseURL;
  }

  // Test connectivity to the API server
  async testConnection(): Promise<{success: boolean; url: string; error?: string}> {
    try {
      this.refreshBaseURL();
      const response = await fetch(`${this.baseURL}/ping`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (response.ok) {
        const data = await response.json();
        logger.log('✅ API Connection successful:', data);
        return { success: true, url: this.baseURL };
      } else {
        logger.log('❌ API Connection failed with status:', response.status);
        return { success: false, url: this.baseURL, error: `HTTP ${response.status}` };
      }
    } catch (error: any) {
      logger.log('❌ API Connection failed:', error.message);
      return { success: false, url: this.baseURL, error: error.message };
    }
  }
}

// Export a singleton instance
export const api = new ApiClient();