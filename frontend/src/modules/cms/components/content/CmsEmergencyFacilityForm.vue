<script setup>
import { computed, reactive, ref, watch } from "vue";
import CmsCoordinateField from "./CmsCoordinateField.vue";
import CmsMapPicker from "./CmsMapPicker.vue";
import { toNullable, validateRequired, validateSlug } from "./formUtils";
import { mapboxAccessToken } from "@/config/mapbox";

const props = defineProps({
  open: { type: Boolean, default: false },
  value: { type: Object, default: null },
  busy: { type: Boolean, default: false },
  serverError: { type: String, default: "" },
});
const emit = defineEmits(["close", "submit"]);
const submitted = ref(false);
const pickerOpen = ref(false);

const DAYS = [
  ["monday", "Monday"],
  ["tuesday", "Tuesday"],
  ["wednesday", "Wednesday"],
  ["thursday", "Thursday"],
  ["friday", "Friday"],
  ["saturday", "Saturday"],
  ["sunday", "Sunday"],
];
const FACILITY_TYPES = [
  ["health_center", "Health center"],
  ["hospital", "Hospital"],
  ["emergency_service", "Emergency service"],
  ["first_aid", "First aid"],
  ["fire_station", "Fire station"],
  ["police_station", "Police station"],
  ["responder", "Responder"],
  ["other", "Other"],
];
const form = reactive(defaultForm());
const title = computed(() =>
  props.value?.id ? "Edit emergency facility" : "Create emergency facility",
);
const errors = computed(() => {
  if (!submitted.value) return {};
  const output = {
    slug: validateSlug(form.slug),
    name: validateRequired(form.name, "Facility name"),
    facilityType: validateRequired(form.facilityType, "Facility type"),
    addressLine: validateRequired(form.addressLine, "Address"),
  };
  const latitude = Number(form.latitude);
  const longitude = Number(form.longitude);
  if (
    form.latitude === "" ||
    !Number.isFinite(latitude) ||
    latitude < -90 ||
    latitude > 90
  ) {
    output.latitude = "Latitude must be a number from -90 to 90.";
  }
  if (
    form.longitude === "" ||
    !Number.isFinite(longitude) ||
    longitude < -180 ||
    longitude > 180
  ) {
    output.longitude = "Longitude must be a number from -180 to 180.";
  }
  if (form.email && !/^\S+@\S+\.\S+$/.test(form.email))
    output.email = "Use a valid email address.";
  return Object.fromEntries(
    Object.entries(output).filter(([, value]) => value),
  );
});

watch(
  () => [props.open, props.value],
  () => {
    Object.assign(form, defaultForm(props.value));
    submitted.value = false;
    pickerOpen.value = false;
  },
  { immediate: true },
);

function defaultForm(value = null) {
  const hours = value?.openingHours || {};
  return {
    slug: value?.slug || "",
    name: value?.name || "",
    facilityType: value?.facilityType || "health_center",
    description: value?.description || "",
    addressLine: value?.addressLine || "",
    barangay: value?.barangay || "",
    municipality: value?.municipality || "Calabanga",
    province: value?.province || "Camarines Sur",
    latitude: value?.latitude ?? "",
    longitude: value?.longitude ?? "",
    openingHours: Object.fromEntries(
      DAYS.map(([key]) => [key, hours[key] || ""]),
    ),
    publicPhone: value?.publicPhone || "",
    emergencyHotline: value?.emergencyHotline || "",
    email: value?.email || "",
    accessibilityText: (value?.accessibilityFeatures || []).join("\n"),
    amenitiesText: (value?.amenities || []).join("\n"),
    verificationSource: value?.verificationSource || "",
    verifiedAt: toLocalDateTime(value?.verifiedAt),
    sortPriority: value?.sortPriority ?? 0,
    status: value?.status || "draft",
  };
}

