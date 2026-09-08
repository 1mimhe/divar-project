import path from "node:path";
import type { Express } from "express";
import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";

const definition = {
  openapi: "3.0.3",
  info: {
    title: "Divar v2 API",
    description:
      "Classified-ads API: OTP auth with rotating sessions, category trees with " +
      "typed options, owner ads with strict option validation, bookmarks and notes.",
    version: "2.0.0",
  },
  servers: [{ url: "/", description: "Same origin (paths below are absolute)" }],
  components: {
    securitySchemes: {
      bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
      cookieAuth: { type: "apiKey", in: "cookie", name: "access_token" },
    },
    schemas: {
      ApiError: {
        type: "object",
        required: ["statusCode", "error"],
        properties: {
          statusCode: { type: "integer", example: 400 },
          error: {
            type: "object",
            required: ["message"],
            properties: {
              message: { type: "string", example: "Validation failed." },
              details: { type: "object", description: "Field errors or conflict context." },
            },
          },
        },
      },
      Page: {
        type: "object",
        required: ["data", "page", "limit", "total", "pages"],
        properties: {
          data: { type: "array", items: { type: "object" } },
          page: { type: "integer", example: 1 },
          limit: { type: "integer", example: 20 },
          total: { type: "integer", example: 42 },
          pages: { type: "integer", example: 3 },
        },
      },
    },
  },
};

/**
 * Serves the OpenAPI document and Swagger UI at `/swagger`.
 * Annotations live as JSDoc on the `*.routes.ts` files (JSON API only).
 */
export function setupSwagger(app: Express): void {
  const spec = swaggerJsdoc({
    definition,
    apis: [path.join(process.cwd(), "src", "modules", "**", "*.routes.ts")],
  });
  app.use("/swagger", swaggerUi.serve, swaggerUi.setup(spec));
}
