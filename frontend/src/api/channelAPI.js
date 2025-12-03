import { apiClient } from './client';

export const channelAPI = {
  getOptimal: (target_w) =>
    apiClient.get(`/api/channels/optimal?target_w=${target_w}`),
};
