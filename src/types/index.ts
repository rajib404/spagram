// ─── API Response Types ──────────────────────────────────────────────────────

export interface ApiError {
  error: string;
  details?: string;
}

export interface ApiSuccess<T = unknown> {
  data?: T;
  message?: string;
}

// ─── Booking Types ───────────────────────────────────────────────────────────

export interface BookingClient {
  id: string;
  name: string;
  email: string;
  image: string | null;
}

export interface BookingTherapist {
  displayName: string;
  slug: string;
  profilePhoto: string | null;
  city: string | null;
  state: string | null;
}

export interface BookingReview {
  id: string;
  rating: number;
  title: string | null;
  comment: string | null;
}

export interface BookingSummary {
  id: string;
  bookingNumber: string;
  date: string;
  startTime: string;
  endTime: string;
  duration: number;
  serviceType: string;
  locationType: string;
  outcallAddress: string | null;
  totalPrice: string;
  bookingFee: string;
  status: string;
  clientNotes: string | null;
  therapistNotes: string | null;
  acceptRejectToken: string | null;
  tokenExpiresAt: string | null;
  createdAt: string;
}

// ─── Therapist Types ─────────────────────────────────────────────────────────

export interface TherapistListItem {
  id: string;
  slug: string;
  displayName: string;
  tagline: string | null;
  profilePhoto: string | null;
  gender: string | null;
  ethnicity: string | null;
  age: number | null;
  state: string | null;
  city: string | null;
  borough: string | null;
  massageTypes: string[];
  incallAvailable: boolean;
  outcallAvailable: boolean;
  incallPricePerHour: string | number | null;
  outcallPricePerHour: string | number | null;
  isVerified: boolean;
  rating: number;
  reviewCount: number;
  lastActiveAt: string | null;
}

// ─── Review Types ────────────────────────────────────────────────────────────

export interface ReviewItem {
  id: string;
  rating: number;
  title: string | null;
  comment: string | null;
  therapistResponse: string | null;
  createdAt: string;
  client: {
    firstName: string | null;
    lastName: string | null;
    image: string | null;
  };
}

// ─── Earnings Types ──────────────────────────────────────────────────────────

export interface EarningsData {
  totalEarnings: string;
  monthlyEarnings: string;
  pendingPayouts: string;
  recentTransactions: EarningsTransaction[];
}

export interface EarningsTransaction {
  id: string;
  bookingNumber: string;
  date: string;
  serviceType: string;
  status: string;
  totalPrice: string;
  bookingFee: string;
  revenue: string;
  clientName: string;
}

// ─── Payment Method Types ────────────────────────────────────────────────────

export interface PaymentMethod {
  id: string;
  brand: string;
  last4: string;
  expMonth: number;
  expYear: number;
}

// ─── User Types ──────────────────────────────────────────────────────────────

export interface UserProfile {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  image: string | null;
  createdAt: string;
}

// ─── Message Types ──────────────────────────────────────────────────────────

export interface MessageItem {
  id: string;
  senderId: string;
  senderName: string;
  senderImage: string | null;
  isMe: boolean;
  content: string;
  isRead: boolean;
  createdAt: string;
}

export interface BookingMessageInfo {
  id: string;
  bookingNumber: string;
  status: string;
  date: string;
  startTime: string;
  endTime: string;
  serviceType: string;
  otherPartyName: string;
  otherPartyImage: string | null;
}

// ─── Notification Types ─────────────────────────────────────────────────────

export interface TherapistNotifications {
  newBookings: number;
  changedBookings: number;
  unreadMessages: number;
}

export interface ClientNotifications {
  statusChanges: number;
  unreadMessages: number;
}
