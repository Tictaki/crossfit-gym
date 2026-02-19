import api from './api';

export const notificationService = {
  // Get notifications (paginated)
  getAll: async (page = 1, limit = 20, unreadOnly = false) => {
    try {
      const response = await api.get('/notifications', {
        params: { page, limit, unreadOnly }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching notifications:', error);
      throw error;
    }
  },

  // Mark single notification as read
  markAsRead: async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  },

  // Mark all as read
  markAllAsRead: async () => {
    try {
      await api.put('/notifications/read-all');
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  }
};
