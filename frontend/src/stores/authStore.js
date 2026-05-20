import { defineStore } from "pinia";
import { login as loginRequest } from "@/modules/accreditation/services/accreditationApi";

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
  "admin@tourism.gov.ph": {
    id: "demo-admin",
    firstName: "Admin",
    middleName: "",
    lastName: "User",
    sex: "Male",
    email: "admin@tourism.gov.ph",
    phone: "+63 900 000 0000",
    telephone: "",
    role: "admin",
    status: "active",
  },
};

export const useAuthStore = defineStore("auth", {
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

      if (demoUser && password === demoPassword) {
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
      this.token = token;
      this.user = user;
      localStorage.setItem("auth_token", token);
      localStorage.setItem("auth_user", JSON.stringify(user));
    },
    useDemoRole(role) {
      const demoUser = {
        id: `demo-${role}`,
        firstName: role === "admin" ? "Admin" : role === "tourism_staff" ? "Maria" : "John",
        middleName: "",
        lastName: role === "admin" ? "User" : role === "tourism_staff" ? "Santos" : "Martinez",
        sex: role === "tourism_staff" ? "Female" : "Male",
        email: `${role}@demo.local`,
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
  },
});
