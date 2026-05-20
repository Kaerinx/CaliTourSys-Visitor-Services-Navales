<template>
  <main class="login-page">
    <form class="login-card" @submit.prevent="submit">
      <RouterLink class="login-back" to="/accreditation">Back</RouterLink>

      <div class="login-logo">
        <Building2 :size="32" />
      </div>

      <div class="login-heading">
        <h1>Welcome Back</h1>
        <p>Sign in to your Business Accreditation account</p>
      </div>

      <label>Email Address
        <input
          v-model="form.email"
          type="email"
          placeholder="your.email@example.com"
          required
        />
      </label>

      <label>Password
        <div class="password-field">
          <input
            v-model="form.password"
            :type="showPassword ? 'text' : 'password'"
            placeholder="Enter your password"
            required
          />
          <button type="button" @click="showPassword = !showPassword">
            {{ showPassword ? "Hide" : "Show" }}
          </button>
        </div>
      </label>

      <div class="login-options">
        <label class="remember-line">
          <input v-model="rememberMe" type="checkbox" />
          <span>Remember me</span>
        </label>
        <a href="#">Forgot password?</a>
      </div>

      <p v-if="error" class="form-error">{{ error }}</p>
      <div v-if="verificationUrl" class="verification-panel">
        <p>Click below to verify this business-owner account.</p>
        <a class="btn primary" :href="verificationUrl">Verify Email</a>
      </div>

      <button class="btn primary full large" type="submit">Sign In</button>

      <div class="login-divider">
        <p>
          New business owner?
          <RouterLink to="/accreditation/register">Create an account</RouterLink>
        </p>
        <small>Staff and admin accounts are managed by the LGU administrator.</small>
      </div>

      <div class="demo-box">
        <p>Demo Accounts for Testing</p>
        <div class="demo-list">
          <button type="button" @click="fillDemo('john@sunsetresort.com')">
            Business Owner
            <span>john@sunsetresort.com</span>
          </button>
          <button type="button" @click="fillDemo('maria.santos@tourism.gov.ph')">
            Tourism Staff
            <span>maria.santos@tourism.gov.ph</span>
          </button>
          <button type="button" @click="fillDemo('admin@tourism.gov.ph')">
            Administrator
            <span>admin@tourism.gov.ph</span>
          </button>
        </div>
        <small>Password: password123</small>
      </div>
    </form>
  </main>
</template>

<script setup>
import { reactive, ref } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/authStore";
import { Building2 } from "@lucide/vue";

const router = useRouter();
const auth = useAuthStore();
const error = ref("");
const verificationUrl = ref("");
const rememberMe = ref(false);
const showPassword = ref(false);
const form = reactive({ email: "", password: "" });

async function submit() {
  error.value = "";
  verificationUrl.value = "";
  try {
    await auth.login(form);
    router.push("/accreditation/app/dashboard");
  } catch (err) {
    error.value = err.response?.data?.message || "Unable to sign in.";
    verificationUrl.value = err.response?.data?.verificationUrl || "";
  }
}

function fillDemo(email) {
  form.email = email;
  form.password = "password123";
}
</script>
