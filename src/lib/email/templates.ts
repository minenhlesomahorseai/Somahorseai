/**
 * Brand-styled transactional email templates. All styles are inline for broad
 * email-client support, and every message includes a plain-text alternative.
 */

const NAVY = "#03045e";
const NAVY_MID = "#023e8a";
const BLUE = "#0077b6";
const MUTED = "#5b647a";
const BORDER = "#dce6f4";
const SURFACE = "#f3f7fd";

interface LayoutOptions {
  heading: string;
  body: string;
  cta?: { href: string; label: string };
  preheader?: string;
  eyebrow?: string;
}

function layout({
  heading,
  body,
  cta,
  preheader,
  eyebrow = "Somahorse.ai",
}: LayoutOptions): string {
  const button = cta
    ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:28px 0 10px;">
        <tr><td style="border-radius:10px;background:${NAVY_MID};">
          <a href="${escapeHtml(cta.href)}" style="display:inline-block;padding:14px 24px;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:10px;">${escapeHtml(cta.label)}</a>
        </td></tr>
      </table>`
    : "";

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>${escapeHtml(heading)}</title>
</head>
<body style="margin:0;padding:0;background:${SURFACE};font-family:Arial,Helvetica,sans-serif;color:${NAVY};">
  ${preheader ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${escapeHtml(preheader)}</div>` : ""}
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${SURFACE};padding:36px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border:1px solid ${BORDER};border-radius:22px;overflow:hidden;box-shadow:0 12px 40px rgba(3,4,94,.08);">
        <tr><td style="padding:24px 34px;background:${NAVY};">
          <span style="font-family:Arial,Helvetica,sans-serif;font-size:20px;font-weight:800;color:#ffffff;letter-spacing:-0.4px;">Somahorse<span style="color:#8ec5ff;">.ai</span></span>
        </td></tr>
        <tr><td style="height:5px;background:linear-gradient(90deg,${BLUE},#00b4d8,#48cae4);font-size:0;">&nbsp;</td></tr>
        <tr><td style="padding:36px 34px 18px;">
          <p style="margin:0 0 10px;font-size:11px;font-weight:800;letter-spacing:1.5px;text-transform:uppercase;color:${BLUE};">${escapeHtml(eyebrow)}</p>
          <h1 style="margin:0 0 18px;font-family:Arial,Helvetica,sans-serif;font-size:26px;line-height:1.25;font-weight:800;color:${NAVY};letter-spacing:-0.4px;">${escapeHtml(heading)}</h1>
          <div style="font-size:15px;line-height:1.72;color:${MUTED};">${body}</div>
          ${button}
        </td></tr>
        <tr><td style="padding:24px 34px 30px;border-top:1px solid ${BORDER};">
          <p style="margin:0;font-size:12px;line-height:1.6;color:#8b96aa;">
            Somahorse.ai · AI infrastructure for African agriculture<br/>
            Durban &amp; Cape Town, South Africa<br/><br/>
            You're receiving this transactional message because you have an account or application with Somahorse.ai.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function p(text: string): string {
  return `<p style="margin:0 0 15px;">${text}</p>`;
}

export interface BuiltEmail {
  subject: string;
  html: string;
  text: string;
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
      preheader: "Your client account is ready — here's how to get started.",
      eyebrow: "Client welcome",
      heading: `Welcome, ${name}.`,
      body:
        p("Thanks for joining Somahorse.ai. We build AI solutions for African agriculture supply chains — produce traceability, yield forecasting, data platforms, and live monitoring.") +
        p("Complete your company context, then use your workspace to describe a problem in plain language. We'll turn it into a clear scope, timeline, and price.") +
        p("We've attached two short guides so you know exactly what to expect."),
      cta: { href: opts.dashboardUrl, label: "Continue client setup" },
    }),
    text: `Welcome, ${name}.\n\nThanks for joining Somahorse.ai. Complete your company context, then use your workspace to describe a problem in plain language.\n\nContinue setup: ${opts.dashboardUrl}`,
  };
}

