import Link from "next/link";
import type { Metadata } from "next";
import packageJson from "../../package.json";

export const metadata: Metadata = {
  title: "About This Build",
};

const safeValue = (value: string | undefined, fallback = "Unavailable") =>
  value && value.trim() ? value.trim() : fallback;

const shortenCommitSha = (value: string | undefined) => {
  const normalized = safeValue(value, "");
  return normalized ? normalized.slice(0, 7) : "Unavailable";
};

const formatDeploymentUrl = (value: string | undefined) => {
  const normalized = safeValue(value, "");

  if (!normalized) {
    return "Not provided";
  }

  return normalized.startsWith("http://") || normalized.startsWith("https://")
    ? normalized
    : `https://${normalized}`;
};

const diagnostics = [
  {
    label: "Version",
    value: safeValue(
      process.env.APP_BUILD_VERSION ??
        process.env.npm_package_version ??
        packageJson.version,
      "Unavailable",
    ),
  },
  {
    label: "Build timestamp",
    value: safeValue(process.env.BUILD_TIMESTAMP, "Unavailable"),
  },
  {
    label: "Commit SHA",
    value: shortenCommitSha(process.env.VERCEL_GIT_COMMIT_SHA),
  },
  {
    label: "Branch",
    value: safeValue(process.env.VERCEL_GIT_COMMIT_REF, "Unavailable"),
  },
  {
    label: "Environment",
    value: safeValue(process.env.VERCEL_ENV, "Unavailable"),
  },
  {
    label: "Deployment URL",
    value: formatDeploymentUrl(process.env.VERCEL_URL).replace("Not provided", "Unavailable"),
  },
] as const;

export default function AboutPage() {
  return (
    <main className="home">
      <header className="home__header">
        <div className="home__title-row">
          <h1>About This Build</h1>
          <Link href="/" className="home__manage-link">
            Workout
          </Link>
        </div>
        <p>
          This page helps identify which deployed build and environment of Gym
          App is currently running.
        </p>
      </header>

      <section className="admin-card about-build" aria-label="Build diagnostics">
        <dl className="about-build__grid">
          {diagnostics.map((item) => (
            <div key={item.label} className="about-build__row">
              <dt className="about-build__label">{item.label}</dt>
              <dd className="about-build__value">{item.value}</dd>
            </div>
          ))}
        </dl>

        <div className="about-build__links">
          <p className="about-build__links-label">Links</p>
          <div className="admin-actions">
            <Link href="/" className="admin-button about-build__link">
              Workout
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
