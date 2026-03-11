import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";

export async function GET(req: NextRequest) {
  try {
    const token = req.nextUrl.searchParams.get("token");

    if (!token) {
      return new NextResponse(renderPage("Invalid Link", "No token provided.", null), {
        headers: { "Content-Type": "text/html" },
        status: 400,
      });
    }

    const booking = await db.booking.findUnique({
      where: { acceptRejectToken: token },
      include: {
        client: {
          select: { firstName: true, lastName: true },
        },
        therapistProfile: {
          select: { displayName: true },
        },
      },
    });

    if (!booking) {
      return new NextResponse(
        renderPage("Invalid Link", "This booking link is invalid or has already been used.", null),
        { headers: { "Content-Type": "text/html" }, status: 404 }
      );
    }

    if (booking.tokenExpiresAt && booking.tokenExpiresAt < new Date()) {
      return new NextResponse(
        renderPage("Link Expired", "This booking link has expired. The booking has been automatically declined.", null),
        { headers: { "Content-Type": "text/html" }, status: 410 }
      );
    }

    if (booking.status !== "PENDING") {
      return new NextResponse(
        renderPage(
          "Already Responded",
          `This booking has already been ${booking.status.toLowerCase()}.`,
          null
        ),
        { headers: { "Content-Type": "text/html" } }
      );
    }

    const clientName = `${booking.client.firstName || ""} ${booking.client.lastName || ""}`.trim() || "Client";
    const formattedDate = new Date(booking.date).toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });

    const html = renderPage("Booking Request", "", {
      bookingNumber: booking.bookingNumber,
      clientName,
      therapistName: booking.therapistProfile.displayName,
      date: formattedDate,
      startTime: booking.startTime,
      endTime: booking.endTime,
      duration: booking.duration,
      serviceType: booking.serviceType,
      locationType: booking.locationType,
      outcallAddress: booking.outcallAddress,
      totalPrice: booking.totalPrice.toString(),
      bookingFee: booking.bookingFee.toString(),
      clientNotes: booking.clientNotes,
      token,
    });

    return new NextResponse(html, {
      headers: { "Content-Type": "text/html" },
    });
  } catch (error) {
    logger.error("Respond page error", { error: error instanceof Error ? error.message : String(error) });
    return new NextResponse(
      renderPage("Error", "Something went wrong. Please try again.", null),
      { headers: { "Content-Type": "text/html" }, status: 500 }
    );
  }
}

interface BookingDetails {
  bookingNumber: string;
  clientName: string;
  therapistName: string;
  date: string;
  startTime: string;
  endTime: string;
  duration: number;
  serviceType: string;
  locationType: string;
  outcallAddress: string | null;
  totalPrice: string;
  bookingFee: string;
  clientNotes: string | null;
  token: string;
}

function renderPage(
  title: string,
  message: string,
  booking: BookingDetails | null
) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${title} — Sparina</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f8fafc; color: #0f172a; min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 24px; }
    .card { background: white; border-radius: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); max-width: 520px; width: 100%; padding: 32px; }
    h1 { font-size: 24px; font-weight: 700; margin-bottom: 8px; }
    .subtitle { color: #64748b; font-size: 14px; margin-bottom: 24px; }
    .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #f1f5f9; font-size: 14px; }
    .detail-label { color: #64748b; }
    .detail-value { font-weight: 500; text-align: right; max-width: 60%; }
    .notes { background: #f8fafc; border-radius: 8px; padding: 12px; margin-top: 16px; font-size: 14px; color: #475569; }
    .notes-label { font-weight: 600; font-size: 12px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px; }
    .actions { display: flex; gap: 12px; margin-top: 24px; }
    .btn { flex: 1; padding: 12px 20px; border: none; border-radius: 10px; font-size: 14px; font-weight: 600; cursor: pointer; text-align: center; transition: opacity 0.2s; }
    .btn:hover { opacity: 0.9; }
    .btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .btn-accept { background: #059669; color: white; }
    .btn-reject { background: #e11d48; color: white; }
    .message { text-align: center; color: #64748b; font-size: 15px; margin-top: 16px; }
    #result { display: none; text-align: center; margin-top: 16px; padding: 12px; border-radius: 8px; font-size: 14px; font-weight: 500; }
    .result-success { display: block; background: #ecfdf5; color: #059669; }
    .result-error { display: block; background: #fff1f2; color: #e11d48; }
  </style>
</head>
<body>
  <div class="card">
    <h1>${title}</h1>
    ${message ? `<p class="message">${message}</p>` : ""}
    ${
      booking
        ? `
    <p class="subtitle">Review the details and accept or decline this booking.</p>
    <div>
      <div class="detail-row"><span class="detail-label">Booking</span><span class="detail-value">#${booking.bookingNumber}</span></div>
      <div class="detail-row"><span class="detail-label">Client</span><span class="detail-value">${booking.clientName}</span></div>
      <div class="detail-row"><span class="detail-label">Date</span><span class="detail-value">${booking.date}</span></div>
      <div class="detail-row"><span class="detail-label">Time</span><span class="detail-value">${booking.startTime} — ${booking.endTime} (${booking.duration} min)</span></div>
      <div class="detail-row"><span class="detail-label">Service</span><span class="detail-value">${booking.serviceType}</span></div>
      <div class="detail-row"><span class="detail-label">Location</span><span class="detail-value">${booking.locationType}${booking.outcallAddress ? " — " + booking.outcallAddress : ""}</span></div>
      <div class="detail-row"><span class="detail-label">Session Price</span><span class="detail-value">$${booking.totalPrice}</span></div>
      <div class="detail-row"><span class="detail-label">Booking Fee (10%)</span><span class="detail-value">$${booking.bookingFee}</span></div>
    </div>
    ${booking.clientNotes ? `<div class="notes"><div class="notes-label">Client Notes</div>${booking.clientNotes}</div>` : ""}
    <div class="actions">
      <button class="btn btn-accept" onclick="respond('accept')" id="btn-accept">Accept</button>
      <button class="btn btn-reject" onclick="respond('reject')" id="btn-reject">Decline</button>
    </div>
    <div id="result"></div>
    <script>
      async function respond(action) {
        const btnAccept = document.getElementById('btn-accept');
        const btnReject = document.getElementById('btn-reject');
        const result = document.getElementById('result');
        btnAccept.disabled = true;
        btnReject.disabled = true;
        try {
          const res = await fetch('/api/bookings/' + action, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: '${booking.token}' })
          });
          const data = await res.json();
          if (res.ok) {
            result.className = 'result-success';
            result.textContent = action === 'accept' ? 'Booking accepted! The client has been notified.' : 'Booking declined. The client has been notified.';
            result.style.display = 'block';
            btnAccept.style.display = 'none';
            btnReject.style.display = 'none';
          } else {
            result.className = 'result-error';
            result.textContent = data.error || 'Something went wrong.';
            result.style.display = 'block';
            btnAccept.disabled = false;
            btnReject.disabled = false;
          }
        } catch (e) {
          result.className = 'result-error';
          result.textContent = 'Network error. Please try again.';
          result.style.display = 'block';
          btnAccept.disabled = false;
          btnReject.disabled = false;
        }
      }
    </script>
    `
        : ""
    }
  </div>
</body>
</html>`;
}
