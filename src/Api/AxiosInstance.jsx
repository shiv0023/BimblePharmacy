// src/api/axiosInstance.js
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const axiosInstance = axios.create({
  baseURL: 'https://api.bimble.pro',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor
axiosInstance.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('auth_token'); // Fetch token from storage

      if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
      } else {
        console.warn('No auth token found');
      }

     
 
      return config;
    } catch (error) {
      console.error('Error retrieving auth token:', error);
      return config; // Continue the request even if token retrieval fails
    }
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor
axiosInstance.interceptors.response.use(
  (response) => {
 
    return response;
  },
  async (error) => {
    if (error.response) {
      console.error('HTTP Error:', error.response.status, error.response.data);

      if (error.response.status === 401) {
        console.warn('Unauthorized! Token may be invalid or expired.');
        
        // Optional: Handle token refresh or logout logic here
        await AsyncStorage.removeItem('auth_token'); // Clear invalid token
      }
    } else if (error.request) {
      console.error('Network Error:', error.message);
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
