import nodemailer from "nodemailer";

let transporter: nodemailer.Transporter | null = null;

function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === "true", // true for 465, false for 587
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }
  return transporter;
}

const FROM_EMAIL = process.env.SMTP_FROM || "Spagram <noreply@spagram.com>";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

interface BookingEmailData {
  bookingNumber: string;
  clientName: string;
  clientEmail: string;
  therapistName: string;
  therapistEmail: string;
  date: string;
  startTime: string;
  endTime: string;
  duration: number;
  serviceType: string;
  locationType: string;
  outcallAddress?: string | null;
  totalPrice: string;
  bookingFee: string;
  clientNotes?: string | null;
}

// ---------------------------------------------------------------------------
// Generic sendEmail helper
// ---------------------------------------------------------------------------

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: SendEmailOptions) {
  return getTransporter().sendMail({ from: FROM_EMAIL, to, subject, html });
}

// ---------------------------------------------------------------------------
// Shared layout & components
// ---------------------------------------------------------------------------

function emailLayout(body: string) {
  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Spagram</title>
  <!--[if mso]>
  <noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript>
  <![endif]-->
</head>
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;-webkit-font-smoothing:antialiased;">

  <!-- Outer wrapper -->
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f1f5f9;">
    <tr>
      <td align="center" style="padding:40px 16px;">

        <!-- Logo -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">
          <tr>
            <td align="center" style="padding-bottom:24px;">
              <span style="font-size:28px;font-weight:800;color:#4f46e5;letter-spacing:-0.5px;">Spagram</span>
            </td>
          </tr>
        </table>

        <!-- Card -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
          ${body}
        </table>

        <!-- Footer -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">
          <tr>
            <td align="center" style="padding:24px 16px 0;">
              <p style="margin:0 0 8px;font-size:13px;color:#94a3b8;">
                &copy; ${new Date().getFullYear()} Spagram. All rights reserved.
              </p>
              <p style="margin:0;font-size:12px;color:#94a3b8;">
                <a href="${APP_URL}/settings/notifications" style="color:#94a3b8;text-decoration:underline;">Unsubscribe</a>
                &nbsp;&middot;&nbsp;
                <a href="${APP_URL}/privacy" style="color:#94a3b8;text-decoration:underline;">Privacy Policy</a>
                &nbsp;&middot;&nbsp;
                <a href="${APP_URL}/terms" style="color:#94a3b8;text-decoration:underline;">Terms of Service</a>
              </p>
            </td>
          </tr>
        </table>

      </td>
    </tr>
  </table>
</body>
</html>`;
}

function headerBanner(
  title: string,
  bgColor = "#4f46e5",
  icon = ""
) {
  return `
  <tr>
    <td style="background-color:${bgColor};padding:28px 32px;">
      <h1 style="margin:0;font-size:22px;font-weight:700;color:#ffffff;line-height:1.3;">
        ${icon ? icon + "&nbsp;&nbsp;" : ""}${title}
      </h1>
    </td>
  </tr>`;
}

function detailRow(label: string, value: string) {
  return `
  <tr>
    <td style="padding:10px 0;border-bottom:1px solid #f1f5f9;color:#64748b;font-size:14px;width:40%;">${label}</td>
    <td style="padding:10px 0;border-bottom:1px solid #f1f5f9;font-size:14px;font-weight:500;color:#0f172a;text-align:right;">${value}</td>
  </tr>`;
}

function bookingDetailsTable(data: BookingEmailData, opts?: { showFee?: boolean; showPrice?: boolean; showLocation?: boolean; showNotes?: boolean }) {
  const showFee = opts?.showFee ?? false;
  const showPrice = opts?.showPrice ?? false;
  const showLocation = opts?.showLocation ?? true;
  const showNotes = opts?.showNotes ?? false;

  const locationValue = data.locationType === "INCALL"
    ? "In-Studio"
    : `Outcall${data.outcallAddress ? " &mdash; " + escapeHtml(data.outcallAddress) : ""}`;

  let rows = "";
  rows += detailRow("Booking", `#${data.bookingNumber}`);
  rows += detailRow("Date", data.date);
  rows += detailRow("Time", `${data.startTime} &ndash; ${data.endTime} (${data.duration} min)`);
  rows += detailRow("Service", formatServiceType(data.serviceType));
  if (showLocation) {
    rows += detailRow("Location", locationValue);
  }
  if (showPrice) {
    rows += detailRow("Session Price", `$${data.totalPrice}`);
  }
  if (showFee) {
    rows += detailRow("Booking Fee (10%)", `$${data.bookingFee}`);
  }

  let notesHtml = "";
  if (showNotes && data.clientNotes) {
    notesHtml = `
    <tr>
      <td colspan="2" style="padding:16px 0 0;">
        <div style="background-color:#f8fafc;border-radius:8px;padding:14px 16px;">
          <p style="margin:0 0 4px;font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.06em;">Client Notes</p>
          <p style="margin:0;font-size:14px;color:#475569;line-height:1.5;">${escapeHtml(data.clientNotes)}</p>
        </div>
      </td>
    </tr>`;
  }

  return `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:4px;">
    ${rows}
    ${notesHtml}
  </table>`;
}

