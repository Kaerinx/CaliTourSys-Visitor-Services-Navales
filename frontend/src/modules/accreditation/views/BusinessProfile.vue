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
            <select v-model="form.region" required>
              <option value="">Select region</option>
              <option v-for="location in philippineLocations" :key="location.name" :value="location.name">
                {{ location.name }}
              </option>
            </select>
          </label>
          <label>Province
            <select v-model="form.province" required>
              <option value="">Select province</option>
              <option v-for="location in provinceOptions" :key="location.name" :value="location.name">
                {{ location.name }}
              </option>
            </select>
          </label>
          <label>City / Municipality
            <select v-model="form.cityMunicipality" required>
              <option value="">Select city or municipality</option>
              <option v-for="location in cityOptions" :key="location.name" :value="location.name">
                {{ location.name }}
              </option>
            </select>
          </label>
          <label>Barangay
            <select v-model="form.barangay" required>
              <option value="">Select barangay</option>
              <option v-for="location in barangayOptions" :key="location" :value="location">
                {{ location }}
              </option>
            </select>
          </label>
          <label class="span-2">Business Address<input v-model="form.streetAddress" required /></label>
          <label>Zip Code<input v-model="form.zipCode" /></label>
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
import { computed, onMounted, reactive, ref, watch } from "vue";
import {
  businessTypeGroups,
  philippineLocations,
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
  region: "",
  province: "",
  cityMunicipality: "",
  barangay: "",
  streetAddress: "",
  zipCode: "",
  phone: auth.user?.phone || "",
  email: auth.user?.email || "",
};

const demoProfile = {
  businessName: "Sunset Beach Resort",
  businessType: "Resort",
  businessPermitNumber: "BP-2026-00124",
  dtiSecRegistrationNumber: "DTI-2026-7712",
  region: "Region V - Bicol Region",
  province: "Camarines Sur",
  cityMunicipality: "Calabanga",
  barangay: "San Francisco",
  streetAddress: "Zone 2, Coastal Road",
  zipCode: "4405",
  phone: "+63 912 345 6789",
  email: auth.user?.email || "john@sunsetresort.com",
};

const form = reactive({ ...emptyProfile });

const selectedRegion = computed(() =>
  philippineLocations.find((location) => location.name === form.region)
);
const provinceOptions = computed(() => selectedRegion.value?.provinces || []);
const selectedProvince = computed(() =>
  provinceOptions.value.find((location) => location.name === form.province)
);
const cityOptions = computed(() => selectedProvince.value?.cities || []);
const selectedCity = computed(() =>
  cityOptions.value.find((location) => location.name === form.cityMunicipality)
);
const barangayOptions = computed(() => selectedCity.value?.barangays || []);

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

watch(
  () => form.region,
  () => {
    const firstProvince = provinceOptions.value[0];
    form.province = firstProvince?.name || "";
    form.cityMunicipality = firstProvince?.cities?.[0]?.name || "";
    form.barangay = firstProvince?.cities?.[0]?.barangays?.[0] || "";
  }
);

watch(
  () => form.province,
  () => {
    const firstCity = cityOptions.value[0];
    form.cityMunicipality = firstCity?.name || "";
    form.barangay = firstCity?.barangays?.[0] || "";
  }
);

watch(
  () => form.cityMunicipality,
  () => {
    form.barangay = barangayOptions.value[0] || "";
  }
);

async function saveProfile() {
  message.value = "";
  error.value = "";
  saving.value = true;

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
}

function normalizeLocationSelection() {
  if (form.region === "Bicol Region") {
    form.region = "Region V - Bicol Region";
  }
  if (!selectedRegion.value) {
    form.region = demoProfile.region;
  }
  if (!provinceOptions.value.some((location) => location.name === form.province)) {
    form.province = provinceOptions.value[0]?.name || "";
  }
  if (!cityOptions.value.some((location) => location.name === form.cityMunicipality)) {
    form.cityMunicipality = cityOptions.value[0]?.name || "";
  }
  if (!barangayOptions.value.includes(form.barangay)) {
    form.barangay = barangayOptions.value[0] || "";
  }
}

function demoStorageKey() {
  return `business_profile_form_${auth.user?.id || "demo"}`;
}

function isDemoSession() {
  return (auth.token || "").startsWith("demo-token");
}
</script>
