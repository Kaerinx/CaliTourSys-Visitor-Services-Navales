<template>
  <section class="page">
    <div class="page-header">
      <div>
        <h1>User Management</h1>
        <p>Manage business owners, tourism staff/officers, and administrators.</p>
      </div>
      <button class="btn primary" @click="showCreate = true">Add New User</button>
    </div>

    <p v-if="message" class="form-success sticky-error">{{ message }}</p>
    <p v-if="error" class="form-error sticky-error">{{ error }}</p>

    <div class="stats-grid">
      <StatCard title="Total Users" :value="users.length" icon="U" />
      <StatCard title="Business Owners" :value="businessOwnerCount" icon="BO" />
      <StatCard title="Tourism Staff/Officers" :value="staffCount" icon="S" />
      <StatCard title="Inactive" :value="inactiveUsers" icon="!" color="red" />
    </div>

    <div class="card compact">
      <div class="card-header">
        <h2>All Users</h2>
        <div class="table-tools">
          <input v-model="search" class="compact-search" placeholder="Search users..." />
          <select v-model="roleFilter">
            <option value="all">All Roles</option>
            <option value="business_owner">Business Owner</option>
            <option value="tourism_staff">Tourism Staff</option>
            <option value="tourism_officer">Tourism Officer</option>
            <option value="admin">System Administrator</option>
          </select>
        </div>
      </div>
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Phone</th>
            <th>Role</th>
            <th>Status</th>
            <th class="actions-cell">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="user in filteredUsers" :key="user.id || user.email">
            <td><strong>{{ user.name }}</strong></td>
            <td>{{ user.email }}</td>
            <td>{{ user.phone || "Not provided" }}</td>
            <td>{{ roleLabel(user.role) }}</td>
            <td><StatusBadge :status="user.status" /></td>
            <td class="actions-cell">
              <button class="icon-action" @click="selected = user">View</button>
              <button class="icon-action" @click="toggleUser(user)">
                {{ user.status === "active" ? "Lock" : "Activate" }}
              </button>
            </td>
          </tr>
          <tr v-if="filteredUsers.length === 0">
            <td colspan="6" class="empty-state">No users found.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="showCreate" class="modal-backdrop" @click.self="showCreate = false">
      <form class="modal" @submit.prevent="submitCreateUser">
        <button class="modal-close" type="button" @click="showCreate = false">x</button>
        <h2>Add New User</h2>
        <div class="form-grid two">
          <label>First Name<input v-model="newUser.firstName" required /></label>
          <label>Middle Name<input v-model="newUser.middleName" /></label>
          <label>Last Name<input v-model="newUser.lastName" required /></label>
          <label>Sex
            <select v-model="newUser.sex">
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
          </label>
          <label>Email Address<input v-model="newUser.email" type="email" required /></label>
          <label>Mobile Number<input v-model="newUser.phone" /></label>
          <label>Telephone Number<input v-model="newUser.telephone" /></label>
          <label>Role
            <select v-model="newUser.role" required>
              <option value="business_owner">Business Owner</option>
              <option value="tourism_staff">Tourism Staff</option>
              <option value="tourism_officer">Tourism Officer</option>
              <option value="admin">System Administrator</option>
            </select>
          </label>
          <label>Temporary Password<input v-model="newUser.password" /></label>
        </div>
        <div class="modal-actions">
          <button class="btn outline" type="button" @click="showCreate = false">Cancel</button>
          <button class="btn primary" type="submit">Create User</button>
        </div>
      </form>
    </div>

    <div v-if="selected" class="modal-backdrop" @click.self="selected = null">
      <section class="modal">
        <button class="modal-close" @click="selected = null">x</button>
        <h2>{{ selected.name }}</h2>
        <div class="detail-grid">
          <p><span>Email</span><strong>{{ selected.email }}</strong></p>
          <p><span>Middle Name</span><strong>{{ selected.middleName || "Not provided" }}</strong></p>
          <p><span>Sex</span><strong>{{ selected.sex || "Not provided" }}</strong></p>
          <p><span>Role</span><strong>{{ roleLabel(selected.role) }}</strong></p>
          <p><span>Status</span><strong>{{ selected.status }}</strong></p>
          <p><span>Mobile</span><strong>{{ selected.phone || "Not provided" }}</strong></p>
          <p><span>Telephone</span><strong>{{ selected.telephone || "Not provided" }}</strong></p>
        </div>
      </section>
    </div>
  </section>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from "vue";
