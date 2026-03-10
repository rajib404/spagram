export const metadata = {
  title: "Terms of Service | Spagram",
};

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-neutral-900">Terms of Service</h1>
      <p className="mt-2 text-sm text-neutral-500">Last updated: March 2026</p>
      <div className="mt-8 space-y-6 text-sm text-neutral-600 leading-relaxed">
        <section>
          <h2 className="text-lg font-semibold text-neutral-900">
            1. Acceptance of Terms
          </h2>
          <p className="mt-2">
            By accessing or using Spagram, you agree to be bound by these Terms
            of Service. If you do not agree to these terms, please do not use
            our platform.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-neutral-900">
            2. Description of Service
          </h2>
          <p className="mt-2">
            Spagram is an online platform that connects clients with massage
            therapists. We facilitate the booking and payment process but are not
            a party to the service agreement between clients and therapists.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-neutral-900">
            3. User Accounts
          </h2>
          <p className="mt-2">
            You are responsible for maintaining the confidentiality of your
            account credentials and for all activities that occur under your
            account. You must provide accurate and complete information when
            creating your account.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-neutral-900">
            4. Bookings and Payments
          </h2>
          <p className="mt-2">
            All payments are processed securely through Stripe. By making a
            booking, you agree to pay the listed price plus any applicable fees.
            Cancellation policies are set by individual therapists.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-neutral-900">
            5. Prohibited Conduct
          </h2>
          <p className="mt-2">
            You may not use Spagram for any unlawful purpose, to harass or
            abuse other users, to post false or misleading information, or to
            attempt to gain unauthorized access to our systems.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-neutral-900">
            6. Limitation of Liability
          </h2>
          <p className="mt-2">
            Spagram acts as an intermediary platform and is not liable for the
            quality, safety, or legality of services provided by therapists. Use
            the platform at your own discretion.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-neutral-900">
            7. Changes to Terms
          </h2>
          <p className="mt-2">
            We may update these terms from time to time. Continued use of the
            platform after changes constitutes acceptance of the updated terms.
          </p>
        </section>
      </div>
    </div>
  );
}
