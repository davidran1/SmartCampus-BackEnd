import * as yup from "yup";
import { IUser } from "../types";

// User registration requirements
export const userSchema = yup.object().shape({
  userId: yup
    .string()
    .required("User ID is required")
    .matches(/^\d{9}$/, "ID must be exactly 9 digits"),
  firstName: yup
    .string()
    .required("First name is required")
    .matches(
      /^\d{[a-z] || [A-Z]}$/,
      "first Name must contain only alphabetic characters"
    ),
  lastName: yup
    .string()
    .required("Last name is required")
    .matches(
      /^\d{[a-z] || [A-Z]}$/,
      "last Name must contain only alphabetic characters"
    ),
  email: yup
    .string()
    .email("Invalid email format")
    .required("Email is required"),
  userName: yup.string().required("Username is required"),
  phone: yup
    .string()
    .required("Phone number is required")
    .matches(/^\d{10}$/, "phone must be exactly 10 digits"),
  password: yup
    .string()
    .required("Password is required")
    .min(8, "Password must be at least 8 characters long")
    .max(20, "password must be at most 20 characters long")
    .matches(/[a-z]/, "Password must contain at least one lowercase letter")
    .matches(/[A-Z]/, "Password must contain at least one uppercase letter")
    .matches(
      /[!@#$%^&*(),.?":{}|<>]/,
      "Password must contain at least one symbol"
    ),
});

/**
 * This function checks if the content provided is valid according to user registration requirements
 */
export async function validate(
  data: IUser
): Promise<{ valid: boolean; errors?: string[] }> {
  try {
    await userSchema.validate(data, { abortEarly: false });
    return { valid: true };
  } catch (err: any) {
    return { valid: false, errors: err.errors };
  }
}
