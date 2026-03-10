export const metadata = {
  title: "Cookie Policy | Spagram",
};

export default function CookiesPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-neutral-900">Cookie Policy</h1>
      <p className="mt-2 text-sm text-neutral-500">Last updated: March 2026</p>
      <div className="mt-8 space-y-6 text-sm text-neutral-600 leading-relaxed">
        <section>
          <h2 className="text-lg font-semibold text-neutral-900">
            What Are Cookies
          </h2>
          <p className="mt-2">
            Cookies are small text files stored on your device when you visit a
            website. They help the site remember your preferences and improve
            your experience.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-neutral-900">
            How We Use Cookies
          </h2>
          <div className="mt-2 space-y-3">
            <div>
              <h3 className="font-medium text-neutral-800">
                Essential Cookies
              </h3>
              <p className="mt-1">
                Required for the platform to function. These handle
                authentication, session management, and security. They cannot
                be disabled.
              </p>
            </div>
            <div>
              <h3 className="font-medium text-neutral-800">
                Analytics Cookies
              </h3>
              <p className="mt-1">
                Help us understand how visitors use our platform so we can
                improve the experience. These cookies collect anonymous usage
                data.
              </p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-neutral-900">
            Managing Cookies
          </h2>
          <p className="mt-2">
            You can control cookies through your browser settings. Note that
            disabling essential cookies may prevent you from using certain
            features of the platform, such as logging in or making bookings.
          </p>
        </section>
      </div>
    </div>
  );
}
