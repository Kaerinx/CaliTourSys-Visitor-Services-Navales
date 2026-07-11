<template>
  <section class="page">
    <div class="page-header">
      <div>
        <h1>Business Profile</h1>
        <p>Manage your business information used for accreditation.</p>
      </div>
    </div>

    <form class="card form-card" @submit.prevent="saveProfile">
      <p v-if="message" class="form-success sticky-error">{{ message }}</p>
      <p v-if="error" class="form-error sticky-error">{{ error }}</p>

      <section class="form-section">
        <h2>Business Information</h2>
        <div class="form-grid two">
          <label>Business Name<input v-model="form.businessName" required /></label>
          <label>Business Type
            <select v-model="form.businessType" class="business-type-select" required>
              <option value="">Select business type</option>
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
          <label>Business Permit Number<input v-model="form.businessPermitNumber" /></label>
          <label>DTI/SEC Registration Number<input v-model="form.dtiSecRegistrationNumber" /></label>
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
            <select v-model="form.barangay" required>
              <option value="">Select barangay</option>
              <option v-for="location in calabangaBarangays" :key="location" :value="location">
                {{ location }}
              </option>
            </select>
          </label>
          <label class="span-2">Business Address<input v-model="form.streetAddress" required /></label>
          <label>Zip Code<input :value="calabangaLocation.zipCode" readonly /></label>
          <EstablishmentLocationPicker
            class="span-2"
            v-model:address="form.streetAddress"
            v-model:latitude="form.latitude"
            v-model:longitude="form.longitude"
          />
        </div>
      </section>

      <section class="form-section">
        <h2>Contact Information</h2>
        <div class="form-grid two">
          <label>Mobile Number<input v-model="form.phone" /></label>
          <label>Email Address<input v-model="form.email" type="email" disabled /></label>
        </div>
      </section>

      <button class="btn primary align-right" type="submit" :disabled="saving">
        {{ saving ? "Saving..." : "Save Changes" }}
      </button>
    </form>
  </section>
</template>

<script setup>
import { onMounted, reactive, ref } from "vue";
import EstablishmentLocationPicker from "@/modules/accreditation/components/EstablishmentLocationPicker.vue";
import {
  businessTypeGroups,
  calabangaBarangays,
  calabangaLocation,
} from "@/modules/accreditation/data/mockData";
import {
  getBusinessProfile,
  updateBusinessProfile,
} from "@/modules/accreditation/services/accreditationApi";
import { useAuthStore } from "@/stores/authStore";

const auth = useAuthStore();
const message = ref("");
const error = ref("");
const saving = ref(false);

const emptyProfile = {
  businessName: "",
  businessType: "",
  businessPermitNumber: "",
  dtiSecRegistrationNumber: "",
  region: calabangaLocation.region,
  province: calabangaLocation.province,
  cityMunicipality: calabangaLocation.cityMunicipality,
  barangay: calabangaBarangays[0] || "",
  streetAddress: "",
  zipCode: calabangaLocation.zipCode,
  latitude: "",
  longitude: "",
  phone: auth.user?.phone || "",
  email: auth.user?.email || "",
};

const demoProfile = {
  businessName: "Sunset Beach Resort",
  businessType: "Resort",
  businessPermitNumber: "BP-2026-00124",
  dtiSecRegistrationNumber: "DTI-2026-7712",
  region: calabangaLocation.region,
  province: calabangaLocation.province,
  cityMunicipality: calabangaLocation.cityMunicipality,
  barangay: "San Francisco",
  streetAddress: "Zone 2, Coastal Road",
  zipCode: calabangaLocation.zipCode,
  latitude: "13.706900",
  longitude: "123.246900",
  phone: "+63 912 345 6789",
  email: auth.user?.email || "john@sunsetresort.com",
};

const form = reactive({ ...emptyProfile });

onMounted(async () => {
  await auth.connectDemoToBackend();

  if (isDemoSession()) {
    fillDemoProfile();
    return;
  }

  try {
    const { profile } = await getBusinessProfile();
    if (profile) {
      fillForm(profile);
      return;
    }
    fillEmptyProfile();
  } catch (_err) {
    fillEmptyProfile();
  }
});

async function saveProfile() {
  message.value = "";
  error.value = "";
  saving.value = true;
  normalizeLocationSelection();

  try {
    if (!isDemoSession()) {
      await updateBusinessProfile({
        businessName: form.businessName,
        businessType: form.businessType,
        businessPermitNumber: form.businessPermitNumber,
        dtiSecRegistrationNumber: form.dtiSecRegistrationNumber,
        region: form.region,
        province: form.province,
        cityMunicipality: form.cityMunicipality,
        barangay: form.barangay,
        streetAddress: form.streetAddress,
        zipCode: form.zipCode,
        latitude: form.latitude,
        longitude: form.longitude,
        phone: form.phone,
      });
    } else {
      localStorage.setItem(demoStorageKey(), JSON.stringify({ ...form }));
    }

    message.value = "Business profile changes saved.";
  } catch (err) {
    error.value = err.response?.data?.message || "Unable to save changes.";
  } finally {
    saving.value = false;
  }
}

function fillForm(profile) {
  Object.assign(form, {
    businessName: profile.business_name || "",
    businessType: profile.business_type || "",
    businessPermitNumber: profile.business_permit_number || "",
    dtiSecRegistrationNumber: profile.dti_sec_registration_number || "",
    region: profile.region || "",
    province: profile.province || "",
    cityMunicipality: profile.city_municipality || "",
    barangay: profile.barangay || "",
    streetAddress: profile.street_address || "",
    zipCode: profile.zip_code || "",
    latitude: profile.latitude ?? "",
    longitude: profile.longitude ?? "",
    phone: profile.phone || "",
    email: profile.email || auth.user?.email || "",
  });
  normalizeLocationSelection();
}

function fillDemoProfile() {
  const saved = JSON.parse(localStorage.getItem(demoStorageKey()) || "null");
  Object.assign(form, saved || demoProfile);
  normalizeLocationSelection({ useDemoDefaults: true });
}

function fillEmptyProfile() {
  Object.assign(form, {
    ...emptyProfile,
    phone: auth.user?.phone || "",
    email: auth.user?.email || "",
  });
  normalizeLocationSelection();
}

function normalizeLocationSelection() {
  form.region = calabangaLocation.region;
  form.province = calabangaLocation.province;
  form.cityMunicipality = calabangaLocation.cityMunicipality;
  form.zipCode = calabangaLocation.zipCode;
  if (!calabangaBarangays.includes(form.barangay)) {
    form.barangay = calabangaBarangays[0] || "";
  }
}

function demoStorageKey() {
  return `business_profile_form_${auth.user?.id || "demo"}`;
}

function isDemoSession() {
  return (auth.token || "").startsWith("demo-token");
}
</script>
