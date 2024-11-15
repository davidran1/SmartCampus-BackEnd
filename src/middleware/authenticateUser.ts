import { Request, Response, NextFunction } from "express";
import { verifyJwt } from "../utils/jwt";

import { JwtPayload } from "jsonwebtoken";
import { findUserByUsername } from "../services/db";

/**
 * This function checks if the provided token is valid
 *
 */
export const authenticateUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    return res.status(401).send("Access denied. No token provided.");
  }

  const decoded = verifyJwt(token);
  if (!(decoded as JwtPayload)?.username) {
    return res.status(401).send("Invalid token.");
  }

  const username = (decoded as JwtPayload)?.username;

  const user = await findUserByUsername(username);
  if (!user) {
    return res.status(404).send("User not found.");
  }

  // @ts-ignore
  req.user = user;
  next();
};
