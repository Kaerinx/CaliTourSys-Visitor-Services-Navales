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
        <h2>Accredited Establishment Content</h2>
        <div class="form-grid two">
          <label class="span-2">
            Description
            <textarea
              v-model="form.description"
              rows="5"
              placeholder="Describe your establishment, services, amenities, or visitor experience."
            />
          </label>
          <label>Facebook Link<input v-model="form.facebookUrl" type="url" placeholder="https://facebook.com/..." /></label>
          <label>Instagram Link<input v-model="form.instagramUrl" type="url" placeholder="https://instagram.com/..." /></label>
          <label>TikTok Link<input v-model="form.tiktokUrl" type="url" placeholder="https://tiktok.com/@..." /></label>
          <label>Twitter / X Link<input v-model="form.twitterUrl" type="url" placeholder="https://x.com/..." /></label>
          <label class="span-2">Website Link<input v-model="form.websiteUrl" type="url" placeholder="https://example.com" /></label>
        </div>
      </section>

      <section class="form-section">
        <div class="section-heading-row">
          <div>
            <h2>Business Photos</h2>
            <p class="muted">Upload up to 5 photos. The first uploaded photo is used as the cover photo in Accredited Establishments.</p>
          </div>
          <span class="photo-count">{{ form.images.length }}/5 photos</span>
        </div>

        <div class="profile-photo-grid" v-if="form.images.length">
          <figure v-for="(image, index) in form.images" :key="image.id || image.url" class="profile-photo-card">
            <img :src="image.image_url || image.url" :alt="image.original_name || image.altText || `${form.businessName} photo`" />
            <figcaption>
              <strong>{{ index === 0 ? "Cover photo" : `Photo ${index + 1}` }}</strong>
              <button
                type="button"
                class="btn ghost"
                :disabled="deletingImageId === image.id || saving"
                @click="deletePhoto(image)"
              >
                Remove
              </button>
            </figcaption>
          </figure>
        </div>

        <div class="photo-upload-row">
          <input
            ref="photoInput"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            :disabled="form.images.length >= 5 || uploadingPhotos"
            @change="uploadPhotos"
          />
          <small>Accepted formats: JPG, PNG, WebP. Maximum 10MB per photo.</small>
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
  deleteBusinessProfileImage,
  getBusinessProfile,
  updateBusinessProfile,
  uploadBusinessProfileImages,
} from "@/modules/accreditation/services/accreditationApi";
import { useAuthStore } from "@/stores/authStore";

const auth = useAuthStore();
const message = ref("");
const error = ref("");
const saving = ref(false);
const uploadingPhotos = ref(false);
const deletingImageId = ref("");
const photoInput = ref(null);

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
  description: "",
  facebookUrl: "",
  instagramUrl: "",
  tiktokUrl: "",
  twitterUrl: "",
  websiteUrl: "",
  images: [],
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
  description: "A coastal accommodation establishment offering visitor-friendly stays and local tourism services in Calabanga.",
  facebookUrl: "",
  instagramUrl: "",
  tiktokUrl: "",
  twitterUrl: "",
  websiteUrl: "",
  images: [],
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
        description: form.description,
        facebookUrl: form.facebookUrl,
        instagramUrl: form.instagramUrl,
        tiktokUrl: form.tiktokUrl,
        twitterUrl: form.twitterUrl,
        websiteUrl: form.websiteUrl,
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
    description: profile.description || "",
    facebookUrl: profile.facebook_url || "",
    instagramUrl: profile.instagram_url || "",
    tiktokUrl: profile.tiktok_url || "",
    twitterUrl: profile.twitter_url || "",
    websiteUrl: profile.website_url || "",
    images: Array.isArray(profile.images) ? profile.images : [],
    phone: profile.phone || "",
    email: profile.email || auth.user?.email || "",
  });
  normalizeLocationSelection();
}

async function uploadPhotos(event) {
  message.value = "";
  error.value = "";
  const files = Array.from(event.target.files || []);
  if (!files.length) return;

  const remaining = 5 - form.images.length;
  if (files.length > remaining) {
    error.value = `You can upload ${remaining} more photo${remaining === 1 ? "" : "s"} only.`;
    event.target.value = "";
    return;
  }

  if (isDemoSession()) {
    error.value = "Photo upload is available after signing in with a verified account.";
    event.target.value = "";
    return;
  }

  uploadingPhotos.value = true;
  try {
    const formData = new FormData();
    files.forEach((file) => formData.append("photos", file));
    const result = await uploadBusinessProfileImages(formData);
    form.images = [...form.images, ...(result.images || [])].slice(0, 5);
    message.value = "Business photos uploaded.";
  } catch (err) {
    error.value = err.response?.data?.message || "Unable to upload business photos.";
  } finally {
    uploadingPhotos.value = false;
    if (photoInput.value) photoInput.value.value = "";
  }
}

async function deletePhoto(image) {
  message.value = "";
  error.value = "";
  if (!image?.id) return;

  if (isDemoSession()) {
    form.images = form.images.filter((item) => item !== image);
    return;
  }

  deletingImageId.value = image.id;
  try {
    await deleteBusinessProfileImage(image.id);
    form.images = form.images.filter((item) => item.id !== image.id);
    message.value = "Business photo removed.";
  } catch (err) {
    error.value = err.response?.data?.message || "Unable to remove business photo.";
  } finally {
    deletingImageId.value = "";
  }
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

<style scoped>
.section-heading-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 18px;
}

.muted {
  margin: 6px 0 0;
  color: #5c5c5c;
}

.photo-count {
  padding: 6px 10px;
  border: 1px solid #d7e5dd;
  border-radius: 999px;
  color: #1b4332;
  font-size: 12px;
  font-weight: 800;
  white-space: nowrap;
}

.profile-photo-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 14px;
  margin-top: 16px;
}

.profile-photo-card {
  min-width: 0;
  margin: 0;
  overflow: hidden;
  border: 1px solid #d7e5dd;
  border-radius: 8px;
  background: #ffffff;
}

.profile-photo-card img {
  width: 100%;
  aspect-ratio: 4 / 3;
  display: block;
  object-fit: cover;
  background: #edf4ef;
}

.profile-photo-card figcaption {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 10px;
}

.profile-photo-card strong {
  color: #123c2e;
  font-size: 13px;
}

.photo-upload-row {
  display: grid;
  gap: 8px;
  margin-top: 16px;
}

.photo-upload-row input {
  max-width: 520px;
}

.photo-upload-row small {
  color: #5c5c5c;
}

@media (max-width: 640px) {
  .section-heading-row {
    flex-direction: column;
  }
}
</style>
