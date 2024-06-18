import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();
const port = +process.env.BACKEND_PORT;

app.use(express.json()); // for parsing application/json
app.use(cors());
app.use(cookieParser());

app.get("/v2/", (req, res) => {
  res.send("Hello World!");
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