import StatCard from "@/modules/accreditation/components/StatCard.vue";
import StatusBadge from "@/modules/accreditation/components/StatusBadge.vue";
import { createUser, getUsers, updateUserStatus } from "@/modules/accreditation/services/accreditationApi";
import { useAuthStore } from "@/stores/authStore";

const auth = useAuthStore();
const users = ref(demoUsers());
const search = ref("");
const roleFilter = ref("all");
const message = ref("");
const error = ref("");
const showCreate = ref(false);
const selected = ref(null);
const newUser = reactive({
  firstName: "",
  middleName: "",
  lastName: "",
  sex: "Male",
  email: "",
  phone: "",
  telephone: "",
  role: "tourism_staff",
  password: "password123",
});

onMounted(loadUsers);

const filteredUsers = computed(() => {
  const term = search.value.trim().toLowerCase();
  return users.value.filter((user) => {
    const matchesRole = roleFilter.value === "all" || user.role === roleFilter.value;
    const matchesSearch =
      !term ||
      [user.name, user.email, roleLabel(user.role)]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(term));
    return matchesRole && matchesSearch;
  });
});

const businessOwnerCount = computed(() => users.value.filter((user) => user.role === "business_owner").length);
const staffCount = computed(() =>
  users.value.filter((user) => ["tourism_staff", "tourism_officer"].includes(user.role)).length
);
const inactiveUsers = computed(() => users.value.filter((user) => user.status !== "active").length);

async function loadUsers() {
  if (isDemoSession()) return;

  try {
    const result = await getUsers();
    users.value = result.users.map(normalizeUser);
  } catch (_err) {
    users.value = demoUsers();
  }
}

async function submitCreateUser() {
  message.value = "";
  error.value = "";

  try {
    if (isDemoSession()) {
      users.value = [
        normalizeUser({
          ...newUser,
          id: `demo-${Date.now()}`,
          first_name: newUser.firstName,
          middle_name: newUser.middleName,
          last_name: newUser.lastName,
          sex: newUser.sex,
          status: "active",
        }),
        ...users.value,
      ];
    } else {
      const result = await createUser({ ...newUser });
      users.value = [normalizeUser(result.user), ...users.value];
    }

    message.value = "User created successfully.";
    showCreate.value = false;
    Object.assign(newUser, {
      firstName: "",
      middleName: "",
      lastName: "",
      sex: "Male",
      email: "",
      phone: "",
      telephone: "",
      role: "tourism_staff",
      password: "password123",
    });
  } catch (err) {
    error.value = err.response?.data?.message || "Unable to create user.";
  }
}

async function toggleUser(user) {
  const nextStatus = user.status === "active" ? "inactive" : "active";
  message.value = "";
  error.value = "";

  try {
    if (!isDemoSession()) {
      await updateUserStatus(user.id, nextStatus);
    }
    user.status = nextStatus;
    message.value = `${user.name} is now ${nextStatus}.`;
  } catch (err) {
    error.value = err.response?.data?.message || "Unable to update user status.";
  }
}

function normalizeUser(user) {
  return {
    ...user,
    firstName: user.firstName || user.first_name,
    middleName: user.middleName || user.middle_name,
    lastName: user.lastName || user.last_name,
    sex: user.sex,
    telephone: user.telephone,
    name: user.name || `${user.firstName || user.first_name || ""} ${user.lastName || user.last_name || ""}`.trim(),
  };
}

function roleLabel(role) {
  const labels = {
    business_owner: "Business Owner",
    tourism_staff: "Tourism Staff",
    tourism_officer: "Tourism Officer",
    admin: "System Administrator",
  };
  return labels[role] || role;
}

function demoUsers() {
  return [
    { id: "demo-staff", name: "Maria Santos", email: "maria.santos@tourism.gov.ph", role: "tourism_staff", status: "active", phone: "+63 911 111 1111", sex: "Female" },
    { id: "demo-owner", name: "John Martinez", email: "john@sunsetresort.com", role: "business_owner", status: "active", phone: "+63 912 345 6789", sex: "Male" },
    { id: "demo-admin", name: "Admin User", email: "admin@tourism.gov.ph", role: "admin", status: "active", phone: "+63 900 000 0000", sex: "Male" },
  ];
}

function isDemoSession() {
  return (auth.token || "").startsWith("demo-token");
}
</script>
