import React, { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Notification } from '../../types';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { LoadingSpinner } from '../layout/LoadingSpinner';
import { 
  Bell, 
  BellOff,
  Mail,
  Ghost,
  Users,
  AlertTriangle,
  FileText,
  Eye,
  ArrowLeft,
  ExternalLink
} from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

interface NotificationCenterProps {
  onBack: () => void;
  onNavigate: (url: string) => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({ onBack, onNavigate }) => {
  const { actor } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [markingAsRead, setMarkingAsRead] = useState(new Set<string>());
  const [markingAllAsRead, setMarkingAllAsRead] = useState(false);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    if (!actor) return;
    
    try {
      const result = await actor.get_my_notifications();
      
      if ('Ok' in result) {
        const sortedNotifications = result.Ok.sort((a, b) => {
          // Sort by read status (unread first) then by creation date (newest first)
          if (a.read !== b.read) {
            return a.read ? 1 : -1;
          }
          return Number(b.created_at - a.created_at);
        });
        setNotifications(sortedNotifications);
      } else {
        toast.error(`Failed to load notifications: ${result.Err}`);
      }
    } catch (error) {
      console.error('Failed to load notifications:', error);
      toast.error('Failed to load notifications. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    if (!actor) return;

    setMarkingAsRead(prev => new Set(prev).add(notificationId));

    try {
      const result = await actor.mark_notification_read(notificationId);
      
      if ('Ok' in result) {
        // Update the notification locally
        setNotifications(prev => prev.map(n => 
          n.id === notificationId ? { ...n, read: true } : n
        ));
      } else {
        toast.error(`Failed to mark as read: ${result.Err}`);
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      toast.error('Failed to mark notification as read. Please try again.');
    } finally {
      setMarkingAsRead(prev => {
        const newSet = new Set(prev);
        newSet.delete(notificationId);
        return newSet;
      });
    }
  };

  const markAllAsRead = async () => {
    if (!actor) return;

    setMarkingAllAsRead(true);

    try {
      const result = await actor.mark_all_notifications_read();
      
      if ('Ok' in result) {
        // Update all notifications locally
        setNotifications(prev => prev.map(notification => ({
          ...notification,
          read: true
        })));
        toast.success('All notifications marked as read');
      } else {
        toast.error(`Failed to mark all as read: ${result.Err}`);
      }
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
      toast.error('Failed to mark all notifications as read. Please try again.');
    } finally {
      setMarkingAllAsRead(false);
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    // Mark as read if unread
    if (!notification.read) {
      markAsRead(notification.id);
    }

    // Navigate to action URL if available
    const actionUrl = Array.isArray(notification.action_url) && notification.action_url.length > 0 
      ? notification.action_url[0] 
      : null;

    if (actionUrl) {
      onNavigate(actionUrl);
    }
  };

  const formatDate = (timestamp: bigint): string => {
    try {
      const date = new Date(Number(timestamp) / 1000000);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffHours = diffMs / (1000 * 60 * 60);
      const diffDays = diffMs / (1000 * 60 * 60 * 24);

      if (diffHours < 1) {
        const diffMinutes = Math.floor(diffMs / (1000 * 60));
        return diffMinutes < 1 ? 'Just now' : `${diffMinutes}m ago`;
      } else if (diffHours < 24) {
        return `${Math.floor(diffHours)}h ago`;
      } else if (diffDays < 7) {
        return `${Math.floor(diffDays)}d ago`;
      } else {
        return format(date, 'MMM d, yyyy');
      }
    } catch {
      return 'Unknown date';
    }
  };

  const getNotificationTypeText = (type: Notification['notification_type']): string => {
    const typeKey = Object.keys(type)[0];
    return typeKey.replace(/([A-Z])/g, ' $1').toLowerCase();
  };

  const getNotificationIcon = (type: Notification['notification_type']) => {
    const typeKey = Object.keys(type)[0];
    switch (typeKey) {
      case 'FamilyInvitation': return <Mail className="h-5 w-5 text-blue-500" />;
      case 'GhostProfileClaim': return <Ghost className="h-5 w-5 text-purple-500" />;
      case 'FamilyUpdate': return <Users className="h-5 w-5 text-green-500" />;
      case 'SystemAlert': return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      default: return <FileText className="h-5 w-5 text-gray-500" />;
    }
  };

  const getNotificationTypeColor = (type: Notification['notification_type']): string => {
    const typeKey = Object.keys(type)[0];
    switch (typeKey) {
      case 'FamilyInvitation': return 'border-l-blue-500';
      case 'GhostProfileClaim': return 'border-l-purple-500';
      case 'FamilyUpdate': return 'border-l-green-500';
      case 'SystemAlert': return 'border-l-yellow-500';
      default: return 'border-l-gray-500';
    }
  };

  const getStats = () => {
    const total = notifications.length;
    const unread = notifications.filter(n => !n.read).length;
    const read = total - unread;
    
    return { total, unread, read };
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold flex items-center space-x-2">
            <Bell className="h-8 w-8" />
            <span>Notification Center</span>
          </h2>
          <Button variant="ghost" onClick={onBack}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Profile
          </Button>
        </div>
        
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner size="lg" text="Loading your notifications..." />
        </div>
      </div>
    );
  }

  const stats = getStats();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold flex items-center space-x-2">
          <Bell className="h-8 w-8" />
          <span>Notification Center</span>
        </h2>
        <div className="flex items-center space-x-3">
          {stats.unread > 0 && (
            <Button
              variant="outline"
              onClick={markAllAsRead}
              disabled={markingAllAsRead}
            >
              {markingAllAsRead ? (
                <>⏳ Marking...</>
              ) : (
                <>
                  <BellOff className="mr-2 h-4 w-4" />
                  Mark All Read
                </>
              )}
            </Button>
          )}
          <Button variant="ghost" onClick={onBack}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Profile
          </Button>
        </div>
      </div>

      {/* Stats */}
      {stats.total > 0 && (
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
              <div className="text-sm text-muted-foreground">Total</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-yellow-600">{stats.unread}</div>
              <div className="text-sm text-muted-foreground">Unread</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{stats.read}</div>
              <div className="text-sm text-muted-foreground">Read</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Notifications List */}
      {notifications.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <Bell className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Notifications</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              You don't have any notifications yet. When there are updates about your families, 
              invitations, or profile activities, they'll appear here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => (
            <Card 
              key={notification.id} 
              className={`border-l-4 ${getNotificationTypeColor(notification.notification_type)} ${
                !notification.read ? 'bg-blue-50/50 border-blue-200' : ''
              } cursor-pointer hover:shadow-md transition-shadow`}
              onClick={() => handleNotificationClick(notification)}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    {!notification.read && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                    )}
                    <div className="flex-1">
                      <CardTitle className="text-base flex items-center space-x-2">
                        {getNotificationIcon(notification.notification_type)}
                        <span>{notification.title}</span>
                      </CardTitle>
                      <Badge variant="outline" className="mt-1 text-xs">
                        {getNotificationTypeText(notification.notification_type)}
                      </Badge>
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {formatDate(notification.created_at)}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm text-muted-foreground mb-3">
                  {notification.message}
                </p>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {Array.isArray(notification.action_url) && notification.action_url.length > 0 && (
                      <div className="flex items-center space-x-1 text-xs text-blue-600">
                        <ExternalLink className="h-3 w-3" />
                        <span>View Details</span>
                      </div>
                    )}
                  </div>
                  
                  {!notification.read && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        markAsRead(notification.id);
                      }}
                      disabled={markingAsRead.has(notification.id)}
                      className="text-xs h-7"
                    >
                      {markingAsRead.has(notification.id) ? (
                        '⏳ Marking...'
                      ) : (
                        <>
                          <Eye className="mr-1 h-3 w-3" />
                          Mark Read
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};