export function talentWelcomeEmail(opts: {
  firstName: string | null;
  statusUrl: string;
}): BuiltEmail {
  const name = opts.firstName ?? FALLBACK_NAME;
  return {
    subject: "Welcome to Somahorse.ai — complete your talent profile",
    html: layout({
      preheader: "Your account is ready. Complete your profile to apply.",
      eyebrow: "Talent welcome",
      heading: `Welcome, ${name}.`,
      body:
        p("Your Somahorse.ai talent account is ready. The next step is to complete your profile with your role, experience, strongest skills, background, and work links.") +
        p("<strong>Your application is only submitted after you finish those steps.</strong> We save your progress as you go, so you can come back at any time.") +
        p("Once submitted, our team will review your profile and email you at every stage."),
      cta: { href: opts.statusUrl, label: "Complete your talent profile" },
    }),
    text: `Welcome, ${name}.\n\nYour Somahorse.ai talent account is ready. Complete your role, experience, skills, background, and work links. Your application is only submitted after you finish those steps.\n\nComplete your profile: ${opts.statusUrl}`,
  };
}

export function talentApplicationReceivedEmail(opts: {
  firstName: string | null;
  statusUrl: string;
}): BuiltEmail {
  const name = opts.firstName ?? FALLBACK_NAME;
  return {
    subject: "We received your Somahorse.ai talent application",
    html: layout({
      preheader: "Your profile and experience are now with our review team.",
      eyebrow: "Application received",
      heading: `Application received, ${name}.`,
      body:
        p("Thanks for completing your profile. We've received your experience, skills, background, and work links, and your application is now in our review queue.") +
        p("If your profile is approved, we'll email you a private link to a technical assessment tailored to what you shared.") +
        p("There is nothing else you need to submit right now. You can follow your progress from your status page."),
      cta: { href: opts.statusUrl, label: "View application status" },
    }),
    text: `Application received, ${name}.\n\nWe've received your experience, skills, background, and work links. Your application is now in review. If approved, we'll email you a private assessment link.\n\nView your status: ${opts.statusUrl}`,
  };
}

export function clientOnboardingReceivedEmail(opts: {
  firstName: string | null;
  dashboardUrl: string;
}): BuiltEmail {
  const name = opts.firstName ?? FALLBACK_NAME;
  return {
    subject: "Your Somahorse.ai workspace is ready",
    html: layout({
      preheader: "Your company details are saved and your workspace is ready.",
      eyebrow: "Setup complete",
      heading: `You're all set, ${name}.`,
      body:
        p("We've saved the company and project context you shared. Your Somahorse.ai workspace is ready for you to describe a problem, review a proposed scope, and follow delivery in one place.") +
        p("Start a project whenever you're ready. Explain the problem in plain language and our scoping assistant will guide the next steps."),
      cta: { href: opts.dashboardUrl, label: "Open your workspace" },
    }),
    text: `You're all set, ${name}.\n\nWe've saved the company and project context you shared. Your Somahorse.ai workspace is ready.\n\nOpen your workspace: ${opts.dashboardUrl}`,
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
      eyebrow: "Application approved",
      heading: `Congratulations, ${name} — you're approved to assess.`,
      body:
        p("Our team has reviewed your application and approved you to take the technical assessment.") +
        p(`The assessment is <strong>unique to you</strong>, curated from the skills and experience you shared. It's a single timed sitting of about ${opts.timeLimitMinutes} minutes.`) +
        p("Use the button below to start when you're ready. This link is private to your account."),
      cta: { href: opts.assessmentUrl, label: "Start your assessment" },
    }),
    text: `Congratulations, ${name} — your application was approved for assessment.\n\nYour private assessment takes about ${opts.timeLimitMinutes} minutes and must be completed in one sitting.\n\nStart your assessment: ${opts.assessmentUrl}`,
  };
}

