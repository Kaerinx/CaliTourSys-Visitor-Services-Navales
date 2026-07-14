<script setup>
import { computed, reactive, ref, watch } from "vue";
import { toNullable } from "./formUtils";

const props = defineProps({
  value: { type: Object, default: null },
  activities: { type: Array, default: () => [] },
  packages: { type: Array, default: () => [] },
  mediaAssets: { type: Array, default: () => [] },
});
const form = reactive(defaultExperience());
const submitted = ref(false);

watch(
  () => props.value,
  (value) => {
    Object.assign(form, defaultExperience(value));
    submitted.value = false;
  },
  { immediate: true, deep: true },
);

const activityOptions = computed(() =>
  mergeLinkedOptions(props.activities, form.activityLinks, "activityId"),
);
const packageOptions = computed(() =>
  mergeLinkedOptions(props.packages, form.packageLinks, "packageId"),
);
const mediaOptions = computed(() => {
  const options = [...props.mediaAssets];
  form.galleryImages.forEach((image) => {
    if (
      !image.mediaAssetId ||
      options.some((option) => option.id === image.mediaAssetId)
    )
      return;
    options.push({
      id: image.mediaAssetId,
      fileUrl: image.resolvedUrl,
      fileName: "Linked media asset",
      altText: image.altText,
    });
  });
  return options;
});
const validationErrors = computed(() => {
  if (!submitted.value) return [];
  const errors = [];
  form.galleryImages.forEach((image, index) => {
    if (!image.mediaAssetId && !isImageUrl(image.imageUrl))
      errors.push(
        `Gallery image ${index + 1} needs a valid http(s) or /uploads/ URL.`,
      );
  });
  if (form.galleryImages.filter((image) => image.isPrimary).length > 1)
    errors.push("Choose only one primary gallery image.");
  if (form.packageLinks.filter((link) => link.isPrimary).length > 1)
    errors.push("Choose only one primary package.");
  form.overnightOptions.forEach((option, index) => {
    if (!option.name.trim())
      errors.push(`Overnight option ${index + 1} needs a name.`);
    if (
      option.rateAmount !== "" &&
      (Number(option.rateAmount) < 0 ||
        !Number.isFinite(Number(option.rateAmount)))
    )
      errors.push(
        `Overnight option ${index + 1} needs a valid non-negative rate.`,
      );
    if (
      option.capacityMin !== "" &&
      option.capacityMax !== "" &&
      Number(option.capacityMax) < Number(option.capacityMin)
    )
      errors.push(
        `Overnight option ${index + 1} maximum capacity cannot be below its minimum.`,
      );
  });
  return errors;
});

