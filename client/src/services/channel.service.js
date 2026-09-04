import api from "../api/axios";

class ChannelService {
  // ==========================
  // Get My Channel
  // ==========================
  async getMyChannel() {
    const { data } = await api.get("/channel/me");
    return data;
  }

  // ==========================
  // Get Public Channel
  // ==========================
  async getChannel(handle) {
    const { data } = await api.get(`/channel/${handle}`);
    return data;
  }

  // ==========================
  // Get Channel Videos
  // ==========================
  async getChannelVideos(handle) {
    const { data } = await api.get(`/channel/${handle}/videos`);
    return data;
  }

  // ==========================
  // Create Channel
  // ==========================
  async createChannel(channelData) {
    const { data } = await api.post("/channel", channelData);
    return data;
  }

  // ==========================
  // Update Channel
  // ==========================
  async updateChannel(channelData) {
    const { data } = await api.put("/channel", channelData);
    return data;
  }
// ==========================
// Update Channel Images
// ==========================

async updateChannelImages(formData) {
  const { data } = await api.put(
    "/channel/images",
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );

  return data;
}
  
  // ==========================
  // Delete Channel
  // ==========================
  async deleteChannel() {
    const { data } = await api.delete("/channel");
    return data;
  }
}

export default new ChannelService();