export function assessmentReceivedEmail(opts: {
  firstName: string | null;
  statusUrl: string;
}): BuiltEmail {
  const name = opts.firstName ?? FALLBACK_NAME;
  return {
    subject: "We received your Somahorse.ai assessment",
    html: layout({
      preheader: "Your assessment is safely submitted and ready for review.",
      eyebrow: "Assessment received",
      heading: `Assessment received, ${name}.`,
      body:
        p("Your technical assessment has been submitted successfully. Our review team can now see your answers and assessment results.") +
        p("We'll review everything carefully and email you with the outcome. If you pass, you'll be able to propose or confirm an interview time from your application page."),
      cta: { href: opts.statusUrl, label: "View application status" },
    }),
    text: `Assessment received, ${name}.\n\nYour technical assessment was submitted successfully and is now under review. We'll email you with the outcome.\n\nView your status: ${opts.statusUrl}`,
  };
}

export function interviewSchedulingInviteEmail(opts: {
  firstName: string | null;
  schedulingUrl: string;
  notes?: string | null;
}): BuiltEmail {
  const name = opts.firstName ?? FALLBACK_NAME;
  return {
    subject: "You passed — choose your Somahorse.ai interview time",
    html: layout({
      preheader: "You passed the assessment. Schedule your interview within seven days.",
      eyebrow: "Assessment passed",
      heading: `Great news, ${name} — you passed.`,
      body:
        p("Your technical assessment has been reviewed and you've passed. The final certification step is an interview with our team.") +
        p("Open your application page to suggest a time within the next seven days. You and the admin can accept, decline, or counter-propose until you both agree on one time.") +
        (opts.notes ? p(`<strong>A note from the reviewer:</strong> ${escapeHtml(opts.notes)}`) : ""),
      cta: { href: opts.schedulingUrl, label: "Choose an interview time" },
    }),
    text: `Great news, ${name} — you passed your assessment.\n\nChoose an interview time within the next seven days. You and the admin can accept, decline, or suggest another time until you agree.\n\nSchedule your interview: ${opts.schedulingUrl}${opts.notes ? `\n\nReviewer note: ${opts.notes}` : ""}`,
  };
}

export function interviewProposalEmail(opts: {
  recipientName: string | null;
  proposerName: string;
  when: string;
  schedulingUrl: string;
  note?: string | null;
}): BuiltEmail {
  const name = opts.recipientName ?? FALLBACK_NAME;
  return {
    subject: "New Somahorse.ai interview time proposed",
    html: layout({
      preheader: `${opts.proposerName} proposed ${opts.when}.`,
      eyebrow: "Interview scheduling",
      heading: `A new interview time is waiting, ${name}.`,
      body:
        p(`<strong>${escapeHtml(opts.proposerName)}</strong> proposed <strong>${escapeHtml(opts.when)}</strong>.`) +
        (opts.note ? p(`<strong>Note:</strong> ${escapeHtml(opts.note)}`) : "") +
        p("Open the interview workspace to accept this time, decline it, or suggest a different time within the next seven days."),
      cta: { href: opts.schedulingUrl, label: "Review proposed time" },
    }),
    text: `A new interview time is waiting, ${name}.\n\n${opts.proposerName} proposed ${opts.when}.${opts.note ? `\n\nNote: ${opts.note}` : ""}\n\nReview it: ${opts.schedulingUrl}`,
  };
}

export function interviewProposalDeclinedEmail(opts: {
  recipientName: string | null;
  when: string;
  schedulingUrl: string;
}): BuiltEmail {
  const name = opts.recipientName ?? FALLBACK_NAME;
  return {
    subject: "A Somahorse.ai interview time was declined",
    html: layout({
      preheader: "The proposed time was declined. Suggest another time.",
      eyebrow: "Interview scheduling",
      heading: `Let's find another time, ${name}.`,
      body:
        p(`The proposed interview time, <strong>${escapeHtml(opts.when)}</strong>, was declined.`) +
        p("The scheduling conversation remains open. Suggest another time within the next seven days and we'll notify the other participant."),
      cta: { href: opts.schedulingUrl, label: "Suggest another time" },
    }),
    text: `Let's find another interview time, ${name}.\n\nThe proposed time, ${opts.when}, was declined. Suggest another time within the next seven days.\n\nOpen scheduling: ${opts.schedulingUrl}`,
  };
}

