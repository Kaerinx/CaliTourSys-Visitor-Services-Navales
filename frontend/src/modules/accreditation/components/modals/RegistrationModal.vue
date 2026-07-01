<template>
  <div v-if="open" class="public-modal-backdrop" @click.self="$emit('close')">
    <form class="registration-modal-card" @submit.prevent="submit">
      <button class="login-back" type="button" @click="$emit('close')">Back</button>

      <h1>Create Business Account</h1>
      <p v-if="message" class="form-success">{{ message }}</p>
      <div v-if="verificationUrl" class="verification-panel">
        <p>
          Email sending is not configured yet. Click below to verify this
          account for local testing.
        </p>
        <a class="btn primary" :href="verificationUrl">Verify Email</a>
      </div>
      <p v-if="error" class="form-error sticky-error">{{ error }}</p>

      <section class="registration-section">
        <h2>Personal Information</h2>
        <div class="form-grid three">
          <label>First Name<input v-model="form.firstName" required /></label>
          <label>Middle Name<input v-model="form.middleName" /></label>
          <label>Last Name<input v-model="form.lastName" required /></label>
        </div>
        <div class="radio-field">
          <span>Sex</span>
          <div class="radio-options">
            <label><input v-model="form.sex" value="Male" type="radio" /> Male</label>
            <label><input v-model="form.sex" value="Female" type="radio" /> Female</label>
          </div>
        </div>
      </section>

      <section class="registration-section">
        <h2>Business Information</h2>
        <label>
          <span>Business Name <small>(should be the name reflected on the enterprise's Business Permits)</small></span>
          <input v-model="form.business.businessName" required />
        </label>
        <div class="form-grid two">
          <label>Region
            <input :value="calabangaLocation.region" readonly />
          </label>
          <label>Province
            <input :value="calabangaLocation.province" readonly />
          </label>
          <label>City / Municipality
            <input :value="calabangaLocation.cityMunicipality" readonly />
          </label>
          <label>Barangay
            <select v-model="form.business.barangay" required>
              <option value="">Select barangay</option>
              <option v-for="location in calabangaBarangays" :key="location" :value="location">
                {{ location }}
              </option>
            </select>
          </label>
        </div>
        <div class="form-grid address-grid">
          <label>
            <span>Business Address <small>(Building / House / Block / Lot No., Street)</small></span>
            <input v-model="form.business.streetAddress" required />
          </label>
          <label>Zip Code<input :value="calabangaLocation.zipCode" readonly /></label>
        </div>
        <EstablishmentLocationPicker
          v-model:address="form.business.streetAddress"
          v-model:latitude="form.business.latitude"
          v-model:longitude="form.business.longitude"
        />
      </section>

      <section class="registration-section">
        <h2>Account Information</h2>
        <label>Email Address<input v-model="form.email" type="email" required /></label>
        <p class="registration-note">
          NOTE: Make sure that the email address you provided is ACTIVE and VALID.
          For ESTABLISHMENTS, ensure that this is a corporate email address or an
          email address that will be permanently associated to your company.
          Please refrain from using your personal email address as notifications
          and official communications will be forwarded to your registered email.
        </p>
        <div class="form-grid two">
          <label>Password<input v-model="form.password" type="password" required /></label>
          <label>Confirm Password<input v-model="confirmPassword" type="password" required /></label>
        </div>
      </section>

      <section class="registration-section">
        <h2>Contact Information</h2>
        <div class="form-grid two">
          <label>Mobile No.<input v-model="form.phone" required /></label>
          <label>Telephone No.<input v-model="form.telephone" /></label>
        </div>
      </section>

      <label class="checkbox-line">
        <input v-model="certified" type="checkbox" />
        <span>
          I certify that I am duly authorized to accomplish this application form
          and that the information provided herein are true, correct and complete
          statements to the best of my knowledge and in compliance with the
          provisions of pertinent laws, rules, and regulations of the Republic of
          the Philippines.
        </span>
      </label>

      <p class="privacy-line">
        By clicking Register Account, you agree to our
        <button class="link-button" type="button" @click="showPrivacy = true">
          Data Privacy Notice
        </button>.
      </p>

      <div class="registration-footer-actions">
        <button class="link-button" type="button" @click="$emit('switch-login')">
          Go to sign in page
        </button>
        <button class="btn primary" type="submit">Register Account</button>
      </div>
    </form>

    <DataPrivacyModal
      :open="showPrivacy"
      @close="showPrivacy = false"
    />
  </div>
</template>

<script setup>
import { reactive, ref } from "vue";
import { calabangaBarangays, calabangaLocation } from "@/modules/accreditation/data/mockData";
import EstablishmentLocationPicker from "@/modules/accreditation/components/EstablishmentLocationPicker.vue";
import { registerBusinessOwner } from "@/modules/accreditation/services/accreditationApi";
import DataPrivacyModal from "@/modules/accreditation/components/modals/DataPrivacyModal.vue";

defineProps({
  open: { type: Boolean, required: true },
});

defineEmits(["close", "switch-login"]);

const error = ref("");
const message = ref("");
const verificationUrl = ref("");
const certified = ref(false);
const confirmPassword = ref("");
const showPrivacy = ref(false);
const form = reactive({
  firstName: "",
  middleName: "",
  lastName: "",
  sex: "Male",
  email: "",
  password: "",
  phone: "",
  telephone: "",
  business: {
    businessName: "",
    businessType: "",
    businessPermitNumber: "",
    region: calabangaLocation.region,
    province: calabangaLocation.province,
    cityMunicipality: calabangaLocation.cityMunicipality,
    barangay: calabangaBarangays[0] || "",
    streetAddress: "",
    zipCode: calabangaLocation.zipCode,
    latitude: "",
    longitude: "",
  },
});

function applyCalabangaLocation() {
  form.business.region = calabangaLocation.region;
  form.business.province = calabangaLocation.province;
  form.business.cityMunicipality = calabangaLocation.cityMunicipality;
  form.business.zipCode = calabangaLocation.zipCode;
  if (!calabangaBarangays.includes(form.business.barangay)) {
    form.business.barangay = calabangaBarangays[0] || "";
  }
}

async function submit() {
  error.value = "";
  message.value = "";
  verificationUrl.value = "";
  applyCalabangaLocation();
  if (form.password !== confirmPassword.value) {
    error.value = "Password and confirmation password do not match.";
    return;
  }
  if (!certified.value) {
    error.value = "Please certify the information before registering.";
    return;
  }

  try {
    const result = await registerBusinessOwner(form);
    message.value = result.message;
    verificationUrl.value = result.verificationUrl || "";
  } catch (err) {
    error.value = err.response?.data?.message || "Unable to register account.";
  }
}
</script>
