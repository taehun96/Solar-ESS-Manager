import { apiClient } from './client';

export const energyAPI = {
  getOptimal: () => apiClient.get('/api/energy/optimal'),
  getPredicted: (lux) => apiClient.get(`/api/energy/predicted?lux=${lux}`),
};
