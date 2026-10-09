const PORT = Number(process.env.PORT) || 2000;

// ---------- small helpers so the spec below stays short ----------
const ref = (name: string) => ({ $ref: `#/components/schemas/${name}` });
const jsonBody = (schema: object) => ({ required: true, content: { "application/json": { schema } } });
const jsonResponse = (description: string, schema: object) => ({ description, content: { "application/json": { schema } } });
const errorResponse = (description: string) => jsonResponse(description, ref("Error"));
const idParam = (name: string, description: string) => ({
  name, in: "path", required: true, description,
  schema: { type: "string", example: "665f1c2e8a1b2c3d4e5f6a7b" },
});
const query = (name: string, description: string, type = "string") => ({
  name, in: "query", required: false, description, schema: { type },
});
const bearer = [{ bearerAuth: [] }];

export const swaggerSpec = {
  openapi: "3.0.3",
  info: {
    title: "E-commerce API",
    version: "2.0.0",
    description:
      "E-commerce backend with an admin dashboard and a shopping side for users.\n\n" +
      "**How to authorize:** call `POST /api/auth/login` (or `POST /api/admin/login` for admins), copy the `token`, " +
      "click **Authorize** and paste it (without the `Bearer ` prefix).",
  },
  servers: [{ url: "/", description: "Current server" }],
  tags: [
    { name: "Auth", description: "Register, login, logout, profile and password reset" },
    { name: "Products", description: "Public: browse, search, filter, details and reviews" },
    { name: "Cart", description: "User's shopping cart (login required)" },
    { name: "Wishlist", description: "User's wishlist (login required)" },
    { name: "Admin", description: "Admin login, dashboard and product management (admin only)" },
    { name: "Users", description: "User list (admin only)" },
  ],
  components: {
    securitySchemes: { bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" } },
    schemas: {
      Error: { type: "object", properties: { message: { type: "string" } } },
      Message: { type: "object", properties: { message: { type: "string" } } },
      AuthUser: {
        type: "object",
        properties: {
          id: { type: "string" },
          name: { type: "string", example: "Jane Doe" },
          email: { type: "string", format: "email", example: "jane@example.com" },
          role: { type: "string", enum: ["user", "admin"] },
        },
      },
      AuthResponse: { type: "object", properties: { token: { type: "string" }, user: ref("AuthUser") } },
      RegisterRequest: {
        type: "object", required: ["name", "email", "password"],
        properties: {
          name: { type: "string", example: "Jane Doe" },
          email: { type: "string", format: "email", example: "jane@example.com" },
          password: { type: "string", minLength: 6, example: "secret123" },
        },
      },
      LoginRequest: {
        type: "object", required: ["email", "password"],
        properties: {
          email: { type: "string", format: "email", example: "jane@example.com" },
          password: { type: "string", example: "secret123" },
        },
      },
      ForgotPasswordRequest: {
        type: "object", required: ["email"],
        properties: { email: { type: "string", format: "email" } },
      },
      ResetPasswordRequest: {
        type: "object", required: ["email", "code", "newPassword"],
        properties: {
          email: { type: "string", format: "email" },
          code: { type: "string", description: "6-digit code sent by email (valid 10 minutes)", example: "123456" },
          newPassword: { type: "string", minLength: 6 },
        },
      },
      Product: {
        type: "object",
        properties: {
          _id: { type: "string" },
          name: { type: "string", example: "Wireless Mouse" },
          description: { type: "string", example: "Quiet clicks, 12 month battery" },
          category: { type: "string", example: "Electronics" },
          price: { type: "number", example: 29.99 },
          imageUrl: { type: "string", format: "uri" },
          isHidden: { type: "boolean", description: "Hidden products are only visible to admins" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      ProductList: {
        type: "object",
        properties: {
          total: { type: "integer" }, page: { type: "integer" }, pages: { type: "integer" },
          products: { type: "array", items: ref("Product") },
        },
      },
      Review: {
        type: "object",
        properties: {
          _id: { type: "string" },
          user: { type: "object", properties: { _id: { type: "string" }, name: { type: "string" } } },
          rating: { type: "integer", minimum: 1, maximum: 5 },
          comment: { type: "string" },
          createdAt: { type: "string", format: "date-time" },
        },
      },
      ProductDetails: {
        type: "object",
        properties: {
          product: ref("Product"),
          averageRating: { type: "number", example: 4.5 },
          reviewCount: { type: "integer" },
          reviews: { type: "array", items: ref("Review") },
        },
      },
      ProductForm: {
        type: "object",
        description: "For updates, send only the fields you want to change.",
        properties: {
          name: { type: "string" },
          description: { type: "string" },
          category: { type: "string" },
          price: { type: "number" },
          image: { type: "string", format: "binary", description: "Product image (optional)" },
        },
      },
      ProductAdded: { type: "object", required: ["productId"], properties: { productId: { type: "string" }, quantity: { type: "integer", default: 1, minimum: 1, maximum: 99 } } },
      WishlistAdd: { type: "object", required: ["productId"], properties: { productId: { type: "string" } } },
      QuantityUpdate: { type: "object", required: ["quantity"], properties: { quantity: { type: "integer", minimum: 1, maximum: 99 } } },
      Cart: {
        type: "object",
        properties: {
          items: {
            type: "array",
            items: { type: "object", properties: { product: ref("Product"), quantity: { type: "integer" }, subtotal: { type: "number" } } },
          },
          totalItems: { type: "integer" },
          totalPrice: { type: "number" },
        },
      },
      Wishlist: {
        type: "object",
        properties: { count: { type: "integer" }, products: { type: "array", items: ref("Product") } },
      },
      Dashboard: {
        type: "object",
        properties: {
          stats: {
            type: "object",
            properties: {
              totalProducts: { type: "integer" }, visibleProducts: { type: "integer" },
              hiddenProducts: { type: "integer" }, totalUsers: { type: "integer" },
            },
          },
          recentProducts: { type: "array", items: ref("Product") },
        },
      },
    },
  },
  paths: {
    // ---------------- Auth ----------------
    "/api/auth/register": {
      post: {
        tags: ["Auth"], summary: "Register a new user (sends a welcome email)",
        requestBody: jsonBody(ref("RegisterRequest")),
        responses: { 201: jsonResponse("Created", ref("AuthResponse")), 400: errorResponse("Missing fields or short password"), 409: errorResponse("Email already in use") },
      },
    },
    "/api/auth/login": {
      post: {
        tags: ["Auth"], summary: "Log in",
        requestBody: jsonBody(ref("LoginRequest")),
        responses: { 200: jsonResponse("Logged in", ref("AuthResponse")), 401: errorResponse("Invalid email or password") },
      },
    },
    "/api/auth/logout": {
      post: {
        tags: ["Auth"], summary: "Log out (the current token stops working)", security: bearer,
        responses: { 200: jsonResponse("Logged out", ref("Message")), 401: errorResponse("Unauthorized") },
      },
    },
    "/api/auth/profile": {
      get: {
        tags: ["Auth"], summary: "Get the logged-in user", security: bearer,
        responses: { 200: jsonResponse("Current user", { type: "object", properties: { user: ref("AuthUser") } }), 401: errorResponse("Unauthorized") },
      },
    },
    "/api/auth/forgot-password": {
      post: {
        tags: ["Auth"], summary: "Email a 6-digit password reset code",
        requestBody: jsonBody(ref("ForgotPasswordRequest")),
        responses: { 200: jsonResponse("Code sent (same answer even if the email is unknown)", ref("Message")) },
      },
    },
    "/api/auth/reset-password": {
      post: {
        tags: ["Auth"], summary: "Set a new password using the emailed code",
        requestBody: jsonBody(ref("ResetPasswordRequest")),
        responses: { 200: jsonResponse("Password changed", ref("Message")), 400: errorResponse("Invalid or expired code") },
      },
    },

    // ---------------- Products (public) ----------------
    "/api/products": {
      get: {
        tags: ["Products"], summary: "Browse, search and filter visible products",
        parameters: [
          query("search", "Text to look for in the name or description"),
          query("category", "Exact category (not case sensitive)"),
          query("minPrice", "Minimum price", "number"),
          query("maxPrice", "Maximum price", "number"),
          { ...query("sort", "Sort order"), schema: { type: "string", enum: ["newest", "price_asc", "price_desc", "name"] } },
          query("page", "Page number (default 1)", "integer"),
          query("limit", "Products per page (default 12, max 50)", "integer"),
        ],
        responses: { 200: jsonResponse("Products", ref("ProductList")) },
      },
    },
    "/api/products/categories": {
      get: {
        tags: ["Products"], summary: "List all categories (for a filter dropdown)",
        responses: { 200: jsonResponse("Categories", { type: "object", properties: { categories: { type: "array", items: { type: "string" } } } }) },
      },
    },
    "/api/products/{id}": {
      get: {
        tags: ["Products"], summary: "Product details with reviews",
        parameters: [idParam("id", "Product id")],
        responses: { 200: jsonResponse("Product, average rating and reviews", ref("ProductDetails")), 404: errorResponse("Product not found or hidden") },
      },
    },

    // ---------------- Cart ----------------
    "/api/cart": {
      get: {
        tags: ["Cart"], summary: "View my cart", security: bearer,
        responses: { 200: jsonResponse("Cart", ref("Cart")), 401: errorResponse("Unauthorized") },
      },
      post: {
        tags: ["Cart"], summary: "Add a product to my cart (adds to the quantity if already there)", security: bearer,
        requestBody: jsonBody(ref("ProductAdded")),
        responses: { 201: jsonResponse("Updated cart", ref("Cart")), 400: errorResponse("Invalid productId or quantity"), 404: errorResponse("Product not found") },
      },
      delete: {
        tags: ["Cart"], summary: "Empty my cart", security: bearer,
        responses: { 200: jsonResponse("Empty cart", ref("Cart")) },
      },
    },
    "/api/cart/{productId}": {
      put: {
        tags: ["Cart"], summary: "Change the quantity of a product in my cart", security: bearer,
        parameters: [idParam("productId", "Product id")],
        requestBody: jsonBody(ref("QuantityUpdate")),
        responses: { 200: jsonResponse("Updated cart", ref("Cart")), 404: errorResponse("Product is not in your cart") },
      },
      delete: {
        tags: ["Cart"], summary: "Remove a product from my cart", security: bearer,
        parameters: [idParam("productId", "Product id")],
        responses: { 200: jsonResponse("Updated cart", ref("Cart")) },
      },
    },

    // ---------------- Wishlist ----------------
    "/api/wishlist": {
      get: {
        tags: ["Wishlist"], summary: "View my wishlist", security: bearer,
        responses: { 200: jsonResponse("Wishlist", ref("Wishlist")), 401: errorResponse("Unauthorized") },
      },
      post: {
        tags: ["Wishlist"], summary: "Add a product to my wishlist", security: bearer,
        requestBody: jsonBody(ref("WishlistAdd")),
        responses: { 201: jsonResponse("Updated wishlist", ref("Wishlist")), 404: errorResponse("Product not found") },
      },
    },
    "/api/wishlist/{productId}": {
      delete: {
        tags: ["Wishlist"], summary: "Remove a product from my wishlist", security: bearer,
        parameters: [idParam("productId", "Product id")],
        responses: { 200: jsonResponse("Updated wishlist", ref("Wishlist")) },
      },
    },

    // ---------------- Admin ----------------
    "/api/admin/login": {
      post: {
        tags: ["Admin"], summary: "Log in to the admin dashboard (admins only)",
        requestBody: jsonBody(ref("LoginRequest")),
        responses: { 200: jsonResponse("Logged in", ref("AuthResponse")), 401: errorResponse("Invalid email or password"), 403: errorResponse("Not an admin") },
      },
    },
    "/api/admin/dashboard": {
      get: {
        tags: ["Admin"], summary: "Dashboard numbers", security: bearer,
        responses: { 200: jsonResponse("Stats", ref("Dashboard")), 403: errorResponse("Admin only") },
      },
    },
    "/api/admin/products": {
      get: {
        tags: ["Admin"], summary: "List all products, including hidden ones", security: bearer,
        responses: { 200: jsonResponse("Products", { type: "object", properties: { count: { type: "integer" }, products: { type: "array", items: ref("Product") } } }) },
      },
      post: {
        tags: ["Admin"], summary: "Add a product", security: bearer,
        requestBody: { required: true, content: { "multipart/form-data": { schema: { ...ref("ProductForm"), required: ["name", "category", "price"] } } } },
        responses: { 201: jsonResponse("Created", { type: "object", properties: { message: { type: "string" }, product: ref("Product") } }), 400: errorResponse("Missing or invalid fields") },
      },
    },
    "/api/admin/products/{id}": {
      put: {
        tags: ["Admin"], summary: "Edit a product", security: bearer,
        parameters: [idParam("id", "Product id")],
        requestBody: { required: true, content: { "multipart/form-data": { schema: ref("ProductForm") } } },
        responses: { 200: jsonResponse("Updated", { type: "object", properties: { message: { type: "string" }, product: ref("Product") } }), 404: errorResponse("Product not found") },
      },
      delete: {
        tags: ["Admin"], summary: "Delete a product (also removes it from carts, wishlists and reviews)", security: bearer,
        parameters: [idParam("id", "Product id")],
        responses: { 200: jsonResponse("Deleted", ref("Message")), 404: errorResponse("Product not found") },
      },
    },
    "/api/admin/products/{id}/visibility": {
      patch: {
        tags: ["Admin"], summary: "Hide a visible product, or show a hidden one", security: bearer,
        parameters: [idParam("id", "Product id")],
        responses: { 200: jsonResponse("Visibility changed", { type: "object", properties: { message: { type: "string" }, product: ref("Product") } }), 404: errorResponse("Product not found") },
      },
    },

    // ---------------- Users ----------------
    "/api/users": {
      get: {
        tags: ["Users"], summary: "List all users (admin only)", security: bearer,
        responses: { 200: jsonResponse("Users", { type: "object", properties: { count: { type: "integer" }, users: { type: "array", items: { type: "object" } } } }), 403: errorResponse("Admin only") },
      },
    },
  },
};
