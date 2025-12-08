import { apiClient } from './client';

export const relayAPI = {
  getStatus: () => apiClient.get('/api/relay/status'),
  control: (relayStatus) =>
    apiClient.post('/api/relay/update', relayStatus),
  reset: () => apiClient.post('/api/relay/reset'),
};
