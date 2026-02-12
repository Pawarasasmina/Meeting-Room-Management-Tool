import Notification from '../models/Notification.js';

export const createNotification = async ({ user, message, type = 'info' }) => {
  await Notification.create({ user, message, type });
};
