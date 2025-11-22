import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { apiUrl, API_BASE_URL } from "@/lib/api";

export default function Login() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = isLogin ? apiUrl("/api/login") : apiUrl("/api/register");
      
      // Debug logging
      console.log("🔍 Signup Debug:");
      console.log("  - Full API URL:", url);
      console.log("  - API Base URL:", API_BASE_URL);
      console.log("  - VITE_API_URL env:", import.meta.env.VITE_API_URL || '(not set)');
      console.log("  - Window API URL:", (window as any).__API_URL__ || '(not set)');
      
      // Ensure URL is valid - should always be absolute in production
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        console.error("❌ URL is not absolute:", url);
        throw new Error(`Invalid API URL format: ${url}. Expected absolute URL starting with http:// or https://`);
      }
      
      const body = isLogin
        ? { email, password }
        : { email, password, firstName, lastName };

      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });

      // Check if response is JSON
      let data;
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      } else {
        const text = await response.text();
        throw new Error(`Invalid response: ${text.substring(0, 100)}`);
      }

      if (!response.ok) {
        throw new Error(data.message || `Authentication failed: ${response.status} ${response.statusText}`);
      }

      // Invalidate and refetch user data
      await queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      
      toast({
        title: "Success",
        description: isLogin ? "Logged in successfully" : "Account created successfully",
      });

      // Redirect to dashboard
      setLocation("/");
    } catch (error: any) {
      console.error("❌ Authentication error:", error);
      console.error("Error details:", {
        message: error.message,
        stack: error.stack,
        name: error.name,
      });
      
      // Better error messages
      let errorMessage = error.message || "Authentication failed";
      
      // Handle specific error types
      if (error.message?.includes("Failed to fetch") || 
          error.message?.includes("NetworkError") ||
          error.message?.includes("Network request failed")) {
        errorMessage = "Cannot connect to server. The backend might be starting up. Please try again in a few seconds.";
      } else if (error.message?.includes("Invalid API URL") || error.message?.includes("Invalid URL")) {
        errorMessage = `API URL Error: ${error.message}. Check console for details.`;
      } else if (error.message?.includes("CORS")) {
        errorMessage = "CORS error: Server is not allowing requests from this domain.";
      } else if (error.message?.includes("Invalid response")) {
        errorMessage = error.message;
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

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            {isLogin ? "Welcome Back" : "Create Account"}
          </CardTitle>
          <CardDescription className="text-center">
            {isLogin
              ? "Sign in to your CRM account"
              : "Sign up to get started with your CRM"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      type="text"
                      placeholder="John"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      required={!isLogin}
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
                      required={!isLogin}
                    />
                  </div>
                </div>
              </>
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
                placeholder="••••••••"
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
                setIsLogin(!isLogin);
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
        </CardContent>
      </Card>
    </div>
  );
}

