import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { sendEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const { to } = await req.json();

  if (!to || typeof to !== "string") {
    return NextResponse.json({ error: "Email address is required" }, { status: 400 });
  }

  try {
    const result = await sendEmail({
      to,
      subject: "Test Email — Spagram",
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px;">
          <h1 style="font-size:20px;color:#4f46e5;">Spagram Test Email</h1>
          <p style="color:#334155;line-height:1.6;">
            This is a test email sent from the Spagram admin panel.
          </p>
          <p style="color:#94a3b8;font-size:13px;">
            Sent at ${new Date().toISOString()}
          </p>
        </div>
      `,
    });

    return NextResponse.json({ success: true, id: result?.data?.id });
  } catch (error) {
    console.error("Test email error:", error);
    return NextResponse.json(
      { error: "Failed to send email" },
      { status: 500 }
    );
  }
}
