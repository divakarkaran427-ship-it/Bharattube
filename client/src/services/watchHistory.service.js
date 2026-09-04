import api from "../api/axios";

class WatchHistoryService {
  async updateWatchProgress(videoId, {
    watchedDuration = 0,
    currentTime = watchedDuration,
    duration,
    completed = false,
  }) {
    const { data } = await api.post(`/history/${videoId}`, {
      watchedDuration,
      currentTime,
      ...(Number.isFinite(duration) && duration > 0 ? { duration } : {}),
      completed,
    });

    return {
      history: data.history || data.data?.history || null,
      viewCounted: Boolean(data.viewCounted ?? data.data?.viewCounted),
    };
  }

  async getHistory({ page = 1, limit = 20, search = "" } = {}) {
    const { data } = await api.get("/history", {
      params: { page, limit, ...(search.trim() ? { search: search.trim() } : {}) },
    });

    return data;
  }

  async getContinueWatching(limit = 12) {
    const { data } = await api.get("/history/continue-watching", {
      params: { limit },
    });

    return data.history || [];
  }

  async removeHistoryItem(videoId) {
    const { data } = await api.delete(`/history/${videoId}`);
    return data;
  }

  async clearHistory() {
    const { data } = await api.delete("/history");
    return data;
  }
}

export default new WatchHistoryService();
