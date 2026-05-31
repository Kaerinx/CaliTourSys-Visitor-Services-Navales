import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Select } from "../ui/select";
import { Badge } from "../ui/badge";
import { Label } from "../ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { Search, UserPlus, Edit, Lock, Unlock } from "lucide-react";
import { toast } from "sonner";

type UserStatus = "active" | "inactive";

type ManagedUser = {
  id: number;
  name: string;
  email: string;
  role: string;
  status: UserStatus;
  lastLogin: string;
};

type UserForm = {
  name: string;
  email: string;
  role: string;
  status: UserStatus;
};

const initialUsers: ManagedUser[] = [
  {
    id: 1,
    name: "Maria Santos",
    email: "maria.santos@tourism.gov.ph",
    role: "Tourism Staff",
    status: "active",
    lastLogin: "2026-05-14",
  },
  {
    id: 2,
    name: "Juan Dela Cruz",
    email: "juan.delacruz@tourism.gov.ph",
    role: "Tourism Officer",
    status: "active",
    lastLogin: "2026-05-13",
  },
  {
    id: 3,
    name: "John Martinez",
    email: "john@sunsetresort.com",
    role: "Business Owner",
    status: "active",
    lastLogin: "2026-05-14",
  },
  {
    id: 4,
    name: "Ana Reyes",
    email: "ana.reyes@tourism.gov.ph",
    role: "Tourism Staff",
    status: "inactive",
    lastLogin: "2026-04-20",
  },
];

const emptyForm: UserForm = {
  name: "",
  email: "",
  role: "Tourism Staff",
  status: "active",
};

const roleOptions = [
  "Business Owner",
  "Tourism Staff",
  "Tourism Officer",
  "System Administrator",
];

export function UserManagement() {
  const [users, setUsers] = useState<ManagedUser[]>(initialUsers);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<ManagedUser | null>(null);
  const [form, setForm] = useState<UserForm>(emptyForm);

  const filteredUsers = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return users.filter((user) => {
      const matchesSearch =
        !query ||
        user.name.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query);
      const matchesRole = roleFilter === "all" || user.role === roleFilter;

      return matchesSearch && matchesRole;
    });
  }, [roleFilter, searchQuery, users]);

  const activeCount = users.filter((user) => user.status === "active").length;
  const inactiveCount = users.length - activeCount;
  const staffCount = users.filter((user) =>
    user.role.toLowerCase().includes("tourism")
  ).length;

  const openAddDialog = () => {
    setEditingUser(null);
    setForm(emptyForm);
    setIsUserDialogOpen(true);
  };

  const openEditDialog = (user: ManagedUser) => {
    setEditingUser(user);
    setForm({
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
    });
    setIsUserDialogOpen(true);
  };

  const closeUserDialog = () => {
    setIsUserDialogOpen(false);
    setEditingUser(null);
    setForm(emptyForm);
  };

  const saveUser = () => {
    if (!form.name.trim() || !form.email.trim()) {
      toast.error("Name and email are required.");
      return;
    }

    const normalizedEmail = form.email.trim().toLowerCase();
    const emailExists = users.some(
      (user) =>
        user.email.toLowerCase() === normalizedEmail &&
        user.id !== editingUser?.id
    );

    if (emailExists) {
      toast.error("A user with this email already exists.");
      return;
    }

    if (editingUser) {
      setUsers((current) =>
        current.map((user) =>
          user.id === editingUser.id
            ? {
                ...user,
                name: form.name.trim(),
                email: normalizedEmail,
                role: form.role,
                status: form.status,
              }
            : user
        )
      );
      toast.success("User updated.");
    } else {
      const nextId = Math.max(...users.map((user) => user.id)) + 1;
      setUsers((current) => [
        ...current,
        {
          id: nextId,
          name: form.name.trim(),
          email: normalizedEmail,
          role: form.role,
          status: form.status,
          lastLogin: "Never",
        },
      ]);
      toast.success("User added.");
    }

    closeUserDialog();
  };

  const toggleUserStatus = (user: ManagedUser) => {
    const nextStatus = user.status === "active" ? "inactive" : "active";

    setUsers((current) =>
      current.map((item) =>
        item.id === user.id ? { ...item, status: nextStatus } : item
      )
    );

    toast.success(
      `${user.name} ${nextStatus === "active" ? "unlocked" : "locked"}.`
    );
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1>User Management</h1>
          <p className="text-muted-foreground mt-1">
            Manage system users and access permissions
          </p>
        </div>
        <Button onClick={openAddDialog}>
          <UserPlus className="size-4 mr-2" />
          Add New User
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <MetricCard label="Total Users" value={users.length} />
        <MetricCard label="Active" value={activeCount} className="text-green-600" />
        <MetricCard label="Inactive" value={inactiveCount} className="text-gray-600" />
        <MetricCard label="Staff" value={staffCount} className="text-blue-600" />
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <CardTitle>All Users</CardTitle>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:flex-initial">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  placeholder="Search users..."
                  className="pl-9 w-full sm:w-64"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                />
              </div>
              <Select
                value={roleFilter}
                onChange={(event) => setRoleFilter(event.target.value)}
              >
                <option value="all">All Roles</option>
                {roleOptions.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Login</TableHead>
                <TableHead className="w-28 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.role}</TableCell>
                  <TableCell>
                    {user.status === "active" ? (
                      <Badge variant="approved">Active</Badge>
                    ) : (
                      <Badge variant="expired">Inactive</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {user.lastLogin}
                  </TableCell>
                  <TableCell className="w-28">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="size-8 p-0"
                        onClick={() => openEditDialog(user)}
                        aria-label={`Edit ${user.name}`}
                      >
                        <Edit className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="size-8 p-0"
                        onClick={() => toggleUserStatus(user)}
                        aria-label={
                          user.status === "active"
                            ? `Lock ${user.name}`
                            : `Unlock ${user.name}`
                        }
                      >
                        {user.status === "active" ? (
                          <Lock className="size-4" />
                        ) : (
                          <Unlock className="size-4" />
                        )}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredUsers.length === 0 && (
            <div className="py-10 text-center text-sm text-muted-foreground">
              No users found.
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isUserDialogOpen} onOpenChange={setIsUserDialogOpen}>
        <DialogContent className="max-w-lg" onClose={closeUserDialog}>
          <DialogHeader>
            <DialogTitle>
              {editingUser ? "Edit User" : "Add New User"}
            </DialogTitle>
            <DialogDescription>
              {editingUser
                ? "Update this user's account details and access status."
                : "Create a new account for business owners, staff, or administrators."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label required>Full Name</Label>
              <Input
                value={form.name}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    name: event.target.value,
                  }))
                }
                placeholder="Enter full name"
              />
            </div>

            <div className="space-y-2">
              <Label required>Email Address</Label>
              <Input
                type="email"
                value={form.email}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    email: event.target.value,
                  }))
                }
                placeholder="user@example.com"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Role</Label>
                <Select
                  value={form.role}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      role: event.target.value,
                    }))
                  }
                >
                  {roleOptions.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={form.status}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      status: event.target.value as UserStatus,
                    }))
                  }
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeUserDialog}>
              Cancel
            </Button>
            <Button onClick={saveUser}>
              {editingUser ? "Save Changes" : "Add User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function MetricCard({
  label,
  value,
  className = "",
}: {
  label: string;
  value: number;
  className?: string;
}) {
  return (
    <Card>
      <CardContent className="p-6 text-center">
        <p className={`text-3xl font-semibold mb-1 ${className}`}>{value}</p>
        <p className="text-sm text-muted-foreground">{label}</p>
      </CardContent>
    </Card>
  );
}
