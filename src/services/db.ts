import { DataSource } from "typeorm";
import { Role } from "../entities/role";
import { User } from "../entities/user";

// Connect to the database in PostgreSQL
export const dataSource = new DataSource({
  type: "postgres",
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  database: process.env.DB,
  schema: process.env.SCHEMA,
  entities: [User, Role],
  synchronize: true,
  ssl: {
    rejectUnauthorized: false, // Set to true if you have a valid SSL certificate
  },
});

/**
 * Checks if the given username exists in DB
 * @param username
 * @returns user
 */
export async function findUserByUsername(
  userName: string
): Promise<User | null> {
  const userRepository = dataSource.getRepository(User);
  try {
    const user = await userRepository
      .createQueryBuilder("user")
      .leftJoinAndSelect("user.role", "role")
      .where("user.userName = :userName", { userName })
      .getOne();
    return user || null;
  } catch (error) {
    throw new Error("Error finding user by username " + error);
  }
}
