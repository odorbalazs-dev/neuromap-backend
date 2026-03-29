import express from "express";
import cors from "cors";

import { env } from "../config/env.js";
import checkoutRoutes from "../api/routes/checkout.routes.js";
import sessionRoutes from "../api/routes/session.routes.js";
import webhookRoutes from "../api/routes/webhook.routes.js";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/checkout", checkoutRoutes);
app.use("/session", sessionRoutes);
app.use("/webhook", webhookRoutes);

app.get("/health", (_, res) => {
  res.json({ status: "ok" });
});

app.listen(env.PORT, () => {
  console.log(`Server running on port ${env.PORT}`);
});