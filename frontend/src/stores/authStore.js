import { defineStore } from "pinia";
import { getCurrentUser, login as loginRequest } from "@/modules/accreditation/services/accreditationApi";

const demoModeEnabled = import.meta.env.DEV || import.meta.env.VITE_ENABLE_DEMO === "true";
const storedToken = localStorage.getItem("auth_token");
if (!demoModeEnabled && String(storedToken || "").startsWith("demo-token")) {
  localStorage.removeItem("auth_token");
  localStorage.removeItem("auth_user");
}

const demoAccounts = {
  "john@sunsetresort.com": {
    id: "demo-business-owner",
    firstName: "John",
    middleName: "",
    lastName: "Martinez",
    sex: "Male",
    email: "john@sunsetresort.com",
    phone: "+63 912 345 6789",
    telephone: "",
    role: "business_owner",
    status: "active",
  },
  "maria.santos@tourism.gov.ph": {
    id: "demo-tourism-staff",
    firstName: "Maria",
    middleName: "",
    lastName: "Santos",
    sex: "Female",
    email: "maria.santos@tourism.gov.ph",
    phone: "+63 911 111 1111",
    telephone: "",
    role: "tourism_staff",
    status: "active",
  },
  "system.admin@tourism.gov.ph": {
    id: "demo-system-admin",
    firstName: "System",
    middleName: "",
    lastName: "Administrator",
    sex: "Male",
    email: "system.admin@tourism.gov.ph",
    phone: "+63 900 000 0000",
    telephone: "",
    role: "admin",
    status: "active",
  },
};

export const useAuthStore = defineStore("accreditationAuth", {
  state: () => ({
    token: localStorage.getItem("auth_token"),
    user: JSON.parse(localStorage.getItem("auth_user") || "null"),
  }),
  getters: {
    role: (state) => state.user?.role || "business_owner",
    isAuthenticated: (state) => Boolean(state.token),
  },
  actions: {
    async login(credentials) {
      const email = credentials.email.trim().toLowerCase();
      const password = credentials.password;
      const demoUser = demoAccounts[email];
      const demoPassword = localStorage.getItem(`demo_password_${email}`) || "password123";

      if (demoModeEnabled && demoUser && password === demoPassword) {
        try {
          const { token, user } = await loginRequest({ email, password });
          this.setSession(token, user);
          return user;
        } catch (error) {
          if (error.response) throw error;

          const token = `demo-token-${demoUser.role}`;
          this.setSession(token, demoUser);
          return demoUser;
        }
      }

      const { token, user } = await loginRequest({
        email,
        password,
      });
      this.setSession(token, user);
      return user;
    },
    async connectDemoToBackend() {
      if (!demoModeEnabled && (this.token || "").startsWith("demo-token")) {
        this.logout();
        return false;
      }

      if (!(this.token || "").startsWith("demo-token")) return true;

      const email = this.user?.email?.toLowerCase();
      if (!email || !demoAccounts[email]) return false;

      try {
        const password = localStorage.getItem(`demo_password_${email}`) || "password123";
        const { token, user } = await loginRequest({ email, password });
        this.setSession(token, user);
        return true;
      } catch (_error) {
        return false;
      }
    },
    setSession(token, user) {
      if (!demoModeEnabled && String(token || "").startsWith("demo-token")) {
        this.logout();
        return;
      }
      this.token = token;
      this.user = user;
      localStorage.setItem("auth_token", token);
      localStorage.setItem("auth_user", JSON.stringify(user));
    },
    useDemoRole(role) {
      if (!demoModeEnabled) return;
      const labels = {
        admin: ["System", "Administrator", "system.admin@demo.local"],
        tourism_staff: ["Maria", "Santos", "tourism_staff@demo.local"],
        business_owner: ["John", "Martinez", "business_owner@demo.local"],
      };
      const [firstName, lastName, email] = labels[role] || labels.business_owner;
      const demoUser = {
        id: `demo-${role}`,
        firstName,
        middleName: "",
        lastName,
        sex: role === "tourism_staff" ? "Female" : "Male",
        email,
        phone: "",
        telephone: "",
        role,
        status: "active",
      };
      this.setSession("demo-token", demoUser);
    },
    updateUser(user) {
      this.user = { ...this.user, ...user };
      localStorage.setItem("auth_user", JSON.stringify(this.user));
    },
    logout() {
      this.token = null;
      this.user = null;
      localStorage.removeItem("auth_token");
      localStorage.removeItem("auth_user");
    },
    async refreshUser() {
      if (!this.token || (this.token || "").startsWith("demo-token")) return this.user;
      const { user } = await getCurrentUser();
      this.updateUser(user);
      return user;
    },
  },
});
