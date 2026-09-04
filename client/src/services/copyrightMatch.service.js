import api from "../api/axios";

const copyrightMatchService = {
  async getPendingMatches() {
    const { data } = await api.get("/copyright/matches");
    return data;
  },

  async reviewMatch(matchResultId, decision) {
    const { data } = await api.patch(`/copyright/matches/${matchResultId}/review`, { decision });
    return data;
  },

  async createClaim(matchResultId) {
    const { data } = await api.post(`/copyright/matches/${matchResultId}/claim`);
    return data;
  },
};

export default copyrightMatchService;