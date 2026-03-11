import axios, { AxiosError, AxiosInstance } from "axios";
import { API_URL } from "../constants/config.constant";
import { APP_CONFIG } from "../constants/app.constant";

const clientAxios: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: APP_CONFIG.HTTP_TIMEOUT_MS,
});

clientAxios.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    const status = error.response?.status;
    
    if (status !== 404) {
      console.error('[Axios] Error:', {
        url: error.config?.url,
        status,
        message: error.message
      });
    }
    
    return Promise.reject(error);
  }
);

export default clientAxios;
