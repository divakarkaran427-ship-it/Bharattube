import api from "../api/axios";

class PlaylistService {
  async getMyPlaylists() {
    const { data } = await api.get("/playlists");
    return data.playlists || [];
  }

  async getPlaylistById(playlistId) {
    const { data } = await api.get(`/playlists/${playlistId}`);
    return data.playlist;
  }

  async getPublicPlaylists({ page = 1, limit = 20 } = {}) {
    const { data } = await api.get("/playlists/public", {
      params: { page, limit },
    });
    return data;
  }

  async createPlaylist({ title, description, visibility }) {
    const { data } = await api.post("/playlists", { title, description, visibility });
    return data.playlist;
  }

  async updatePlaylist(playlistId, payload) {
    const { data } = await api.patch(`/playlists/${playlistId}`, payload);
    return data.playlist;
  }

  async deletePlaylist(playlistId) {
    const { data } = await api.delete(`/playlists/${playlistId}`);
    return data;
  }

  async addVideo(playlistId, videoId) {
    const { data } = await api.post(`/playlists/${playlistId}/videos/${videoId}`);
    return data.playlist;
  }

  async removeVideo(playlistId, videoId) {
    const { data } = await api.delete(`/playlists/${playlistId}/videos/${videoId}`);
    return data.playlist;
  }
}

export default new PlaylistService();
