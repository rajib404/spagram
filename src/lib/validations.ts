import { z } from "zod";

export const registerSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Please enter a valid email"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain an uppercase letter")
    .regex(/[0-9]/, "Password must contain a number"),
  role: z.enum(["CLIENT", "THERAPIST"], {
    error: "Invalid role",
  }),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain an uppercase letter")
      .regex(/[0-9]/, "Password must contain a number"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export const deleteAccountSchema = z.object({
  password: z.string().min(1, "Password is required"),
  confirmation: z.literal("DELETE", {
    error: "Please type DELETE to confirm",
  }),
});

export const reviewSchema = z.object({
  bookingId: z.string().min(1, "Booking ID is required"),
  rating: z.number().int().min(1, "Rating must be at least 1").max(5, "Rating must be at most 5"),
  title: z.string().max(100, "Title must be at most 100 characters").optional().nullable(),
  comment: z
    .string()
    .min(20, "Comment must be at least 20 characters")
    .max(1000, "Comment must be at most 1000 characters")
    .optional()
    .nullable(),
});

export const createBookingSchema = z
  .object({
    therapistProfileId: z.string().min(1, "Therapist is required"),
    date: z.string().min(1, "Date is required"),
    startTime: z.string().min(1, "Start time is required"),
    endTime: z.string().min(1, "End time is required"),
    duration: z.number().int().positive("Duration must be positive"),
    serviceType: z.string().min(1, "Service type is required"),
    locationType: z.enum(["INCALL", "OUTCALL"], {
      error: "Invalid location type",
    }),
    outcallAddress: z.string().optional().nullable(),
    clientNotes: z.string().optional().nullable(),
  })
  .refine(
    (data) =>
      data.locationType !== "OUTCALL" || (data.outcallAddress && data.outcallAddress.trim().length > 0),
    {
      message: "Outcall address is required",
      path: ["outcallAddress"],
    }
  );

// Server-side password change (no confirmPassword needed)
export const serverPasswordSchema = z.object({
  currentPassword: z.string().optional(),
  newPassword: z
    .string()
    .min(8, "New password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain an uppercase letter")
    .regex(/[0-9]/, "Password must contain a number"),
});

// Booking actions (accept/reject/cancel/complete/no-show)
export const bookingActionSchema = z.object({
  bookingId: z.string().min(1, "Booking ID is required").optional(),
  token: z.string().optional(),
}).refine(
  (data) => data.bookingId || data.token,
  { message: "Token or booking ID is required" }
);

export const bookingIdSchema = z.object({
  bookingId: z.string().min(1, "Booking ID is required"),
});

// Favorites
export const favoriteSchema = z.object({
  therapistProfileId: z.string().min(1, "Therapist profile ID is required"),
});

// Therapist notes
export const therapistNotesSchema = z.object({
  bookingId: z.string().min(1, "Booking ID is required"),
  notes: z.string().max(2000, "Notes must be at most 2000 characters").optional().default(""),
});

// User profile update
export const updateProfileSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(50),
  lastName: z.string().min(1, "Last name is required").max(50),
  phone: z.string().max(20).optional().default(""),
});

// Review response
export const reviewResponseSchema = z.object({
  response: z.string().min(1, "Response is required").max(1000, "Response must be at most 1000 characters"),
});

// Payment method actions
export const paymentMethodSchema = z.object({
  paymentMethodId: z.string().min(1, "Payment method ID is required"),
});

// Messages
export const sendMessageSchema = z.object({
  bookingId: z.string().min(1, "Booking ID is required"),
  content: z.string().min(1, "Message cannot be empty").max(2000, "Message must be at most 2000 characters"),
});

export const markMessagesReadSchema = z.object({
  bookingId: z.string().min(1, "Booking ID is required"),
});
