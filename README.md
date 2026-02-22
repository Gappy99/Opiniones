# Endpoints

Base path: `/api/v1`

Auth
- POST /auth/register
- POST /auth/login
- POST /auth/verify-email
- POST /auth/resend-verification
- POST /auth/forgot-password
- POST /auth/reset-password
- GET  /auth/profile
- POST /auth/profile/by-id

Users
- GET  /users/profile/me
- PUT  /users/profile/me
- GET  /users/:userId/roles
- GET  /users/by-role/:roleName

Opinions
- POST   /opinions/
- GET    /opinions/
- GET    /opinions/:id
- PUT    /opinions/:id
- DELETE /opinions/:id

Comments
- POST   /comments/
- GET    /comments/opinion/:opinionId
- GET    /comments/:id
- PUT    /comments/:id
- DELETE /comments/:id

Health
- GET /health
