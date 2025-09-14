import { html, TemplateResult } from 'lit-html';
import { BackendActor, Notification, ViewType } from '../types';

export class NotificationCenter {
  private actor: BackendActor;
  private onViewChange: (view: ViewType, data?: any) => void;
  private onBack: () => void;
  private notifications: Notification[] = [];
  private loading = true;
  private message = '';
  private markingAsRead = new Set<string>();
  private markingAllAsRead = false;

  constructor(
    actor: BackendActor,
    onViewChange: (view: ViewType, data?: any) => void,
    onBack: () => void
  ) {
    this.actor = actor;
    this.onViewChange = onViewChange;
    this.onBack = onBack;
    this.loadNotifications();
  }



  private requestUpdate(): void {
    // Since we're not using Lit anymore, this is a no-op
    // The parent component should handle re-rendering
  }

  private async loadNotifications() {
    try {
      const result = await this.actor.get_my_notifications();
      
      if ('Ok' in result) {
        this.notifications = result.Ok.sort((a, b) => {
          // Sort by read status (unread first) then by creation date (newest first)
          if (a.read !== b.read) {
            return a.read ? 1 : -1;
          }
          return Number(b.created_at - a.created_at);
        });
      } else {
        this.message = `Failed to load notifications: ${result.Err}`;
      }
    } catch (error) {
      console.error('Failed to load notifications:', error);
      this.message = 'Failed to load notifications. Please try again.';
    } finally {
      this.loading = false;
    }
  }

