# HRIS Backend API

JWT-based authentication backend built with Express + Prisma + PostgreSQL, Redis (JWT blacklist + queues), and Nodemailer.

## Base URL

- Local: `http://localhost:3000`

## Authentication

### POST `/api/auth/login`

- Description: Authenticate user and return access and refresh tokens.
- Request (JSON):

```json
{
  "email": "user@company.com",
  "password": "YourPassword123!"
}
```

- Success (200):

```json
{
  "success": true,
  "message": "Login successful.",
  "data": {
    "accessToken": "<JWT>",
    "refreshToken": "<JWT>",
    "user": {
      "id": "uuid",
      "email": "user@company.com",
      "firstName": "User",
      "lastName": "Name",
      "status": "ACTIVE",
      "role": "EMPLOYEE",
      "companyId": "uuid"
    }
  }
}
```

- Errors:
  - 400 Invalid email or password.
  - 403 Your account is inactive. Please contact administrator!

### POST `/api/auth/register` (Protected)

- Description: Super admin registers a new user in their company.
- Auth: `Authorization: Bearer <accessToken>`
- Request (JSON):

```json
{
  "email": "new.user@company.com",
  "password": "TestPassword123!",
  "firstName": "New",
  "lastName": "User",
  "role": "EMPLOYEE"
}
```

- Success (201):

```json
{
  "success": true,
  "message": "User created.",
  "data": {
    "id": "uuid",
    "email": "new.user@company.com",
    "firstName": "New",
    "lastName": "User",
    "status": "ACTIVE",
    "role": "EMPLOYEE",
    "companyId": "uuid"
  }
}
```

- Errors:
  - 403 Only company super admin can add users.
  - 400 Email address must be a valid company email.
  - 409 Email already exists.

### POST `/api/auth/logout` (Protected)

- Description: Revoke current access token and provided refresh token (both are blacklisted in Redis).
- Auth: `Authorization: Bearer <accessToken>`
- Request (JSON):

```json
{
  "refreshToken": "<JWT>"
}
```

- Success (200):

```json
{ "success": true, "message": "Logout successful.", "data": null }
```

### POST `/api/auth/refresh-token`

- Description: Exchanges a valid refresh token for new access/refresh tokens. Refresh tokens are checked against the Redis blacklist.
- Request (JSON):

```json
{
  "refreshToken": "<JWT>"
}
```

- Success (200):

```json
{
  "success": true,
  "message": "Login successful.",
  "data": {
    "accessToken": "<JWT>",
    "refreshToken": "<JWT>",
    "user": {
      "id": "uuid",
      "email": "user@company.com",
      "firstName": "User",
      "lastName": "Name",
      "status": "ACTIVE",
      "role": "EMPLOYEE",
      "companyId": "uuid"
    }
  }
}
```

- Errors:
  - 401 Token has been invalidated / Unauthorized.

### POST `/api/auth/reset-password`

- Description: Request an OTP to be sent to the user’s email for password reset.
- Request (JSON):

```json
{
  "email": "user@company.com"
}
```

- Success (200):

```json
{
  "success": true,
  "message": "OTP sent to user@company.com. Valid for 5 minutes.",
  "data": null
}
```

- Errors:
  - 404 User not found.
  - 500 Failed to generate OTP.

### POST `/api/auth/reset-password/verify`

- Description: Verify OTP and issue temporary JWTs to allow password change.
- Request (JSON):

```json
{
  "email": "user@company.com",
  "otp": "123456"
}
```

- Success (200):

```json
{
  "success": true,
  "message": "OTP verified.",
  "data": {
    "accessToken": "<JWT>",
    "refreshToken": "<JWT>",
    "user": {
      "id": "uuid",
      "email": "user@company.com",
      "firstName": "User",
      "lastName": "Name",
      "status": "ACTIVE",
      "role": "EMPLOYEE",
      "companyId": "uuid"
    }
  }
}
```

- Errors:
  - 400 Invalid OTP.
  - 404 User not found.

### PUT `/api/auth/reset-password` (Protected)

- Description: Change password using the access token obtained from OTP verification.
- Auth: `Authorization: Bearer <accessToken>`
- Request (JSON):

```json
{
  "email": "user@company.com",
  "newPassword": "NewStrongP@ss123"
}
```

- Success (200):

```json
{
  "success": true,
  "message": "Password changed successfully.",
  "data": null
}
```

- Errors:
  - 401 Unauthorized.
  - 404 User not found.

## Auth Header

For protected endpoints, include:

```
Authorization: Bearer <accessToken>
```

## Response Format

All responses follow:

```json
{
  "success": true,
  "message": "...",
  "data": {}
}
```

For errors:

```json
{
  "success": false,
  "message": "Error message"
}
```

## Models (Prisma)

- User: profile fields, `role` enum (`SUPER_ADMIN`, `ADMIN`, `EMPLOYEE`), optional `companyId`.
- Company: `username` (unique), `name`, `email`, `domain` (unique), `superAdminId`.

## Environment Variables

- `DATABASE_URL`
- `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `JWT_ACCESS_EXPIRES_IN`, `JWT_REFRESH_EXPIRES_IN`
- `REDIS_URL` (or queue config below)
- SMTP for Nodemailer (Resend or other):
  - `MAIL_HOST`, `MAIL_PORT`, `MAIL_USERNAME`, `MAIL_PASSWORD`, `EMAIL_USER`
- Queue (Bull) alternative to REDIS_URL:
  - `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD`

## Examples (cURL)

Login:

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@company.com","password":"YourPassword123!"}'
```

Register (as super admin):

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Authorization: Bearer $ACCESS" \
  -H "Content-Type: application/json" \
  -d '{"email":"new.user@company.com","password":"TestPassword123!","firstName":"New","lastName":"User","role":"EMPLOYEE"}'
```

Logout:

```bash
curl -X POST http://localhost:3000/api/auth/logout \
  -H "Authorization: Bearer $ACCESS" \
  -H "Content-Type: application/json" \
  -d '{"refreshToken":"'$REFRESH'"}'
```

Refresh Token:

```bash
curl -X POST http://localhost:3000/api/auth/refresh-token \
  -H "Content-Type: application/json" \
  -d '{"refreshToken":"'$REFRESH'"}'
```

Request OTP:

```bash
curl -X POST http://localhost:3000/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{"email":"user@company.com"}'
```

Verify OTP:

```bash
curl -X POST http://localhost:3000/api/auth/reset-password/verify \
  -H "Content-Type: application/json" \
  -d '{"email":"user@company.com","otp":"123456"}'
```

Change Password (requires access token from verify step):

```bash
curl -X PUT http://localhost:3000/api/auth/reset-password \
  -H "Authorization: Bearer $ACCESS" \
  -H "Content-Type: application/json" \
  -d '{"email":"user@company.com","newPassword":"NewStrongP@ss123"}'
```

## Notes

- Logout requires Authorization bearer token and a valid `refreshToken` in the body; both tokens are added to the Redis blacklist.
- Email sending uses Nodemailer; for Resend SMTP, prefer:
  - `MAIL_HOST=smtp.resend.com`, `MAIL_PORT=465`, `secure=false`.
- If using Bull queues, ensure Redis is reachable via `REDIS_URL` or (`REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD`).