export function interviewConfirmedEmail(opts: {
  recipientName: string | null;
  talentName: string | null;
  when: string;
  schedulingUrl: string;
  googleCalendarUrl: string;
  meetingUrl?: string | null;
}): BuiltEmail {
  const name = opts.recipientName ?? FALLBACK_NAME;
  return {
    subject: `Interview confirmed${opts.talentName ? ` — ${opts.talentName}` : ""}`,
    html: layout({
      preheader: `Your Somahorse.ai interview is confirmed for ${opts.when}.`,
      eyebrow: "Interview confirmed",
      heading: `Interview confirmed, ${name}.`,
      body:
        p(`Everyone has agreed to <strong>${escapeHtml(opts.when)}</strong>.`) +
        (opts.meetingUrl
          ? p(`<strong>Meeting link:</strong> <a href="${escapeHtml(opts.meetingUrl)}" style="color:${NAVY_MID};">${escapeHtml(opts.meetingUrl)}</a>`)
          : p("The interview workspace contains the confirmed time. The admin can add the event to Google Calendar and include the meeting link there.")) +
        p(`Add it to <a href="${escapeHtml(opts.googleCalendarUrl)}" style="color:${NAVY_MID};font-weight:700;">Google Calendar</a>. A calendar file is also attached.`),
      cta: { href: opts.schedulingUrl, label: "Open interview details" },
    }),
    text: `Interview confirmed, ${name}.\n\nEveryone has agreed to ${opts.when}.${opts.meetingUrl ? `\nMeeting link: ${opts.meetingUrl}` : ""}\n\nAdd to Google Calendar: ${opts.googleCalendarUrl}\nOpen interview details: ${opts.schedulingUrl}`,
  };
}

export function talentApprovedEmail(opts: {
  firstName: string | null;
  dashboardUrl: string;
}): BuiltEmail {
  const name = opts.firstName ?? FALLBACK_NAME;
  return {
    subject: "You're certified — welcome to the Somahorse.ai talent network",
    html: layout({
      preheader: "You completed certification and your talent dashboard is ready.",
      eyebrow: "Certification complete",
      heading: `Welcome to the network, ${name}.`,
      body:
        p("You've completed the full Somahorse.ai certification process and your application is approved.") +
        p("Your onboarding information, skills, experience, and portfolio are now available in your talent profile. From your dashboard you can manage availability, project invitations, messages, and payments.") +
        p("Congratulations — we're glad to have you in the network."),
      cta: { href: opts.dashboardUrl, label: "Open your talent dashboard" },
    }),
    text: `Welcome to the network, ${name}.\n\nYou've completed the full Somahorse.ai certification process and your application is approved.\n\nOpen your talent dashboard: ${opts.dashboardUrl}`,
  };
}

export function talentRejectedEmail(opts: {
  firstName: string | null;
  reason?: string | null;
  stage?: "application" | "assessment" | "interview";
}): BuiltEmail {
  const name = opts.firstName ?? FALLBACK_NAME;
  const stage = opts.stage ?? "application";
  const stageCopy =
    stage === "assessment"
      ? "After reviewing your technical assessment, we won't be moving your application to the interview stage."
      : stage === "interview"
        ? "After completing the interview process, we won't be moving forward with certification at this time."
        : "After reviewing your profile and experience, we won't be moving your application to the assessment stage.";
  return {
    subject: "Update on your Somahorse.ai application",
    html: layout({
      preheader: "An update on your application.",
      eyebrow: "Application update",
      heading: `Thank you for your time, ${name}.`,
      body:
        p(stageCopy) +
        (opts.reason ? p(`<strong>Reason:</strong> ${escapeHtml(opts.reason)}`) : "") +
        p("This isn't a reflection of your worth as an engineer — our needs are specific and change over time. You're welcome to apply again in the future."),
    }),
    text: `Thank you for your time, ${name}.\n\n${stageCopy}${opts.reason ? `\n\nReason: ${opts.reason}` : ""}\n\nYou're welcome to apply again in the future.`,
  };
}

