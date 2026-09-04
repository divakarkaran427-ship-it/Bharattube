import api from "../api/axios";

class ShortsService {
  async getFeed({ page = 1, limit = 24 } = {}) {
    const { data } = await api.get("/shorts/feed", { params: { page, limit } });
    return data;
  }
}

export default new ShortsService();
