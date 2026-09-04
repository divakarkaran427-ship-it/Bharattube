import api from "../api/axios";

class SubscriptionService {
  async toggleSubscription(channelId) {
    const { data } = await api.post(`/subscriptions/${channelId}`);
    return data;
  }

  async getSubscribers(channelId) {
    const { data } = await api.get(`/subscriptions/${channelId}`);
    return data;
  }
}

export default new SubscriptionService();