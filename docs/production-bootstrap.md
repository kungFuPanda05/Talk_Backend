# Production database bootstrap

`scripts/bootstrap-production.js` prepares an empty production database without
running the legacy seeders. In particular, it never runs
`seeders/20250105082051-add-bot-accounts.js`, which creates 20 bot accounts.

The bootstrap is safe to run on every deployment. It:

1. acquires a MySQL advisory lock so concurrent app instances do not migrate at
   the same time;
2. runs only migration files that are absent from `SequelizeMeta`;
3. creates or reconciles exactly two managed demo accounts in one transaction;
4. grants admin status to the demo admin and removes admin status from the
   regular demo account; and
5. only replaces a password when it does not already match, so repeat runs do
   not generate needless hashes or database writes.

It does not delete or demote unrelated production users.

## Required environment variables

Set every value below in the hosting provider. Do not commit their values.

```dotenv
NODE_ENV=production

DB_CONNECTION=
DB_HOST=
DB_PORT=
DB_DATABASE=
DB_USERNAME=
DB_PASSWORD=

DEMO_ADMIN_NAME=
DEMO_ADMIN_EMAIL=
DEMO_ADMIN_PASSWORD=

DEMO_USER_NAME=
DEMO_USER_EMAIL=
DEMO_USER_PASSWORD=

# This must be identical to DEMO_ADMIN_EMAIL because the runtime uses it for
# admin-only socket behavior.
ADMIN_EMAIL_ID=
```

Both passwords must contain at least eight characters, and the two email
addresses must be different.

These settings are optional and have non-secret defaults:

```dotenv
DEMO_ADMIN_GENDER=F
DEMO_USER_GENDER=M
DEMO_STARTING_COINS=1000
```

Existing demo accounts keep their coins when the balance is above the configured
starting value. A lower balance is replenished so both accounts remain usable
for stranger matching.

## Deployment command

Run the bootstrap before starting the built server:

```sh
npm run db:bootstrap && npm run start:prod
```

To check for pending work without changing the database:

```sh
npm run db:bootstrap -- --check
```

The check exits unsuccessfully when a migration or demo-account reconciliation
is needed, making it suitable for a deployment verification step.

To exercise the account reconciliation twice inside a transaction and then roll
everything back:

```sh
npm run db:bootstrap -- --verify-idempotency
```
