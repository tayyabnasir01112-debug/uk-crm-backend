import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import connectPg from "connect-pg-simple";
import bcrypt from "bcrypt";
import { storage } from "./storage";
import type { User } from "@shared/schema";

const pgStore = connectPg(session);

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL must be set");
  }

  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: true,
    ttl: sessionTtl,
    tableName: "sessions",
  });

  return session({
    secret: process.env.SESSION_SECRET || "change-this-secret-in-production",
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: sessionTtl,
      sameSite: "lax",
    },
  });
}

// Configure Passport Local Strategy
passport.use(
  new LocalStrategy(
    {
      usernameField: "email",
      passwordField: "password",
    },
    async (email, password, done) => {
      try {
        // Find user by email
        const users = await storage.getUsersByEmail(email);
        const user = users[0];

        if (!user) {
          return done(null, false, { message: "Invalid email or password" });
        }

        // Check for password field
        if (!user.password) {
          console.error("User found but no password field:", { id: user.id, email: user.email });
          return done(null, false, { message: "Please set a password for your account" });
        }

        // Verify password
        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) {
          return done(null, false, { message: "Invalid email or password" });
        }

        // Verify user has ID
        if (!user.id) {
          console.error("User missing ID after password verification:", user);
          return done(new Error("User data error: missing ID"), null);
        }

        return done(null, user);
      } catch (error: any) {
        console.error("LocalStrategy error:", error);
        console.error("Error stack:", error?.stack);
        return done(error);
      }
    }
  )
);

passport.serializeUser((user: Express.User, done) => {
  const userId = (user as User).id;
  if (!userId) {
    console.error("Serialization error: user missing ID", user);
    return done(new Error("User missing ID"), null);
  }
  done(null, userId);
});

passport.deserializeUser(async (id: string, done) => {
  try {
    if (!id) {
      return done(new Error("Missing user ID"), null);
    }
    const user = await storage.getUser(id);
    if (!user) {
      return done(null, false);
    }
    done(null, user);
  } catch (error) {
    console.error("Deserialization error:", error);
    done(error);
  }
});

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  // Register endpoint
  app.post("/api/register", async (req, res) => {
    try {
      const { email, password, firstName, lastName } = req.body;

      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }

      // Check if user already exists
      const existingUsers = await storage.getUsersByEmail(email);
      if (existingUsers.length > 0) {
        return res.status(400).json({ message: "Email already registered" });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user
      const user = await storage.upsertUser({
        email,
        password: hashedPassword,
        firstName: firstName || null,
        lastName: lastName || null,
      });

      // Verify user was created with an ID
      if (!user || !user.id) {
        console.error("User created but missing ID:", user);
        return res.status(500).json({ message: "User created but missing ID" });
      }

      // Auto-login after registration
      req.login(user, (err) => {
        if (err) {
          console.error("Login error after registration:", err);
          console.error("User object:", { id: user.id, email: user.email });
          // Still return success - user can login manually
          return res.status(201).json({ 
            user, 
            message: "Registration successful. Please log in.",
            requiresLogin: true 
          });
        }
        return res.json({ user, message: "Registration successful" });
      });
    } catch (error: any) {
      console.error("Registration error:", error);
      console.error("Error stack:", error.stack);
      console.error("Error name:", error.name);
      console.error("Error message:", error.message);
      
      // Better error messages
      let errorMessage = "Registration failed";
      if (error.message?.includes("Invalid URL")) {
        errorMessage = "Database configuration error. Please contact support.";
        console.error("DATABASE_URL might be invalid:", process.env.DATABASE_URL ? "Set" : "Not set");
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      res.status(500).json({ message: errorMessage });
    }
  });

  // Login endpoint
  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err: any, user: User | false, info: any) => {
      if (err) {
        console.error("Login authentication error:", err);
        console.error("Login error stack:", err?.stack);
        console.error("Login error name:", err?.name);
        return res.status(500).json({ message: err.message || "An error occurred during login" });
      }
      if (!user) {
        return res.status(401).json({ message: info?.message || "Invalid email or password" });
      }
      
      // Verify user has ID before login
      if (!user.id) {
        console.error("Login error: user missing ID", user);
        return res.status(500).json({ message: "User data error" });
      }
      
      req.login(user, (err) => {
        if (err) {
          console.error("Session login error:", err);
          console.error("Session login error stack:", err?.stack);
          console.error("User being logged in:", { id: user.id, email: user.email });
          return res.status(500).json({ message: err.message || "Failed to log in user" });
        }
        res.json({ message: "Logged in successfully", user });
      });
    })(req, res, next);
  });

  // Logout endpoint
  app.post("/api/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ message: "Logout failed" });
      }
      res.json({ message: "Logout successful" });
    });
  });
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  return res.status(401).json({ message: "Unauthorized" });
};

