/**
 * Brand-styled HTML email templates. Inline styles only, since email clients
 * don't support external CSS. Kept deliberately simple and table-free where we
 * can — the layout is a single centered card on a tinted background.
 */

const NAVY = "#03045e";
const NAVY_MID = "#023e8a";
const MUTED = "#5b647a";
const BORDER = "#e3eaf5";

function layout({
  heading,
  body,
  cta,
  preheader,
}: {
  heading: string;
  body: string;
  cta?: { href: string; label: string };
  preheader?: string;
}): string {
  const button = cta
    ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:28px 0 8px;">
        <tr><td style="border-radius:999px;background:${NAVY_MID};">
          <a href="${cta.href}" style="display:inline-block;padding:13px 28px;font-family:'Space Grotesk',Arial,sans-serif;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:999px;">${cta.label}</a>
        </td></tr>
      </table>`
    : "";

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>${heading}</title>
</head>
<body style="margin:0;padding:0;background:#f3f7fd;font-family:Arial,Helvetica,sans-serif;color:${NAVY};">
  ${preheader ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${preheader}</div>` : ""}
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3f7fd;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1px solid ${BORDER};border-radius:20px;overflow:hidden;">
        <tr><td style="padding:22px 32px;background:linear-gradient(120deg,${NAVY},${NAVY_MID});">
          <span style="font-family:'Space Grotesk',Arial,sans-serif;font-size:18px;font-weight:800;color:#ffffff;letter-spacing:-0.3px;">Somahorse<span style="color:#7fb2ff;">.ai</span></span>
        </td></tr>
        <tr><td style="padding:34px 32px 12px;">
          <h1 style="margin:0 0 14px;font-family:'Space Grotesk',Arial,sans-serif;font-size:23px;line-height:1.25;font-weight:800;color:${NAVY};">${heading}</h1>
          <div style="font-size:15px;line-height:1.7;color:${MUTED};">${body}</div>
          ${button}
        </td></tr>
        <tr><td style="padding:22px 32px 30px;border-top:1px solid ${BORDER};margin-top:18px;">
          <p style="margin:0;font-size:12px;line-height:1.6;color:#97a1b5;">
            Somahorse.ai · AI infrastructure for African agriculture · Durban &amp; Cape Town, South Africa<br/>
            You're receiving this because you have an account with Somahorse.ai.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function p(text: string): string {
  return `<p style="margin:0 0 14px;">${text}</p>`;
}

export interface BuiltEmail {
  subject: string;
  html: string;
}

const FALLBACK_NAME = "there";

export function clientWelcomeEmail(opts: {
  firstName: string | null;
  dashboardUrl: string;
}): BuiltEmail {
  const name = opts.firstName ?? FALLBACK_NAME;
  return {
    subject: "Welcome to Somahorse.ai",
    html: layout({
      preheader: "Your account is ready — here's how to get started.",
      heading: `Welcome, ${name}.`,
      body:
        p("Thanks for joining Somahorse.ai. We build AI solutions for African agriculture supply chains — produce traceability, yield forecasting, data platforms, and live monitoring.") +
        p("Your account is ready. From your dashboard you can describe a problem in plain language and we'll turn it into a clear scope, timeline, and price.") +
        p("We've attached two short guides — a welcome note and a how-it-works overview — so you know exactly what to expect."),
      cta: { href: opts.dashboardUrl, label: "Open your dashboard" },
    }),
  };
}

export function talentWelcomeEmail(opts: {
  firstName: string | null;
  statusUrl: string;
}): BuiltEmail {
  const name = opts.firstName ?? FALLBACK_NAME;
  return {
    subject: "Your Somahorse.ai application has been received",
    html: layout({
      preheader: "Application received — awaiting review.",
      heading: `Thanks for applying, ${name}.`,
      body:
        p("Welcome to the Somahorse.ai engineer network. We certify African AI engineers on real skills and how they think — not CVs.") +
        p("<strong>Your application is now with our team for review.</strong> Once you're approved, we'll email you a unique link to your technical assessment, curated to your skills and experience.") +
        p("You can check your application status any time from the link below."),
      cta: { href: opts.statusUrl, label: "View application status" },
    }),
  };
}

export function assessmentInviteEmail(opts: {
  firstName: string | null;
  assessmentUrl: string;
  timeLimitMinutes: number;
}): BuiltEmail {
  const name = opts.firstName ?? FALLBACK_NAME;
  return {
    subject: "You're approved — take your Somahorse.ai assessment",
    html: layout({
      preheader: "You've been approved to take your technical assessment.",
      heading: `Congratulations, ${name} — you're approved to assess.`,
      body:
        p("Our team has reviewed your application and approved you to take the technical assessment.") +
        p("The assessment is <strong>unique to you</strong>, curated by our AI from the skills and experience you shared. It's a single timed sitting of about " + opts.timeLimitMinutes + " minutes, with a short set of rules you'll read before you begin.") +
        p("Use the button below to start when you're ready. The link is private to your account."),
      cta: { href: opts.assessmentUrl, label: "Start your assessment" },
    }),
  };
}

export function talentPassedEmail(opts: {
  firstName: string | null;
  statusUrl: string;
  notes?: string | null;
}): BuiltEmail {
  const name = opts.firstName ?? FALLBACK_NAME;
  return {
    subject: "You passed your Somahorse.ai assessment",
    html: layout({
      preheader: "Great news about your assessment.",
      heading: `Great news, ${name} — you passed.`,
      body:
        p("Your technical assessment has been reviewed and you've passed. The next step is an interview with our team, and we'll be in touch with details.") +
        (opts.notes ? p(`<strong>A note from the reviewer:</strong> ${escapeHtml(opts.notes)}`) : "") +
        p("You can follow your progress from your application status page."),
      cta: { href: opts.statusUrl, label: "View application status" },
    }),
  };
}

export function talentRejectedEmail(opts: {
  firstName: string | null;
  reason?: string | null;
}): BuiltEmail {
  const name = opts.firstName ?? FALLBACK_NAME;
  return {
    subject: "Update on your Somahorse.ai application",
    html: layout({
      preheader: "An update on your application.",
      heading: `Thank you for applying, ${name}.`,
      body:
        p("We've finished reviewing your application. Unfortunately we won't be moving forward at this time.") +
        (opts.reason ? p(`<strong>Reason:</strong> ${escapeHtml(opts.reason)}`) : "") +
        p("This isn't a reflection of your worth as an engineer — our needs are specific and change over time. You're welcome to apply again in the future, and we'd genuinely like to see you back."),
    }),
  };
}

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
