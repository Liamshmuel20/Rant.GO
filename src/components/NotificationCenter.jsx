import React, { useState, useEffect, useRef } from 'react';
import { Notification } from '@/api/entities';
import { User } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Bell, Check, MessageSquare, DollarSign, Clock, Shield, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { he } from 'date-fns/locale';

const typeIcons = {
  message: MessageSquare,
  approval: Check,
  payment: DollarSign,
  status_update: Clock,
  system: Shield
};

const typeColors = {
  message: 'bg-blue-100 text-blue-600',
  approval: 'bg-green-100 text-green-600',
  payment: 'bg-yellow-100 text-yellow-600',
  status_update: 'bg-orange-100 text-orange-600',
  system: 'bg-purple-100 text-purple-600'
};

export default function NotificationCenter() {
  const [notifications, setNotifications] = useState([]);
  const [user, setUser] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const timeoutRef = useRef(null);
  const isMounted = useRef(true);

  const loadNotifications = async () => {
    if (!isMounted.current) return;
    
    try {
      const currentUser = await User.me();
      if (!isMounted.current) return;
      
      setUser(currentUser);
      
      if (!currentUser || !currentUser.email) {
        setNotifications([]);
        return;
      }
      
      const allNotifications = await Notification.filter(
        { user_email: currentUser.email },
        '-created_date',
        20
      );

      if (isMounted.current) {
        setNotifications(allNotifications);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
      if (isMounted.current) {
        // On network error, don't log the user out, just clear notifications for safety
        setNotifications([]);
      }
    }
  };

  useEffect(() => {
    isMounted.current = true;
    
    const pollNotifications = async () => {
      await loadNotifications();
      // If component is still mounted, schedule the next poll regardless of success
      if (isMounted.current) {
        timeoutRef.current = setTimeout(pollNotifications, 30000);
      }
    };

    pollNotifications(); // Initial call

    // Cleanup on unmount
    return () => {
      isMounted.current = false;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const markAsRead = async (notificationId) => {
    try {
      await Notification.update(notificationId, { is_read: true });
      loadNotifications();
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const unreadNotifications = notifications.filter(n => !n.is_read);
      if (unreadNotifications.length > 0) {
        await Promise.all(
          unreadNotifications.map(n => Notification.update(n.id, { is_read: true }))
        );
        loadNotifications();
      }
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const deleteNotification = async (notificationId) => {
    try {
      await Notification.delete(notificationId);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  if (!user) return null;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 bg-red-500 text-white text-xs min-w-5 h-5 flex items-center justify-center rounded-full">
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">התראות</h3>
            {unreadCount > 0 && (
              <Button variant="link" size="sm" onClick={markAllAsRead} className="text-orange-600">
                סמן הכל כנקרא
              </Button>
            )}
          </div>
        </div>
        <div className="max-h-96 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Bell className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p>אין התראות חדשות</p>
            </div>
          ) : (
            notifications.map((notification) => {
              const IconComponent = typeIcons[notification.type] || Bell;
              return (
                <div
                  key={notification.id}
                  className={`p-4 border-b hover:bg-gray-50 transition-colors ${
                    !notification.is_read ? 'bg-orange-50' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${typeColors[notification.type]}`}>
                      <IconComponent className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="font-semibold text-sm truncate">{notification.title}</p>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNotification(notification.id);
                          }}
                          className="text-gray-400 hover:text-red-500 w-6 h-6"
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-gray-400">
                          {formatDistanceToNow(new Date(notification.created_date), { addSuffix: true, locale: he })}
                        </span>
                        <div className="flex gap-2">
                          {!notification.is_read && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                markAsRead(notification.id);
                              }}
                              className="text-xs"
                            >
                              סמן כנקרא
                            </Button>
                          )}
                          {notification.action_url && (
                            <Link to={notification.action_url} onClick={() => setIsOpen(false)}>
                              <Button variant="ghost" size="sm" className="text-xs text-orange-600">
                                צפה
                              </Button>
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}