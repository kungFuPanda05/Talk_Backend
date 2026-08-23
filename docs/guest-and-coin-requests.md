# Guest sessions and coin requests

## Guest session

Create a guest user without an email or password prompt:

```http
POST /api/auth/guest
Content-Type: application/json

{
  "name": "Aarav",
  "gender": "M"
}
```

`gender` accepts `M` or `F`. The response includes a normal bearer token, and
guest users are marked with `isGuest: true` in the `Users` table. Account login
and registration continue to use their existing endpoints.

## User coin request

Users can submit a request only after their balance reaches zero. The allowed
amount is 1 through 100, and each user can have only one pending request.

```http
POST /api/coin-request/request
Authorization: Bearer <token>
Content-Type: application/json

{
  "requestedCoins": 100
}
```

The latest request is available from `GET /api/coin-request/request`.

## Admin review

Both admin routes require an authenticated user with `isAdmin: true`.

```http
GET /api/coin-request/admin-list?status=pending&page=1&limit=25
```

Approve or reject one request:

```http
PATCH /api/coin-request/review/42
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "status": "approved",
  "adminNote": "Approved from the admin portal"
}
```

Approval adds the requested amount exactly once in the same database
transaction. Re-reviewing an approved or rejected request returns `409` and
does not change the user's balance.

## Database

Apply the migrations before deploying:

```bash
npx sequelize-cli db:migrate
```

This adds `Users.isGuest` and creates the `Coin_Requests` table.
