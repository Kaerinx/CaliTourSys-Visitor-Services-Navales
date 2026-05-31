import { useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../ui/card";
import { Building2 } from "lucide-react";

interface LoginPageProps {
  onLogin: (role: "business_owner" | "tourism_staff" | "admin") => void;
  onRegister: () => void;
  onBack: () => void;
}

export function LoginPage({ onLogin, onRegister, onBack }: LoginPageProps) {
  const [email, setEmail] = useState("");

  const handleLogin = () => {
    const normalizedEmail = email.trim().toLowerCase();

    if (normalizedEmail.includes("admin")) {
      onLogin("admin");
    } else if (
      normalizedEmail.includes("staff") ||
      normalizedEmail.includes("tourism")
    ) {
      onLogin("tourism_staff");
    } else {
      onLogin("business_owner");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center size-16 rounded-full bg-[var(--color-gov-blue)] mx-auto mb-4">
            <Building2 className="size-8 text-white" />
          </div>
          <CardTitle className="text-2xl">Welcome Back</CardTitle>
          <CardDescription>
            Sign in to your LGU Tourism Accreditation account
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label required>Email Address</Label>
            <Input
              type="email"
              placeholder="your.email@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label required>Password</Label>
            <Input type="password" placeholder="Enter your password" />
          </div>

          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="rounded" />
              <span>Remember me</span>
            </label>
            <a href="#" className="text-[var(--color-gov-blue)] hover:underline">
              Forgot password?
            </a>
          </div>

          <Button className="w-full" onClick={handleLogin}>
            Sign In
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">Demo Accounts</span>
            </div>
          </div>

          <div className="space-y-2 text-sm">
            <p className="text-muted-foreground">Try these demo accounts:</p>
            <div className="space-y-1 text-xs">
              <p>
                <strong>Business Owner:</strong> owner@business.com
              </p>
              <p>
                <strong>Tourism Staff:</strong> staff@tourism.gov.ph
              </p>
              <p>
                <strong>Admin:</strong> admin@tourism.gov.ph
              </p>
            </div>
          </div>

          <div className="text-center text-sm">
            <span className="text-muted-foreground">Don't have an account? </span>
            <button
              onClick={onRegister}
              className="text-[var(--color-gov-blue)] hover:underline"
            >
              Register here
            </button>
          </div>

          <Button variant="ghost" className="w-full" onClick={onBack}>
            Back to Home
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
