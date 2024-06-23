import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import login from "./src/login.js";

const app = express();
const port = +process.env.BACKEND_PORT;

app.use(express.json()); // for parsing application/json
app.use(cors());
app.use(cookieParser());
app.use(express.static("public"));

app.get("/v1", (req, res) => {
  res.send("Hello World!");
});
app.post("/v1/auth", login);

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
