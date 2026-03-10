export const metadata = {
  title: "Privacy Policy | Spagram",
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-neutral-900">Privacy Policy</h1>
      <p className="mt-2 text-sm text-neutral-500">Last updated: March 2026</p>
      <div className="mt-8 space-y-6 text-sm text-neutral-600 leading-relaxed">
        <section>
          <h2 className="text-lg font-semibold text-neutral-900">
            1. Information We Collect
          </h2>
          <p className="mt-2">
            We collect information you provide when creating an account (name,
            email address), booking sessions, and using our platform. We also
            collect usage data such as pages visited and device information.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-neutral-900">
            2. How We Use Your Information
          </h2>
          <p className="mt-2">
            Your information is used to provide and improve our services,
            process bookings and payments, communicate with you about your
            account, and ensure platform safety and security.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-neutral-900">
            3. Payment Information
          </h2>
          <p className="mt-2">
            Payment processing is handled by Stripe. We do not store your
            credit card information on our servers. Please refer to Stripe&apos;s
            privacy policy for details on how they handle payment data.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-neutral-900">
            4. Data Sharing
          </h2>
          <p className="mt-2">
            We do not sell your personal information. We share data only as
            necessary to provide our services (e.g., sharing your name with a
            therapist when you book a session) or as required by law.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-neutral-900">
            5. Data Security
          </h2>
          <p className="mt-2">
            We implement industry-standard security measures to protect your
            data, including encryption in transit and at rest. However, no
            method of transmission over the internet is 100% secure.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-neutral-900">
            6. Your Rights
          </h2>
          <p className="mt-2">
            You may access, update, or delete your personal information through
            your account settings. To request a full data export or account
            deletion, contact us at support@spagram.com.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-neutral-900">
            7. Changes to This Policy
          </h2>
          <p className="mt-2">
            We may update this privacy policy from time to time. We will notify
            you of significant changes via email or a notice on our platform.
          </p>
        </section>
      </div>
    </div>
  );
}
