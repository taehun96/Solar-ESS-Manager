import { apiClient } from './client';

export const dataAPI = {
  getLatest: () => apiClient.get('/api/data/latest'),
  updateSolar: (soc, solar_w, lux) => apiClient.post('/api/data/solar', { soc, solar_w, lux }),
};
