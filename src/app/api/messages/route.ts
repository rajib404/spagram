import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";
import { sendMessageSchema } from "@/lib/validations";
import { logger } from "@/lib/logger";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const bookingId = req.nextUrl.searchParams.get("bookingId");
    if (!bookingId) {
      return NextResponse.json({ error: "bookingId is required" }, { status: 400 });
    }

    // Verify user is a participant and booking is ACCEPTED
    const booking = await db.booking.findUnique({
      where: { id: bookingId },
      select: {
        clientId: true,
        status: true,
        therapistProfile: { select: { userId: true } },
      },
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    const isClient = booking.clientId === session.user.id;
    const isTherapist = booking.therapistProfile.userId === session.user.id;
    if (!isClient && !isTherapist) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    if (booking.status !== "ACCEPTED") {
      return NextResponse.json({ error: "Messages are only available for accepted bookings" }, { status: 400 });
    }

    const messages = await db.message.findMany({
      where: { bookingId },
      orderBy: { createdAt: "asc" },
      include: {
        sender: {
          select: { id: true, firstName: true, lastName: true, image: true },
        },
      },
    });

    const formatted = messages.map((m) => ({
      id: m.id,
      senderId: m.senderId,
      senderName: [m.sender.firstName, m.sender.lastName].filter(Boolean).join(" ") || "User",
      senderImage: m.sender.image,
      isMe: m.senderId === session.user.id,
      content: m.content,
      isRead: m.isRead,
      createdAt: m.createdAt.toISOString(),
    }));

    return NextResponse.json({ messages: formatted });
  } catch (error) {
    logger.error("Error fetching messages:", {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!rateLimit(`messages:${session.user.id}`, 10, 60_000)) {
      return NextResponse.json({ error: "Too many messages. Please slow down." }, { status: 429 });
    }

    const body = await req.json();
    const parsed = sendMessageSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid input" },
        { status: 400 }
      );
    }

    const { bookingId, content } = parsed.data;

    // Verify user is a participant and booking is ACCEPTED
    const booking = await db.booking.findUnique({
      where: { id: bookingId },
      select: {
        clientId: true,
        status: true,
        therapistProfile: { select: { userId: true } },
      },
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    const isClient = booking.clientId === session.user.id;
    const isTherapist = booking.therapistProfile.userId === session.user.id;
    if (!isClient && !isTherapist) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    if (booking.status !== "ACCEPTED") {
      return NextResponse.json({ error: "Messages are only available for accepted bookings" }, { status: 400 });
    }

    const message = await db.message.create({
      data: {
        bookingId,
        senderId: session.user.id,
        content,
      },
      include: {
        sender: {
          select: { id: true, firstName: true, lastName: true, image: true },
        },
      },
    });

    return NextResponse.json({
      message: {
        id: message.id,
        senderId: message.senderId,
        senderName: [message.sender.firstName, message.sender.lastName].filter(Boolean).join(" ") || "User",
        senderImage: message.sender.image,
        isMe: true,
        content: message.content,
        isRead: message.isRead,
        createdAt: message.createdAt.toISOString(),
      },
    });
  } catch (error) {
    logger.error("Error sending message:", {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }
}