function defaultExperience(value = null) {
  const details = value?.details || {};
  return {
    details: {
      overview: details.overview || "",
      openingHoursText: details.openingHoursText || "",
      admissionInformation: details.admissionInformation || "",
      bestTimeToVisit: details.bestTimeToVisit || "",
      accessibilityNotes: details.accessibilityNotes || "",
      howToVisit: details.howToVisit || "",
      howToBook: details.howToBook || "",
    },
    galleryImages: (value?.galleryImages || []).map((image, index) => ({
      mediaAssetId: image.mediaAssetId || null,
      imageUrl: image.imageUrl || "",
      resolvedUrl: image.resolvedUrl || image.imageUrl || "",
      altText: image.altText || "",
      displayOrder: image.displayOrder ?? index,
      isPrimary: Boolean(image.isPrimary),
    })),
    activityLinks: (value?.activityLinks || []).map((link, index) => ({
      ...link,
      displayOrder: link.displayOrder ?? index,
    })),
    packageLinks: (value?.packageLinks || []).map((link, index) => ({
      ...link,
      displayOrder: link.displayOrder ?? index,
      isPrimary: Boolean(link.isPrimary),
    })),
    overnightOptions: (value?.overnightOptions || []).map((option, index) => ({
      optionType: option.optionType || "camping",
      name: option.name || "",
      description: option.description || "",
      capacityMin: option.capacityMin ?? "",
      capacityMax: option.capacityMax ?? "",
      rateAmount: option.rateAmount ?? "",
      currency: option.currency || "PHP",
      rateUnit: option.rateUnit || "per_person_per_night",
      inclusionsText: (option.inclusions || []).join("\n"),
      notes: option.notes || "",
      isActive: option.isActive ?? true,
      displayOrder: option.displayOrder ?? index,
    })),
  };
}
function mergeLinkedOptions(options, links, idKey) {
  const output = [...options];
  links.forEach((link) => {
    if (!output.some((option) => option.id === link[idKey]))
      output.push({
        id: link[idKey],
        name: link.name || "Linked archived record",
        status: link.status,
      });
  });
  return output;
}
function isImageUrl(value) {
  if (!value) return false;
  if (value.startsWith("/uploads/")) return true;
  try {
    return ["http:", "https:"].includes(new URL(value).protocol);
  } catch {
    return false;
  }
}
function addGalleryImage() {
  form.galleryImages.push({
    mediaAssetId: null,
    imageUrl: "",
    resolvedUrl: "",
    altText: "",
    displayOrder: form.galleryImages.length,
    isPrimary: form.galleryImages.length === 0,
  });
}
function removeGalleryImage(index) {
  const wasPrimary = form.galleryImages[index]?.isPrimary;
  form.galleryImages.splice(index, 1);
  if (wasPrimary && form.galleryImages.length)
    form.galleryImages[0].isPrimary = true;
}
function setPrimaryImage(index) {
  form.galleryImages.forEach((image, imageIndex) => {
    image.isPrimary = imageIndex === index;
  });
}
function useUrlForImage(image) {
  image.mediaAssetId = null;
  image.imageUrl = image.resolvedUrl || "";
}
function selectMediaAsset(image, mediaAssetId) {
  image.mediaAssetId = mediaAssetId || null;
  if (!image.mediaAssetId) {
    image.imageUrl = image.imageUrl || image.resolvedUrl || "";
    return;
  }
  const media = mediaOptions.value.find(
    (option) => option.id === image.mediaAssetId,
  );
  image.imageUrl = "";
  image.resolvedUrl = media?.fileUrl || "";
  if (!image.altText) image.altText = media?.altText || media?.fileName || "";
}
function isActivitySelected(id) {
  return form.activityLinks.some((link) => link.activityId === id);
}
function toggleActivity(option, selected) {
  if (selected)
    form.activityLinks.push({
      activityId: option.id,
      displayOrder: form.activityLinks.length,
      name: option.name,
      status: option.status,
    });
  else
    form.activityLinks = form.activityLinks.filter(
      (link) => link.activityId !== option.id,
    );
}
function isPackageSelected(id) {
  return form.packageLinks.some((link) => link.packageId === id);
}
function togglePackage(option, selected) {
  if (selected)
    form.packageLinks.push({
      packageId: option.id,
      displayOrder: form.packageLinks.length,
      isPrimary: form.packageLinks.length === 0,
      name: option.name,
      status: option.status,
    });
  else {
    const removed = form.packageLinks.find(
      (link) => link.packageId === option.id,
    );
    form.packageLinks = form.packageLinks.filter(
      (link) => link.packageId !== option.id,
    );
    if (removed?.isPrimary && form.packageLinks.length)
      form.packageLinks[0].isPrimary = true;
  }
}
function setPrimaryPackage(id) {
  form.packageLinks.forEach((link) => {
    link.isPrimary = link.packageId === id;
  });
}
function linkForActivity(id) {
  return form.activityLinks.find((link) => link.activityId === id);
}
function linkForPackage(id) {
  return form.packageLinks.find((link) => link.packageId === id);
}
function addOvernightOption() {
  form.overnightOptions.push({
    optionType: "camping",
    name: "",
    description: "",
    capacityMin: "",
    capacityMax: "",
    rateAmount: "",
    currency: "PHP",
    rateUnit: "per_person_per_night",
    inclusionsText: "",
    notes: "",
    isActive: true,
    displayOrder: form.overnightOptions.length,
  });
}
function removeOvernightOption(index) {
  form.overnightOptions.splice(index, 1);
}
function lineItems(value) {
  return value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}
