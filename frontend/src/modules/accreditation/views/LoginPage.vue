<template>
  <div class="entry-page">
    <PublicServiceHeader :show-sign-in="false" />

    <main class="entry-shell">
      <section class="entry-intro" aria-labelledby="login-title">
        <p class="entry-kicker">Returning applicants</p>
        <h1 id="login-title">Sign in to the Business Accreditation Service</h1>
        <p>
          Access your account to continue an application, respond to revision requests, or track a
          Tourism Office decision.
        </p>

        <div class="entry-guidance">
          <strong>Before signing in</strong>
          <ul>
            <li>Use the email address registered for the business account.</li>
            <li>Check that the account email has been verified.</li>
            <li>Contact the Tourism Office if you cannot access the registered email.</li>
          </ul>
        </div>

        <RouterLink class="back-link" to="/accreditation">Return to service overview</RouterLink>
      </section>

      <form class="entry-card" aria-label="Sign in form" @submit.prevent="submit">
        <div class="entry-card__heading">
          <span>Secure account access</span>
          <h2>Sign in</h2>
          <p>Required fields are marked with an asterisk (*).</p>
        </div>

        <label class="field-row">
          <span>Email address *</span>
          <span class="field-control">
            <input
              v-model="form.email"
              type="email"
              autocomplete="email"
              required
            />
            <Mail :size="17" aria-hidden="true" />
          </span>
        </label>

        <label class="field-row">
          <span>Password *</span>
          <span class="field-control">
            <input
              v-model="form.password"
              :type="showPassword ? 'text' : 'password'"
              autocomplete="current-password"
              required
            />
            <button
              type="button"
              :aria-label="showPassword ? 'Hide password' : 'Show password'"
              @click="showPassword = !showPassword"
            >
              <EyeOff v-if="showPassword" :size="17" aria-hidden="true" />
              <Eye v-else :size="17" aria-hidden="true" />
            </button>
          </span>
        </label>

        <p v-if="error" class="form-message form-message--error" role="alert">{{ error }}</p>
        <div v-if="verificationUrl" class="form-message form-message--success">
          <p>Verify this business-owner account before signing in.</p>
          <a class="entry-button entry-button--secondary" :href="verificationUrl">Verify email</a>
        </div>

        <button class="entry-button entry-button--primary" type="submit">Sign in</button>

        <p class="account-action">
          New to this service?
          <RouterLink to="/accreditation/register">Create a business account</RouterLink>
        </p>
        <p class="support-note">
          Password recovery is not yet available online. Contact the Tourism Office for account
          access support.
        </p>
      </form>
    </main>

    <PublicServiceFooter />
  </div>
</template>

<script setup>
import { reactive, ref } from "vue";
import { useRouter } from "vue-router";
import { Eye, EyeOff, Mail } from "@lucide/vue";
import PublicServiceFooter from "@/modules/accreditation/components/PublicServiceFooter.vue";
import PublicServiceHeader from "@/modules/accreditation/components/PublicServiceHeader.vue";
import { useAuthStore } from "@/stores/authStore";

const router = useRouter();
const auth = useAuthStore();
const error = ref("");
const verificationUrl = ref("");
const showPassword = ref(false);
const form = reactive({ email: "", password: "" });

async function submit() {
  error.value = "";
  verificationUrl.value = "";
  try {
    const user = await auth.login(form);
    if (user.role !== "business_owner") {
      auth.logout();
      router.push({ name: "cms-login", query: { redirect: "/cms/businesses" } });
      return;
    }
    router.push("/accreditation/app/dashboard");
  } catch (err) {
    error.value = err.response?.data?.message || "Unable to sign in.";
    verificationUrl.value = err.response?.data?.verificationUrl || "";
  }
}
</script>

<style scoped>
.entry-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f4f7f5;
  color: #17231e;
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}

.entry-page,
.entry-page *,
.entry-page *::before,
.entry-page *::after {
  box-sizing: border-box;
}

.entry-page :focus-visible {
  outline: 3px solid #e1a928;
  outline-offset: 3px;
}

.entry-shell {
  width: min(1040px, calc(100% - 40px));
  flex: 1;
  margin: 0 auto;
  display: grid;
  grid-template-columns: minmax(0, 1fr) 400px;
  align-items: start;
  gap: 72px;
  padding: 72px 0;
}

