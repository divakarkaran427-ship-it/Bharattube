import api from "../api/axios";

class NotificationService {
  async getNotifications({ page = 1, limit = 30, unread = false } = {}) {
    const { data } = await api.get("/notifications", {
      params: { page, limit, ...(unread ? { unread: true } : {}) },
    });

    return data;
  }

  async getUnreadCount() {
    const { data } = await api.get("/notifications/unread-count");
    return data.unreadCount || 0;
  }

  async markAsRead(notificationId) {
    const { data } = await api.patch(`/notifications/${notificationId}`);
    return data.notification;
  }

  async markAllAsRead() {
    const { data } = await api.patch("/notifications/read-all");
    return data.updatedCount || 0;
  }

  async deleteNotification(notificationId) {
    const { data } = await api.delete(`/notifications/${notificationId}`);
    return data;
  }
}

export default new NotificationService();
