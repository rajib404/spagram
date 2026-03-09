import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Strip HTML tags and trim whitespace from user-submitted text. */
export function sanitize(input: string): string {
  return input.replace(/<[^>]*>/g, "").trim();
}
