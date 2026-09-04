import api from "../api/axios";

const commentService = {
  async getComments(videoId) {
    const { data } = await api.get(`/comments/${videoId}`);
    return data;
  },

  async addComment(videoId, text) {
    const { data } = await api.post(`/comments/${videoId}`, { text });
    return data;
  },

  async addReply(videoId, parentComment, text) {
    const { data } = await api.post(`/comments/${videoId}`, { text, parentComment });
    return data;
  },

  async toggleLikeComment(commentId) {
    const { data } = await api.post(`/comments/${commentId}/like`);
    return data;
  },

  async removeLikeComment(commentId) {
    const { data } = await api.delete(`/comments/${commentId}/like`);
    return data;
  },
};

export default commentService;