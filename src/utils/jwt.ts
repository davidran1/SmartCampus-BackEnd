import jwt from "jsonwebtoken";
require("dotenv").config();

const secret = process.env.JWT_SECRET;
if (!secret) {
  throw new Error("secret is undefined");
}

export const signJwt = (payload: object, expiresIn: string | number = "1h") => {
  return jwt.sign(payload, secret, { expiresIn });
};

export const verifyJwt = (token: string) => {
  try {
    return jwt.verify(token, secret);
  } catch (error) {
    return null;
  }
};
