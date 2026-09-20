import api from "../api/axios";

class AdminService {
  async getDashboard() {
    const { data } = await api.get("/admin/dashboard");
    return data.data;
  }
}

export default new AdminService();
