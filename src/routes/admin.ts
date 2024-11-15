import express, { Request, Response } from "express";
import { User } from "../entities/user";

/** -----------DOCUMENTATION-----------
    GET / --> Default route that returns a success message with an admin role.
    GET /users --> Retrieve all users from the database along with their roles.
    GET /users/count --> Retrieve the total number of users.
    PUT /edit/:id --> Edit a user's details (first name, last name, email, and role).
    DELETE /delete/:id --> Delete a user from the database.
 */

const router = express.Router();

// Endpoint to show a success admin entry
router.get("/", async (req: Request, res: Response) => {
  return res.status(200).json({
    status: "The user's role is admin (0), success",
  });
});

// Endpoint to get all users
router.get("/users", async (req: Request, res: Response) => {
  try {
    //getting all the users with relation to their role
    const users = await User.find({
      select: ["userId", "firstName", "lastName", "email"],
      relations: ["role"],
    });

    //mapping the users separately
    const userResponse = users.map((user) => ({
      id: user.userId,
      firstName: `${user.firstName}`,
      lastName:  `${user.lastName}`,
      email: user.email,
      role: user.role.roleDescription,
    }));

    return res.status(200).json(userResponse);
  } catch (error) {
    console.error("Error fetching users:", error);
    return res.status(500).json({ message: "Server error" });
  }
});

// Endpoint to get the number of users
router.get("/users/count", async (req: Request, res: Response) => {
  try {
    const count = await User.count();

    return res.status(200).json({ totalUsers: count });
  } catch (error) {
    console.error("Error fetching user count:", error);
    return res.status(500).json({ message: "Server error" });
  }
});


// Endpoint to edit a certain user
router.put("/edit/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  const { firstName, lastName, email, role } = req.body;

  //role dictionary with string and id for each role
  const roleDicationary: { [key: string]: number } = {
    Admin: 0,
    Student: 1,
    Lecturer: 2,
    Administration: 3,
  };

  try {
    const user = await User.findOne({
      where: { userId: String(id) },
      relations: ["role"],
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    //if there are changes it will change it
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (email) {
      const existingUser = await User.findOneBy({ email });

      //if another user with the same email exists, return a 400 error
      if (existingUser && existingUser.userId !== user.userId) {
        return res.status(400).json({ message: "Email is already in use" });
      }

      user.email = email;
    }
    if (role) {
      const newRoleId = roleDicationary[role];

      if (newRoleId === undefined) {
        return res.status(400).json({ message: "Invalid role provided" });
      }

      user.role.roleDescription = role;
      user.role.roleId = newRoleId;
    }

    //saving the updated user in db
    await user.save();

    return res.status(200).json({
      message: "User updated successfully",
      user: {
        id: user.userId,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Error updating user:", error);
    return res.status(500).json({ message: "Server error" });
  }
});

// Endpoint to delete a certain user
router.delete("/delete/:id", async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const user = await User.findOneBy({ userId: String(id) });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    //delete the user
    await User.remove(user);

    return res.status(200).json({
      message: "User deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting user:", error);
    return res.status(500).json({ message: "Server error" });
  }
});

export default router;
