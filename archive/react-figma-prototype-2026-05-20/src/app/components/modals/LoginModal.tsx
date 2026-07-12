import { useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { X, Building2 } from "lucide-react";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (role: "business_owner" | "tourism_staff" | "admin") => void;
  onRegisterClick: () => void;
}

export function LoginModal({ isOpen, onClose, onLogin, onRegisterClick }: LoginModalProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();
    
    // Role detection based on email
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-2 hover:bg-gray-100 transition-colors z-10"
        >
          <X className="size-5 text-gray-500" />
        </button>

        {/* Content */}
        <div className="p-8">
          {/* Logo */}
          <div className="flex items-center justify-center mb-6">
            <div className="flex items-center justify-center size-16 rounded-full bg-[var(--color-gov-blue)]">
              <Building2 className="size-8 text-white" />
            </div>
          </div>

          {/* Header */}
          <div className="text-center mb-8">
            <h2 className="text-2xl mb-2">Welcome Back</h2>
            <p className="text-muted-foreground">
              Sign in to your Business Accreditation account
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label required>Email Address</Label>
              <Input
                type="email"
                placeholder="your.email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label required>Password</Label>
              <Input
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm">Remember me</span>
              </label>
              <a href="#" className="text-sm text-[var(--color-gov-blue)] hover:underline">
                Forgot password?
              </a>
            </div>

            <Button type="submit" className="w-full" size="lg">
              Sign In
            </Button>

            <div className="text-center pt-4 border-t border-border space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-2">
                  New business owner?{" "}
                  <button
                    type="button"
                    onClick={onRegisterClick}
                    className="text-[var(--color-gov-blue)] hover:underline font-medium"
                  >
                    Create an account
                  </button>
                </p>
                <p className="text-xs text-muted-foreground">
                  Staff and admin accounts are managed by the LGU administrator.
                </p>
              </div>

              {/* Demo Accounts */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-xs font-medium text-blue-900 mb-2">Demo Accounts for Testing:</p>
                <div className="space-y-2 text-left">
                  <div className="text-xs">
                    <p className="font-medium text-blue-900">Business Owner:</p>
                    <p className="text-blue-700">owner@business.com</p>
                  </div>
                  <div className="text-xs">
                    <p className="font-medium text-blue-900">Tourism Staff/Officer:</p>
                    <p className="text-blue-700">staff@tourism.gov.ph</p>
                  </div>
                  <div className="text-xs">
                    <p className="font-medium text-blue-900">Administrator:</p>
                    <p className="text-blue-700">admin@tourism.gov.ph</p>
                  </div>
                  <p className="text-xs text-blue-600 italic mt-2">
                    Password: Any password (demo mode)
                  </p>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
