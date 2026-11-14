# Contributing to fabnow

Thank you for your interest in improving **fabnow**!

## Development Setup

```bash
npm install
npm run dev
```

Or run the Cloudflare Workers Vite dev server (`vinext`):

```bash
npx vinext dev
```

Copy [`.env.example`](.env.example) to `.env.local` if you want to configure custom Firebase Authentication or canonical `NEXT_PUBLIC_SITE_URL` origins. Without environment variables, `fabnow` runs cleanly with built-in mock auth and public market/supply telemetry feeds.

## Quality & Verification Checklist

Before opening a pull request, run:

```bash
npm run manifest
node setup.mjs --check
npm run typecheck
npm run lint
npm run build
npx vinext check
```

## Design & Architecture Guidelines

- Follow [`AGENTS.md`](AGENTS.md) and [`DESIGN.md`](DESIGN.md) for Liquid Glass chrome vs. solid content surfaces, touch targets (`>= 44x44px`), contrast ratios, and Server/Client boundary discipline.
- Avoid introducing badge clutter or search bar chrome into the editorial workbench layout.
- Keep commits focused and never include `.env*` files, private credentials, or machine-local file paths.

## License

By contributing, you agree that your contributions will be licensed under the **Apache License 2.0** (see [`LICENSE`](LICENSE) and [`NOTICE`](NOTICE)).
