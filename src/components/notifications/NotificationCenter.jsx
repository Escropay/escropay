import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { 
  Bell, 
  CheckCircle2, 
  Wallet, 
  AlertTriangle,
  Clock,
  X,
  MessageCircle
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const notificationIcons = {
  funded: { icon: Wallet, color: 'text-cyan-600', bg: 'bg-cyan-100' },
  released: { icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-100' },
  disputed: { icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-100' },
  created: { icon: Clock, color: 'text-purple-600', bg: 'bg-purple-100' }
};

export default function NotificationCenter({ userEmail }) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!userEmail) return;

    // Subscribe to escrow changes
    const unsubscribe = base44.entities.Escrow.subscribe((event) => {
      const escrow = event.data;

      // Guard: data can be null if payload_too_large
      if (!escrow) return;
      
      // Only notify if user is involved
      if (escrow.buyer_email !== userEmail && escrow.seller_email !== userEmail) {
        return;
      }

      let message = '';
      let type = event.type;

      if (event.type === 'create') {
        message = `New escrow "${escrow.title}" created`;
        type = 'created';
      } else if (event.type === 'update') {
        if (escrow.status === 'funded') {
          message = `Escrow "${escrow.title}" has been funded`;
          type = 'funded';
        } else if (escrow.status === 'released') {
          message = `Funds released for "${escrow.title}"`;
          type = 'released';
        } else if (escrow.status === 'disputed') {
          message = `Dispute raised on "${escrow.title}"`;
          type = 'disputed';
        }
      }

      if (message) {
        const newNotification = {
          id: Date.now(),
          message,
          type,
          timestamp: new Date().toISOString(),
          read: false
        };

        setNotifications(prev => [newNotification, ...prev].slice(0, 20));
        setUnreadCount(prev => prev + 1);
      }
    });

    return () => unsubscribe();
  }, [userEmail]);

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="icon" className="rounded-full relative">
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">Notifications</h3>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={markAllRead} className="text-xs text-purple-600">
              Mark all read
            </Button>
          )}
        </div>
        <div className="max-h-80 overflow-y-auto">
          <AnimatePresence>
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                <Bell className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">No notifications yet</p>
              </div>
            ) : (
              notifications.map((notification) => {
                const config = notificationIcons[notification.type] || notificationIcons.created;
                const Icon = config.icon;
                
                return (
                  <motion.div
                    key={notification.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className={`p-3 border-b border-gray-50 hover:bg-gray-50 transition-colors ${!notification.read ? 'bg-purple-50/50' : ''}`}
                  >
                    <div className="flex gap-3">
                      <div className={`p-2 rounded-lg ${config.bg} flex-shrink-0`}>
                        <Icon className={`w-4 h-4 ${config.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-700">{notification.message}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          {formatDistanceToNow(new Date(notification.timestamp), { addSuffix: true })}
                        </p>
                      </div>
                      <button
                        onClick={() => removeNotification(notification.id)}
                        className="text-gray-400 hover:text-gray-600 p-1"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  </motion.div>
                );
              })
            )}
          </AnimatePresence>
        </div>
      </PopoverContent>
    </Popover>
  );
}