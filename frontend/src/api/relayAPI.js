import { apiClient } from './client';

export const relayAPI = {
  getStatus: () => apiClient.get('/api/relay/status'),
  control: (channels, action) =>
    apiClient.post('/api/relay/control', { channels, action }),
  reset: () => apiClient.post('/api/relay/reset'),
};
