import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type NotificationType =
  | 'workout_liked'
  | 'workout_commented'
  | 'friend_request_received'
  | 'friend_request_accepted';

interface EmailPayload {
  type: NotificationType;
  recipientUserId: string;
  actorUserId: string;
  workoutId?: string;
  friendRequestId?: string;
}

interface EmailContent {
  subject: string;
  html: string;
}

const buildEmailContent = (
  type: NotificationType,
  actorName: string,
  recipientName: string
): EmailContent => {
  switch (type) {
    case 'workout_liked':
      return {
        subject: `${actorName} liked your workout!`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Hey ${recipientName}!</h2>
            <p>${actorName} liked your workout on Lift.</p>
            <p style="color: #666;">Keep up the great work!</p>
          </div>
        `,
      };
    case 'workout_commented':
      return {
        subject: `${actorName} commented on your workout`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Hey ${recipientName}!</h2>
            <p>${actorName} left a comment on your workout.</p>
            <p style="color: #666;">Check it out and reply!</p>
          </div>
        `,
      };
    case 'friend_request_received':
      return {
        subject: `${actorName} sent you a friend request`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Hey ${recipientName}!</h2>
            <p>${actorName} wants to connect with you on Lift.</p>
            <p style="color: #666;">Accept their request to see each other's workouts!</p>
          </div>
        `,
      };
    case 'friend_request_accepted':
      return {
        subject: `${actorName} accepted your friend request!`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Great news, ${recipientName}!</h2>
            <p>${actorName} accepted your friend request.</p>
            <p style="color: #666;">You can now see each other's workouts in your feed!</p>
          </div>
        `,
      };
    default:
      return {
        subject: 'Notification from Lift',
        html: '<p>You have a new notification.</p>',
      };
  }
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const payload: EmailPayload = await req.json();

    // Validate required fields
    if (!payload.type || !payload.recipientUserId || !payload.actorUserId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Don't send email if actor is the recipient (self-action)
    if (payload.recipientUserId === payload.actorUserId) {
      return new Response(
        JSON.stringify({ skipped: true, reason: 'self_action' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client with service role for admin access
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // 1. Check if recipient has email notifications enabled
    const { data: recipientProfile, error: profileError } = await supabase
      .from('profiles')
      .select('email_notifications_enabled, first_name, last_name, username')
      .eq('id', payload.recipientUserId)
      .single();

    if (profileError || !recipientProfile) {
      console.error('Failed to fetch recipient profile:', profileError);
      return new Response(
        JSON.stringify({ skipped: true, reason: 'profile_not_found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!recipientProfile.email_notifications_enabled) {
      return new Response(
        JSON.stringify({ skipped: true, reason: 'notifications_disabled' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2. Get recipient's email from auth.users
    const { data: userData, error: userError } = await supabase.auth.admin.getUserById(
      payload.recipientUserId
    );

    if (userError || !userData?.user?.email) {
      console.error('Failed to fetch recipient email:', userError);
      return new Response(
        JSON.stringify({ skipped: true, reason: 'no_email' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const recipientEmail = userData.user.email;

    // 3. Check deduplication for workout interactions
    if (payload.workoutId) {
      const { data: existingEmail } = await supabase
        .from('email_notifications_sent')
        .select('id')
        .eq('recipient_user_id', payload.recipientUserId)
        .eq('actor_user_id', payload.actorUserId)
        .eq('workout_id', payload.workoutId)
        .maybeSingle();

      if (existingEmail) {
        return new Response(
          JSON.stringify({ skipped: true, reason: 'already_sent_for_workout' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // 4. Check deduplication for friend requests
    if (payload.friendRequestId) {
      const { data: existingEmail } = await supabase
        .from('email_notifications_sent')
        .select('id')
        .eq('friend_request_id', payload.friendRequestId)
        .eq('notification_type', payload.type)
        .maybeSingle();

      if (existingEmail) {
        return new Response(
          JSON.stringify({ skipped: true, reason: 'already_sent_for_request' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // 5. Get actor's name for email content
    const { data: actorProfile } = await supabase
      .from('profiles')
      .select('first_name, last_name, username')
      .eq('id', payload.actorUserId)
      .single();

    const actorName = actorProfile?.first_name
      ? `${actorProfile.first_name}${actorProfile.last_name ? ' ' + actorProfile.last_name : ''}`
      : actorProfile?.username || 'Someone';

    const recipientName = recipientProfile.first_name || recipientProfile.username || 'there';

    // 6. Build email content
    const { subject, html } = buildEmailContent(payload.type, actorName, recipientName);

    // 7. Send email via Resend
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Lift <onboarding@resend.dev>',
        to: recipientEmail,
        subject,
        html,
      }),
    });

    if (!resendResponse.ok) {
      const errorText = await resendResponse.text();
      console.error('Resend error:', errorText);
      return new Response(
        JSON.stringify({ error: 'Failed to send email', details: errorText }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 8. Record the sent email for deduplication
    const { error: insertError } = await supabase.from('email_notifications_sent').insert({
      recipient_user_id: payload.recipientUserId,
      actor_user_id: payload.actorUserId,
      notification_type: payload.type,
      workout_id: payload.workoutId || null,
      friend_request_id: payload.friendRequestId || null,
    });

    if (insertError) {
      console.error('Failed to record sent email:', insertError);
      // Don't fail the request - email was sent successfully
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Email notification error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