.entry-intro {
  padding-top: 24px;
}

.entry-kicker,
.entry-card__heading span {
  margin: 0 0 10px;
  color: #176249;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

h1,
h2,
p {
  margin-top: 0;
  overflow-wrap: break-word;
}

h1,
h2 {
  color: #173f32;
  line-height: 1.2;
  white-space: normal;
}

h1 {
  margin-bottom: 18px;
  font-size: clamp(36px, 5vw, 52px);
  letter-spacing: -0.04em;
}

h2 {
  margin-bottom: 8px;
  font-size: 28px;
}

.entry-intro > p:not(.entry-kicker),
.entry-card__heading p,
.support-note {
  color: #52665e;
  line-height: 1.7;
}

.entry-guidance {
  margin: 32px 0;
  padding: 22px;
  border-left: 4px solid #176249;
  background: #e9f2ed;
}

.entry-guidance strong {
  color: #173f32;
}

.entry-guidance ul {
  display: grid;
  gap: 8px;
  margin: 12px 0 0;
  padding-left: 20px;
  color: #304a40;
  font-size: 14px;
}

.back-link,
.account-action a {
  color: #176249;
  font-weight: 800;
  text-underline-offset: 4px;
}

.entry-card {
  display: grid;
  gap: 20px;
  padding: 30px;
  border: 1px solid #d4dfd9;
  border-radius: 8px;
  background: #ffffff;
  box-shadow: 0 14px 34px rgba(23, 63, 50, 0.08);
}

.entry-shell > * {
  min-width: 0;
}

.entry-card__heading {
  margin-bottom: 4px;
  padding-bottom: 20px;
  border-bottom: 1px solid #d9e1dc;
}

.entry-card__heading p {
  margin-bottom: 0;
  font-size: 13px;
}

.field-row {
  display: grid;
  gap: 7px;
  color: #294c40;
  font-size: 13px;
  font-weight: 800;
}

.field-control {
  position: relative;
  display: block;
}

.field-control input {
  width: 100%;
  min-height: 46px;
  padding: 9px 42px 9px 12px;
  border: 1px solid #b9c9c1;
  border-radius: 5px;
  background: #ffffff;
  color: #17231e;
  font: inherit;
}

.field-control input:focus {
  border-color: #176249;
  outline: 0;
  box-shadow: 0 0 0 3px rgba(23, 98, 73, 0.14);
}

.field-control > svg,
.field-control button {
  position: absolute;
  top: 50%;
  right: 12px;
  width: 22px;
  height: 22px;
  display: grid;
  place-items: center;
  padding: 0;
  border: 0;
  background: transparent;
  color: #176249;
  transform: translateY(-50%);
}

.field-control button {
  cursor: pointer;
}

.entry-button {
  min-height: 46px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 10px 18px;
  border: 1px solid #176249;
  border-radius: 5px;
  color: #174d3d;
  font: inherit;
  font-size: 14px;
  font-weight: 800;
  text-decoration: none;
  cursor: pointer;
}

.entry-button--primary {
  background: #176249;
  color: #ffffff;
}

.entry-button--primary:hover {
  background: #104c38;
}

.entry-button--secondary {
  background: #ffffff;
}

.form-message {
  margin: 0;
  padding: 12px;
  border-left: 4px solid;
  font-size: 13px;
}

.form-message p {
  margin-bottom: 10px;
}

.form-message--error {
  border-color: #a33a24;
  background: #fff0ec;
  color: #762816;
}

.form-message--success {
  border-color: #176249;
  background: #edf7f2;
  color: #174d3d;
}

.account-action,
.support-note {
  margin: 0;
  text-align: center;
  font-size: 13px;
}

.support-note {
  padding-top: 16px;
  border-top: 1px solid #d9e1dc;
}

@media (max-width: 860px) {
  .entry-shell {
    grid-template-columns: minmax(0, 1fr);
    gap: 38px;
    padding: 50px 0;
  }

  .entry-intro {
    padding-top: 0;
  }

  .entry-card {
    width: min(100%, 520px);
  }
}

@media (max-width: 520px) {
  .entry-shell {
    width: min(100% - 28px, 1040px);
  }

  .entry-card {
    padding: 22px;
  }
}
</style>
