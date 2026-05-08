/**
 * AdminNotification — local type definition.
 * The backend canister exposes getAdminNotifications(), markNotificationRead(),
 * and markAllNotificationsRead() which use this shape.
 */
export interface AdminNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  timestamp: bigint;
  read: boolean;
}
