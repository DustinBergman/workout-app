import { supabase } from '../../lib/supabase';

export type EmailNotificationType =
  | 'workout_liked'
  | 'workout_commented'
  | 'friend_request_received'
  | 'friend_request_accepted';

interface SendEmailNotificationParams {
  type: EmailNotificationType;
  recipientUserId: string;
  actorUserId: string;
  workoutId?: string;
  friendRequestId?: string;
}

/**
 * Send an email notification via Supabase Edge Function.
 * This is a fire-and-forget operation - errors are logged but don't block the main action.
 * Deduplication is handled server-side.
 */
export const sendEmailNotification = async (
  params: SendEmailNotificationParams
): Promise<void> => {
  // Don't send if actor is the recipient (self-action)
  if (params.recipientUserId === params.actorUserId) {
    return;
  }

  try {
    const { error } = await supabase.functions.invoke('send-email-notification', {
      body: params,
    });

    if (error) {
      console.error('[Email Notification] Error:', error);
    }
  } catch (err) {
    // Non-blocking - log error but don't fail the main action
    console.error('[Email Notification] Error:', err);
  }
};
