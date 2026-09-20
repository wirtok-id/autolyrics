import { auth } from "./index";
import { db } from "../db/client";
import { users, sessions } from "../db/schema";
import { eq } from "drizzle-orm";
import { getNextMondayReset } from "../utils";

// Register new user
export async function registerUser(name: string, email: string, password: string) {
  try {
    // Check if email already exists
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (existingUser) {
      throw new Error("Email sudah terdaftar");
    }

    // Create user with Better Auth
    const result = await auth.api.signUpEmail({
      body: {
        name,
        email,
        password,
      },
    });

    // Update additional fields (role, tier, points, pointsResetAt)
    await db
      .update(users)
      .set({
        role: "user",
        tier: "free",
        points: 10,
        pointsResetAt: getNextMondayReset(),
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(users.id, result.user.id));

    return {
      success: true,
      user: result.user,
      session: result.session,
    };
  } catch (error) {
    console.error("Register error:", error);
    throw error;
  }
}

// Login user
export async function loginUser(email: string, password: string) {
  try {
    const result = await auth.api.signInEmail({
      body: {
        email,
        password,
      },
    });

    return {
      success: true,
      user: result.user,
      session: result.session,
    };
  } catch (error) {
    console.error("Login error:", error);
    throw error;
  }
}

// Get session from request
export async function getSession(headers: Headers) {
  try {
    const session = await auth.api.getSession({
      headers,
    });

    return session;
  } catch (error) {
    console.error("Get session error:", error);
    return null;
  }
}

// Logout user
export async function logoutUser(sessionToken: string) {
  try {
    await auth.api.signOut({
      headers: new Headers({
        cookie: `session=${sessionToken}`,
      }),
    });

    return { success: true };
  } catch (error) {
    console.error("Logout error:", error);
    throw error;
  }
}
