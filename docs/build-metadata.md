# Build Metadata

This project includes a lightweight build metadata wrapper so the `/about` page can show which deployed release is running.

## Build Command

Use the normal build command:

```bash
npm run build
```

The build script runs:

```bash
node scripts/build-with-metadata.mjs
```

That wrapper sets build metadata environment variables before running `next build`.

## Metadata Variables

The `/about` page reads these values:

- `APP_BUILD_VERSION`
- `BUILD_TIMESTAMP`
- `VERCEL_GIT_COMMIT_SHA`
- `VERCEL_GIT_COMMIT_REF`
- `VERCEL_ENV`
- `VERCEL_URL`
- `npm_package_version`

## Current Fallback Behavior

If `APP_BUILD_VERSION` is not already set:

1. use `VERCEL_GIT_COMMIT_SHA`
2. otherwise use the version from `package.json`
3. otherwise use `"unknown"`

If `BUILD_TIMESTAMP` is not already set:

1. use the current UTC timestamp at build time

## Local Build

You can just run:

```bash
npm run build
```

If you want explicit release metadata in the `/about` page, set the values yourself:

```bash
APP_BUILD_VERSION="v0.1.0+abc1234" \
BUILD_TIMESTAMP="$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
npm run build
```

## Deployment Recommendation

In CI or your hosting platform, prefer setting both values explicitly:

- `APP_BUILD_VERSION`: your release identifier
- `BUILD_TIMESTAMP`: the UTC build/deploy timestamp

Example:

```bash
export APP_BUILD_VERSION="v0.1.0"
export BUILD_TIMESTAMP="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
npm run build
```

## Vercel Notes

On Vercel, the wrapper can usually fall back to:

- `VERCEL_GIT_COMMIT_SHA`
- `VERCEL_GIT_COMMIT_REF`
- `VERCEL_ENV`
- `VERCEL_URL`

That means `npm run build` will still work without extra configuration.

If you want `/about` to show a cleaner release identifier than a raw commit SHA, set `APP_BUILD_VERSION` explicitly in the Vercel build environment.
