import express, { Request, Response } from "express";
import { User } from "../entities/user";
import { dataSource } from "../services/db";
import router from "./login";
import nodemailer from "nodemailer";
import crypto from "crypto";
import bcrypt from "bcrypt";

/** -----------DOCUMENTATION-----------
    POST /manage-password/forgot-password --> 
    - Request a password reset for a user.
    - Requires the user's email in the request body.
    - If the user exists and their email is verified, a password reset token is generated, 
      stored in the database, and sent to the user's email. 
    - The token expires after 1 hour.

    POST /manage-password/reset-password --> 
    - Reset the user's password using the token sent via email.
    - Requires the token, user's email, and new password in the request body.
    - The system checks if the token is valid and has not expired.
    - If valid, the password is updated, and the reset token and expiration are cleared.
 */

router.post("/forgot-password", async (req: Request, res: Response) => {
  const { email } = req.body;

  try {
    // Find user by email
    const user = await dataSource
      .getRepository(User)
      .findOne({ where: { email } });

    if (!user) {
      return res.status(400).send("User with that email does not exist.");
    }

    // Check if the user has verified their email
    if (!user.isEmailVerified) {
      return res
        .status(400)
        .send("Please verify your email before resetting your password.");
    }

    // Generate a random reset token
    const token = crypto.randomBytes(32).toString("hex");

    // Hash the token
    const hashedToken = await bcrypt.hash(token, 10);

    // Save the token and expiration date in emailVerificationToken and passwordResetExpires
    user.emailVerificationToken = hashedToken; // Reuse this field for password reset token
    user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

    await dataSource.getRepository(User).save(user);

    // Send the token to the user's email
    const transporter = nodemailer.createTransport({
      host: process.env.SMPT_HOST,
      port: 465,
      secure: true, // true for port 465
      auth: {
        user: process.env.EMAIL_SECRET, // Your email here
        pass: process.env.EMAIL_SECRET_PASSWORD, // Your email password
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_SECRET,
      to: user.email,
      subject: "Password Reset",
      text: `You requested a password reset. Here is your token: ${token}. It will expire in 1 hour.`,
    };

    await transporter.sendMail(mailOptions);

    return res.status(200).send("Password reset token sent to email.");
  } catch (err) {
    return res.status(500).send("Internal server error.");
  }
});

router.post("/reset-password", async (req: Request, res: Response) => {
  const { token, email, newPassword } = req.body;

  try {
    // Find user by email
    const user = await dataSource
      .getRepository(User)
      .findOne({ where: { email } });

    if (!user) {
      return res.status(400).send("Invalid email.");
    }

    // Check if the token has expired
    if (user.passwordResetExpires && user.passwordResetExpires < new Date()) {
      return res.status(400).send("Token has expired.");
    }

    // Compare the provided token with the hashed token in the database (stored in emailVerificationToken)
    const isValidToken = await bcrypt.compare(
      token,
      user.emailVerificationToken!
    );

    if (!isValidToken) {
      return res.status(400).send("Invalid or expired token.");
    }

    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update the user's password and clear the token
    user.password = hashedPassword;
    user.emailVerificationToken = null; // Clear the token after successful password reset
    user.passwordResetExpires = null; // Clear the expiration date

    await dataSource.getRepository(User).save(user);

    return res.status(200).send("Password successfully reset.");
  } catch (err) {
    return res.status(500).send("Internal server error.");
  }
});

export default router;
