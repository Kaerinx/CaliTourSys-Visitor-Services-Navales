<template>
  <main class="forgot-page">
    <section class="forgot-card" aria-labelledby="forgot-title">
      <h1 id="forgot-title">Forgot your password?</h1>
      <p class="forgot-copy">
        No worries! Simply provide your registered email to reset your password.
      </p>

      <form class="forgot-form" @submit.prevent="submit">
        <label class="email-field">
          <span>Please enter your registered Email Address</span>
          <input
            v-model.trim="email"
            type="email"
            autocomplete="email"
            placeholder="Input your E-Mail Address"
            required
          />
        </label>

        <label class="captcha-box">
          <input v-model="captchaChecked" type="checkbox" />
          <span class="captcha-check" aria-hidden="true"></span>
          <span>I'm not a robot</span>
          <span class="captcha-brand">reCAPTCHA</span>
        </label>

        <p v-if="message" class="form-message" :class="`form-message--${messageType}`">
          {{ message }}
        </p>

        <button class="submit-button" type="submit">Submit</button>

        <p class="back-copy">
          Go back to
          <RouterLink to="/accreditation/login">Login page</RouterLink>
        </p>
      </form>
    </section>
  </main>
</template>

<script setup>
import { ref } from "vue";

const email = ref("");
const captchaChecked = ref(false);
const message = ref("");
const messageType = ref("success");

function submit() {
  message.value = "";

  if (!captchaChecked.value) {
    messageType.value = "error";
    message.value = "Please confirm that you are not a robot.";
    return;
  }

  messageType.value = "success";
  message.value =
    "Password reset assistance has been prepared for the registered email address.";
}
</script>

<style scoped>
.forgot-page {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 40px 20px;
  background:
    linear-gradient(rgba(255, 255, 255, 0.9), rgba(255, 255, 255, 0.9)),
    url("@/assets/brand/calabanga-login-seal-artwork.png") center / min(620px, 90vw) auto no-repeat;
  color: #173f32;
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}

.forgot-page,
.forgot-page * {
  box-sizing: border-box;
}

.forgot-card {
  width: min(100%, 448px);
  text-align: center;
}

h1,
p {
  margin-top: 0;
}

h1 {
  margin-bottom: 6px;
  color: #174d3d;
  font-size: 34px;
  font-weight: 800;
  line-height: 1.15;
}

.forgot-copy {
  max-width: 420px;
  margin: 0 auto 12px;
  color: #52665e;
  font-size: 17px;
  line-height: 1.45;
}

.forgot-form {
  display: grid;
  gap: 16px;
  padding: 18px 14px 24px;
  border: 1px solid #cfd8d3;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.88);
}

.email-field {
  display: grid;
  gap: 16px;
  color: #174d3d;
  font-size: 17px;
}

.email-field input {
  width: 100%;
  min-height: 44px;
  padding: 9px 12px;
  border: 1px solid #c4d0ca;
  background: #ffffff;
  color: #17231e;
  font: inherit;
  font-size: 16px;
}

.email-field input:focus {
  border-color: #176249;
  outline: 0;
  box-shadow: 0 0 0 3px rgba(23, 98, 73, 0.14);
}

.captcha-box {
  width: min(304px, 100%);
  min-height: 78px;
  display: grid;
  grid-template-columns: 28px 1fr auto;
  align-items: center;
  gap: 10px;
  margin: 0 auto 2px;
  padding: 14px 16px;
  border: 1px solid #d4d4d4;
  border-radius: 2px;
  background: #fafafa;
  color: #1f1f1f;
  font-size: 14px;
  text-align: left;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.12);
  cursor: pointer;
}

.captcha-box input {
  position: absolute;
  opacity: 0;
  pointer-events: none;
}

.captcha-check {
  width: 28px;
  height: 28px;
  border: 1px solid #bdbdbd;
  background: #ffffff;
}

.captcha-box input:checked + .captcha-check {
  border-color: transparent;
  background:
    linear-gradient(135deg, transparent 45%, #0a9f62 46% 58%, transparent 59%) 6px 11px / 9px 12px no-repeat,
    linear-gradient(45deg, transparent 42%, #0a9f62 43% 55%, transparent 56%) 13px 5px / 14px 20px no-repeat;
}

.captcha-brand {
  color: #6b6b6b;
  font-size: 10px;
  text-align: center;
}

.captcha-brand::before {
  content: "";
  width: 28px;
  height: 28px;
  display: block;
  margin: 0 auto 2px;
  border-radius: 4px;
  background:
    linear-gradient(135deg, #4f7fd9, #3b63bd);
}

.form-message {
  margin: -4px 0 0;
  padding: 10px 12px;
  border-radius: 4px;
  font-size: 13px;
  line-height: 1.4;
  text-align: left;
}

.form-message--success {
  background: #edf7f2;
  color: #174d3d;
}

.form-message--error {
  background: #fff0ec;
  color: #762816;
}

.submit-button {
  min-height: 39px;
  border: 0;
  border-radius: 4px;
  background: #dd3333;
  color: #ffffff;
  font: inherit;
  font-size: 17px;
  font-weight: 700;
  cursor: pointer;
}

.submit-button:hover {
  background: #c92e2e;
}

.back-copy {
  margin: 0;
  color: #294c40;
  font-size: 14px;
}

.back-copy a {
  color: #005bd3;
  text-decoration: none;
}

.back-copy a:hover {
  text-decoration: underline;
  text-underline-offset: 3px;
}
</style>
