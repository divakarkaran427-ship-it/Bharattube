import api from "../api/axios";

class SearchHistoryService {
  async recordSearch(query, { clickedVideo, clickedChannel } = {}) {
    const { data } = await api.post("/search/history", {
      query,
      ...(clickedVideo && { clickedVideo }),
      ...(clickedChannel && { clickedChannel }),
    });

    return data.history;
  }
}

export default new SearchHistoryService();
