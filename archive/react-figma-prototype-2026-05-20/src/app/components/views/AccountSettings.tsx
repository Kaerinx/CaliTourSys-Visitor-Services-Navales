import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Mail, Phone } from "lucide-react";

export function AccountSettings() {
  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1>Account Settings</h1>
        <p className="text-muted-foreground mt-1">
          Manage your account preferences and security settings
        </p>
      </div>

      <Card>
        <CardHeader className="px-6 pt-6 pb-5">
          <CardTitle>Personal Information</CardTitle>
        </CardHeader>
        <CardContent className="px-6 pb-6 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-5">
            <div className="space-y-2">
              <Label>First Name</Label>
              <Input defaultValue="John" />
            </div>
            <div className="space-y-2">
              <Label>Last Name</Label>
              <Input defaultValue="Martinez" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-5">
            <div className="space-y-2">
              <Label>Email Address</Label>
              <div className="flex items-center gap-3">
                <Mail className="size-4 text-muted-foreground" />
                <Input defaultValue="john@sunsetresort.com" className="flex-1" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Phone Number</Label>
              <div className="flex items-center gap-3">
                <Phone className="size-4 text-muted-foreground" />
                <Input defaultValue="+63 912 345 6789" className="flex-1" />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <Button>Save Changes</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Security</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Current Password</Label>
            <Input type="password" placeholder="Enter current password" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>New Password</Label>
              <Input type="password" placeholder="Enter new password" />
            </div>
            <div className="space-y-2">
              <Label>Confirm Password</Label>
              <Input type="password" placeholder="Confirm new password" />
            </div>
          </div>

          <div className="flex justify-end">
            <Button>Update Password</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
