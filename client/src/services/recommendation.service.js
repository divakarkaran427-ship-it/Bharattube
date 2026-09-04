import api from "../api/axios";

class RecommendationService {
  async getPersonalizedFeed(limit = 12) {
    const { data } = await api.get("/recommendations/personalized", {
      params: { limit },
    });

    return data.videos || [];
  }

  async recordImpressions(surface, impressions) {
    const { data } = await api.post("/recommendations/impressions", {
      surface,
      impressions,
    });

    return data;
  }

  async recordClick(impressionId) {
    const { data } = await api.post("/recommendations/clicks", {
      impressionId,
    });

    return data;
  }
}

export default new RecommendationService();
