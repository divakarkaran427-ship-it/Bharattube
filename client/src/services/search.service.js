import api from "../api/axios";

class SearchService {
  async search(query, { page = 1, limit = 12 } = {}) {
    const { data } = await api.get("/search", { params: { q: query, page, limit } });
    return data;
  }
}

export default new SearchService();