export const metadata = {
  title: "Careers | Spagram",
};

export default function CareersPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-neutral-900">Careers</h1>
      <div className="mt-8 space-y-6 text-neutral-600 leading-relaxed">
        <p>
          We&apos;re building the future of massage therapy booking. If
          you&apos;re passionate about creating great experiences and want to
          join a growing team, we&apos;d love to hear from you.
        </p>
        <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-6">
          <p className="text-sm font-medium text-neutral-900">
            No open positions right now
          </p>
          <p className="mt-2 text-sm text-neutral-500">
            We don&apos;t have any openings at the moment, but feel free to
            reach out at{" "}
            <span className="font-medium text-neutral-700">
              careers@spagram.com
            </span>{" "}
            and we&apos;ll keep your information on file.
          </p>
        </div>
      </div>
    </div>
  );
}
