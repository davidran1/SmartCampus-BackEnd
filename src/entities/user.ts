import {
  Entity,
  PrimaryColumn,
  Column,
  BaseEntity,
  ManyToOne,
  JoinColumn,
  Generated,
} from "typeorm";
import { Role } from "./role";

// User table

@Entity("user")
export class User extends BaseEntity {
  @Column()
  @Generated("increment")
  id!: number;

  @PrimaryColumn()
  userId!: string;

  @Column()
  firstName!: string;

  @Column()
  lastName!: string;

  @Column({
    unique: true,
  })
  email!: string;

  @Column({
    unique: true,
  })
  userName!: string;

  @Column()
  phone!: string;

  @Column()
  password!: string;

  @ManyToOne(() => Role)
  @JoinColumn({ name: "roleId" })
  role!: Role;

  @Column({ default: false })
  isEmailVerified!: boolean;

  @Column({ nullable: true, type: "varchar" })
  emailVerificationToken!: string | null;

  @Column({ nullable: true, type: "timestamp" })
  passwordResetExpires?: Date | null; // Added field for token expiration
}
