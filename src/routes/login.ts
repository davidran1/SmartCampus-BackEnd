import express, { Request, Response } from "express";
import bcrypt from "bcrypt";

import { signJwt } from "../utils/jwt";
import { findUserByUsername } from "../services/db";

const router = express.Router();

router.post("/", async (req: Request, res: Response) => {
  const { userName, password } = req.body;

  const user = await findUserByUsername(userName);

  if (!user) {
    console.log("Invalid username");
    return res.status(404).send("Invalid username or password.");
  }

  const validPassword = await bcrypt.compare(password, user.password);
  if (!validPassword) {
    console.log("invalid password");
    return res.status(401).send("Invalid username or password.");
  }

  const token = signJwt({ username: user.userName }, "1h");
  res.send({ token, roleId: user.role.roleId });
});

export default router;