function toLocalDateTime(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (part) => String(part).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
function lines(value) {
  return value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}
function applyCoordinates(coordinates) {
  form.latitude = coordinates.latitude;
  form.longitude = coordinates.longitude;
}
function submitForm() {
  submitted.value = true;
  if (Object.keys(errors.value).length) return;
  const openingHours = Object.fromEntries(
    Object.entries(form.openingHours)
      .filter(([, value]) => value.trim())
      .map(([key, value]) => [key, value.trim()]),
  );
  emit("submit", {
    slug: form.slug.trim(),
    name: form.name.trim(),
    facilityType: form.facilityType,
    description: toNullable(form.description),
    addressLine: form.addressLine.trim(),
    barangay: toNullable(form.barangay),
    municipality: form.municipality.trim() || "Calabanga",
    province: form.province.trim() || "Camarines Sur",
    latitude: Number(form.latitude),
    longitude: Number(form.longitude),
    openingHours,
    publicPhone: toNullable(form.publicPhone),
    emergencyHotline: toNullable(form.emergencyHotline),
    email: toNullable(form.email),
    accessibilityFeatures: lines(form.accessibilityText),
    amenities: lines(form.amenitiesText),
    verificationSource: toNullable(form.verificationSource),
    verifiedAt: form.verifiedAt
      ? new Date(form.verifiedAt).toISOString()
      : null,
    sortPriority: Number(form.sortPriority || 0),
  });
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="open"
      class="facility-modal"
      role="presentation"
      @click.self="$emit('close')"
    >
      <section
        class="facility-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="facility-form-title"
      >
        <header>
          <div>
            <p>Emergency infrastructure</p>
            <h2 id="facility-form-title">{{ title }}</h2>
          </div>
          <button type="button" aria-label="Close form" @click="$emit('close')">
            x
          </button>
        </header>
        <form novalidate @submit.prevent="submitForm">
          <div class="facility-body">
            <section>
              <h3>Facility details</h3>
              <div class="grid">
                <label
                  ><span>Name</span
                  ><input
                    v-model="form.name"
                    :aria-invalid="Boolean(errors.name)"
                  /><small v-if="errors.name">{{ errors.name }}</small></label
                ><label
                  ><span>Slug</span
                  ><input
                    v-model="form.slug"
                    :aria-invalid="Boolean(errors.slug)"
                  /><small v-if="errors.slug">{{ errors.slug }}</small></label
                >
              </div>
              <div class="grid">
                <label
                  ><span>Facility type</span
                  ><select v-model="form.facilityType">
                    <option
                      v-for="type in FACILITY_TYPES"
                      :key="type[0]"
                      :value="type[0]"
                    >
                      {{ type[1] }}
                    </option>
                  </select></label
                ><label
                  ><span>Current status</span
                  ><select v-model="form.status" disabled>
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                    <option value="archived">Archived</option></select
                  ><em
                    >Use the list actions to publish or archive this record.</em
                  ></label
                >
              </div>
              <label
                ><span>Description</span
                ><textarea v-model="form.description" rows="3" />
              </label>
              <label
                ><span>Address</span
                ><textarea
                  v-model="form.addressLine"
                  rows="2"
                  :aria-invalid="Boolean(errors.addressLine)"
                ></textarea
                ><small v-if="errors.addressLine">{{
                  errors.addressLine
                }}</small></label
              >
              <div class="grid three">
                <label
                  ><span>Barangay</span><input v-model="form.barangay" /></label
                ><label
                  ><span>Municipality</span
                  ><input v-model="form.municipality" /></label
                ><label
                  ><span>Province</span><input v-model="form.province"
                /></label>
              </div>
            </section>

            <section>
              <div class="section-title">
                <h3>Map position</h3>
                <button type="button" @click="pickerOpen = !pickerOpen">
                  {{ pickerOpen ? "Hide map" : "Pick on map" }}
                </button>
              </div>
              <CmsMapPicker
                v-if="pickerOpen"
                :access-token="mapboxAccessToken"
                :latitude="form.latitude"
                :longitude="form.longitude"
                @select="applyCoordinates"
              />
              <CmsCoordinateField
                v-model:latitude="form.latitude"
                v-model:longitude="form.longitude"
                :latitude-error="errors.latitude"
                :longitude-error="errors.longitude"
              />
            </section>

            <section class="wide">
              <h3>Opening hours</h3>
              <p class="helper">
                Enter a public-facing value such as “8:00 AM–5:00 PM” or
                “Closed”. Leave unverified days empty.
              </p>
              <div class="hours">
                <label v-for="day in DAYS" :key="day[0]"
                  ><span>{{ day[1] }}</span
                  ><input
                    v-model="form.openingHours[day[0]]"
                    placeholder="Hours not confirmed"
                /></label>
              </div>
            </section>

            <section>
              <h3>Public contacts</h3>
              <label
                ><span>Public phone</span><input v-model="form.publicPhone"
              /></label>
              <label
                ><span>Emergency hotline</span
                ><input v-model="form.emergencyHotline"
              /></label>
              <label
                ><span>Email</span
                ><input
                  v-model="form.email"
                  type="email"
                  :aria-invalid="Boolean(errors.email)"
                /><small v-if="errors.email">{{ errors.email }}</small></label
              >
            </section>

            <section>
              <h3>Access and amenities</h3>
              <label
                ><span>Accessibility features</span
                ><textarea
                  v-model="form.accessibilityText"
                  rows="4"
                  placeholder="One feature per line"
                />
              </label>
              <label
                ><span>Amenities</span
                ><textarea
                  v-model="form.amenitiesText"
                  rows="4"
                  placeholder="One amenity per line"
                />
              </label>
            </section>

            <section class="wide">
              <h3>Verification and ordering</h3>
              <div class="grid">
                <label
                  ><span>Verification source</span
                  ><textarea
                    v-model="form.verificationSource"
                    rows="2"
                  /></label
                ><label
                  ><span>Verified at</span
                  ><input
                    v-model="form.verifiedAt"
                    type="datetime-local" /></label
                ><label
                  ><span>Map sort priority</span
                  ><input v-model="form.sortPriority" type="number"
                /></label>
              </div>
            </section>
            <div v-if="serverError" class="error wide" role="alert">
              {{ serverError }}
            </div>
          </div>
          <footer>
            <button type="button" :disabled="busy" @click="$emit('close')">
              Cancel</button
            ><button class="primary" type="submit" :disabled="busy">
              {{ busy ? "Saving…" : "Save facility" }}
            </button>
          </footer>
        </form>
      </section>
    </div>
  </Teleport>
</template>

<style scoped>
* {
  box-sizing: border-box;
}
.facility-modal {
  position: fixed;
  inset: 0;
  z-index: 80;
  display: grid;
  place-items: center;
  padding: 16px;
  background: rgba(15, 23, 42, 0.5);
}
.facility-dialog {
  display: flex;
  flex-direction: column;
  width: min(980px, 100%);
  max-height: calc(100vh - 32px);
  overflow: hidden;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  background: #fff;
  box-shadow: 0 24px 70px rgba(15, 23, 42, 0.24);
}
header,
footer {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: space-between;
  padding: 15px 18px;
  border-bottom: 1px solid #e2e8f0;
}
footer {
  border-top: 1px solid #e2e8f0;
  border-bottom: 0;
}
header p,
header h2,
h3,
.helper {
  margin: 0;
}
header p {
  color: #b91c1c;
  font-size: 0.72rem;
  font-weight: 900;
  text-transform: uppercase;
}
header h2 {
  margin-top: 3px;
  font-size: 1.18rem;
}
.facility-dialog form {
  display: flex;
  min-height: 0;
  flex: 1;
  flex-direction: column;
}
.facility-body {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 18px;
  padding: 18px;
  overflow: auto;
}
.facility-body section {
  display: grid;
  align-content: start;
  gap: 12px;
  padding: 14px;
  border: 1px solid #e2e8f0;
  border-radius: 9px;
}
.wide {
  grid-column: 1/-1;
}
.grid,
.hours {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}
.grid.three {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}
.hours {
  grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
}
label {
  display: grid;
  gap: 6px;
  min-width: 0;
}
label > span {
  color: #334155;
  font-size: 0.82rem;
  font-weight: 800;
}
input,
select,
textarea,
button {
  font: inherit;
}
input,
select,
textarea {
  width: 100%;
  min-width: 0;
  padding: 8px 10px;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  background: #fff;
}
textarea {
  resize: vertical;
}
.section-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}
.helper {
  color: #64748b;
  font-size: 0.82rem;
  line-height: 1.45;
}
.facility-dialog button {
  min-height: 36px;
  padding: 0 13px;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  background: #fff;
  font-weight: 800;
}
.facility-dialog .primary {
  color: #fff;
  border-color: #b91c1c;
  background: #b91c1c;
}
input:focus,
select:focus,
textarea:focus,
button:focus-visible {
  border-color: #0ea5e9;
  outline: 3px solid rgba(14, 165, 233, 0.16);
}
small,
.error {
  color: #b91c1c;
  font-size: 0.78rem;
}
.error {
  padding: 10px;
  border: 1px solid #fecaca;
  border-radius: 8px;
  background: #fef2f2;
}
@media (max-width: 720px) {
  .facility-body {
    grid-template-columns: 1fr;
  }
  .wide {
    grid-column: auto;
  }
  .grid,
  .grid.three {
    grid-template-columns: 1fr;
  }
}
@media (max-width: 460px) {
  .facility-modal {
    padding: 8px;
  }
  .facility-dialog {
    max-height: calc(100vh - 16px);
  }
  footer {
    flex-direction: column-reverse;
    gap: 8px;
  }
  footer button {
    width: 100%;
  }
}
label > em {
  color: #64748b;
  font-size: 0.76rem;
  font-style: normal;
}
</style>
