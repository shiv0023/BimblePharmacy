// src/api/axiosInstance.js
import axios from 'axios';


const axiosInstance = axios.create({
  baseURL: 'https://api.bimble.pro',
  headers: {
    'Content-Type': 'application/json',
  },
});


axiosInstance.interceptors.request.use(
  (config) => {
 
    const token = ' ';
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
 
    console.log('Request sent:', config);
    return config;
  },
  (error) => {
  
    return Promise.reject(error);
  }
);


axiosInstance.interceptors.response.use(
  (response) => {
  
    console.log('Response received:', response);
    return response;  
  },
  (error) => {

    if (error.response) {
     
      console.error('HTTP Error:', error.response.status);
      if (error.response.status === 401) {
      
        console.log('Token expired. Redirecting to login...');
      }
    } else if (error.request) {
 
      console.error('Network Error:', error.message);
    }
  
    return Promise.reject(error);
  }
);

export default axiosInstance;
