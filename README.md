# Nadecommerce

An ecommerce storefront and order-management source edition. The existing product
catalog, category and promotion management, cart, checkout, member history, outlet
availability, order administration, payment status, and delivery integrations are
retained for further development.

## Stack and installation

Use Node.js 22 or newer. The project uses Next.js 13, React 18, JavaScript, MySQL
or Supabase, payment and delivery adapters, Google identity/maps, and email services.

```sh
npm ci
npm run dev
```

The default storefront opens at `http://localhost:3000`. Without database
configuration, local JSON catalog storage is used. `data/orders.json` starts empty;
no customer records or historical payments are included. Outlet records are clearly
fictional Demo locations. The included promotion is a synthetic example.

## Development services

Database and provider code remains in place and has not been replaced with mocks.
Configure isolated development services privately before exercising those flows.
MySQL uses `MYSQL_HOST`, `MYSQL_USER`, `MYSQL_PASSWORD`, and `MYSQL_DATABASE`.
Supabase uses runtime URL and key settings. Payment, delivery, Google, email, and
messaging integrations similarly require runtime development configuration.
No environment file, usable credentials, provider transaction records, real contact
addresses, or database export is supplied.

For MySQL setup, use the schema and the existing migration/seed scripts only against
an isolated development database. Administrator creation requires `ADMIN_EMAIL` and
`ADMIN_PASSWORD` supplied at runtime; there is no bundled administrator login.
The optional database-copy helper requires `SANDBOX_MYSQL_HOST` explicitly.

## Checks

```sh
npm run build
```

No full application or external-service verification is implied by this source
edition. Source parsing and local import checks can be performed without live
services. Use synthetic checkout, member, and order data for development and tests.
Generated order files, logs, dependency folders, environment files, and build output
must stay outside uploaded source archives.

## License

MIT. See [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) for dependency notices.
