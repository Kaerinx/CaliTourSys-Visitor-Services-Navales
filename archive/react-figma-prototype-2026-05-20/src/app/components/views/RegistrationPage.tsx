import { useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Select } from "../ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../ui/card";
import { Building2 } from "lucide-react";

interface RegistrationPageProps {
  onRegister: () => void;
  onLogin: () => void;
  onBack: () => void;
}

export function RegistrationPage({ onRegister, onLogin, onBack }: RegistrationPageProps) {
  const [businessType, setBusinessType] = useState("");
  const [otherBusinessType, setOtherBusinessType] = useState("");

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center p-6">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center size-16 rounded-full bg-[var(--color-gov-blue)] mx-auto mb-4">
            <Building2 className="size-8 text-white" />
          </div>
          <CardTitle className="text-2xl">Create Business Owner Account</CardTitle>
          <CardDescription>
            Register to start your business accreditation application
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label required>First Name</Label>
              <Input placeholder="Juan" />
            </div>
            <div className="space-y-2">
              <Label required>Last Name</Label>
              <Input placeholder="Dela Cruz" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label required>Email Address</Label>
              <Input type="email" placeholder="juan@business.com" />
            </div>
            <div className="space-y-2">
              <Label required>Mobile Number</Label>
              <Input placeholder="+63 912 345 6789" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label required>Password</Label>
              <Input type="password" placeholder="Minimum 8 characters" />
            </div>
            <div className="space-y-2">
              <Label required>Confirm Password</Label>
              <Input type="password" placeholder="Re-enter password" />
            </div>
          </div>

          <div className="space-y-2">
            <Label required>Business Name</Label>
            <Input placeholder="Enter your business name" />
          </div>

          <div className="space-y-2">
            <Label required>Business Type</Label>
            <Select
              value={businessType}
              onChange={(e) => {
                setBusinessType(e.target.value);
                if (e.target.value !== "other") {
                  setOtherBusinessType("");
                }
              }}
            >
              <option value="">Select business type</option>
              <option value="resort">Resort</option>
              <option value="hotel">Hotel</option>
              <option value="inn">Inn/Pension House</option>
              <option value="tour">Tour Operator</option>
              <option value="restaurant">Restaurant/Café</option>
              <option value="transport">Transport Services</option>
              <option value="other">Other, please specify</option>
            </Select>
          </div>

          {businessType === "other" && (
            <div className="space-y-2">
              <Label required>Specify Business Type</Label>
              <Input
                placeholder="Enter business type"
                value={otherBusinessType}
                onChange={(e) => setOtherBusinessType(e.target.value)}
                required
              />
            </div>
          )}

          <div className="flex items-start gap-2">
            <input type="checkbox" id="terms" className="mt-1" />
            <label htmlFor="terms" className="text-sm text-muted-foreground">
              I agree to the{" "}
              <a href="#" className="text-[var(--color-gov-blue)] hover:underline">
                Terms and Conditions
              </a>{" "}
              and{" "}
              <a href="#" className="text-[var(--color-gov-blue)] hover:underline">
                Privacy Policy
              </a>
            </label>
          </div>

          <Button className="w-full" onClick={onRegister}>
            Create Account
          </Button>

          <div className="text-center text-sm">
            <span className="text-muted-foreground">Already have an account? </span>
            <button
              onClick={onLogin}
              className="text-[var(--color-gov-blue)] hover:underline"
            >
              Sign in here
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