export function projectStartedClientEmail(opts: {
  firstName: string | null;
  projectTitle: string;
  dashboardUrl: string;
  depositZar: string;
}): BuiltEmail {
  const name = opts.firstName ?? FALLBACK_NAME;
  return {
    subject: `Project started: ${opts.projectTitle}`,
    html: layout({
      preheader: "Your deposit is confirmed and your project is active.",
      eyebrow: "Project funded",
      heading: `Your project is underway, ${name}.`,
      body:
        p(`We've confirmed your ${escapeHtml(opts.depositZar)} deposit for <strong>${escapeHtml(opts.projectTitle)}</strong>.`) +
        p("The nominated team has been assigned, Somahorse.ai is coordinating delivery, and your project now appears in the dashboard.") +
        p("We'll keep the timeline, milestones, messages, and payment records together in one place."),
      cta: { href: opts.dashboardUrl, label: "Open your project" },
    }),
    text: `Your project is underway, ${name}.\n\nWe've confirmed your ${opts.depositZar} deposit for ${opts.projectTitle}.\n\nOpen your project: ${opts.dashboardUrl}`,
  };
}

export function projectAssignmentTalentEmail(opts: {
  firstName: string | null;
  projectTitle: string;
  role: string;
  dashboardUrl: string;
}): BuiltEmail {
  const name = opts.firstName ?? FALLBACK_NAME;
  return {
    subject: `New Somahorse.ai project: ${opts.projectTitle}`,
    html: layout({
      preheader: "You have been assigned to a funded project.",
      eyebrow: "New project",
      heading: `You have a new project, ${name}.`,
      body:
        p(`The client deposit for <strong>${escapeHtml(opts.projectTitle)}</strong> has cleared and you have been assigned as <strong>${escapeHtml(opts.role)}</strong>.`) +
        p("Open your dashboard for the project brief and delivery status. Somahorse.ai will coordinate the next step with the full team."),
      cta: { href: opts.dashboardUrl, label: "Open talent dashboard" },
    }),
    text: `You have a new project, ${name}.\n\nYou've been assigned as ${opts.role} on ${opts.projectTitle}.\n\nOpen your dashboard: ${opts.dashboardUrl}`,
  };
}

export function projectFundedAdminEmail(opts: {
  projectTitle: string;
  companyName: string | null;
  depositZar: string;
  invoiceNumber: string | null;
  teamSummary: string;
  adminUrl: string;
  needsStaffingAttention: boolean;
}): BuiltEmail {
  const heading = opts.needsStaffingAttention
    ? "A paid project needs staffing attention."
    : "A new project is funded.";
  return {
    subject: `${opts.needsStaffingAttention ? "Staffing attention: " : "Project funded: "}${opts.projectTitle}`,
    html: layout({
      preheader: "A client deposit has completed through Paddle.",
      eyebrow: "Admin notification",
      heading,
      body:
        p(`<strong>Project:</strong> ${escapeHtml(opts.projectTitle)}<br/><strong>Enterprise:</strong> ${escapeHtml(opts.companyName ?? "Not specified")}<br/><strong>Deposit:</strong> ${escapeHtml(opts.depositZar)}<br/><strong>Invoice:</strong> ${escapeHtml(opts.invoiceNumber ?? "Pending Paddle finalisation")}`) +
        p(`<strong>Assigned team:</strong> ${escapeHtml(opts.teamSummary || "No assignment completed")}`) +
        (opts.needsStaffingAttention
          ? p("At least one proposed specialist was no longer available when payment cleared. The project is active in the staffing queue and needs a replacement.")
          : p("The nominated specialists have been assigned and alerted.")),
      cta: { href: opts.adminUrl, label: "Open project control" },
    }),
    text: `${heading}\n\nProject: ${opts.projectTitle}\nEnterprise: ${opts.companyName ?? "Not specified"}\nDeposit: ${opts.depositZar}\nInvoice: ${opts.invoiceNumber ?? "Pending"}\nAssigned team: ${opts.teamSummary || "No assignment completed"}\n\nOpen project control: ${opts.adminUrl}`,
  };
}

