import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Checkbox } from "../ui/checkbox";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Select } from "../ui/select";
import {
  Shield,
  Save,
  UserCog,
  FileText,
  BarChart3,
  Settings,
} from "lucide-react";

const roles = [
  {
    name: "Business Owner",
    users: 233,
    description: "Submit applications, upload documents, track status, renew accreditation",
  },
  {
    name: "Tourism Staff",
    users: 9,
    description: "Review applications, verify documents, request revisions, issue decisions",
  },
  {
    name: "System Administrator",
    users: 3,
    description: "Manage users, roles, audit logs, system settings, and reporting access",
  },
];

const permissionGroups = [
  {
    title: "Applications",
    icon: FileText,
    permissions: [
      ["Submit application", true, true, false],
      ["Review application", false, true, false],
      ["Approve or reject", false, true, false],
      ["Delete application record", false, false, true],
    ],
  },
  {
    title: "Reports",
    icon: BarChart3,
    permissions: [
      ["View analytics", false, true, true],
      ["Export reports", false, true, true],
      ["Configure report templates", false, false, true],
    ],
  },
  {
    title: "Administration",
    icon: Settings,
    permissions: [
      ["Manage users", false, false, true],
      ["Manage role permissions", false, false, true],
      ["View audit logs", false, false, true],
    ],
  },
];

export function RoleManagement() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1>Role Management</h1>
          <p className="text-muted-foreground mt-1">
            Configure access permissions for each accreditation system role
          </p>
        </div>
        <Button>
          <Save className="size-4 mr-2" />
          Save Changes
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {roles.map((role) => (
          <Card key={role.name}>
            <CardContent className="p-6 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="size-12 rounded-lg bg-blue-50 flex items-center justify-center">
                  <Shield className="size-6 text-blue-600" />
                </div>
                <Badge variant="default">{role.users} users</Badge>
              </div>
              <div>
                <h3>{role.name}</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {role.description}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <CardTitle>Permission Matrix</CardTitle>
            <div className="flex flex-col sm:flex-row gap-2">
              <Select defaultValue="all">
                <option value="all">All Permission Groups</option>
                <option value="applications">Applications</option>
                <option value="reports">Reports</option>
                <option value="administration">Administration</option>
              </Select>
              <Button variant="outline">
                <UserCog className="size-4 mr-2" />
                Duplicate Role
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <div className="min-w-[760px] space-y-6">
              <div className="grid grid-cols-[minmax(220px,1fr)_repeat(3,minmax(120px,160px))] gap-3 text-sm font-medium text-muted-foreground">
                <span>Permission</span>
                <span>Business Owner</span>
                <span>Tourism Staff</span>
                <span>Administrator</span>
              </div>

              {permissionGroups.map((group) => {
                const Icon = group.icon;
                return (
                  <div key={group.title} className="space-y-3">
                    <div className="flex items-center gap-2 pb-2 border-b border-border">
                      <Icon className="size-4 text-muted-foreground" />
                      <h4>{group.title}</h4>
                    </div>
                    {group.permissions.map((permission) => (
                      <div
                        key={permission[0] as string}
                        className="grid grid-cols-[minmax(220px,1fr)_repeat(3,minmax(120px,160px))] gap-3 items-center rounded-lg border border-border p-3"
                      >
                        <p className="text-sm font-medium">
                          {permission[0] as string}
                        </p>
                        {[1, 2, 3].map((index) => (
                          <div key={index} className="flex justify-center">
                            <Checkbox
                              defaultChecked={permission[index] as boolean}
                              disabled={index === 3}
                            />
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Create Custom Role</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Role Name</Label>
              <Input placeholder="e.g. Tourism Officer" />
            </div>
            <div className="space-y-2">
              <Label>Based On</Label>
              <Select defaultValue="staff">
                <option value="staff">Tourism Staff</option>
                <option value="owner">Business Owner</option>
                <option value="admin">System Administrator</option>
              </Select>
            </div>
            <div className="flex items-end">
              <Button variant="outline" className="w-full">
                Create Role
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
