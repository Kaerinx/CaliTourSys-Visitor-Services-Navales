<template>
  <div class="registration-service-page">
    <PublicServiceHeader />

    <main class="registration-shell">
      <form class="registration-form" aria-label="Business account registration form" @submit.prevent="submit">
        <div class="registration-form__heading">
          <span>Account registration</span>
          <h2>Business accreditation account</h2>
          <p>Required fields are marked with an asterisk (*).</p>
        </div>

        <p v-if="message" class="form-message form-message--success" role="status">{{ message }}</p>
        <p v-if="error" class="form-message form-message--error" role="alert">{{ error }}</p>

        <section class="registration-section" aria-labelledby="structure-title">
          <div class="registration-section__heading">
            <span>1</span>
            <div>
              <h3 id="structure-title">Business type</h3>
              <p>Select how the business is legally registered.</p>
            </div>
          </div>
          <div class="business-structure-options">
            <label
              v-for="type in businessLegalTypes"
              :key="type.value"
              :class="{ selected: form.business.legalStructure === type.value }"
            >
              <input v-model="form.business.legalStructure" type="radio" :value="type.value" required />
              <span>
                <strong>{{ type.title }}</strong>
                <small>{{ type.summary }}</small>
              </span>
            </label>
          </div>
          <div class="information-note">
            {{ selectedLegalProfile.validation }}
          </div>
        </section>

        <section class="registration-section" aria-labelledby="personal-title">
          <div class="registration-section__heading">
            <span>2</span>
            <div>
              <h3 id="personal-title">Applicant information</h3>
              <p>{{ applicantSectionHelp }}</p>
            </div>
          </div>
          <div class="form-grid form-grid--three">
            <label>{{ applicantFirstNameLabel }} *<input v-model="form.firstName" autocomplete="given-name" required /></label>
            <label>Middle name<input v-model="form.middleName" autocomplete="additional-name" /></label>
            <label>{{ applicantLastNameLabel }} *<input v-model="form.lastName" autocomplete="family-name" required /></label>
          </div>
          <fieldset class="radio-field">
            <legend>Sex</legend>
            <div class="radio-options">
              <label><input v-model="form.sex" value="Male" type="radio" /> Male</label>
              <label><input v-model="form.sex" value="Female" type="radio" /> Female</label>
            </div>
          </fieldset>

          <div v-if="isSoleProprietorship" class="information-note">
            Sole Proprietorship registration accepts one owner applicant only.
          </div>

          <div v-if="isPartnership" class="structure-details">
            <div class="structure-details__heading">
              <strong>Partner names</strong>
              <button class="small-action" type="button" @click="addPartner">Add Partner</button>
            </div>
            <div
              v-for="(partner, index) in form.business.partners"
              :key="partner.id"
              class="repeatable-row"
            >
              <label>
                Partner {{ index + 1 }} name *
                <input v-model="partner.name" required />
              </label>
              <button
                class="small-action small-action--danger"
                type="button"
                :disabled="form.business.partners.length === 1"
                @click="removePartner(index)"
              >
                Remove
              </button>
            </div>
          </div>

          <div v-if="isCorporation" class="structure-details">
            <div class="structure-details__heading">
              <strong>Company and representative details</strong>
            </div>
            <div class="form-grid form-grid--two">
              <label>SEC / company registration number *<input v-model="form.business.company.registrationNumber" required /></label>
              <label>Authorized representative position *<input v-model="form.business.company.representativePosition" required /></label>
            </div>
          </div>
        </section>

        <section class="registration-section" aria-labelledby="business-title">
          <div class="registration-section__heading">
            <span>3</span>
            <div>
              <h3 id="business-title">Business information</h3>
              <p>Use the registered business name, tourism category, and operating address.</p>
            </div>
          </div>
          <label>
            <span>Business name *</span>
            <small>Use the name reflected on the business permit.</small>
            <input v-model="form.business.businessName" autocomplete="organization" required />
          </label>
          <div class="form-grid form-grid--two">
            <label>Tourism business category *
              <select v-model="form.business.businessType" required>
                <option value="" disabled>Select category</option>
                <optgroup
                  v-for="group in businessTypeGroups"
                  :key="group.label"
                  :label="group.label"
                >
                  <option v-for="type in group.options" :key="type" :value="type">
                    {{ type }}
                  </option>
                </optgroup>
              </select>
            </label>
            <label>Business permit number<input v-model="form.business.businessPermitNumber" /></label>
          </div>
          <div class="form-grid form-grid--two">
            <label>Region *
              <input :value="calabangaLocation.region" readonly />
            </label>
            <label>Province *
              <input :value="calabangaLocation.province" readonly />
            </label>
            <label>City or municipality *
              <input :value="calabangaLocation.cityMunicipality" readonly />
            </label>
            <label>Barangay *
              <select v-model="form.business.barangay" required>
                <option value="">Select barangay</option>
                <option v-for="location in calabangaBarangays" :key="location" :value="location">
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
            <label>Zip code<input :value="calabangaLocation.zipCode" autocomplete="postal-code" readonly /></label>
          </div>
          <EstablishmentLocationPicker
            v-model:address="form.business.streetAddress"
            v-model:latitude="form.business.latitude"
            v-model:longitude="form.business.longitude"
          />
        </section>

        <section class="registration-section" aria-labelledby="account-title">
          <div class="registration-section__heading">
            <span>4</span>
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
            <span>5</span>
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
            <span>6</span>
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
import { computed, reactive, ref } from "vue";
import DataPrivacyModal from "@/modules/accreditation/components/modals/DataPrivacyModal.vue";
import EstablishmentLocationPicker from "@/modules/accreditation/components/EstablishmentLocationPicker.vue";
import PublicServiceFooter from "@/modules/accreditation/components/PublicServiceFooter.vue";
import PublicServiceHeader from "@/modules/accreditation/components/PublicServiceHeader.vue";
import {
  businessTypeGroups,
  calabangaBarangays,
  calabangaLocation,
} from "@/modules/accreditation/data/mockData";
import { businessLegalTypes } from "@/modules/accreditation/data/publicServiceContent";
import { registerBusinessOwner } from "@/modules/accreditation/services/accreditationApi";