export function projectPaymentClientEmail(opts: {
  firstName: string | null;
  projectTitle: string;
  paymentLabel: string;
  paidAmount: string;
  baseAmount: string;
  invoiceNumber: string | null;
  dashboardUrl: string;
}): BuiltEmail {
  const name = opts.firstName ?? FALLBACK_NAME;
  return {
    subject: `Payment received: ${opts.projectTitle}`,
    html: layout({
      preheader: `${opts.paymentLabel} has been verified.`,
      eyebrow: "Payment receipt",
      heading: `Your payment is confirmed, ${name}.`,
      body:
        p(`<strong>Project:</strong> ${escapeHtml(opts.projectTitle)}<br/><strong>Payment:</strong> ${escapeHtml(opts.paymentLabel)}<br/><strong>Project amount:</strong> ${escapeHtml(opts.paidAmount)}<br/><strong>Base project value:</strong> ${escapeHtml(opts.baseAmount)}<br/><strong>Invoice:</strong> ${escapeHtml(opts.invoiceNumber ?? "Paddle is finalising the invoice")}`) +
        p("The project amount is locked in the checkout currency. Paddle shows any applicable tax separately and its invoice is the final record of the total charged. Future exchange-rate movements do not change this project record."),
      cta: { href: opts.dashboardUrl, label: "Open project billing" },
    }),
    text: `Your payment is confirmed, ${name}.\n\nProject: ${opts.projectTitle}\nPayment: ${opts.paymentLabel}\nProject amount: ${opts.paidAmount}\nBase project value: ${opts.baseAmount}\nInvoice: ${opts.invoiceNumber ?? "Pending"}\n\nPaddle's invoice is the final record of any applicable tax and the total charged.\n\nOpen project billing: ${opts.dashboardUrl}`,
  };
}

export function projectEarningsTalentEmail(opts: {
  firstName: string | null;
  projectTitle: string;
  paymentLabel: string;
  allocationAmount: string;
  preferredCurrency: string;
  dashboardUrl: string;
}): BuiltEmail {
  const name = opts.firstName ?? FALLBACK_NAME;
  return {
    subject: `New project earnings: ${opts.projectTitle}`,
    html: layout({
      preheader: "A verified client payment added to your earnings ledger.",
      eyebrow: "Earnings added",
      heading: `New earnings are recorded, ${name}.`,
      body:
        p(`A verified <strong>${escapeHtml(opts.paymentLabel)}</strong> for <strong>${escapeHtml(opts.projectTitle)}</strong> added <strong>${escapeHtml(opts.allocationAmount)}</strong> to your earnings ledger.`) +
        p(`This is the stable project-accounting value. When the payout is made, Somahorse.ai locks and records the equivalent amount in your preferred <strong>${escapeHtml(opts.preferredCurrency)}</strong> currency, together with the payout reference.`),
      cta: { href: opts.dashboardUrl, label: "View earnings" },
    }),
    text: `New earnings are recorded, ${name}.\n\n${opts.paymentLabel} for ${opts.projectTitle} added ${opts.allocationAmount} to your earnings ledger. Your payout will be converted and locked in ${opts.preferredCurrency} when it is made.\n\nView earnings: ${opts.dashboardUrl}`,
  };
}

