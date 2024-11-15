import { Role } from "./entities/role";

export interface IUser {
  userName: string;
  firstName: string;
  lastName: string;
  phone: string;
  userId: string;
  email: string;
  password: string;
  role?: Role;
  isEmailVerified: boolean;
  emailVerificationToken: string;
}
