import axios from 'axios'; // <--- This MUST be 'axios', not './api/axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;
export const requestPickup = async (bookingId: string, data: any) => {
  return await api.put(`/booking/${bookingId}/pickup/request`, data);
};

export const decidePickup = async (bookingId: string, data: any) => {
  return await api.put(`/booking/${bookingId}/pickup/decide`, data);
};