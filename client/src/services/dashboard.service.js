import api from "../api/axios";

class DashboardService {
  async getDashboardOverview() {
    const { data } = await api.get("/dashboard");
    return data.dashboard;
  }

  async getStudioDashboard() {
    const { data } = await api.get("/studio/dashboard");
    return data.dashboard;
  }

  async getStudioVideos() {
    const { data } = await api.get("/studio/videos");
    return {
      videos: data.videos || [],
      pagination: data.pagination || null,
    };
  }

  async getDashboard() {
    return this.getDashboardOverview();
  }
}

export default new DashboardService();
