import { AppNotification } from '../types';

export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!('Notification' in window)) {
    console.warn('This browser does not support desktop notification');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  return false;
};

export const showLocalNotification = (title: string, options?: NotificationOptions) => {
  if (Notification.permission === 'granted') {
    const notification = new Notification(title, {
      icon: '/vite.svg', // Fallback icon
      badge: '/vite.svg',
      ...options
    });

    notification.onclick = () => {
      window.focus();
      notification.close();
    };
  }
};

export const MOCK_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'n1',
    title: 'Scholarship Deadline Pass Aa Rahi Hai!',
    body: 'UP Pre-Matric Scholarship ki last date 2 din mein khatam ho rahi hai. Abhi apply karein!',
    type: 'deadline',
    timestamp: Date.now() - 3600000,
    read: false,
    actionUrl: 'scholarships'
  },
  {
    id: 'n2',
    title: 'Application Status Update',
    body: 'Bihar Student Credit Card application "Under Review" status par move ho gayi hai.',
    type: 'status',
    timestamp: Date.now() - 86400000,
    read: true
  },
  {
    id: 'n3',
    title: 'Nayi Scheme Launch!',
    body: 'Pradhan Mantri Vishwakarma Yojana ke baare mein jaanein. registration shuru ho gaye hain.',
    type: 'news',
    timestamp: Date.now() - 172800000,
    read: true,
    actionUrl: 'schemes'
  }
];
