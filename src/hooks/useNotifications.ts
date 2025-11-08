import { useEffect, useState } from 'react';
import { toast } from '@/hooks/use-toast';

export const useNotifications = () => {
  const [permission, setPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = async () => {
    if (!('Notification' in window)) {
      toast({
        title: "Không hỗ trợ",
        description: "Trình duyệt không hỗ trợ thông báo",
        variant: "destructive"
      });
      return false;
    }

    const result = await Notification.requestPermission();
    setPermission(result);
    
    if (result === 'granted') {
      toast({
        title: "Đã bật thông báo",
        description: "Bạn sẽ nhận được thông báo tự động"
      });
      return true;
    } else {
      toast({
        title: "Thông báo bị tắt",
        description: "Vui lòng bật thông báo trong cài đặt trình duyệt",
        variant: "destructive"
      });
      return false;
    }
  };

  const sendNotification = (title: string, body: string, icon?: string) => {
    if (permission !== 'granted') {
      return;
    }

    try {
      new Notification(title, {
        body,
        icon: icon || '/favicon.ico',
        badge: '/favicon.ico',
        tag: 'study-app',
        requireInteraction: false
      });
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  };

  const notifyScoreDecrease = (subject: string, oldScore: number, newScore: number) => {
    sendNotification(
      `⚠️ Điểm ${subject} giảm`,
      `Điểm trung bình giảm từ ${oldScore.toFixed(1)} xuống ${newScore.toFixed(1)}`
    );
  };

  const notifyUpcomingClass = (subject: string, time: string, minutesUntil: number) => {
    sendNotification(
      `🔔 Sắp đến giờ học`,
      `${subject} bắt đầu lúc ${time} (còn ${minutesUntil} phút)`
    );
  };

  return {
    permission,
    requestPermission,
    sendNotification,
    notifyScoreDecrease,
    notifyUpcomingClass
  };
};
