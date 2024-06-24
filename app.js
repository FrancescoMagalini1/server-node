import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import login from "./src/login.js";
import {
  createSkybox,
  getSkyboxStatus,
  afterCreateWebhook,
  afterExportWebhook,
} from "./src/skybox.js";
import { authorizer, Biscuit, PublicKey } from "@biscuit-auth/biscuit-wasm";

const app = express();
const port = +process.env.BACKEND_PORT;

app.use(express.json()); // for parsing application/json
app.use(cors());
app.use(cookieParser());
app.use(express.static("public"));

function auth() {
  /**
   * Get stores information function.
   * @param {import("express").Request} req
   * @param {import("express").Response} res
   * @param {import("express").NextFunction} next
   */
  return (req, res, next) => {
    try {
      const token = req.headers["authorization"];
      if (!token) {
        res.status(401).end();
        return;
      }
      if (!token.startsWith("Bearer ")) {
        res.status(403).end();
        return;
      }
      const biscuitToken = Biscuit.fromBase64(
        token.slice(7),
        PublicKey.fromString(process.env.BISCUIT_PUBLIC_KEY)
      );
      const auth = authorizer`
      allow if true;
      `;

      auth.addToken(biscuitToken);
      const acceptedPolicyCustomLimits = auth.authorizeWithLimits({
        max_facts: 1000, // default: 1000
        max_iterations: 100, // default: 100
        max_time_micro: 100000, // default: 1000 (1ms)
      });
      next();
    } catch (error) {
      console.log(error);
      res.status(403).end();
      return;
    }
  };
}

app.get("/v1", (req, res) => {
  res.send("Hello World!");
});
app.post("/v1/auth", login);
app.post("/v1/skybox", auth(), createSkybox);
app.get("/v1/skybox/:id", auth(), getSkyboxStatus);
app.post("/v1/webhook/create", afterCreateWebhook);
app.post("/v1/webhook/export", afterExportWebhook);

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
