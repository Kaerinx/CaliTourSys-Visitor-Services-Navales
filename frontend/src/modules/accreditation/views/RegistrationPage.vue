<template>
  <div class="registration-service-page">
    <PublicServiceHeader />

    <main class="registration-shell">
      <aside class="registration-intro" aria-labelledby="registration-title">
        <p class="registration-kicker">New applicants</p>
        <h1 id="registration-title">Create your service account</h1>
        <p>
          Register the business owner or authorized representative who will manage the
          accreditation request.
        </p>

        <div class="registration-notice">
          <strong>This step creates an account only.</strong>
          <p>
            After email verification, sign in to complete and submit the accreditation
            application and required documents.
          </p>
        </div>

        <div class="registration-guidance">
          <strong>Before you continue</strong>
          <ul>
            <li>Use the business name shown on the business permit.</li>
            <li>Use an active email address for official notifications.</li>
            <li>Only an owner or authorized representative should register.</li>
          </ul>
        </div>

        <RouterLink class="back-link" to="/accreditation">Return to service overview</RouterLink>
      </aside>

      <form class="registration-form" aria-label="Business account registration form" @submit.prevent="submit">
        <div class="registration-form__heading">
          <span>Account registration</span>
          <h2>Business owner details</h2>
          <p>Required fields are marked with an asterisk (*).</p>
        </div>

        <p v-if="message" class="form-message form-message--success" role="status">{{ message }}</p>
        <div v-if="verificationUrl" class="form-message form-message--success">
          <p>Email sending is not configured yet. Use the link below to verify this account for local testing.</p>
          <a class="form-button form-button--secondary" :href="verificationUrl">Verify email</a>
        </div>
        <p v-if="error" class="form-message form-message--error" role="alert">{{ error }}</p>

        <section class="registration-section" aria-labelledby="personal-title">
          <div class="registration-section__heading">
            <span>1</span>
            <div>
              <h3 id="personal-title">Personal information</h3>
              <p>Provide the details of the owner or authorized representative.</p>
            </div>
          </div>
          <div class="form-grid form-grid--three">
            <label>First name *<input v-model="form.firstName" autocomplete="given-name" required /></label>
            <label>Middle name<input v-model="form.middleName" autocomplete="additional-name" /></label>
            <label>Last name *<input v-model="form.lastName" autocomplete="family-name" required /></label>
          </div>
          <fieldset class="radio-field">
            <legend>Sex</legend>
            <div class="radio-options">
              <label><input v-model="form.sex" value="Male" type="radio" /> Male</label>
              <label><input v-model="form.sex" value="Female" type="radio" /> Female</label>
            </div>
          </fieldset>
        </section>

        <section class="registration-section" aria-labelledby="business-title">
          <div class="registration-section__heading">
            <span>2</span>
            <div>
              <h3 id="business-title">Business information</h3>
              <p>Use the registered business name and operating address.</p>
            </div>
          </div>
          <label>
            <span>Business name *</span>
            <small>Use the name reflected on the business permit.</small>
            <input v-model="form.business.businessName" autocomplete="organization" required />
          </label>
          <div class="form-grid form-grid--two">
            <label>Region *
              <select v-model="form.business.region" required>
                <option value="">Select region</option>
                <option v-for="location in philippineLocations" :key="location.name" :value="location.name">
                  {{ location.name }}
                </option>
              </select>
            </label>
            <label>Province *
              <select v-model="form.business.province" required>
                <option value="">Select province</option>
                <option v-for="location in provinceOptions" :key="location.name" :value="location.name">
                  {{ location.name }}
                </option>
              </select>
            </label>
            <label>City or municipality *
              <select v-model="form.business.cityMunicipality" required>
                <option value="">Select city or municipality</option>
                <option v-for="location in cityOptions" :key="location.name" :value="location.name">
                  {{ location.name }}
                </option>
              </select>
            </label>
            <label>Barangay *
              <select v-model="form.business.barangay" required>
                <option value="">Select barangay</option>
                <option v-for="location in barangayOptions" :key="location" :value="location">
                  {{ location }}
                </option>
              </select>
            </label>
          </div>
          <div class="form-grid form-grid--address">
            <label>
              <span>Business address *</span>
              <small>Building, house, block, lot number, and street</small>
              <input v-model="form.business.streetAddress" autocomplete="street-address" required />
            </label>
            <label>Zip code<input v-model="form.business.zipCode" autocomplete="postal-code" /></label>
          </div>
        </section>

        <section class="registration-section" aria-labelledby="account-title">
          <div class="registration-section__heading">
            <span>3</span>
            <div>
              <h3 id="account-title">Account information</h3>
              <p>Create the sign-in details used to manage the application.</p>
            </div>
          </div>
          <label>Email address *<input v-model="form.email" type="email" autocomplete="email" required /></label>
          <div class="information-note">
            Use an active and permanent business email address. Official notices and application
            updates will be sent to this address.
          </div>
          <div class="form-grid form-grid--two">
            <label>Password *<input v-model="form.password" type="password" autocomplete="new-password" required /></label>
            <label>Confirm password *<input v-model="confirmPassword" type="password" autocomplete="new-password" required /></label>
          </div>
          <small>Password must contain at least 8 characters.</small>
        </section>

        <section class="registration-section" aria-labelledby="contact-title">
          <div class="registration-section__heading">
            <span>4</span>
            <div>
              <h3 id="contact-title">Contact information</h3>
              <p>Provide a number the Tourism Office can use for application concerns.</p>
            </div>
          </div>
          <div class="form-grid form-grid--two">
            <label>Mobile number *<input v-model="form.phone" type="tel" autocomplete="tel" required /></label>
            <label>Telephone number<input v-model="form.telephone" type="tel" /></label>
          </div>
        </section>

        <section class="registration-section registration-section--certification" aria-labelledby="certification-title">
          <div class="registration-section__heading">
            <span>5</span>
            <div>
              <h3 id="certification-title">Certification and privacy</h3>
              <p>Confirm your authority and review the data privacy notice.</p>
            </div>
          </div>
          <label class="checkbox-line">
            <input v-model="certified" type="checkbox" />
            <span>
              I certify that I am authorized to register this business account and that the
              information provided is true, correct, and complete to the best of my knowledge.
            </span>
          </label>
          <p class="privacy-line">
            By selecting Register account, you agree to the
            <button class="link-button" type="button" @click="showPrivacy = true">Data Privacy Notice</button>.
          </p>
        </section>

        <div class="registration-actions">
          <RouterLink class="form-button form-button--secondary" to="/accreditation/login">Go to sign in</RouterLink>
          <button class="form-button form-button--primary" type="submit" :disabled="registering">
            {{ registering ? "Registering..." : "Register account" }}
          </button>
        </div>
      </form>
    </main>

    <PublicServiceFooter />

    <DataPrivacyModal :open="showPrivacy" @close="showPrivacy = false" />
  </div>
