import { Request, Response, NextFunction } from "express";
import { verifyJwt } from "../utils/jwt";
import { JwtPayload } from "jsonwebtoken";
import { User } from "../entities/user";

/** -----------DOCUMENTATION-----------
  Middleware to validate if the user is an admin.
  This middleware extracts the JWT token from the Authorization header,
  verifies its validity, and checks the user's role.
  
  If the token is missing or invalid, or the user is not found,
  or the user is not an admin, it will return the appropriate error response.
  Otherwise, it allows the request to proceed.
 
  @param req - The incoming request object, containing the token in the Authorization header.
  @param res - The response object used to send error messages in case of unauthorized access.
  @param next - The next middleware function to be called if validation passes.
  
  @throws 401 - Access denied due to missing or invalid token.
  @throws 404 - User not found.
  @throws 403 - Access denied due to insufficient privileges (not an admin).
  @throws 500 - Internal server error in case of exceptions.
 */

export const validateAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    //checking if there is a token
    if (!token) {
      return res.status(401).send("Access denied. No token provided.");
    }

    const decoded = verifyJwt(token);
    //checking if token is valid
    if (!(decoded as JwtPayload)?.username) {
      return res.status(401).send("Invalid token.");
    }

    //finding the user in the db and his role
    const username = (decoded as JwtPayload)?.username;
    const user = await User.findOne({
      where: { userName: username },
      relations: ["role"],
    });

    //checking if user is found
    if (!user) {
      return res.status(404).send("User not found.");
    }

    //checking if user role is admin
    if (user.role.roleId !== 0) {
      return res.status(403).send("Access denied. Not an admin.");
    }

    next();
  } catch (err) {
    console.error(err);
    return res.status(500).send("Internal server error.");
  }
};