  private async markAsRead(notificationId: string) {
    this.markingAsRead.add(notificationId);
    this.requestUpdate();

    try {
      const result = await this.actor.mark_notification_read(notificationId);
      
      if ('Ok' in result) {
        // Update the notification locally
        const notification = this.notifications.find(n => n.id === notificationId);
        if (notification) {
          notification.read = true;
          this.requestUpdate();
        }
      } else {
        this.message = `Failed to mark as read: ${result.Err}`;
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      this.message = 'Failed to mark notification as read. Please try again.';
    } finally {
      this.markingAsRead.delete(notificationId);
      this.requestUpdate();
    }
  }

  private async markAllAsRead() {
    this.markingAllAsRead = true;
    this.message = '';

    try {
      const result = await this.actor.mark_all_notifications_read();
      
      if ('Ok' in result) {
        // Update all notifications locally
        this.notifications = this.notifications.map(notification => ({
          ...notification,
          read: true
        }));
        this.message = 'All notifications marked as read';
      } else {
        this.message = `Failed to mark all as read: ${result.Err}`;
      }
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
      this.message = 'Failed to mark all notifications as read. Please try again.';
    } finally {
      this.markingAllAsRead = false;
    }
  }

  private handleNotificationClick(notification: Notification) {
    // Mark as read if unread
    if (!notification.read) {
      this.markAsRead(notification.id);
    }

    // Navigate to action URL if available
    const actionUrl = Array.isArray(notification.action_url) && notification.action_url.length > 0 
      ? notification.action_url[0] 
      : null;

    if (actionUrl) {
      if (actionUrl.includes('/invitations/')) {
        this.onViewChange('my-invitations');
      } else if (actionUrl.includes('/family/')) {
        const familyId = actionUrl.split('/family/')[1];
        this.onViewChange('family-detail', { familyId });
      } else if (actionUrl.includes('/claims/')) {
        this.onViewChange('claim-requests');
      }
    }
  }

  private formatDate(timestamp: bigint): string {
    try {
      const date = new Date(Number(timestamp / 1000000n));
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
        return date.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        });
      }
    } catch {
      return 'Unknown date';
    }
  }

  private getNotificationTypeClass(type: any): string {
    const typeKey = Object.keys(type)[0].toLowerCase();
    return `type-${typeKey}`;
  }

  private getNotificationTypeText(type: any): string {
    const typeKey = Object.keys(type)[0];
    return typeKey.replace(/([A-Z])/g, ' $1').toLowerCase();
  }

  private getNotificationIcon(type: any): string {
    const typeKey = Object.keys(type)[0];
    switch (typeKey) {
      case 'FamilyInvitation': return '📨';
      case 'GhostProfileClaim': return '👻';
      case 'FamilyUpdate': return '👥';
      case 'SystemAlert': return '🔔';
      default: return '📄';
    }
  }

  private formatMessage(message: any): string {
    if (Array.isArray(message) && message.length > 0) {
      return message[0];
    }
    return message;
  }

  private getStats() {
    const total = this.notifications.length;
    const unread = this.notifications.filter(n => !n.read).length;
    const read = total - unread;
    
    return { total, unread, read };
  }

  render(): TemplateResult {
    if (this.loading) {
      return html`
        <div class="container">
          <div class="header">
            <h2>🔔 Notification Center</h2>
            <button class="back-button" @click=${this.onBack}>
              ← Back to Profile
            </button>
          </div>
          
          <div class="loading">
            <div class="loading-spinner"></div>
            Loading your notifications...
          </div>
        </div>
      `;
    }

    const stats = this.getStats();

    return html`
      <div class="container">
        <div class="header">
          <h2>🔔 Notification Center</h2>
          <div class="header-controls">
            ${stats.unread > 0 ? html`
              <button
                class="mark-all-button"
                @click=${this.markAllAsRead}
                ?disabled=${this.markingAllAsRead}
              >
                ${this.markingAllAsRead ? 'Marking...' : 'Mark All Read'}
              </button>
            ` : ''}
            <button class="back-button" @click=${this.onBack}>
              ← Back to Profile
            </button>
          </div>
        </div>

        ${this.message ? html`
          <div class="message ${this.message.includes('Failed') || this.message.includes('error') ? 'error' : 'success'}">
            ${this.message}
          </div>
        ` : ''}

        ${stats.total > 0 ? html`
          <div class="notification-stats">
            <div class="stat-item">
              <span class="stat-number">${stats.total}</span>
              <span class="stat-label">Total</span>
            </div>
            <div class="stat-item">
              <span class="stat-number">${stats.unread}</span>
              <span class="stat-label">Unread</span>
            </div>
            <div class="stat-item">
              <span class="stat-number">${stats.read}</span>
              <span class="stat-label">Read</span>
            </div>
          </div>
        ` : ''}

        ${this.notifications.length === 0 ? html`
          <div class="no-notifications">
            <div class="no-notifications-icon">🔔</div>
            <h3>No Notifications</h3>
            <p>
              You don't have any notifications yet.<br>
              When there are updates about your families, invitations, or profile activities, they'll appear here.
            </p>
          </div>
        ` : html`
          <div class="notifications-list">
            ${this.notifications.map(notification => html`
              <div
                class="notification-card ${notification.read ? 'read' : 'unread'}"
                @click=${() => this.handleNotificationClick(notification)}
              >
                ${!notification.read ? html`<div class="unread-indicator"></div>` : ''}
                
                <div class="notification-header">
                  <div class="notification-title">
                    ${this.getNotificationIcon(notification.notification_type)} ${notification.title}
                  </div>
                  <div class="notification-type ${this.getNotificationTypeClass(notification.notification_type)}">
                    ${this.getNotificationTypeText(notification.notification_type)}
                  </div>
                </div>

                <div class="notification-message">
                  ${notification.message}
                </div>

                <div class="notification-footer">
                  <div class="notification-date">
                    ${this.formatDate(notification.created_at)}
                  </div>
                  
                  <div class="notification-actions">
                    ${Array.isArray(notification.action_url) && notification.action_url.length > 0 ? html`
                      <span class="action-link">View Details →</span>
                    ` : ''}
                    
                    ${!notification.read ? html`
                      <button
                        class="mark-read-button"
                        @click=${(e: Event) => {
                          e.stopPropagation();
                          this.markAsRead(notification.id);
                        }}
                        ?disabled=${this.markingAsRead.has(notification.id)}
                      >
                        ${this.markingAsRead.has(notification.id) ? 'Marking...' : 'Mark Read'}
                      </button>
                    ` : ''}
                  </div>
                </div>
              </div>
            `)}
          </div>
        `}
      </div>
    `;
  }
}