</template>

<script setup>
import { computed, reactive, ref, watch } from "vue";
import DataPrivacyModal from "@/modules/accreditation/components/modals/DataPrivacyModal.vue";
import PublicServiceFooter from "@/modules/accreditation/components/PublicServiceFooter.vue";
import PublicServiceHeader from "@/modules/accreditation/components/PublicServiceHeader.vue";
import { philippineLocations } from "@/modules/accreditation/data/mockData";
import { registerBusinessOwner } from "@/modules/accreditation/services/accreditationApi";

const error = ref("");
const message = ref("");
const verificationUrl = ref("");
const certified = ref(false);
const confirmPassword = ref("");
const showPrivacy = ref(false);
const registering = ref(false);
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
    region: "",
    province: "",
    cityMunicipality: "",
    barangay: "",
    streetAddress: "",
    zipCode: "",
  },
});

const selectedRegion = computed(() =>
  philippineLocations.find((location) => location.name === form.business.region),
);
const provinceOptions = computed(() => selectedRegion.value?.provinces || []);
const selectedProvince = computed(() =>
  provinceOptions.value.find((location) => location.name === form.business.province),
);
const cityOptions = computed(() => selectedProvince.value?.cities || []);
const selectedCity = computed(() =>
  cityOptions.value.find((location) => location.name === form.business.cityMunicipality),
);
const barangayOptions = computed(() => selectedCity.value?.barangays || []);

