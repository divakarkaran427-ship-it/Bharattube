import api from "../api/axios";

class VideoService {
  async getVideos({
    page = 1,
    limit = 12,
    search = "",
    category = "",
    language = "",
  } = {}) {
    const params = new URLSearchParams();

    params.append("page", page);
    params.append("limit", limit);

    if (search) params.append("search", search);
    if (category) params.append("category", category);
    if (language) params.append("language", language);

    const response = await api.get(`/videos?${params.toString()}`);

    // 👇 Sirf actual data return karo
    return response.data.data;
  }

  async getVideoById(id) {
    const response = await api.get(`/videos/${id}`);

    return response.data.data;
  }

  async getRelatedVideos(videoId) {
    const response = await api.get(
      `/videos?limit=10&exclude=${videoId}`
    );

    return response.data.data;
  }

}

export default new VideoService();
