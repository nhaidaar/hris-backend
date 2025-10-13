# HRIS Backend API

JWT-based authentication backend built with Express + Prisma + PostgreSQL.

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
  - 400 Invalid email or password
  - 403 Inactive account

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
  - 403 Only company super admin can add users
  - 400 Invalid company email
  - 409 Email already exists

### POST `/api/auth/logout` (Protected)

- Description: Revoke current access token and provided refresh token.
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

- Description: Exchanges a valid refresh token for new access/refresh tokens.
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
  - 401 Token has been invalidated / Unauthorized

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

- User: profile fields, `role` enum (`SUPER_ADMIN`, `ADMIN`, `EMPLOYEE`), optional `companyId`
- Company: `username`, `name`, `email`, `domain`, `superAdminId`

## Environment Variables

- `DATABASE_URL`
- `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `JWT_ACCESS_EXPIRES_IN`, `JWT_REFRESH_EXPIRES_IN`
- `REDIS_URL`

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