watch(
  () => form.business.region,
  () => {
    const firstProvince = provinceOptions.value[0];
    form.business.province = firstProvince?.name || "";
    form.business.cityMunicipality = firstProvince?.cities?.[0]?.name || "";
    form.business.barangay = firstProvince?.cities?.[0]?.barangays?.[0] || "";
  },
);

watch(
  () => form.business.province,
  () => {
    const firstCity = cityOptions.value[0];
    form.business.cityMunicipality = firstCity?.name || "";
    form.business.barangay = firstCity?.barangays?.[0] || "";
  },
);

watch(
  () => form.business.cityMunicipality,
  () => {
    form.business.barangay = barangayOptions.value[0] || "";
  },
);

async function submit() {
  error.value = "";
  message.value = "";
  verificationUrl.value = "";

  if (form.password !== confirmPassword.value) {
    error.value = "Password and confirmation password do not match.";
    window.scrollTo({ top: 0, behavior: "smooth" });
    return;
  }

  if (form.password.length < 8) {
    error.value = "Password must be at least 8 characters.";
    window.scrollTo({ top: 0, behavior: "smooth" });
    return;
  }

  if (!certified.value) {
    error.value = "Please certify the information before registering.";
    window.scrollTo({ top: 0, behavior: "smooth" });
    return;
  }

  registering.value = true;
  try {
    const result = await registerBusinessOwner(form);
    message.value = result.message;
    verificationUrl.value = result.verificationUrl || "";
    window.scrollTo({ top: 0, behavior: "smooth" });
  } catch (err) {
    error.value =
      err.response?.data?.message ||
      (err.request
        ? "Unable to reach the backend. Please make sure the backend is running on port 5000."
        : "Unable to register account.");
    window.scrollTo({ top: 0, behavior: "smooth" });
  } finally {
    registering.value = false;
  }
}
</script>

<style scoped>
.registration-service-page {
  min-height: 100vh;
  background: #f4f7f5;
  color: #17231e;
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  line-height: 1.6;
}

.registration-service-page,
.registration-service-page *,
.registration-service-page *::before,
.registration-service-page *::after {
  box-sizing: border-box;
}

.registration-service-page :focus-visible {
  outline: 3px solid #e1a928;
  outline-offset: 3px;
}

.registration-shell {
  width: min(1180px, calc(100% - 40px));
  margin: 0 auto;
  display: grid;
  grid-template-columns: 300px minmax(0, 1fr);
  align-items: start;
  gap: 42px;
  padding: 58px 0 76px;
}

.registration-intro {
  position: sticky;
  top: 24px;
}

.registration-shell > * {
  min-width: 0;
}

