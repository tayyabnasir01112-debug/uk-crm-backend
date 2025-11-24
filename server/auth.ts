import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import connectPg from "connect-pg-simple";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { storage } from "./storage";
import type { User } from "@shared/schema";
import { sendVerificationEmail } from "./email";

const pgStore = connectPg(session);

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL must be set");
  }

  // Clean up DATABASE_URL - same as in db.ts
  let dbUrl = process.env.DATABASE_URL.trim();
  // Remove 'psql ' prefix if present
  if (dbUrl.startsWith('psql ')) {
    dbUrl = dbUrl.substring(5).trim();
  }
  // Remove surrounding quotes if present
  if ((dbUrl.startsWith("'") && dbUrl.endsWith("'")) || (dbUrl.startsWith('"') && dbUrl.endsWith('"'))) {
    dbUrl = dbUrl.slice(1, -1).trim();
  }

  // Validate URL format
  if (!dbUrl.startsWith('postgresql://') && !dbUrl.startsWith('postgres://')) {
    throw new Error(`Invalid DATABASE_URL for session store. Got: ${dbUrl.substring(0, 50)}...`);
  }

  // Log the cleaned URL (without credentials)
  const urlForLogging = dbUrl.replace(/:[^:@]+@/, ':****@');
  console.log('🔐 Session store using DATABASE_URL:', urlForLogging.split('@')[1] || 'parsed');

  const sessionStore = new pgStore({
    conString: dbUrl,
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
      secure: process.env.NODE_ENV === "production", // true in production (HTTPS only)
      maxAge: sessionTtl,
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax", // "none" required for cross-origin in production
      domain: undefined, // Don't set domain - let browser handle it
    },
  });
}

const APP_BASE_URL =
  process.env.PUBLIC_APP_URL ||
  process.env.APP_URL ||
  process.env.FRONTEND_URL ||
  "https://crmlaunch.co.uk";

const VERIFICATION_TTL_MINUTES = Number(process.env.VERIFICATION_TTL_MINUTES || 60);

function createVerificationPayload() {
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + VERIFICATION_TTL_MINUTES * 60 * 1000);
  return { code, token, expiresAt };
}

function buildVerificationUrl(token: string) {
  const base = APP_BASE_URL.endsWith("/") ? APP_BASE_URL.slice(0, -1) : APP_BASE_URL;
  return `${base}/login?verify=${token}`;
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

        if (!user.emailVerified) {
          return done(
            null,
            false,
            {
              message: "Please verify your email before logging in",
              requiresVerification: true,
              email: user.email,
            } as any
          );
        }

        // Verify user has ID
        if (!user.id) {
          console.error("User missing ID after password verification:", user);
          return done(new Error("User data error: missing ID"), undefined);
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
    return done(new Error("User missing ID"), undefined);
  }
  done(null, userId);
});

passport.deserializeUser(async (id: string, done) => {
  try {
    if (!id) {
      return done(new Error("Missing user ID"), undefined);
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

      const verification = createVerificationPayload();

      // Create user
      const user = await storage.upsertUser({
        email,
        password: hashedPassword,
        firstName: firstName || null,
        lastName: lastName || null,
        emailVerified: false,
        verificationCode: verification.code,
        verificationToken: verification.token,
        verificationExpires: verification.expiresAt,
      });

      // Verify user was created with an ID
      if (!user || !user.id) {
        console.error("User created but missing ID:", user);
        return res.status(500).json({ message: "User created but missing ID" });
      }

      try {
        await sendVerificationEmail({
          to: email,
          code: verification.code,
          expiresAt: verification.expiresAt,
          verifyUrl: buildVerificationUrl(verification.token),
        });
      } catch (emailError: any) {
        console.error("Failed to send verification email:", emailError);
        return res.status(500).json({
          message: "Registration created but verification email could not be sent. Please try again later.",
        });
      }

      return res.status(201).json({
        message: "Registration successful. Please verify your email to continue.",
        requiresVerification: true,
        email,
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

  // Verify email endpoint
  app.post("/api/verify-email", async (req, res) => {
    try {
      const { email, code, token } = req.body || {};

      if (!token && (!email || !code)) {
        return res.status(400).json({ message: "Provide verification token or email and code" });
      }

      let user: User | undefined;

      if (token) {
        user = await storage.getUserByVerificationToken(token);
      } else if (email) {
        const users = await storage.getUsersByEmail(email);
        user = users[0];
      }

      if (!user) {
        return res.status(404).json({ message: "Account not found" });
      }

      const completeLoginAndRespond = () =>
        req.login(user as User, (err) => {
          if (err) {
            console.error("Auto login failed after verification:", err);
            return res.json({ message: "Email verified. Please log in." });
          }
          const { password: _password, ...safeUser } = user as User;
          return res.json({ message: "Email verified successfully", user: safeUser });
        });

      if (user.emailVerified) {
        return completeLoginAndRespond();
      }

      if (!user.verificationExpires || user.verificationExpires < new Date()) {
        return res.status(400).json({ message: "Verification code expired", expired: true });
      }

      if (token) {
        if (user.verificationToken !== token) {
          return res.status(400).json({ message: "Invalid verification token" });
        }
      } else if (user.verificationCode !== code) {
        return res.status(400).json({ message: "Invalid verification code" });
      }

      const updatedUser = await storage.updateUser(user.id, {
        emailVerified: true,
        verificationCode: null,
        verificationToken: null,
        verificationExpires: null,
      });

      if (!updatedUser) {
        return res.status(500).json({ message: "Failed to update verification status" });
      }

      user = updatedUser;

      return completeLoginAndRespond();
    } catch (error) {
      console.error("Email verification error:", error);
      return res.status(500).json({ message: "Failed to verify email" });
    }
  });

  // Resend verification code endpoint
  app.post("/api/resend-verification", async (req, res) => {
    try {
      const { email } = req.body || {};

      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }

      const users = await storage.getUsersByEmail(email);
      const user = users[0];

      if (!user) {
        return res.status(404).json({ message: "Account not found" });
      }

      if (user.emailVerified) {
        return res.status(400).json({ message: "Email already verified" });
      }

      const verification = createVerificationPayload();

      await storage.updateUser(user.id, {
        verificationCode: verification.code,
        verificationToken: verification.token,
        verificationExpires: verification.expiresAt,
      });

      await sendVerificationEmail({
        to: email,
        code: verification.code,
        expiresAt: verification.expiresAt,
        verifyUrl: buildVerificationUrl(verification.token),
      });

      res.json({ message: "Verification email sent" });
    } catch (error) {
      console.error("Resend verification error:", error);
      res.status(500).json({ message: "Failed to resend verification email" });
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
        if (info?.requiresVerification) {
          return res.status(403).json({
            message: info?.message || "Please verify your email before logging in",
            requiresVerification: true,
            email: info?.email,
          });
        }
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
          console.error("Session login error code:", (err as any)?.code);
          console.error("Session login error syscall:", (err as any)?.syscall);
          console.error("Session login error hostname:", (err as any)?.hostname);
          console.error("User being logged in:", { id: user.id, email: user.email });
          console.error("DATABASE_URL check:", process.env.DATABASE_URL ? `Set (${process.env.DATABASE_URL.substring(0, 30)}...)` : 'Not set');
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

