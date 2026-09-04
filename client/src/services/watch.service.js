import api from "../api/axios";

const watchService = {
  async startWatching(videoId) {
    const { data } = await api.post(`/watch/${videoId}/start`);
    return data;
  },

  async saveWatchProgress(videoId, payload = {}) {
    const { data } = await api.post(`/watch/${videoId}/progress`, payload);
    return data;
  },

  async saveWatchedSeconds(videoId, payload = {}) {
    const { data } = await api.post(`/watch/${videoId}/watched-seconds`, payload);
    return data;
  },

  async saveCompletionPercentage(videoId, payload = {}) {
    const { data } = await api.post(`/watch/${videoId}/completion`, payload);
    return data;
  },
};

export default watchService;