export function projectPaymentAdminEmail(opts: {
  projectTitle: string;
  paymentLabel: string;
  paidAmount: string;
  baseAmount: string;
  invoiceNumber: string | null;
  projectUrl: string;
}): BuiltEmail {
  return {
    subject: `Project payment received: ${opts.projectTitle}`,
    html: layout({
      preheader: "A client project payment has cleared through Paddle.",
      eyebrow: "Payment control",
      heading: "A project payment is verified.",
      body:
        p(`<strong>Project:</strong> ${escapeHtml(opts.projectTitle)}<br/><strong>Payment:</strong> ${escapeHtml(opts.paymentLabel)}<br/><strong>Client project amount:</strong> ${escapeHtml(opts.paidAmount)}<br/><strong>Canonical value:</strong> ${escapeHtml(opts.baseAmount)}<br/><strong>Invoice:</strong> ${escapeHtml(opts.invoiceNumber ?? "Paddle is finalising the invoice")}`) +
        p("The 60% talent allocation has been added to the internal earnings ledger. Talent payout remains a separate controlled action."),
      cta: { href: opts.projectUrl, label: "Open project control" },
    }),
    text: `A project payment is verified.\n\nProject: ${opts.projectTitle}\nPayment: ${opts.paymentLabel}\nClient project amount: ${opts.paidAmount}\nCanonical value: ${opts.baseAmount}\nInvoice: ${opts.invoiceNumber ?? "Pending"}\n\nOpen project control: ${opts.projectUrl}`,
  };
}

export function talentPayoutEmail(opts: {
  firstName: string | null;
  projectTitle: string;
  payoutAmount: string;
  baseAmount: string;
  reference: string;
  dashboardUrl: string;
}): BuiltEmail {
  const name = opts.firstName ?? FALLBACK_NAME;
  return {
    subject: `Project payout sent: ${opts.projectTitle}`,
    html: layout({
      preheader: "Your project earnings payout has been recorded.",
      eyebrow: "Payout completed",
      heading: `Your payout has been sent, ${name}.`,
      body:
        p(`<strong>Project:</strong> ${escapeHtml(opts.projectTitle)}<br/><strong>Payout:</strong> ${escapeHtml(opts.payoutAmount)}<br/><strong>Base earnings value:</strong> ${escapeHtml(opts.baseAmount)}<br/><strong>Reference:</strong> ${escapeHtml(opts.reference)}`) +
        p("The payout currency and exchange rate are now locked in your earnings history. Future exchange-rate movements will not change this record."),
      cta: { href: opts.dashboardUrl, label: "Open payout history" },
    }),
    text: `Your payout has been sent, ${name}.\n\nProject: ${opts.projectTitle}\nPayout: ${opts.payoutAmount}\nBase earnings value: ${opts.baseAmount}\nReference: ${opts.reference}\n\nOpen payout history: ${opts.dashboardUrl}`,
  };
}

export function talentPayoutAdminEmail(opts: {
  talentName: string;
  projectTitle: string;
  payoutAmount: string;
  baseAmount: string;
  reference: string;
  projectUrl: string;
}): BuiltEmail {
  return {
    subject: `Talent payout recorded: ${opts.projectTitle}`,
    html: layout({
      preheader: "A talent payout has been settled in the project ledger.",
      eyebrow: "Payout control",
      heading: "Talent payout recorded.",
      body:
        p(`<strong>Talent:</strong> ${escapeHtml(opts.talentName)}<br/><strong>Project:</strong> ${escapeHtml(opts.projectTitle)}<br/><strong>Payout:</strong> ${escapeHtml(opts.payoutAmount)}<br/><strong>Base earnings value:</strong> ${escapeHtml(opts.baseAmount)}<br/><strong>Reference:</strong> ${escapeHtml(opts.reference)}`),
      cta: { href: opts.projectUrl, label: "Open project control" },
    }),
    text: `Talent payout recorded.\n\nTalent: ${opts.talentName}\nProject: ${opts.projectTitle}\nPayout: ${opts.payoutAmount}\nBase earnings value: ${opts.baseAmount}\nReference: ${opts.reference}\n\nOpen project control: ${opts.projectUrl}`,
  };
}

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
