<template>
  <section class="page narrow">
    <div class="page-header">
      <div>
        <h1>Account Settings</h1>
        <p>Manage your account profile and security settings.</p>
      </div>
    </div>

    <form class="card form-card personal-card" @submit.prevent="savePersonalInfo">
      <h2>Personal Information</h2>
      <p v-if="personalMessage" class="form-success">{{ personalMessage }}</p>
      <p v-if="personalError" class="form-error">{{ personalError }}</p>
      <div class="form-grid three">
        <label>First Name<input v-model="personalForm.firstName" required /></label>
        <label>Middle Name<input v-model="personalForm.middleName" /></label>
        <label>Last Name<input v-model="personalForm.lastName" required /></label>
      </div>
      <div class="radio-field">
        <span>Sex</span>
        <div class="radio-options">
          <label><input v-model="personalForm.sex" value="Male" type="radio" /> Male</label>
          <label><input v-model="personalForm.sex" value="Female" type="radio" /> Female</label>
        </div>
      </div>
      <div class="form-grid two">
        <label>Email Address<input v-model="personalForm.email" type="email" required /></label>
        <label>Mobile Number<input v-model="personalForm.phone" /></label>
        <label>Telephone Number<input v-model="personalForm.telephone" /></label>
      </div>
      <button class="btn primary align-right" type="submit" :disabled="savingPersonal">
        {{ savingPersonal ? "Saving..." : "Save Changes" }}
      </button>
    </form>

    <form class="card form-card" @submit.prevent="updatePassword">
      <h2>Security</h2>
      <p v-if="securityMessage" class="form-success">{{ securityMessage }}</p>
      <p v-if="securityError" class="form-error">{{ securityError }}</p>
      <label>Current Password<input v-model="securityForm.currentPassword" type="password" /></label>
      <div class="form-grid two">
        <label>New Password<input v-model="securityForm.newPassword" type="password" /></label>
        <label>Confirm Password<input v-model="securityForm.confirmPassword" type="password" /></label>
      </div>
      <button class="btn primary align-right" type="submit" :disabled="savingSecurity">
        {{ savingSecurity ? "Updating..." : "Update Password" }}
      </button>
    </form>
  </section>
</template>

<script setup>
import { onMounted, reactive, ref } from "vue";
import { changePassword, updateAccount } from "@/modules/accreditation/services/accreditationApi";
import { useAuthStore } from "@/stores/authStore";

const auth = useAuthStore();

const personalForm = reactive({
  firstName: "",
  middleName: "",
  lastName: "",
  sex: "Male",
  email: "",
  phone: "",
  telephone: "",
});

const securityForm = reactive({
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
});

const personalMessage = ref("");
const personalError = ref("");
const securityMessage = ref("");
const securityError = ref("");
const savingPersonal = ref(false);
const savingSecurity = ref(false);

onMounted(async () => {
  await auth.connectDemoToBackend();
  fillPersonalForm(auth.user);
});

async function savePersonalInfo() {
  personalMessage.value = "";
  personalError.value = "";
  savingPersonal.value = true;

  try {
    if (isDemoSession()) {
      auth.updateUser({ ...personalForm });
    } else {
      const result = await updateAccount({ ...personalForm });
      auth.updateUser(result.user);
      fillPersonalForm(result.user);
    }

    personalMessage.value = "Personal information updated.";
  } catch (err) {
    personalError.value = err.response?.data?.message || "Unable to update personal information.";
  } finally {
    savingPersonal.value = false;
  }
}

async function updatePassword() {
  securityMessage.value = "";
  securityError.value = "";

  if (securityForm.newPassword !== securityForm.confirmPassword) {
    securityError.value = "New password and confirmation password do not match.";
    return;
  }

  if (securityForm.newPassword.length < 8) {
    securityError.value = "New password must be at least 8 characters.";
    return;
  }

  savingSecurity.value = true;

  try {
    if (isDemoSession()) {
      if (!auth.user?.email) {
        securityError.value = "Current password is incorrect.";
        return;
      }
      const expectedPassword = localStorage.getItem(`demo_password_${auth.user.email}`) || "password123";
      if (securityForm.currentPassword !== expectedPassword) {
        securityError.value = "Current password is incorrect.";
        return;
      }
      localStorage.setItem(`demo_password_${auth.user.email}`, securityForm.newPassword);
    } else {
      await changePassword({
        currentPassword: securityForm.currentPassword,
        newPassword: securityForm.newPassword,
      });
    }

    securityForm.currentPassword = "";
    securityForm.newPassword = "";
    securityForm.confirmPassword = "";
    securityMessage.value = "Password updated.";
  } catch (err) {
    securityError.value = err.response?.data?.message || "Unable to update password.";
  } finally {
    savingSecurity.value = false;
  }
}

function fillPersonalForm(user) {
  Object.assign(personalForm, {
    firstName: user?.firstName || "",
    middleName: user?.middleName || "",
    lastName: user?.lastName || "",
    sex: user?.sex || "Male",
    email: user?.email || "",
    phone: user?.phone || "",
    telephone: user?.telephone || "",
  });
}

function isDemoSession() {
  return (auth.token || "").startsWith("demo-token");
}
</script>
