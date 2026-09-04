import api from "../api/axios";

class ReactionService {
  async likeVideo(id) {
    const { data } = await api.post(`/reactions/${id}`, {
      type: "like",
    });

    return data;
  }

  async dislikeVideo(id) {
    const { data } = await api.post(`/reactions/${id}`, {
      type: "dislike",
    });

    return data;
  }

  async getLikedVideos({ page = 1, limit = 20 } = {}) {
    const { data } = await api.get("/reactions/liked-videos", {
      params: { page, limit },
    });

    return data;
  }

  async removeReaction(id) {
    const { data } = await api.delete(`/reactions/${id}`);

    return data;
  }
}

export default new ReactionService();