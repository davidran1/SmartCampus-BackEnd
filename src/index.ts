import express, { Express, Response } from "express";
import dotenv from "dotenv";
import cors from "cors";
import { pagination } from "typeorm-pagination";
import { authenticateUser } from "./middleware/authenticateUser";
import { validateAdmin } from "./middleware/validateAdmin";
import loginRouter from "./routes/login";
import registerRouter from "./routes/register";
import adminRouter from "./routes/admin";
import verifyEmailRouter from "./routes/verifyEmail";
import managePasswordRouter from "./routes/forgotPassword";
import { Role } from "./entities/role";
import { dataSource } from "./services/db";
import { defaultRoles } from "./constants";
import sensorsDataRouter from "./routes/sensors";

dotenv.config();

const app: Express = express();
app.use(express.json());

// Enable CORS for all origins
app.use(
  cors({
    origin: "*",
  })
);

app.use("/login", loginRouter);
app.use("/register", registerRouter);
app.use("/verify-email", verifyEmailRouter);
app.use("/manage-password", managePasswordRouter);
app.use("/api", authenticateUser,sensorsDataRouter);
app.use("/api/admin", validateAdmin, adminRouter);

const port = process.env.PORT || 10000;

// Function to initialize connection to DB and checks Role table
const main = async () => {
  try {
    await dataSource.initialize();
    const roleRepository = dataSource.getRepository(Role);

    // Checking if the default roles exist in the Role table
    for (const role of defaultRoles) {
      const existingRole = await roleRepository.findOneBy({
        roleId: role.roleId,
      });
      if (!existingRole) {
        await roleRepository.save(role);
      }
    }

    console.log("Connected to Postgres");
  } catch (err) {
    if (err instanceof Error) {
      if ((err as any).code === "ECONNRESET") {
        console.error("Connection reset by peer. Retrying...");
      } else {
        console.error("Database connection error:", err.message);
      }
    } else {
      console.error("An unexpected error occurred:", err);
    }
  }
};

main();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(pagination);

app.get("/smart", (_, res: Response) => {
  res.status(200).json({
    success: true,
    message: "You are connected to Smart Campus web server.",
  });
});

app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});