.registration-kicker,
.registration-form__heading > span {
  margin: 0 0 10px;
  color: #176249;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

h1,
h2,
h3,
p {
  margin-top: 0;
  overflow-wrap: break-word;
}

h1,
h2,
h3 {
  color: #173f32;
  line-height: 1.2;
  white-space: normal;
}

h1 {
  margin-bottom: 16px;
  font-size: 36px;
  letter-spacing: -0.035em;
}

h2 {
  margin-bottom: 8px;
  font-size: 30px;
}

h3 {
  margin-bottom: 5px;
  font-size: 18px;
}

.registration-intro > p:not(.registration-kicker),
.registration-form__heading p,
.registration-section__heading p {
  color: #52665e;
}

.registration-notice,
.registration-guidance {
  margin: 28px 0;
  padding: 18px;
  border-left: 4px solid #176249;
  background: #e9f2ed;
  color: #304a40;
  font-size: 13px;
}

.registration-notice strong,
.registration-guidance strong {
  color: #173f32;
}

.registration-notice p {
  margin: 8px 0 0;
}

.registration-guidance ul {
  display: grid;
  gap: 8px;
  margin: 10px 0 0;
  padding-left: 18px;
}

.back-link,
.link-button {
  color: #176249;
  font-weight: 800;
  text-underline-offset: 4px;
}

.registration-form {
  display: grid;
  gap: 0;
  padding: 32px;
  border: 1px solid #d4dfd9;
  border-radius: 8px;
  background: #ffffff;
  box-shadow: 0 14px 34px rgba(23, 63, 50, 0.07);
}

.registration-form__heading {
  padding-bottom: 24px;
  border-bottom: 1px solid #d9e1dc;
}

.registration-form__heading p,
.registration-section__heading p {
  margin-bottom: 0;
  font-size: 13px;
}

.registration-section {
  display: grid;
  gap: 18px;
  padding: 30px 0;
  border-bottom: 1px solid #d9e1dc;
}

.registration-section__heading {
  display: grid;
  grid-template-columns: 34px minmax(0, 1fr);
  gap: 12px;
}

.registration-section__heading > span {
  width: 30px;
  height: 30px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: #e5f2eb;
  color: #176249;
  font-size: 13px;
  font-weight: 800;
}

.registration-form label,
.radio-field legend {
  display: grid;
  gap: 7px;
  color: #294c40;
  font-size: 13px;
  font-weight: 800;
}

.registration-form label small,
.registration-form > small,
.registration-section > small {
  color: #62736c;
  font-size: 12px;
  font-weight: 500;
}

.registration-form input:not([type="radio"]):not([type="checkbox"]),
.registration-form select {
  width: 100%;
  min-height: 44px;
  padding: 9px 11px;
  border: 1px solid #b9c9c1;
  border-radius: 5px;
  background: #ffffff;
  color: #17231e;
  font: inherit;
}

.registration-form input:focus,
.registration-form select:focus {
  border-color: #176249;
  outline: 0;
  box-shadow: 0 0 0 3px rgba(23, 98, 73, 0.14);
}

.form-grid {
  display: grid;
  gap: 16px;
}

.form-grid--three {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.form-grid--two {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.form-grid--address {
  grid-template-columns: minmax(0, 1fr) 160px;
}

.radio-field {
  margin: 0;
  padding: 0;
  border: 0;
}

.radio-options {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.radio-options label {
  min-height: 38px;
  display: inline-flex;
  align-items: center;
  grid-template-columns: auto 1fr;
  padding: 7px 12px;
  border: 1px solid #cddbd4;
  border-radius: 5px;
  cursor: pointer;
}

.radio-options label:has(input:checked) {
  border-color: #176249;
  background: #edf7f2;
}

.radio-options input,
.checkbox-line input {
  accent-color: #176249;
}

.information-note {
  padding: 14px;
  border-left: 4px solid #176249;
  background: #edf7f2;
  color: #304a40;
  font-size: 13px;
}

.checkbox-line {
  grid-template-columns: auto minmax(0, 1fr);
  align-items: start;
  gap: 10px !important;
  font-weight: 500 !important;
}

.checkbox-line input {
  width: 17px;
  height: 17px;
  margin-top: 3px;
}

.privacy-line {
  margin: 0;
  color: #52665e;
  font-size: 13px;
}

.link-button {
  padding: 0;
  border: 0;
  background: transparent;
  font: inherit;
  cursor: pointer;
  text-decoration: underline;
}

.form-message {
  margin: 20px 0 0;
  padding: 14px;
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

.registration-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding-top: 26px;
}

.form-button {
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

.form-button--primary {
  background: #176249;
  color: #ffffff;
}

.form-button--primary:hover {
  background: #104c38;
}

.form-button--secondary {
  background: #ffffff;
}

.form-button:disabled {
  cursor: not-allowed;
  opacity: 0.58;
}

@media (max-width: 980px) {
  .registration-shell {
    grid-template-columns: minmax(0, 1fr);
  }

  .registration-intro {
    position: static;
    max-width: 720px;
  }
}

@media (max-width: 720px) {
  .registration-shell {
    width: min(100% - 28px, 1180px);
    padding: 42px 0 56px;
  }

  .registration-form {
    padding: 22px;
  }

  .form-grid--three,
  .form-grid--two,
  .form-grid--address {
    grid-template-columns: minmax(0, 1fr);
  }

  .registration-actions {
    align-items: stretch;
    flex-direction: column-reverse;
  }
}
</style>