const error = ref("");
const message = ref("");
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
    legalStructure: businessLegalTypes[0]?.value || "",
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
    partners: [{ id: Date.now(), name: "" }],
    company: {
      registrationNumber: "",
      representativePosition: "",
    },
  },
});

const selectedLegalProfile = computed(
  () => businessLegalTypes.find((type) => type.value === form.business.legalStructure) || businessLegalTypes[0],
);
const isSoleProprietorship = computed(() => form.business.legalStructure === "sole-proprietorship");
const isPartnership = computed(() => form.business.legalStructure === "partnership");
const isCorporation = computed(() => form.business.legalStructure === "corporation");
const applicantSectionHelp = computed(() => {
  if (isSoleProprietorship.value) return "Provide the details of the single owner applicant.";
  if (isPartnership.value) return "Provide the managing partner details and list all partner names.";
  if (isCorporation.value) return "Provide the authorized representative details and company information.";
  return "Provide the applicant details.";
});
const applicantFirstNameLabel = computed(() => {
  if (isSoleProprietorship.value) return "Owner first name";
  if (isPartnership.value) return "Managing partner first name";
  if (isCorporation.value) return "Authorized representative first name";
  return "First name";
});
const applicantLastNameLabel = computed(() => {
  if (isSoleProprietorship.value) return "Owner last name";
  if (isPartnership.value) return "Managing partner last name";
  if (isCorporation.value) return "Authorized representative last name";
  return "Last name";
});

function addPartner() {
  form.business.partners.push({ id: Date.now() + Math.random(), name: "" });
}

function removePartner(index) {
  if (form.business.partners.length === 1) return;
  form.business.partners.splice(index, 1);
}

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
  applyCalabangaLocation();

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

  if (!form.business.legalStructure || !form.business.businessType) {
    error.value = "Please select the business type and tourism business category.";
    window.scrollTo({ top: 0, behavior: "smooth" });
    return;
  }

  if (isPartnership.value && form.business.partners.some((partner) => !partner.name.trim())) {
    error.value = "Please enter the name of each partner.";
    window.scrollTo({ top: 0, behavior: "smooth" });
    return;
  }

  if (
    isCorporation.value &&
    (!form.business.company.registrationNumber.trim() ||
      !form.business.company.representativePosition.trim())
  ) {
    error.value = "Please complete the required company and authorized representative details.";
    window.scrollTo({ top: 0, behavior: "smooth" });
    return;
  }

  registering.value = true;
  try {
    const result = await registerBusinessOwner({
      ...form,
      business: {
        ...form.business,
        partners: isPartnership.value
          ? form.business.partners.map((partner) => partner.name.trim()).filter(Boolean)
          : [],
        company: isCorporation.value ? { ...form.business.company } : null,
      },
    });
    message.value = result.message;
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
  width: min(880px, calc(100% - 40px));
  margin: 0 auto;
  display: grid;
  padding: 58px 0 76px;
}

.registration-shell > * {
  min-width: 0;
}

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

.registration-form__heading p,
.registration-section__heading p {
  color: #52665e;
}

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

.business-structure-options {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.business-structure-options label {
  min-height: 150px;
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: start;
  gap: 10px !important;
  padding: 16px;
  border: 1px solid #cddbd4;
  border-radius: 8px;
  background: #ffffff;
  cursor: pointer;
}

.business-structure-options label.selected {
  border-color: #176249;
  background: #edf7f2;
  box-shadow: inset 0 0 0 2px rgba(23, 98, 73, 0.14);
}

.business-structure-options input {
  width: 17px;
  height: 17px;
  margin-top: 3px;
  accent-color: #176249;
}

.business-structure-options strong,
.business-structure-options small {
  display: block;
}

.business-structure-options strong {
  color: #173f32;
  font-size: 14px;
}

.business-structure-options small {
  margin-top: 6px;
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

.structure-details {
  display: grid;
  gap: 14px;
  padding: 18px;
  border: 1px solid #d9e1dc;
  border-radius: 8px;
  background: #f8faf7;
}

.structure-details__heading,
.repeatable-row {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 12px;
}

.structure-details__heading {
  align-items: center;
}

.structure-details__heading strong {
  color: #173f32;
}

.repeatable-row label {
  flex: 1 1 auto;
}

.small-action {
  min-height: 38px;
  flex: 0 0 auto;
  padding: 7px 12px;
  border: 1px solid #176249;
  border-radius: 5px;
  background: #ffffff;
  color: #176249;
  font: inherit;
  font-size: 12px;
  font-weight: 800;
  cursor: pointer;
}

.small-action:hover {
  background: #e8f3ed;
}

.small-action--danger {
  border-color: #a33a24;
  color: #8c2d1c;
}

.small-action:disabled {
  cursor: not-allowed;
  opacity: 0.5;
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

  .business-structure-options {
    grid-template-columns: minmax(0, 1fr);
  }

  .business-structure-options label {
    min-height: auto;
  }

  .registration-actions {
    align-items: stretch;
    flex-direction: column-reverse;
  }

  .structure-details__heading,
  .repeatable-row {
    align-items: stretch;
    flex-direction: column;
  }
}
</style>
