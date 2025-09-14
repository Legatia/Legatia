import React, { useEffect } from 'react';
import { Button } from '../components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { LoadingSpinner } from '../components/layout/LoadingSpinner';
import { useNotifications } from '../hooks/useNotifications';
import { Notification } from '../types';
import { 
  Bell, 
  User, 
  Ghost, 
  Users, 
  AlertTriangle,
  CheckCircle,
  Clock,
  Check
} from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

export const NotificationsPage: React.FC = () => {
  const {
    notifications,
    unreadCount,
    loading,
    error,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    clearError,
  } = useNotifications();

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  useEffect(() => {
    if (error) {
      toast.error(error);
      const timer = setTimeout(() => clearError(), 5000);
      return () => clearTimeout(timer);
    }
  }, [error, clearError]);

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await markAsRead(notificationId);
      toast.success('Notification marked as read');
    } catch (error) {
      console.error('Error marking notification as read:', error);
      toast.error('Failed to mark notification as read');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
      toast.success('All notifications marked as read');
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      toast.error('Failed to mark all notifications as read');
    }
  };

  const getNotificationIcon = (type: Notification['notification_type']): React.ReactNode => {
    switch (type) {
      case 'FamilyInvitation':
        return <User className="h-5 w-5 text-blue-500" />;
      case 'GhostProfileClaim':
        return <Ghost className="h-5 w-5 text-purple-500" />;
      case 'FamilyUpdate':
        return <Users className="h-5 w-5 text-green-500" />;
      case 'SystemAlert':
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      default:
        return <Bell className="h-5 w-5 text-gray-500" />;
    }
  };

  const getNotificationTypeText = (type: Notification['notification_type']): string => {
    switch (type) {
      case 'FamilyInvitation':
        return 'Family Invitation';
      case 'GhostProfileClaim':
        return 'Ghost Profile Claim';
      case 'FamilyUpdate':
        return 'Family Update';
      case 'SystemAlert':
        return 'System Alert';
      default:
        return 'Notification';
    }
  };

  const formatTimestamp = (timestamp: bigint): string => {
    try {
      return format(new Date(Number(timestamp) / 1000000), 'MMM d, yyyy h:mm a');
    } catch {
      return 'Unknown';
    }
  };

  if (loading && notifications.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" text="Loading notifications..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
          <p className="text-muted-foreground">
            Stay updated with your family activities
          </p>
        </div>
        
        {unreadCount > 0 && (
          <Button onClick={handleMarkAllAsRead} variant="outline">
            <Check className="h-4 w-4 mr-2" />
            Mark All Read ({unreadCount})
          </Button>
        )}
      </div>

      {/* Notifications List */}
      {notifications.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No notifications yet</h3>
            <p className="text-muted-foreground">
              You'll see family updates and invitations here
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {notifications.map((notification) => (
            <Card 
              key={notification.id} 
              className={`transition-colors ${
                !notification.read ? 'bg-blue-50 border-blue-200' : ''
              }`}
            >
              <CardContent className="p-6">
                <div className="flex items-start space-x-4">
                  {/* Icon */}
                  <div className="flex-shrink-0 mt-1">
                    {getNotificationIcon(notification.notification_type)}
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-2">
                      <h3 className="text-lg font-semibold truncate">
                        {notification.title}
                      </h3>
                      {!notification.read && (
                        <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                          New
                        </Badge>
                      )}
                      <Badge variant="outline">
                        {getNotificationTypeText(notification.notification_type)}
                      </Badge>
                    </div>
                    
                    <p className="text-gray-700 mb-3">
                      {notification.message}
                    </p>
                    
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Clock className="h-4 w-4 mr-1" />
                      {formatTimestamp(notification.created_at)}
                    </div>
                  </div>
                  
                  {/* Actions */}
                  <div className="flex-shrink-0">
                    {!notification.read && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleMarkAsRead(notification.id)}
                      >
                        <CheckCircle className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};