function nullableNumber(value) {
  return value === "" || value === null || value === undefined
    ? null
    : Number(value);
}
function validate() {
  submitted.value = true;
  return validationErrors.value.length === 0;
}
function getPayload() {
  return {
    details: Object.fromEntries(
      Object.entries(form.details).map(([key, value]) => [
        key,
        toNullable(value),
      ]),
    ),
    galleryImages: form.galleryImages.map((image, index) => ({
      mediaAssetId: image.mediaAssetId || null,
      imageUrl: image.mediaAssetId ? null : image.imageUrl.trim(),
      altText: toNullable(image.altText),
      displayOrder: Number(image.displayOrder ?? index),
      isPrimary: image.isPrimary,
    })),
    activityLinks: form.activityLinks.map((link, index) => ({
      activityId: link.activityId,
      displayOrder: Number(link.displayOrder ?? index),
    })),
    packageLinks: form.packageLinks.map((link, index) => ({
      packageId: link.packageId,
      displayOrder: Number(link.displayOrder ?? index),
      isPrimary: link.isPrimary,
    })),
    overnightOptions: form.overnightOptions.map((option, index) => ({
      optionType: option.optionType,
      name: option.name.trim(),
      description: toNullable(option.description),
      capacityMin: nullableNumber(option.capacityMin),
      capacityMax: nullableNumber(option.capacityMax),
      rateAmount: nullableNumber(option.rateAmount),
      currency: "PHP",
      rateUnit: option.rateUnit,
      inclusions: lineItems(option.inclusionsText),
      notes: toNullable(option.notes),
      isActive: option.isActive,
      displayOrder: Number(option.displayOrder ?? index),
    })),
  };
}
defineExpose({ getPayload, validate });
</script>

