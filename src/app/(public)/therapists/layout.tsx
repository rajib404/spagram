import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Browse Massage Therapists",
  description:
    "Search and filter licensed massage therapists by location, specialty, price, and rating. Find the perfect therapist near you on Spagram.",
  alternates: {
    canonical: `${process.env.NEXT_PUBLIC_APP_URL || "https://spagram.com"}/therapists`,
  },
};

export default function TherapistsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
