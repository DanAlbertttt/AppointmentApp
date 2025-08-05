// Real authentication service
import storageService from './storage_service';

class AuthService {
  constructor() {
    this.baseUrl = 'https://testing.cosmeticcloud.tech/api';
  }

  async login(email, password) {
    try {
      const response = await fetch(`${this.baseUrl}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email,
          password: password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      // Handle the actual API response format
      const user = data.user || {};
      return {
        success: true,
        user: {
          id: user.user_id || user.id || 1,
          email: user.email || email,
          name: user.doctor_name || user.name || 'User',
          phone: user.phone || null,
          devices: user.devices || [],
        },
        token: data.token || data.access_token || `token_${Date.now()}`,
      };
    } catch (error) {
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error('Network error. Please check your connection.');
      }
      throw new Error(error.message || 'Login failed. Please try again.');
    }
  }

  async logout() {
    try {
      const token = await this.getStoredToken();
      
      if (token) {
        await fetch(`${this.baseUrl}/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
      }
      
      return { success: true };
    } catch (error) {
      // Even if logout API fails, we still want to clear local storage
      console.warn('Logout API error:', error);
      return { success: true };
    }
  }

  async getCurrentUser() {
    try {
      const token = await this.getStoredToken();
      
      if (!token) {
        return null;
      }

      const response = await fetch(`${this.baseUrl}/user`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      const user = data.user || data;
      
      return {
        id: user.user_id || user.id || 1,
        email: user.email || '',
        name: user.doctor_name || user.name || 'User',
        phone: user.phone || null,
        devices: user.devices || [],
      };
    } catch (error) {
      console.warn('Get current user error:', error);
      return null;
    }
  }

  async getStoredToken() {
    return await storageService.getToken();
  }
}

export default new AuthService(); 