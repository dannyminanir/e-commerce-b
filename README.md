# E-commerce Project

A REST API built with **Node.js**, **Express 5**, **TypeScript** and **MongoDB (Mongoose)**.

- **Auth**: register, login, JWT-protected routes, password reset by emailed code (Gmail SMTP), admin role protection
- **Shop**: public product browsing with search, filters and reviews; cart and wishlist for users
- **Admin**: dashboard and product management (add, edit, delete, hide/show) with image upload to **Cloudinary**
- **Welcome email** sent on registration

## Getting started

Requires Node.js 18+ and a running MongoDB.

```bash
npm install
cp .env.example .env      # then fill in your values
npm run dev
```

The server prints `Server running on http://localhost:<PORT>` once MongoDB is connected.

| Script | What it does |
| --- | --- |
| `npm run dev` | Start with nodemon + ts-node (auto-restart on save) |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm start` | Compile and run `dist/server.js` |

### Environment variables

| Variable | Notes |
| --- | --- |
| `PORT` | Defaults to 2000 |
| `MONGODB_URI` | e.g. `mongodb://localhost:27017/e-commerce` |
| `JWT_SECRET` | Use a long random string |
| `JWT_EXPIRES_IN` | e.g. `1d` |
| `EMAIL_USER`, `EMAIL_PASSWORD` | Gmail address and an **App Password** (turn on 2-Step Verification, then create one at https://myaccount.google.com/apppasswords) |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | **Required**: the app will not start without them |

`.env` is git-ignored. Never commit it.

## API documentation (Swagger)

Interactive docs are served by the app once it is running: http://localhost:2000/api-docs

To call protected endpoints: log in, copy the `token`, click **Authorize** and paste it.
The spec lives in `src/config/swagger.ts`; update it when you add or change routes.

## API

### Auth (everyone)

| Method | Route | Access | Body |
| --- | --- | --- | --- |
| POST | `/api/auth/register` | Public | `name`, `email`, `password` (sends welcome email) |
| POST | `/api/auth/login` | Public | `email`, `password` |
| POST | `/api/auth/logout` | Logged in | (Bearer token) - the token stops working |
| GET | `/api/auth/profile` | Logged in | (Bearer token) |
| POST | `/api/auth/forgot-password` | Public | `email` |
| POST | `/api/auth/reset-password` | Public | `email`, `code`, `newPassword` |

### Products (public, hidden products are never shown)

| Method | Route | Notes |
| --- | --- | --- |
| GET | `/api/products` | Query: `search`, `category`, `minPrice`, `maxPrice`, `sort` (`newest`, `price_asc`, `price_desc`, `name`), `page`, `limit` |
| GET | `/api/products/categories` | Categories for a filter dropdown |
| GET | `/api/products/:id` | Product details + reviews + average rating |

### Cart and wishlist (logged-in users)

| Method | Route | Body |
| --- | --- | --- |
| GET | `/api/cart` | |
| POST | `/api/cart` | `productId`, `quantity` (optional, default 1) |
| PUT | `/api/cart/:productId` | `quantity` |
| DELETE | `/api/cart/:productId` | |
| DELETE | `/api/cart` | (empties the cart) |
| GET | `/api/wishlist` | |
| POST | `/api/wishlist` | `productId` |
| DELETE | `/api/wishlist/:productId` | |

### Admin

| Method | Route | Body |
| --- | --- | --- |
| POST | `/api/admin/login` | `email`, `password` (admins only) |
| GET | `/api/admin/dashboard` | Product and user counts, latest products |
| GET | `/api/admin/products` | All products, including hidden |
| POST | `/api/admin/products` | `form-data`: `name`, `category`, `price`, `description`, `image` (file) |
| PUT | `/api/admin/products/:id` | `form-data`: any of the fields above |
| PATCH | `/api/admin/products/:id/visibility` | Hides a visible product / shows a hidden one |
| DELETE | `/api/admin/products/:id` | Also removes it from carts, wishlists and reviews |

### Users

| Method | Route | Access |
| --- | --- | --- |
| GET | `/api/users` | Admin |

### Password reset flow

1. `forgot-password` creates a 6-digit code, stores a hash of it with a 10-minute expiry, and emails the code.
2. `reset-password` checks the code and expiry, saves the new password, and clears the code so it can't be reused.

### Making an admin

Registration always creates a `user` (the role is never read from the request body). Promote someone in your database:

```bash
mongosh <your-db-name> --eval 'db.users.updateOne({ email: "you@example.com" }, { $set: { role: "admin" } })'
```

## Project structure

```text
src/
  server.ts                  connects to MongoDB, then starts the app
  app.ts                     express setup, route mounting, error handling
  config/                    db, mail, cloudinary, swagger
  models/                    user, product, review, cart, wishlist, revokedToken
  controllers/               auth, user, product (public), adminProduct, admin, cart, wishlist
  routes/                    auth, user, product, admin, cart, wishlist
  middlewares/               authenticate, authorize, validateObjectId, uploadMiddleware
  services/emailService.ts   welcome email, reset code email
  templates/                 welcome email HTML
  utils/                     jwt, authResponse, uploadImage
  types/express.d.ts         adds req.user / req.token to Express types
```
