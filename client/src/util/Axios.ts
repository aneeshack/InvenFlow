import { env } from "@/config/env";
import axios from 'axios';

export const CLIENT_API = axios.create({
    baseURL: env.BACKEND_API_URL,
    withCredentials:true,
    headers:{
        'Content-Type':'application/json'
    }
})


CLIENT_API.interceptors.request.use(
    (config) => {
      console.log('Request sent:', config.url);
      return config;
    },
    (error) => {
      console.error('Request interceptor error:', error);
      return Promise.reject(error);
    }
  );

  CLIENT_API.interceptors.response.use(
    (response) => {
        console.log('response from back',response)
      return response;
    },

    (error) => {
      console.error('error in response interceptor',error.message)
      return Promise.reject(error);
    }
  );