<template>
  <div class="experience-editor">
    <section>
      <div class="heading">
        <div>
          <h3>Rich detail content</h3>
          <p>
            Optional content appears in the destination or business detail
            panel.
          </p>
        </div>
      </div>
      <label
        ><span>Overview</span
        ><textarea v-model="form.details.overview" rows="4"></textarea>
      </label>
      <div class="grid">
        <label
          ><span>Opening hours</span
          ><textarea
            v-model="form.details.openingHoursText"
            rows="3"
          ></textarea></label
        ><label
          ><span>Admission information</span
          ><textarea
            v-model="form.details.admissionInformation"
            rows="3"
          ></textarea>
        </label>
      </div>
      <div class="grid">
        <label
          ><span>Best time to visit</span
          ><textarea
            v-model="form.details.bestTimeToVisit"
            rows="3"
          ></textarea></label
        ><label
          ><span>Accessibility notes</span
          ><textarea
            v-model="form.details.accessibilityNotes"
            rows="3"
          ></textarea>
        </label>
      </div>
      <div class="grid">
        <label
          ><span>How to visit</span
          ><textarea
            v-model="form.details.howToVisit"
            rows="4"
          ></textarea></label
        ><label
          ><span>How to book</span
          ><textarea v-model="form.details.howToBook" rows="4"></textarea>
        </label>
      </div>
    </section>

    <section>
      <div class="heading">
        <div>
          <h3>Gallery</h3>
          <p>
            Add ordered image URLs or select active assets from the managed
            media library.
          </p>
        </div>
        <button type="button" @click="addGalleryImage">Add image</button>
      </div>
      <p v-if="!form.galleryImages.length" class="empty">
        No gallery images. The public page will use its existing image fallback.
      </p>
      <article
        v-for="(image, index) in form.galleryImages"
        :key="index"
        class="repeat-row"
      >
        <label class="grow"
          ><span>Managed media (optional)</span
          ><select
            :value="image.mediaAssetId || ''"
            @change="selectMediaAsset(image, $event.target.value)"
          >
            <option value="">Use an image URL</option>
            <option
              v-for="media in mediaOptions"
              :key="media.id"
              :value="media.id"
            >
              {{ media.fileName || media.altText || media.fileUrl }}
            </option>
          </select></label
        >
        <label v-if="!image.mediaAssetId" class="grow"
          ><span>Image URL</span
          ><input
            v-model="image.imageUrl"
            type="url"
            placeholder="https://… or /uploads/…"
        /></label>
        <div v-else class="managed-media">
          <span>Selected media preview URL</span
          ><code>{{ image.resolvedUrl || image.mediaAssetId }}</code
          ><button type="button" @click="useUrlForImage(image)">
            Use URL instead
          </button>
        </div>
        <label class="grow"
          ><span>Alt text</span><input v-model="image.altText"
        /></label>
        <label class="order"
          ><span>Order</span
          ><input v-model.number="image.displayOrder" type="number"
        /></label>
        <label class="check"
          ><input
            :checked="image.isPrimary"
            type="radio"
            name="primary-gallery-image"
            @change="setPrimaryImage(index)"
          /><span>Primary</span></label
        >
        <button type="button" class="danger" @click="removeGalleryImage(index)">
          Remove
        </button>
      </article>
    </section>

    <section>
      <div class="heading">
        <div>
          <h3>Activities</h3>
          <p>Link tourism activities and control their display order.</p>
        </div>
      </div>
      <p v-if="!activityOptions.length" class="empty">
        No non-archived activities are available yet.
      </p>
      <div class="option-list">
        <label v-for="option in activityOptions" :key="option.id" class="option"
          ><input
            type="checkbox"
            :checked="isActivitySelected(option.id)"
            @change="toggleActivity(option, $event.target.checked)" /><span
            ><strong>{{ option.name }}</strong
            ><small>{{ option.status || "Status unavailable" }}</small></span
          ><input
            v-if="isActivitySelected(option.id)"
            v-model.number="linkForActivity(option.id).displayOrder"
            class="inline-order"
            type="number"
            aria-label="Activity display order"
        /></label>
      </div>
    </section>

    <section>
      <div class="heading">
        <div>
          <h3>Bookable packages</h3>
          <p>Link packages and select the default Book Now destination.</p>
        </div>
      </div>
      <p v-if="!packageOptions.length" class="empty">
        No non-archived packages are available yet.
      </p>
      <div class="option-list">
        <div v-for="option in packageOptions" :key="option.id" class="option">
          <input
            type="checkbox"
            :checked="isPackageSelected(option.id)"
            :aria-label="`Link ${option.name}`"
            @change="togglePackage(option, $event.target.checked)"
          /><span
            ><strong>{{ option.name }}</strong
            ><small>{{ option.status || "Status unavailable" }}</small></span
          ><template v-if="isPackageSelected(option.id)"
            ><input
              v-model.number="linkForPackage(option.id).displayOrder"
              class="inline-order"
              type="number"
              aria-label="Package display order"
            /><label class="primary-choice"
              ><input
                type="radio"
                name="primary-package"
                :checked="linkForPackage(option.id).isPrimary"
                @change="setPrimaryPackage(option.id)"
              /><span>Primary</span></label
            ></template
          >
        </div>
      </div>
    </section>

    <section>
      <div class="heading">
        <div>
          <h3>Overnight stays</h3>
          <p>
            Maintain the camping and tent-rental pricing matrix. Leave empty
            when overnight stays are unavailable.
          </p>
        </div>
        <button type="button" @click="addOvernightOption">Add option</button>
      </div>
      <p v-if="!form.overnightOptions.length" class="empty">
        No overnight options configured.
      </p>
      <article
        v-for="(option, index) in form.overnightOptions"
        :key="index"
        class="overnight"
      >
        <div class="heading">
          <strong>Option {{ index + 1 }}</strong
          ><button
            type="button"
            class="danger"
            @click="removeOvernightOption(index)"
          >
            Remove
          </button>
        </div>
        <div class="grid three">
          <label
            ><span>Type</span
            ><select v-model="option.optionType">
              <option value="camping">Camping</option>
              <option value="tent_rental">Tent rental</option>
              <option value="other">Other</option>
            </select></label
          ><label><span>Name</span><input v-model="option.name" /></label
          ><label
            ><span>Display order</span
            ><input v-model.number="option.displayOrder" type="number"
          /></label>
        </div>
        <label
          ><span>Description</span
          ><textarea v-model="option.description" rows="2"></textarea>
        </label>
        <div class="grid three">
          <label
            ><span>Minimum capacity</span
            ><input v-model="option.capacityMin" type="number" min="1" /></label
          ><label
            ><span>Maximum capacity</span
            ><input v-model="option.capacityMax" type="number" min="1" /></label
          ><label
            ><span>Rate (PHP, optional)</span
            ><input
              v-model="option.rateAmount"
              type="number"
              min="0"
              step="0.01"
          /></label>
        </div>
        <div class="grid">
          <label
            ><span>Billing unit</span
            ><select v-model="option.rateUnit">
              <option value="per_person_per_night">Per person / night</option>
              <option value="per_tent_per_night">Per tent / night</option>
              <option value="per_site_per_night">Per site / night</option>
              <option value="flat_rate">Flat rate</option>
            </select></label
          ><label class="check"
            ><input v-model="option.isActive" type="checkbox" /><span
              >Active option</span
            ></label
          >
        </div>
        <div class="grid">
          <label
            ><span>Inclusions</span
            ><textarea
              v-model="option.inclusionsText"
              rows="3"
              placeholder="One inclusion per line"
            ></textarea></label
          ><label
            ><span>Notes</span
            ><textarea v-model="option.notes" rows="3"></textarea>
          </label>
        </div>
      </article>
    </section>
    <div v-if="validationErrors.length" class="validation" role="alert">
      <strong>Review rich detail content:</strong>
      <ul>
        <li v-for="message in validationErrors" :key="message">
          {{ message }}
        </li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