function ctaButton(label: string, href: string, bgColor = "#4f46e5") {
  return `
  <table role="presentation" cellpadding="0" cellspacing="0" style="margin:28px auto 0;">
    <tr>
      <td align="center" style="border-radius:10px;background-color:${bgColor};">
        <a href="${href}" target="_blank" style="display:inline-block;padding:14px 32px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:10px;">
          ${label}
        </a>
      </td>
    </tr>
  </table>`;
}

function dualButtons(
  label1: string, href1: string, bg1: string,
  label2: string, href2: string, bg2: string
) {
  return `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:28px auto 0;">
    <tr>
      <td align="center" style="padding-right:6px;width:50%;">
        <a href="${href1}" target="_blank" style="display:block;padding:14px 8px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:10px;background-color:${bg1};text-align:center;">
          ${label1}
        </a>
      </td>
      <td align="center" style="padding-left:6px;width:50%;">
        <a href="${href2}" target="_blank" style="display:block;padding:14px 8px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:10px;background-color:${bg2};text-align:center;">
          ${label2}
        </a>
      </td>
    </tr>
  </table>`;
}

function infoBox(text: string, bgColor = "#f0fdf4", textColor = "#166534", borderColor = "#bbf7d0") {
  return `
  <div style="background-color:${bgColor};border:1px solid ${borderColor};border-radius:8px;padding:14px 16px;margin-top:20px;">
    <p style="margin:0;font-size:13px;color:${textColor};line-height:1.5;">${text}</p>
  </div>`;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatServiceType(s: string): string {
  return s
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

// ---------------------------------------------------------------------------
// Email Verification
// ---------------------------------------------------------------------------

export async function sendVerificationEmail(
  email: string,
  firstName: string,
  token: string
) {
  const verifyUrl = `${APP_URL}/verify-email?token=${token}`;

  const body = `
    ${headerBanner("Verify Your Email", "#4f46e5", "&#9993;")}
    <tr>
      <td style="padding:28px 32px 32px;">
        <p style="margin:0 0 20px;font-size:15px;color:#334155;line-height:1.6;">
          Hi <strong>${escapeHtml(firstName)}</strong>,
        </p>
        <p style="margin:0 0 20px;font-size:15px;color:#334155;line-height:1.6;">
          Welcome to Spagram! Please verify your email address to complete your account setup.
        </p>

        ${ctaButton("Verify Email", verifyUrl)}

        <p style="margin:24px 0 0;font-size:12px;color:#94a3b8;text-align:center;line-height:1.5;">
          This link expires in 24 hours. If you didn&rsquo;t create an account, you can safely ignore this email.
        </p>
      </td>
    </tr>`;

  await sendEmail({
    to: email,
    subject: "Verify your email — Spagram",
    html: emailLayout(body),
  });
}

// ---------------------------------------------------------------------------
// Password Reset
// ---------------------------------------------------------------------------

export async function sendPasswordResetEmail(
  email: string,
  firstName: string,
  token: string
) {
  const resetUrl = `${APP_URL}/reset-password?token=${token}`;

  const body = `
    ${headerBanner("Reset Your Password", "#4f46e5", "&#128274;")}
    <tr>
      <td style="padding:28px 32px 32px;">
        <p style="margin:0 0 20px;font-size:15px;color:#334155;line-height:1.6;">
          Hi <strong>${escapeHtml(firstName)}</strong>,
        </p>
        <p style="margin:0 0 20px;font-size:15px;color:#334155;line-height:1.6;">
          We received a request to reset the password for your Spagram account. Click the button below to set a new password.
        </p>

        ${ctaButton("Reset Password", resetUrl)}

        <p style="margin:24px 0 0;font-size:12px;color:#94a3b8;text-align:center;line-height:1.5;">
          This link expires in 1 hour. If you didn&rsquo;t request a password reset, you can safely ignore this email.
        </p>
      </td>
    </tr>`;

  await sendEmail({
    to: email,
    subject: "Reset your password — Spagram",
    html: emailLayout(body),
  });
}

// ---------------------------------------------------------------------------
// 1. Booking Request — to therapist
// ---------------------------------------------------------------------------

export async function sendBookingPendingToTherapist(
  data: BookingEmailData,
  respondToken: string
) {
  const respondUrl = `${APP_URL}/api/bookings/respond?token=${respondToken}`;

  const body = `
    ${headerBanner("New Booking Request", "#4f46e5", "&#128203;")}
    <tr>
      <td style="padding:28px 32px 32px;">
        <p style="margin:0 0 20px;font-size:15px;color:#334155;line-height:1.6;">
          Hi <strong>${escapeHtml(data.therapistName)}</strong>,
        </p>
        <p style="margin:0 0 20px;font-size:15px;color:#334155;line-height:1.6;">
          You have a new booking request from <strong>${escapeHtml(data.clientName)}</strong>. Please review the details below and respond within <strong>48 hours</strong>.
        </p>

        ${bookingDetailsTable(data, { showPrice: true, showFee: true, showLocation: true, showNotes: true })}

        ${dualButtons(
          "&#10004;&nbsp; Accept Booking", respondUrl, "#059669",
          "&#10006;&nbsp; Decline", respondUrl, "#dc2626"
        )}

        <p style="margin:24px 0 0;font-size:12px;color:#94a3b8;text-align:center;line-height:1.5;">
          This link expires in 48 hours. If no action is taken, the booking will be automatically declined.
        </p>
      </td>
    </tr>`;

  await sendEmail({
    to: data.therapistEmail,
    subject: `New Booking Request — ${data.clientName} on ${data.date}`,
    html: emailLayout(body),
  });
}

// ---------------------------------------------------------------------------
// 2. Booking Pending Confirmation — to client
// ---------------------------------------------------------------------------

export async function sendBookingPendingToClient(data: BookingEmailData) {
  const body = `
    ${headerBanner("Booking Request Submitted", "#4f46e5", "&#9993;")}
    <tr>
      <td style="padding:28px 32px 32px;">
        <p style="margin:0 0 20px;font-size:15px;color:#334155;line-height:1.6;">
          Hi <strong>${escapeHtml(data.clientName)}</strong>,
        </p>
        <p style="margin:0 0 20px;font-size:15px;color:#334155;line-height:1.6;">
          Your booking request with <strong>${escapeHtml(data.therapistName)}</strong> has been submitted and is awaiting their confirmation.
        </p>

        ${bookingDetailsTable(data, { showFee: true, showLocation: true })}

        ${infoBox(
          "&#128179;&nbsp; <strong>Your card will not be charged</strong> until the therapist accepts your booking. A temporary hold of <strong>$" + data.bookingFee + "</strong> (10% booking fee) has been placed and will be released if declined.",
          "#eff6ff", "#1e40af", "#bfdbfe"
        )}

        <div style="margin-top:20px;background-color:#f8fafc;border-radius:8px;padding:14px 16px;">
          <p style="margin:0;font-size:13px;color:#64748b;line-height:1.5;">
            &#9202;&nbsp; <strong>Estimated response time:</strong> Most therapists respond within a few hours. You'll receive an email as soon as they accept or decline.
          </p>
        </div>

        ${ctaButton("View My Bookings", `${APP_URL}/user/bookings`)}
      </td>
    </tr>`;

  await sendEmail({
    to: data.clientEmail,
    subject: `Booking Request Submitted — ${data.therapistName}`,
    html: emailLayout(body),
  });
}

// ---------------------------------------------------------------------------
// 3. Booking Accepted — to client
// ---------------------------------------------------------------------------

export async function sendBookingAcceptedToClient(data: BookingEmailData) {
  const locationDetail = data.locationType === "INCALL"
    ? `<p style="margin:0;font-size:13px;color:#166534;line-height:1.5;">&#127970;&nbsp; <strong>In-Studio:</strong> The therapist's studio address will be available in your booking details.</p>`
    : data.outcallAddress
      ? `<p style="margin:0;font-size:13px;color:#166534;line-height:1.5;">&#128205;&nbsp; <strong>Outcall Address:</strong> ${escapeHtml(data.outcallAddress)}</p>`
      : "";

  const body = `
    ${headerBanner("Booking Confirmed!", "#059669", "&#9989;")}
    <tr>
      <td style="padding:28px 32px 32px;">
        <p style="margin:0 0 20px;font-size:15px;color:#334155;line-height:1.6;">
          Great news, <strong>${escapeHtml(data.clientName)}</strong>!
        </p>
        <p style="margin:0 0 20px;font-size:15px;color:#334155;line-height:1.6;">
          <strong>${escapeHtml(data.therapistName)}</strong> has accepted your booking. Your session is confirmed for <strong>${data.date}</strong> at <strong>${data.startTime}</strong>.
        </p>

        ${bookingDetailsTable(data, { showFee: true, showLocation: true })}

        ${infoBox(
          "&#128179;&nbsp; Your booking fee of <strong>$" + data.bookingFee + "</strong> (10%) has been charged to your card. The remaining session balance of <strong>$" + (parseFloat(data.totalPrice) - parseFloat(data.bookingFee)).toFixed(2) + "</strong> is due directly to the therapist at the time of your appointment.",
          "#f0fdf4", "#166534", "#bbf7d0"
        )}

        ${locationDetail ? `<div style="background-color:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:14px 16px;margin-top:12px;">${locationDetail}</div>` : ""}

        <div style="margin-top:20px;background-color:#fef3c7;border:1px solid #fde68a;border-radius:8px;padding:14px 16px;">
          <p style="margin:0 0 4px;font-size:13px;font-weight:600;color:#92400e;">Cancellation Policy</p>
          <p style="margin:0;font-size:13px;color:#92400e;line-height:1.5;">
            You may cancel up to 24 hours before your appointment for a full refund of the booking fee. Cancellations made within 24 hours may be non-refundable.
          </p>
        </div>

        ${ctaButton("View Booking Details", `${APP_URL}/user/bookings`, "#059669")}
      </td>
    </tr>`;

  await sendEmail({
    to: data.clientEmail,
    subject: `Booking Confirmed! — ${data.therapistName} on ${data.date}`,
    html: emailLayout(body),
  });
}

// ---------------------------------------------------------------------------
// 4. Booking Rejected — to client
// ---------------------------------------------------------------------------

export async function sendBookingRejectedToClient(data: BookingEmailData) {
  const body = `
    ${headerBanner("Booking Update", "#64748b", "&#128232;")}
    <tr>
      <td style="padding:28px 32px 32px;">
        <p style="margin:0 0 20px;font-size:15px;color:#334155;line-height:1.6;">
          Hi <strong>${escapeHtml(data.clientName)}</strong>,
        </p>
        <p style="margin:0 0 20px;font-size:15px;color:#334155;line-height:1.6;">
          Unfortunately, <strong>${escapeHtml(data.therapistName)}</strong> was unable to accept your booking request for <strong>${data.date}</strong> at <strong>${data.startTime}</strong>.
        </p>
        <p style="margin:0 0 20px;font-size:15px;color:#334155;line-height:1.6;">
          This could be due to scheduling conflicts or availability changes. We encourage you to try a different date or time, or explore other therapists in your area.
        </p>

        ${infoBox(
          "&#128179;&nbsp; <strong>No charges have been made.</strong> The temporary hold on your card has been fully released.",
          "#f0fdf4", "#166534", "#bbf7d0"
        )}

        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:28px auto 0;">
          <tr>
            <td align="center" style="padding-right:6px;width:50%;">
              <a href="${APP_URL}/therapists" target="_blank" style="display:block;padding:14px 8px;font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:10px;background-color:#4f46e5;text-align:center;">
                Browse Therapists
              </a>
            </td>
            <td align="center" style="padding-left:6px;width:50%;">
              <a href="${APP_URL}/user/bookings" target="_blank" style="display:block;padding:14px 8px;font-size:14px;font-weight:600;color:#4f46e5;text-decoration:none;border-radius:10px;background-color:#eef2ff;text-align:center;border:1px solid #c7d2fe;">
                My Bookings
              </a>
            </td>
          </tr>
        </table>
      </td>
    </tr>`;

  await sendEmail({
    to: data.clientEmail,
    subject: `Booking Update — ${data.therapistName}`,
    html: emailLayout(body),
  });
}

// ---------------------------------------------------------------------------
// 5. Booking Cancelled — to therapist
// ---------------------------------------------------------------------------

export async function sendBookingCancelledToTherapist(data: BookingEmailData) {
  const body = `
    ${headerBanner("Booking Cancelled", "#dc2626", "&#128683;")}
    <tr>
      <td style="padding:28px 32px 32px;">
        <p style="margin:0 0 20px;font-size:15px;color:#334155;line-height:1.6;">
          Hi <strong>${escapeHtml(data.therapistName)}</strong>,
        </p>
        <p style="margin:0 0 20px;font-size:15px;color:#334155;line-height:1.6;">
          <strong>${escapeHtml(data.clientName)}</strong> has cancelled their booking for <strong>${data.date}</strong> at <strong>${data.startTime}</strong>.
        </p>

        ${bookingDetailsTable(data, { showLocation: true })}

        ${infoBox(
          "&#128197;&nbsp; This time slot is now open and available for new bookings.",
          "#eff6ff", "#1e40af", "#bfdbfe"
        )}

        ${ctaButton("View My Schedule", `${APP_URL}/therapist/bookings`)}
      </td>
    </tr>`;

  await sendEmail({
    to: data.therapistEmail,
    subject: `Booking Cancelled — ${data.clientName} on ${data.date}`,
    html: emailLayout(body),
  });
}

// ---------------------------------------------------------------------------
// 6. Review Request — to client (after completion)
// ---------------------------------------------------------------------------

export async function sendBookingCompletedToClient(
  data: BookingEmailData,
  bookingId: string
) {
  const reviewUrl = `${APP_URL}/user/bookings/${bookingId}/review`;

  const body = `
    ${headerBanner("How Was Your Session?", "#7c3aed", "&#11088;")}
    <tr>
      <td style="padding:28px 32px 32px;">
        <p style="margin:0 0 20px;font-size:15px;color:#334155;line-height:1.6;">
          Hi <strong>${escapeHtml(data.clientName)}</strong>,
        </p>
        <p style="margin:0 0 20px;font-size:15px;color:#334155;line-height:1.6;">
          We hope you enjoyed your <strong>${formatServiceType(data.serviceType)}</strong> session with <strong>${escapeHtml(data.therapistName)}</strong>!
        </p>
        <p style="margin:0 0 8px;font-size:15px;color:#334155;line-height:1.6;">
          Your feedback helps other clients find great therapists and helps <strong>${escapeHtml(data.therapistName)}</strong> continue to improve. It only takes a minute!
        </p>

        <!-- Star rating visual -->
        <div style="text-align:center;margin:24px 0 8px;">
          <span style="font-size:36px;letter-spacing:4px;color:#fbbf24;">&#9733;&#9733;&#9733;&#9733;&#9733;</span>
        </div>

        ${ctaButton("Leave a Review", reviewUrl, "#7c3aed")}

        <div style="margin-top:24px;background-color:#f8fafc;border-radius:8px;padding:14px 16px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            ${detailRow("Therapist", escapeHtml(data.therapistName))}
            ${detailRow("Date", data.date)}
            ${detailRow("Service", formatServiceType(data.serviceType))}
          </table>
        </div>
      </td>
    </tr>`;

  await sendEmail({
    to: data.clientEmail,
    subject: `How was your session with ${data.therapistName}?`,
    html: emailLayout(body),
  });
}

// ---------------------------------------------------------------------------
// 7. New Review Notification — to therapist
// ---------------------------------------------------------------------------

interface NewReviewEmailData {
  therapistName: string;
  therapistEmail: string;
  clientName: string;
  rating: number;
  title: string | null;
  comment: string | null;
  serviceName: string;
  sessionDate: string;
}

export async function sendNewReviewToTherapist(data: NewReviewEmailData) {
  const stars = "&#9733;".repeat(data.rating) + "&#9734;".repeat(5 - data.rating);

  const reviewContent = data.comment
    ? `<div style="background-color:#f8fafc;border-radius:8px;padding:14px 16px;margin-top:16px;">
        ${data.title ? `<p style="margin:0 0 6px;font-size:14px;font-weight:600;color:#0f172a;">${escapeHtml(data.title)}</p>` : ""}
        <p style="margin:0;font-size:14px;color:#475569;line-height:1.5;">&ldquo;${escapeHtml(data.comment)}&rdquo;</p>
      </div>`
    : "";

  const body = `
    ${headerBanner("New Review Received", "#7c3aed", "&#11088;")}
    <tr>
      <td style="padding:28px 32px 32px;">
        <p style="margin:0 0 20px;font-size:15px;color:#334155;line-height:1.6;">
          Hi <strong>${escapeHtml(data.therapistName)}</strong>,
        </p>
        <p style="margin:0 0 20px;font-size:15px;color:#334155;line-height:1.6;">
          <strong>${escapeHtml(data.clientName)}</strong> left you a review for their <strong>${escapeHtml(data.serviceName)}</strong> session on <strong>${data.sessionDate}</strong>.
        </p>

        <div style="text-align:center;margin:8px 0;">
          <span style="font-size:32px;letter-spacing:4px;color:#fbbf24;">${stars}</span>
          <p style="margin:6px 0 0;font-size:15px;font-weight:600;color:#0f172a;">${data.rating} out of 5</p>
        </div>

        ${reviewContent}

        ${infoBox(
          "&#128172;&nbsp; You can respond to this review from your dashboard. Thoughtful responses show future clients you care about their experience.",
          "#eff6ff", "#1e40af", "#bfdbfe"
        )}

        ${ctaButton("View & Respond", `${APP_URL}/therapist/reviews`, "#7c3aed")}
      </td>
    </tr>`;

  await sendEmail({
    to: data.therapistEmail,
    subject: `New ${data.rating}-Star Review from ${data.clientName}`,
    html: emailLayout(body),
  });
}
