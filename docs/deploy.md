# Deploy

The expected deployment target is the user's own server.

## Basic Path

1. Configure environment variables from `.env.example`.
2. Install dependencies with `pnpm install`.
3. Build with `pnpm build`.
4. Run migrations when database modules are introduced.
5. Start with `pnpm start` behind a process manager or Docker.
6. Put Nginx and HTTPS in front of the app.

## Rollback

Keep the previous build artifact or container image available, and roll back environment changes together with code changes.
