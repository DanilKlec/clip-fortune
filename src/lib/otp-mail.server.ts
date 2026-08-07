// Server-only helper: renders the OTP email and enqueues it into the
// auth_emails pgmq queue. The `/lovable/email/queue/process`
// route picks it up (via pg_cron, ~every 5s) and delivers via Lovable Email.

const SENDER_DOMAIN = "code.virality.socialsensor.io";
const FROM_DOMAIN = "virality.socialsensor.io";
const FROM_ADDRESS = `Robinzone <noreply@${FROM_DOMAIN}>`;
const SITE_URL = "https://virality.socialsensor.io";

export async function sendOtpEmail(email: string, code: string): Promise<void> {
  const [{ render }, { supabaseAdmin }, React, { MagicLinkEmail }] =
    await Promise.all([
      import("@react-email/render"),
      import("@/integrations/supabase/client.server"),
      import("react"),
      import("./email-templates/magic-link"),
    ]);

  const element = React.createElement(MagicLinkEmail, {
    token: code,
    siteUrl: SITE_URL,
  });
  const [html, text] = await Promise.all([
    render(element),
    render(element, { plainText: true }),
  ]);

  const messageId = crypto.randomUUID();
  const unsubscribeToken = crypto.randomUUID();
  const payload = {
    message_id: messageId,
    to: email,
    from: FROM_ADDRESS,
    sender_domain: SENDER_DOMAIN,
    subject: `Your Robinzone code: ${code}`,
    html,
    text,
    purpose: "transactional",
    label: "magiclink",
    idempotency_key: `otp-${messageId}`,
    unsubscribe_token: unsubscribeToken,
    queued_at: new Date().toISOString(),
  };

  await supabaseAdmin.from("email_unsubscribe_tokens").insert({
    token: unsubscribeToken,
    email,
  });

  await supabaseAdmin.from("email_send_log").insert({
    message_id: messageId,
    template_name: "magiclink",
    recipient_email: email,
    status: "pending",
  });

  const { error } = await supabaseAdmin.rpc("enqueue_email", {
    queue_name: "auth_emails",
    payload: payload as never,
  });
  if (error) {
    console.error("[sendOtpEmail] enqueue failed", error);
    await supabaseAdmin.from("email_send_log").insert({
      message_id: messageId,
      template_name: "magiclink",
      recipient_email: email,
      status: "failed",
      error_message: error.message,
    });
    throw new Error("Failed to enqueue OTP email");
  }
}