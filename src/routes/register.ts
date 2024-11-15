import express, { Request, Response } from "express";
import bcrypt from "bcrypt";
import { User } from "../entities/user";
import { dataSource } from "../services/db";
import { IUser } from "../types";
import { validate } from "../services/validation";
import { Role } from "../entities/role";
import nodemailer from "nodemailer";
import crypto from "crypto";

const router = express.Router();

/** -----------DOCUMENTATION-----------
  User Registration Route

  This route handles the user registration process, including validating the user's input,
  hashing the password, generating an email verification token, storing the user in the 
  database, and sending a verification email.

  - It first validates the incoming request body using a predefined schema.
  - If the validation passes, the password is hashed using bcrypt for security.
  - A random token is generated for email verification and stored (hashed) in the database.
  - The user data, along with the hashed password and token, is inserted into the database.
  - Finally, an email containing the plain token is sent to the user for verification.

  Key Points:
  - Bcrypt is used to securely hash passwords and tokens.
  - Nodemailer is used to send the email containing the verification token.
  - If the user already exists, a proper error is returned.
  
  @param req - The incoming request object, containing user details such as 
               userName, password, firstName, lastName, phone, userId, and email.
  @param res - The response object used to send success or error messages back to the client.
  
  @throws 400 - Validation error for invalid input data.
  @throws 404 - If the student role is not found in the database.
  @throws 500 - Internal server error in case of exceptions during the process.
 */

router.post("/", async (req: Request, res: Response) => {
  try {
    const { userName, password, firstName, lastName, phone, userId, email } =
      req.body;

    // Check if the content is valid
    const validationResult = await validate({
      userName,
      firstName,
      lastName,
      phone,
      userId,
      email,
      password,
      isEmailVerified: false,
      emailVerificationToken: "",
    });

    if (!validationResult.valid) {
      return res.status(400).json({ errors: validationResult.errors });
    }

    // Bcrypt the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const studentRole = await dataSource
      .getRepository(Role)
      .findOne({ where: { roleId: 1 } });

    if (!studentRole) {
      return res.status(404).json({ message: "Student role not found" });
    }

    // Generate a random token and hash it with bcrypt
    const token = crypto.randomBytes(32).toString("hex");
    const hashedToken = await bcrypt.hash(token, salt);

    const user: IUser = {
      userName,
      firstName,
      lastName,
      phone,
      userId,
      email,
      password: hashedPassword,
      role: studentRole,
      isEmailVerified: false, // Set to false initially
      emailVerificationToken: hashedToken, // Store the hashed token
    };

    // Add user to DB
    await dataSource
      .createQueryBuilder()
      .insert()
      .into(User)
      .values(user)
      .execute();

    // Send email verification
    const transporter = nodemailer.createTransport({
      host: process.env.SMPT_HOST,
      port: 465,
      secure: true, // true for port 465, false for other ports
      auth: {
        user: process.env.EMAIL_SECRET,
        pass: process.env.EMAIL_SECRET_PASSWORD,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_SECRET,
      to: user.email,
      subject: "Smart Campus Email Verification",
      text: `Please verify your email by copying and pasting the following token into the verification page:\n\nToken: ${token}`,
    };

    await transporter.sendMail(mailOptions);

    return res
      .status(200)
      .send(
        "User registered successfully. Please check your email for verification."
      );
  } catch (err) {
    return res.status(401).send(err);
  }
});

export default router;
