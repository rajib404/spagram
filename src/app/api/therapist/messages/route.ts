import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session.user.therapistProfileId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const profileId = session.user.therapistProfileId;

    const bookings = await db.booking.findMany({
      where: {
        therapistProfileId: profileId,
        status: "ACCEPTED",
      },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        bookingNumber: true,
        status: true,
        date: true,
        startTime: true,
        endTime: true,
        serviceType: true,
        client: {
          select: {
            firstName: true,
            lastName: true,
            image: true,
          },
        },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: {
            content: true,
            createdAt: true,
            senderId: true,
          },
        },
        _count: {
          select: {
            messages: {
              where: {
                senderId: { not: session.user.id },
                isRead: false,
              },
            },
          },
        },
      },
    });

    const formatted = bookings.map((b) => ({
      id: b.id,
      bookingNumber: b.bookingNumber,
      status: b.status,
      date: b.date.toISOString(),
      startTime: b.startTime,
      endTime: b.endTime,
      serviceType: b.serviceType,
      otherPartyName: [b.client.firstName, b.client.lastName].filter(Boolean).join(" ") || "Client",
      otherPartyImage: b.client.image,
      lastMessage: b.messages[0]
        ? {
            content: b.messages[0].content,
            createdAt: b.messages[0].createdAt.toISOString(),
            isMe: b.messages[0].senderId === session.user.id,
          }
        : null,
      unreadCount: b._count.messages,
    }));

    return NextResponse.json({ conversations: formatted });
  } catch (error) {
    logger.error("Error fetching therapist messages:", {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 });
  }
}
