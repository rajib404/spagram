"use client";

import { Suspense, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";

const registerSchema = z
  .object({
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    email: z.string().email("Please enter a valid email"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain an uppercase letter")
      .regex(/[0-9]/, "Password must contain a number"),
    confirmPassword: z.string(),
    role: z.enum(["CLIENT", "THERAPIST"]),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterForm />
    </Suspense>
  );
}

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [serverError, setServerError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const defaultRole = searchParams.get("role") === "therapist" ? "THERAPIST" : "CLIENT";

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      role: defaultRole,
    },
  });

  const selectedRole = watch("role");

  async function onSubmit(data: RegisterFormData) {
    setIsLoading(true);
    setServerError("");

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          password: data.password,
          role: data.role,
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        setServerError(result.error || "Registration failed");
        setIsLoading(false);
        return;
      }

      // Auto sign-in after registration
      const signInResult = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (signInResult?.error) {
        setServerError("Account created but sign-in failed. Please log in.");
        setIsLoading(false);
        router.push("/login");
        return;
      }

      // Redirect therapists to profile setup, clients to dashboard
      if (data.role === "THERAPIST") {
        router.push("/therapist/profile");
      } else {
        router.push("/user");
      }
      router.refresh();
    } catch {
      setServerError("Something went wrong. Please try again.");
      setIsLoading(false);
    }
  }

  return (
    <div className="card">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold text-neutral-900">Create account</h1>
        <p className="mt-2 text-sm text-neutral-500">
          Join Sparina to book or offer massage services
        </p>
      </div>

      {serverError && (
        <div className="mb-4 rounded-lg bg-error-50 p-3 text-sm text-error-600">
          {serverError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Role selector */}
        <div>
          <label className="mb-2 block text-sm font-medium text-neutral-700">
            I want to
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label
              className={`flex cursor-pointer items-center justify-center rounded-lg border-2 px-4 py-3 text-sm font-medium transition-colors ${
                selectedRole === "CLIENT"
                  ? "border-primary-600 bg-primary-50 text-primary-700"
                  : "border-neutral-200 text-neutral-600 hover:border-neutral-300"
              }`}
            >
              <input
                type="radio"
                value="CLIENT"
                {...register("role")}
                className="sr-only"
              />
              Book massages
            </label>
            <label
              className={`flex cursor-pointer items-center justify-center rounded-lg border-2 px-4 py-3 text-sm font-medium transition-colors ${
                selectedRole === "THERAPIST"
                  ? "border-primary-600 bg-primary-50 text-primary-700"
                  : "border-neutral-200 text-neutral-600 hover:border-neutral-300"
              }`}
            >
              <input
                type="radio"
                value="THERAPIST"
                {...register("role")}
                className="sr-only"
              />
              Offer services
            </label>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label
              htmlFor="firstName"
              className="mb-1 block text-sm font-medium text-neutral-700"
            >
              First name
            </label>
            <input
              id="firstName"
              {...register("firstName")}
              className="input"
              placeholder="John"
              disabled={isLoading}
            />
            {errors.firstName && (
              <p className="mt-1 text-xs text-error-500">
                {errors.firstName.message}
              </p>
            )}
          </div>
          <div>
            <label
              htmlFor="lastName"
              className="mb-1 block text-sm font-medium text-neutral-700"
            >
              Last name
            </label>
            <input
              id="lastName"
              {...register("lastName")}
              className="input"
              placeholder="Doe"
              disabled={isLoading}
            />
            {errors.lastName && (
              <p className="mt-1 text-xs text-error-500">
                {errors.lastName.message}
              </p>
            )}
          </div>
        </div>

        <div>
          <label
            htmlFor="email"
            className="mb-1 block text-sm font-medium text-neutral-700"
          >
            Email
          </label>
          <input
            id="email"
            type="email"
            {...register("email")}
            className="input"
            placeholder="you@example.com"
            disabled={isLoading}
          />
          {errors.email && (
            <p className="mt-1 text-xs text-error-500">
              {errors.email.message}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="password"
            className="mb-1 block text-sm font-medium text-neutral-700"
          >
            Password
          </label>
          <input
            id="password"
            type="password"
            {...register("password")}
            className="input"
            placeholder="Min. 8 characters"
            disabled={isLoading}
          />
          {errors.password && (
            <p className="mt-1 text-xs text-error-500">
              {errors.password.message}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="confirmPassword"
            className="mb-1 block text-sm font-medium text-neutral-700"
          >
            Confirm password
          </label>
          <input
            id="confirmPassword"
            type="password"
            {...register("confirmPassword")}
            className="input"
            placeholder="Re-enter your password"
            disabled={isLoading}
          />
          {errors.confirmPassword && (
            <p className="mt-1 text-xs text-error-500">
              {errors.confirmPassword.message}
            </p>
          )}
        </div>

        <button type="submit" className="btn-primary w-full" disabled={isLoading}>
          {isLoading ? "Creating account..." : "Create account"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-neutral-500">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-medium text-primary-600 hover:text-primary-700"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
