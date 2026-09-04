import api from "../api/axios";

const viewService = {
  async addView(videoId) {
    try {
      const { data } = await api.post(`/views/${videoId}`);
      return data;
    } catch (err) {
      console.warn("View count failed:", err?.response?.data?.message || err.message);
      return null;
    }
  },

  async getViews(videoId) {
    try {
      const { data } = await api.get(`/views/${videoId}`);
      return data;
    } catch (err) {
      return null;
    }
  },
};

export default viewService;