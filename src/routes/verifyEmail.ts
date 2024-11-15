import express, { Request, Response } from "express";
import bcrypt from "bcrypt";
import { User } from "../entities/user";
import { dataSource } from "../services/db";

const router = express.Router();

/** -----------DOCUMENTATION-----------
  Email Verification Route

  This route handles the email verification process after a user registers. 
  The user is required to submit the token they received via email along with their email 
  in a POST request. The system then verifies if the token matches the one stored in the database.

  - The token and email are sent as part of the POST request body.
  - The route searches for the user by email in the database.
  - It then compares the token provided by the user with the hashed token stored in the database.
  - If the token is valid, the user's `isEmailVerified` field is set to `true` and the 
    `emailVerificationToken` is cleared (set to null).
  - The user’s updated verification status is saved in the database.

  Key Points:
  - Bcrypt is used to securely compare the stored hashed token and the plain token received from the user.
  - The token is invalidated by setting it to null once it is successfully verified.
  
  @param req - The incoming request object, containing the verification token and email.
  @param res - The response object used to send success or error messages back to the client.

  @throws 400 - If the email or token is invalid or expired.
  @throws 500 - Internal server error in case of exceptions during the verification process.
 */

router.post("/", async (req: Request, res: Response) => {
  const { token, email } = req.body;

  try {
    const user = await dataSource
      .getRepository(User)
      .findOne({ where: { email: email as string } });

    if (!user) {
      return res.status(400).send("Invalid email or token.");
    }

    const isValidToken = await bcrypt.compare(
      token as string,
      user.emailVerificationToken!
    );

    if (!isValidToken) {
      return res.status(400).send("Invalid or expired token.");
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = null;

    await dataSource.getRepository(User).save(user);

    return res.status(200).send("Email successfully verified!");
  } catch (err) {
    return res.status(500).send((err as Error).message);
  }
});

export default router;
