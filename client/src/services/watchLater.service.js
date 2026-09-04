import api from "../api/axios";

class WatchLaterService {
  async getMyWatchLater({ page = 1, limit = 24 } = {}) {
    const { data } = await api.get("/watch-later", {
      params: { page, limit },
    });

    return data;
  }

  async addToWatchLater(videoId) {
    const { data } = await api.post(`/watch-later/${videoId}`);
    return data;
  }

  async removeFromWatchLater(videoId) {
    const { data } = await api.delete(`/watch-later/${videoId}`);
    return data;
  }
}

export default new WatchLaterService();
