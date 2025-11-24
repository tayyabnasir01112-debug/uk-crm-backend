import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { apiUrl, API_BASE_URL } from "@/lib/api";
import { ArrowLeft, Home } from "lucide-react";

type AuthMode = "login" | "signup" | "verify";

export default function Login() {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const searchParams = new URLSearchParams(window.location.search);
  const initialMode: AuthMode = searchParams.has("signup") ? "signup" : "login";
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [verificationMessage, setVerificationMessage] = useState<string | null>(null);
  const [resendTimer, setResendTimer] = useState(0);

  const isLogin = mode === "login";
  const isSignup = mode === "signup";
  const verificationTargetEmail = verificationEmail || email || "";
  const maskedEmail = verificationTargetEmail
    ? verificationTargetEmail.replace(/(^.{2}).+(@.*$)/, (_, start, domain) => `${start}***${domain}`)
    : "your email";

  const resetVerificationState = () => {
    setVerificationMessage(null);
    setVerificationCode("");
    setVerificationEmail("");
    setResendTimer(0);
  };

  const startVerificationFlow = (targetEmail: string, message?: string) => {
    setMode("verify");
    setVerificationEmail(targetEmail);
    setVerificationMessage(message || "Enter the 6-digit code we sent to your email address.");
    setVerificationCode("");
    setResendTimer(60);
  };

  const switchAuthMode = (nextMode: AuthMode) => {
    setMode(nextMode);
    if (nextMode !== "verify") {
      resetVerificationState();
    }
  };

  async function submitVerification(options?: { token?: string }) {
    const usingToken = Boolean(options?.token);
    const targetEmail = verificationEmail || email;

    if (!usingToken) {
      if (!targetEmail) {
        toast({
          title: "Missing email",
          description: "Enter the email you used to sign up.",
          variant: "destructive",
        });
        return;
      }

      if (verificationCode.length !== 6) {
        toast({
          title: "Invalid code",
          description: "Please enter the 6-digit verification code.",
          variant: "destructive",
        });
        return;
      }
    }

    setLoading(true);

    try {
      const payload: Record<string, string> = {};
      if (usingToken) {
        payload.token = options!.token!;
      } else {
        payload.email = targetEmail;
        payload.code = verificationCode;
      }

      const response = await fetch(apiUrl("/api/verify-email"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to verify email");
      }

      if (data.user) {
        await queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
        toast({ title: "Email verified", description: "You're now signed in." });
        setLocation("/");
      } else {
        toast({
          title: "Email verified",
          description: "Please log in with your credentials.",
        });
        switchAuthMode("login");
      }

      setVerificationCode("");
      setVerificationMessage(null);
      setResendTimer(0);
      if (data.user?.email || targetEmail) {
        setEmail(data.user?.email || targetEmail);
      }
    } catch (error: any) {
      console.error("âŒ Verification error:", error);
      toast({
        title: "Verification failed",
        description: error.message || "Unable to verify email. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  const handleVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await submitVerification();
  };

  const handleResendCode = async () => {
    const targetEmail = verificationEmail || email;
    if (!targetEmail) {
      toast({
        title: "Missing email",
        description: "Enter the email you used to sign up before requesting a new code.",
        variant: "destructive",
      });
      return;
    }

    setResendLoading(true);
    try {
      const response = await fetch(apiUrl("/api/resend-verification"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: targetEmail }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to resend verification code");
      }

      toast({
        title: "Verification email sent",
        description: `We sent a new code to ${targetEmail}.`,
      });
      setResendTimer(60);
      setVerificationEmail(targetEmail);
    } catch (error: any) {
      toast({
        title: "Unable to resend code",
        description: error.message || "Please try again in a moment.",
        variant: "destructive",
      });
    } finally {
      setResendLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = isLogin ? apiUrl("/api/login") : apiUrl("/api/register");

      console.log("ðŸ” Signup Debug:");
      console.log("  - Full API URL:", url);
      console.log("  - API Base URL:", API_BASE_URL);

      const body = isLogin
        ? { email, password }
        : { email, password, firstName, lastName };

      let response: Response;
      try {
        response = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(body),
        });
      } catch (fetchError: any) {
        console.error("âŒ Fetch error:", fetchError);
        throw new Error(`Network error: ${fetchError.message || "Failed to connect to server"}`);
      }

      let data;
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        try {
          data = await response.json();
        } catch (jsonError) {
          const text = await response.text();
          throw new Error(`Server returned invalid JSON: ${text.substring(0, 200)}`);
        }
      } else {
        const text = await response.text();
        throw new Error(`Server returned non-JSON response (${response.status}): ${text.substring(0, 200)}`);
      }

      if (!response.ok) {
        if (response.status === 403 && data?.requiresVerification) {
          startVerificationFlow(data.email || email, data.message);
          toast({
            title: "Verify your email",
            description: data.message || "We just sent you a fresh verification code.",
          });
          return;
        }
        throw new Error(data.message || `Authentication failed: ${response.status} ${response.statusText}`);
      }

      if (isSignup && data?.requiresVerification) {
        startVerificationFlow(email, data.message);
        toast({
          title: "Verify your email",
          description: "Enter the 6-digit code we sent to your inbox.",
        });
        return;
      }

      await queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });

      toast({
        title: "Success",
        description: isLogin ? "Logged in successfully" : "Account created successfully",
      });

      setLocation("/");
    } catch (error: any) {
      console.error("âŒ Authentication error:", error);
      console.error("Error details:", {
        message: error.message,
        stack: error.stack,
        name: error.name,
      });

      let errorMessage = error.message || "Authentication failed";

      if (
        error.message?.includes("Network error") ||
        error.message?.includes("Failed to fetch") ||
        error.message?.includes("NetworkError") ||
        error.message?.includes("Network request failed")
      ) {
        errorMessage =
          "Cannot connect to server. The backend might be starting up. Please try again in a few seconds.";
      } else if (error.message?.includes("CORS")) {
        errorMessage = "CORS error: Server is not allowing requests from this domain.";
      }

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (resendTimer <= 0) return;
    const interval = setInterval(() => {
      setResendTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [resendTimer]);

  useEffect(() => {
    const token = searchParams.get("verify");
    if (!token) return;
    setMode("verify");
    setVerificationMessage("Verifying your email...");
    submitVerification({ token });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cardTitle =
    mode === "login"
      ? "Welcome Back"
      : mode === "signup"
        ? "Create Account"
        : "Verify Your Email";

  const cardDescription =
    mode === "verify"
      ? undefined
      : mode === "login"
        ? "Sign in to your CRM Launch workspace"
        : "Create a CRM Launch account in seconds";

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 relative">
      <div className="absolute top-4 left-4">
        <Button
          variant="ghost"
          onClick={() => setLocation("/")}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          <Home className="h-4 w-4" />
          Back to Home
        </Button>
      </div>
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            {cardTitle}
          </CardTitle>
          {cardDescription && (
            <CardDescription className="text-center">
              {cardDescription}
            </CardDescription>
          )}
        </CardHeader>
        <CardContent>
          {mode !== "verify" ? (
            <>
              <form onSubmit={handleSubmit} className="space-y-4">
                {isSignup && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name</Label>
                      <Input
                        id="firstName"
                        type="text"
                        placeholder="John"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        required={isSignup}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        type="text"
                        placeholder="Doe"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        required={isSignup}
                      />
                    </div>
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder={isLogin ? "Enter your password" : "Create a secure password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Please wait..." : isLogin ? "Sign In" : "Create Account"}
                </Button>
              </form>
              <div className="mt-4 text-center text-sm">
                <button
                  type="button"
                  onClick={() => {
                    switchAuthMode(isLogin ? "signup" : "login");
                    setEmail("");
                    setPassword("");
                    setFirstName("");
                    setLastName("");
                  }}
                  className="text-primary hover:underline"
                >
                  {isLogin
                    ? "Don't have an account? Sign up"
                    : "Already have an account? Sign in"}
                </button>
              </div>
            </>
          ) : (
            <>
              <form onSubmit={handleVerifySubmit} className="space-y-6">
                <div className="text-center space-y-2">
                  <p className="text-sm text-muted-foreground">
                    {verificationMessage || "Enter the 6-digit code we emailed you."}
                  </p>
                  <p className="text-sm">
                    Sent to{" "}
                    <span className="font-medium text-foreground">
                      {maskedEmail}
                    </span>. It can take up to a minute—check spam or promotions if it’s missing.
                  </p>
                </div>
                <div className="flex justify-center">
                  <InputOTP
                    maxLength={6}
                    value={verificationCode}
                    onChange={(value) => setVerificationCode(value)}
                  >
                    <InputOTPGroup className="flex gap-2">
                      {Array.from({ length: 6 }).map((_, index) => (
                        <InputOTPSlot key={index} index={index} className="w-12 h-12 text-lg" />
                      ))}
                    </InputOTPGroup>
                  </InputOTP>
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={loading || verificationCode.length !== 6}
                >
                  {loading ? "Verifying..." : "Verify Email"}
                </Button>
              </form>
              <div className="mt-4 space-y-2 text-center text-sm">
                <p className="text-muted-foreground">
                  Didn't get an email?
                  <button
                    type="button"
                    onClick={handleResendCode}
                    className="text-primary hover:underline disabled:opacity-50 ml-1"
                    disabled={resendLoading || resendTimer > 0}
                  >
                    {resendTimer > 0 ? `Resend in ${resendTimer}s` : "Resend code"}
                  </button>
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setEmail(verificationEmail || email);
                    switchAuthMode("signup");
                  }}
                  className="text-primary hover:underline block w-full"
                >
                  Change email
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEmail(verificationEmail || email);
                    switchAuthMode("login");
                  }}
                  className="text-primary hover:underline block w-full"
                >
                  Back to login
                </button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
