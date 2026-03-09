import { User, Ruler, Weight, Palette, Eye } from "lucide-react";

interface AboutSectionProps {
  bio: string | null;
  age: number | null;
  height: string | null;
  weight: string | null;
  ethnicity: string | null;
  hairColor: string | null;
  eyeColor: string | null;
  gender: string | null;
  massageTypes: string[];
}

export function AboutSection({
  bio,
  age,
  height,
  weight,
  ethnicity,
  hairColor,
  eyeColor,
  gender,
  massageTypes,
}: AboutSectionProps) {
  const details = [
    { label: "Age", value: age ? `${age} years` : null, icon: User },
    { label: "Gender", value: gender, icon: User },
    { label: "Height", value: height, icon: Ruler },
    { label: "Weight", value: weight, icon: Weight },
    { label: "Ethnicity", value: ethnicity, icon: User },
    { label: "Hair", value: hairColor, icon: Palette },
    { label: "Eyes", value: eyeColor, icon: Eye },
  ].filter((d) => d.value);

  return (
    <section id="about">
      <h2 className="text-xl font-semibold text-neutral-900">About</h2>

      {bio && (
        <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-neutral-600">
          {bio}
        </p>
      )}

      {/* Personal details grid */}
      {details.length > 0 && (
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {details.map((d) => (
            <div
              key={d.label}
              className="rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2.5"
            >
              <span className="text-[10px] font-medium uppercase tracking-wider text-neutral-400">
                {d.label}
              </span>
              <p className="mt-0.5 text-sm font-medium text-neutral-800">
                {d.value}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Massage types */}
      {massageTypes.length > 0 && (
        <div className="mt-6">
          <h3 className="text-sm font-medium text-neutral-700">
            Services offered
          </h3>
          <div className="mt-2 flex flex-wrap gap-2">
            {massageTypes.map((type) => (
              <span
                key={type}
                className="rounded-full bg-primary-50 px-3 py-1 text-xs font-medium text-primary-700"
              >
                {type}
              </span>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