.experience-editor {
  display: grid;
  grid-column: 1/-1;
  gap: 16px;
  min-width: 0;
}
.experience-editor section {
  display: grid;
  gap: 12px;
  min-width: 0;
  padding: 14px;
  border: 1px solid #dbeafe;
  border-radius: 9px;
  background: #f8fbff;
}
.heading {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}
.heading h3,
.heading p {
  margin: 0;
}
.heading p,
.empty {
  color: #64748b;
  font-size: 0.8rem;
  line-height: 1.4;
}
.grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}
.grid.three {
  grid-template-columns: repeat(3, minmax(0, 1fr));
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
.repeat-row {
  display: flex;
  flex-wrap: wrap;
  gap: 9px;
  align-items: end;
  padding: 10px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #fff;
}
.grow {
  flex: 1 1 220px;
}
.order {
  width: 85px;
}
.check,
.primary-choice {
  display: flex;
  align-items: center;
  gap: 6px;
  min-height: 36px;
}
.check input,
.primary-choice input,
.option > input {
  width: 16px;
  min-height: 16px;
}
.managed-media {
  display: grid;
  flex: 1 1 100%;
  gap: 5px;
  padding: 9px;
  border-radius: 7px;
  background: #f1f5f9;
}
.managed-media code {
  overflow-wrap: anywhere;
}
.option-list {
  display: grid;
  gap: 7px;
}
.option {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto auto;
  gap: 9px;
  align-items: center;
  padding: 9px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #fff;
}
.option strong,
.option small {
  display: block;
}
.option small {
  margin-top: 2px;
  color: #64748b;
}
.inline-order {
  width: 75px;
}
.overnight {
  display: grid;
  gap: 10px;
  padding: 12px;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  background: #fff;
}
.experience-editor button {
  min-height: 34px;
  padding: 0 11px;
  border: 1px solid #bae6fd;
  border-radius: 8px;
  color: #075985;
  background: #f0f9ff;
  font-weight: 800;
}
.experience-editor .danger {
  color: #b91c1c;
  border-color: #fecaca;
  background: #fff;
}
.validation {
  padding: 11px;
  color: #991b1b;
  border: 1px solid #fecaca;
  border-radius: 8px;
  background: #fef2f2;
}
.validation ul {
  margin: 6px 0 0;
  padding-left: 20px;
}
.empty {
  margin: 0;
  padding: 11px;
  border: 1px dashed #cbd5e1;
  border-radius: 8px;
  background: #fff;
}
@media (max-width: 700px) {
  .grid,
  .grid.three {
    grid-template-columns: 1fr;
  }
  .option {
    grid-template-columns: auto minmax(0, 1fr);
  }
  .inline-order,
  .primary-choice {
    grid-column: 2;
  }
  .inline-order {
    width: 100%;
  }
}
@media (max-width: 460px) {
  .repeat-row {
    align-items: stretch;
    flex-direction: column;
  }
  .grow,
  .order {
    width: 100%;
    flex-basis: auto;
  }
}
</style>
