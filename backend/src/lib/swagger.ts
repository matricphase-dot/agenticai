import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import { Express } from "express";

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Agentic AI Platform API",
      version: "1.0.0",
      description: "The Infrastructure Layer for the AI Agent Economy — Complete API Reference",
      contact: {
        name: "Agentic AI",
        url: "https://agenticai.dev",
        email: "support@agenticai.dev",
      },
      license: {
        name: "MIT",
        url: "https://opensource.org/licenses/MIT",
      },
    },
    servers: [
      { url: "http://localhost:4000", description: "Development" },
      { url: "https://api.agenticai.dev", description: "Production" },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
        apiKeyAuth: {
          type: "apiKey",
          in: "header",
          name: "X-API-Key",
        },
      },
    },
    security: [{ bearerAuth: [] }],
    tags: [
      { name: "Auth", description: "Authentication & authorization" },
      { name: "Agents", description: "AI Agent CRUD & management" },
      { name: "Invoke", description: "Agent invocation gateway" },
      { name: "Nodes", description: "Compute node management" },
      { name: "Marketplace", description: "Agent marketplace" },
      { name: "Staking", description: "Token staking & rewards" },
      { name: "Billing", description: "Credits & transactions" },
      { name: "Governance", description: "DAO proposals & voting" },
      { name: "Teams", description: "Team collaboration" },
      { name: "Secrets", description: "Encrypted secrets vault" },
      { name: "Storage", description: "Agent key-value storage" },
      { name: "Webhooks", description: "Webhook management" },
      { name: "Monitoring", description: "Logs & metrics" },
      { name: "Audit", description: "Audit trail" },
      { name: "Notifications", description: "User notifications" },
      { name: "Users", description: "User profile management" },
    ],
  },
  apis: ["./src/routes/*.ts"],
};

const swaggerSpec = swaggerJsdoc(options);

export function setupSwagger(app: Express): void {
  app.use(
    "/api-docs",
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, {
      customCss: `
        .swagger-ui .topbar { display: none }
        .swagger-ui { background: #0f0f0f; }
        .swagger-ui .info .title { color: #7C3AED; }
      `,
      customSiteTitle: "Agentic AI — API Reference",
    })
  );
  app.get("/api-docs.json", (_req, res) => {
    res.json(swaggerSpec);
  });
}
