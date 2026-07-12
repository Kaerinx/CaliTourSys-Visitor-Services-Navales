<template>
  <div class="entry-page">
    <section class="entry-brand-panel" aria-label="Tourism accreditation service">
      <div class="entry-brand-panel__watermarks" aria-hidden="true">
        <img v-for="position in 5" :key="position" :src="sealArtwork" alt="" />
      </div>
      <div class="entry-brand-panel__content">
        <div class="entry-brand-panel__seal-crop">
          <img class="entry-brand-panel__seal" :src="sealArtwork" alt="Municipality of Calabanga seal" />
        </div>
        <div class="entry-brand-panel__copy">
          <span>Supporting responsible tourism in Calabanga</span>
          <h1>Tourism Business Accreditation</h1>
          <p>Register. Submit. Track.</p>
        </div>
      </div>
    </section>

    <main class="entry-shell">
      <form class="entry-card" aria-label="Sign in form" @submit.prevent="submit">
        <div class="entry-card__heading">
          <img :src="logo" alt="Love Calabanga" />
          <h2>Welcome Back!</h2>
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

        <div class="login-options">
          <label class="remember-line">
            <input v-model="rememberMe" type="checkbox" />
            <span>Remember me</span>
          </label>
          <RouterLink to="/accreditation/forgot-password">Forgot password?</RouterLink>
        </div>

        <p v-if="error" class="form-message form-message--error" role="alert">{{ error }}</p>

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
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from "vue";
import { useRouter } from "vue-router";
import { Eye, EyeOff, Mail } from "@lucide/vue";
import sealArtwork from "@/assets/brand/calabanga-login-seal-artwork.png";
import logo from "@/assets/brand/love-calabanga-logo.png";
import { useAuthStore } from "@/stores/authStore";

const router = useRouter();
const auth = useAuthStore();
const error = ref("");
const showPassword = ref(false);
const rememberMe = ref(false);
const form = reactive({ email: "", password: "" });
const rememberedEmailKey = "accreditation_login_email";

async function submit() {
  error.value = "";
  try {
    const user = await auth.login(form);
    if (user.role !== "business_owner") {
      auth.logout();
      router.push({ name: "cms-login", query: { redirect: "/cms/businesses" } });
      return;
    }
    updateRememberedEmail();
    router.push("/accreditation/app/dashboard");
  } catch (err) {
    error.value = err.response?.data?.message || "Unable to sign in.";
  }
}

function updateRememberedEmail() {
  const email = form.email.trim();

  if (rememberMe.value && email) {
    localStorage.setItem(rememberedEmailKey, email);
    return;
  }

  localStorage.removeItem(rememberedEmailKey);
}

onMounted(() => {
  const rememberedEmail = localStorage.getItem(rememberedEmailKey);

  if (rememberedEmail) {
    form.email = rememberedEmail;
    rememberMe.value = true;
  }
});
</script>

<style scoped>
.entry-page {
  min-height: 100vh;
  display: grid;
  grid-template-columns: minmax(380px, 42%) minmax(520px, 58%);
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

.entry-brand-panel {
  position: relative;
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 48px;
  background:
    radial-gradient(circle at 36% 28%, rgba(255, 255, 255, 0.96), transparent 34%),
    radial-gradient(circle at 4% 64%, rgba(255, 255, 255, 0.82), transparent 35%),
    linear-gradient(135deg, #a8d5b4 0%, #edf7f2 43%, #73b985 100%);
  overflow: hidden;
}

.entry-brand-panel__content {
  position: relative;
  z-index: 1;
  width: min(100%, 560px);
  display: grid;
  align-content: center;
  justify-items: center;
  gap: 12px;
  text-align: center;
}

.entry-brand-panel__seal-crop {
  position: relative;
  width: 158px;
  height: 158px;
  overflow: hidden;
  border-radius: 50%;
  background: transparent;
}

.entry-brand-panel__seal {
  position: absolute;
  top: -140px;
  left: -146px;
  width: 450px;
  max-width: none;
  height: 600px;
  display: block;
  mix-blend-mode: multiply;
}

.entry-brand-panel__watermarks {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.entry-brand-panel__watermarks img {
  position: absolute;
  width: 190px;
  height: 230px;
  object-fit: contain;
  opacity: 0.09;
  mix-blend-mode: multiply;
  filter: grayscale(1);
}

.entry-brand-panel__watermarks img:nth-child(1) {
  top: 12%;
  left: -5%;
  transform: rotate(-10deg);
}

.entry-brand-panel__watermarks img:nth-child(2) {
  top: 9%;
  right: -4%;
  transform: rotate(10deg);
}

.entry-brand-panel__watermarks img:nth-child(3) {
  top: 48%;
  left: 4%;
  transform: rotate(8deg);
}

.entry-brand-panel__watermarks img:nth-child(4) {
  right: 2%;
  bottom: 8%;
  transform: rotate(-8deg);
}

.entry-brand-panel__watermarks img:nth-child(5) {
  bottom: -7%;
  left: 34%;
  transform: rotate(5deg);
}

.entry-brand-panel__copy {
  max-width: 480px;
  padding-bottom: 36px;
}

.entry-brand-panel__copy span {
  display: block;
  margin-bottom: 12px;
  color: #176249;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.entry-brand-panel__copy h1 {
  margin: 0;
  color: #173f32;
  font-family: "Plus Jakarta Sans", Inter, system-ui, sans-serif;
  font-size: 40px;
  font-weight: 800;
  line-height: 1.2;
  letter-spacing: 0;
}

.entry-brand-panel__copy p {
  max-width: 460px;
  margin: 12px auto 0;
  color: #176249;
  font-size: 16px;
  font-weight: 800;
  line-height: 1.5;
}

.entry-shell {
  width: 100%;
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 72px 40px;
  background: #ffffff;
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

.entry-card__heading p,
.support-note {
  color: #52665e;
  line-height: 1.7;
}

.back-link,
.account-action a {
  color: #176249;
  font-weight: 800;
  text-underline-offset: 4px;
}

.entry-card {
  width: min(100%, 520px);
  display: grid;
  gap: 20px;
  align-self: center;
  justify-self: center;
  padding: 38px;
  border: 0;
  border-radius: 0;
  background: #ffffff;
  box-shadow: none;
}

.entry-shell > * {
  min-width: 0;
}

.entry-card__heading {
  margin-bottom: 4px;
  padding-bottom: 8px;
  text-align: center;
}

.entry-card__heading p {
  margin-bottom: 0;
  font-size: 13px;
}

.entry-card__heading h2 {
  margin-bottom: 0;
  color: #174d3d;
  font-family: "Plus Jakarta Sans", Inter, system-ui, sans-serif;
  font-size: 36px;
  font-weight: 800;
}

.entry-card__heading img {
  width: 132px;
  height: auto;
  display: block;
  margin: 0 auto 28px;
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

.login-options {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-top: -8px;
  color: #52665e;
  font-size: 14px;
}

.remember-line {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: #294c40;
  cursor: pointer;
}

.remember-line input {
  width: 15px;
  height: 15px;
  margin: 0;
  accent-color: #176249;
}

.login-options a {
  color: #176249;
  font-weight: 700;
  text-decoration: none;
}

.login-options a:hover {
  text-decoration: underline;
  text-underline-offset: 4px;
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
  .entry-page {
    grid-template-columns: 1fr;
  }

  .entry-brand-panel {
    display: none;
  }

  .entry-shell {
    padding: 50px 20px;
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

  .login-options {
    align-items: flex-start;
    flex-direction: column;
    gap: 10px;
  }
}
</style>
