<template>
  <section class="page">
    <div class="page-header">
      <div>
        <h1>Role Management</h1>
        <p>Review access permissions assigned to each system role.</p>
      </div>
    </div>

    <div class="stats-grid">
      <StatCard title="Roles" :value="roles.length" icon="R" />
      <StatCard title="Admin Only" :value="adminOnlyPermissions" icon="A" />
      <StatCard title="Staff Tools" :value="staffPermissions" icon="S" color="orange" />
      <StatCard title="Owner Tools" :value="ownerPermissions" icon="O" color="green" />
    </div>

    <div class="card compact">
      <div class="card-header">
        <h2>Permission Matrix</h2>
      </div>
      <table>
        <thead>
          <tr>
            <th>Permission</th>
            <th>Business Owner</th>
            <th>Tourism Staff</th>
            <th>Tourism Officer</th>
            <th>System Administrator</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="permission in permissions" :key="permission.name">
            <td>
              <strong>{{ permission.name }}</strong>
              <p class="muted">{{ permission.description }}</p>
            </td>
            <td><StatusBadge :status="permission.roles.includes('business_owner') ? 'active' : 'inactive'" /></td>
            <td><StatusBadge :status="permission.roles.includes('tourism_staff') ? 'active' : 'inactive'" /></td>
            <td><StatusBadge :status="permission.roles.includes('tourism_officer') ? 'active' : 'inactive'" /></td>
            <td><StatusBadge :status="permission.roles.includes('admin') ? 'active' : 'inactive'" /></td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>

<script setup>
import { computed } from "vue";
import StatCard from "@/modules/accreditation/components/StatCard.vue";
import StatusBadge from "@/modules/accreditation/components/StatusBadge.vue";

const roles = ["business_owner", "tourism_staff", "tourism_officer", "admin"];
const permissions = [
  {
    name: "Submit application",
    description: "Create, save, upload documents, and submit accreditation applications.",
    roles: ["business_owner"],
  },
  {
    name: "View own applications",
    description: "Track status, remarks, and submitted documents.",
    roles: ["business_owner"],
  },
  {
    name: "Review applications",
    description: "Open submitted applications, inspect documents, and record decisions.",
    roles: ["tourism_staff", "tourism_officer", "admin"],
  },
  {
    name: "View accreditation records",
    description: "Access issued accreditation records and supporting documents.",
    roles: ["tourism_staff", "tourism_officer", "admin"],
  },
  {
    name: "Reports",
    description: "View operational reports, compliance summaries, and export data.",
    roles: ["tourism_staff", "tourism_officer", "admin"],
  },
  {
    name: "Manage users",
    description: "Create staff/admin accounts and activate or deactivate users.",
    roles: ["admin"],
  },
  {
    name: "Audit logs",
    description: "Review security, account, and system activity logs.",
    roles: ["admin"],
  },
  {
    name: "Role management",
    description: "Review configured system permissions.",
    roles: ["admin"],
  },
];

const adminOnlyPermissions = computed(() =>
  permissions.filter((permission) => permission.roles.length === 1 && permission.roles.includes("admin")).length
);
const staffPermissions = computed(() =>
  permissions.filter((permission) => permission.roles.some((role) => ["tourism_staff", "tourism_officer"].includes(role))).length
);
const ownerPermissions = computed(() =>
  permissions.filter((permission) => permission.roles.includes("business_owner")).length
);
</script>
