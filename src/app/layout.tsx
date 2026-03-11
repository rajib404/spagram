import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Providers } from "@/components/shared/providers";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://sparina.com";

export const metadata: Metadata = {
  title: {
    default: "Sparina — Find & Book Massage Therapists",
    template: "%s — Sparina",
  },
  description:
    "Discover and book licensed massage therapists near you. Browse profiles, read reviews, and schedule sessions instantly on Sparina.",
  metadataBase: new URL(APP_URL),
  openGraph: {
    type: "website",
    siteName: "Sparina",
    title: "Sparina — Find & Book Massage Therapists",
    description:
      "Discover and book licensed massage therapists near you. Browse profiles, read reviews, and schedule sessions instantly.",
    url: APP_URL,
  },
  twitter: {
    card: "summary_large_image",
    title: "Sparina — Find & Book Massage Therapists",
    description:
      "Discover and book licensed massage therapists near you.",
  },
  icons: {
    icon: "/icon.svg",
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: APP_URL,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
