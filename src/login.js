import db from "./config/db.js";
import ajv from "./config/ajv.js";
import bcrypt from "bcryptjs";
import { biscuit, PrivateKey } from "@biscuit-auth/biscuit-wasm";

const loginSchema = {
  type: "object",
  properties: {
    email: {
      type: "string",
      pattern: "^[^@ \\t\\r\\n]+@[^@ \\t\\r\\n]+\\.[^@ \\t\\r\\n]+$",
    },
    password: {
      type: "string",
      minLength: 8,
    },
  },
  required: ["email", "password"],
  additionalProperties: false,
};

const loginValidate = ajv.compile(loginSchema);

/**
 * Login function.
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 */
async function login(req, res) {
  try {
    /** @type {{email: string, password: string}} */
    let data = req.body;
    let valid = loginValidate(data);
    if (!valid) {
      res.status(400).end();
      return;
    }
    /** @type {{password: string, name: string, surname: string, id: string} | undefined} */
    let result = await db.oneOrNone({
      name: "login_query",
      text: "SELECT id, name, surname, password FROM users WHERE email=$1",
      values: [data.email],
    });
    if (!result) {
      res.status(400).end();
      return;
    }
    let match = await bcrypt.compare(data.password, result.password);
    if (!match) {
      res.status(400).end();
      return;
    }
    const builder = biscuit`
      user(${result.id});
      `;
    const privateKey = PrivateKey.fromString(process.env.BISCUIT_PRIVATE_KEY);
    const token = builder.build(privateKey);
    res
      .status(200)
      .json({
        token: token.toBase64(),
        name: result.name,
        surname: result.surname,
        id: result.id,
      });
  } catch (error) {
    console.log(error);
    res.status(500).end();
  }
}

export default login;
