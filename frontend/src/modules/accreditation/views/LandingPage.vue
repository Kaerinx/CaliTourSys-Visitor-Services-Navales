<template>
  <div class="service-page">
    <PublicServiceHeader />

    <main>
      <section class="service-hero" aria-labelledby="service-title">
        <div class="service-hero__overlay">
          <div class="service-shell service-hero__content">
            <p class="service-kicker">Business Accreditation</p>
            <h1 id="service-title">{{ serviceIdentity.serviceName }}</h1>
            <p class="service-lede">{{ serviceIdentity.description }}</p>
            <div class="service-actions">
              <RouterLink class="service-button service-button--primary" to="/accreditation/register">
                Apply for Accreditation
                <ArrowRight :size="17" aria-hidden="true" />
              </RouterLink>
              <a class="service-button service-button--secondary" href="#requirements">View Requirements</a>
              <a class="service-button service-button--secondary" href="#process">Check Application Process</a>
              <RouterLink class="service-button service-button--ghost" to="/accreditation/login">Sign In</RouterLink>
            </div>
          </div>
        </div>
      </section>

      <section id="services" class="services-section" aria-labelledby="services-title">
        <div class="service-shell">
          <h2 id="services-title">Services</h2>
          <article class="simple-service-card">
            <h3>{{ serviceOverview.title }}</h3>
            <div class="simple-service-card__body">
              <p>
                The Tourism Certificate of Registration / Endorsement for Accreditation is issued
                to tourism-related establishments in Calabanga that submit the minimum requirements
                and pay the corresponding registration fee, when applicable.
              </p>
              <p>
                The certificate contains basic information about the tourism establishment and
                confirms that the application was registered with the Municipality of Calabanga
                Tourism Office for review, updates, and certificate release coordination.
              </p>
              <a href="#requirements">More details</a>
            </div>
          </article>
        </div>
      </section>

      <section id="business-types" class="content-section content-section--muted" aria-labelledby="business-types-title">
        <div class="service-shell">
          <div class="section-heading">
            <p class="question-label">Business type selection</p>
            <h2 id="business-types-title">Registration starts by identifying how the business is organized.</h2>
            <p>
              The selected structure determines owner, partner, or representative fields, required
              authority documents, validation rules, and the application sections shown later.
            </p>
          </div>

          <div class="business-type-grid">
            <article
              v-for="type in businessLegalTypes"
              :key="type.value"
              :class="{ selected: selectedLegalType === type.value }"
            >
              <button type="button" @click="selectedLegalType = type.value">
                <Building2 :size="21" aria-hidden="true" />
                <span>{{ type.title }}</span>
              </button>
              <p>{{ type.summary }}</p>
              <ul>
                <li v-for="field in type.fields" :key="field">{{ field }}</li>
              </ul>
            </article>
          </div>

          <aside class="selection-result" aria-live="polite">
            <strong>{{ selectedLegalProfile.title }} validation</strong>
            <p>{{ selectedLegalProfile.validation }}</p>
          </aside>
        </div>
      </section>

      <section id="requirements" class="content-section" aria-labelledby="requirements-title">
        <div class="service-shell">
          <div class="requirements-layout">
            <div class="section-heading">
              <p class="question-label">Requirements</p>
              <h2 id="requirements-title">Filter requirements before you apply.</h2>
              <p>
                Applicants should not have to scan one long document. This preview groups common
                requirements and adds category-specific documents based on the selected tourism business type.
              </p>
            </div>

            <form class="requirement-filter" aria-label="Requirement filter controls">
              <div class="filter-heading">
                <Filter :size="20" aria-hidden="true" />
                <strong>Requirement filters</strong>
              </div>
              <label>
                Business structure
                <select v-model="selectedLegalType">
                  <option v-for="type in businessLegalTypes" :key="type.value" :value="type.value">
                    {{ type.title }}
                  </option>
                </select>
              </label>
              <label>
                Business category or industry
                <select v-model="selectedCategory">
                  <optgroup v-for="group in businessTypeGroups" :key="group.label" :label="group.label">
                    <option v-for="type in group.options" :key="type" :value="type">{{ type }}</option>
                  </optgroup>
                </select>
              </label>
              <label>
                Application type
                <select v-model="selectedApplicationType">
                  <option v-for="type in applicationTypes" :key="type" :value="type">{{ type }}</option>
                </select>
              </label>
            </form>
          </div>

          <div class="requirement-results">
            <article class="document-panel">
              <div class="panel-heading">
                <FileText :size="22" aria-hidden="true" />
                <div>
                  <span>Required documents</span>
                  <h3>{{ selectedCategory }} - {{ selectedApplicationType }}</h3>
                </div>
              </div>
              <ul class="document-list">
                <li v-for="document in categoryDocuments" :key="document">
                  <CheckCircle2 :size="17" aria-hidden="true" />
                  <span>{{ document }}</span>
                  <small>PDF, JPG, or PNG e-copy</small>
                </li>
              </ul>
            </article>

            <div class="requirement-groups">
              <details v-for="group in requirementProfiles" :key="group.label" open>
                <summary>{{ group.label }}</summary>
                <div class="requirement-group__items">
                  <article v-for="item in group.items" :key="item.name">
                    <strong>{{ item.name }}</strong>
                    <span>{{ item.format }} | {{ item.copy }}</span>
                    <p>{{ item.note }}</p>
                  </article>
                </div>
              </details>
            </div>
          </div>
        </div>
      </section>

      <section id="process" class="content-section content-section--muted" aria-labelledby="process-title">
        <div class="service-shell">
          <div class="section-heading">
            <p class="question-label">Guide / Procedure</p>
            <h2 id="process-title">A step-by-step process with clear applicant and officer actions.</h2>
            <p>
              Each step shows what the applicant does, what the system or officer does next, and
              the possible status applicants should expect to see.
            </p>
          </div>

          <ol class="process-timeline">
            <li v-for="(step, index) in processSteps" :key="step.title">
              <span class="step-number">{{ index + 1 }}</span>
              <div>
                <h3>{{ step.title }}</h3>
                <p>{{ step.instruction }}</p>
                <dl>
                  <div>
                    <dt>Applicant action</dt>
                    <dd>{{ step.applicantAction }}</dd>
                  </div>
                  <div>
                    <dt>System / officer action</dt>
                    <dd>{{ step.officerAction }}</dd>
                  </div>
                </dl>
                <span class="status-chip">{{ step.status }}</span>
              </div>
            </li>
          </ol>
        </div>
      </section>

      <section id="account-flow" class="content-section" aria-labelledby="account-flow-title">
        <div class="service-shell account-layout">
          <div class="section-heading">
            <p class="question-label">Account creation flow</p>
            <h2 id="account-flow-title">Applicants know access activates after verification.</h2>
            <p>
              The registration flow explains that the account is not immediately active. Business
              verification happens first, then email verification unlocks sign-in access.
            </p>
            <RouterLink class="service-button service-button--primary" to="/accreditation/register">
              Create Applicant Account
            </RouterLink>
          </div>

          <ol class="account-flow-list">
            <li v-for="(item, index) in accountCreationFlow" :key="item">
              <span>{{ index + 1 }}</span>
              <p>{{ item }}</p>
            </li>
          </ol>
        </div>
      </section>

      <section class="content-section content-section--muted" aria-labelledby="status-title">
        <div class="service-shell status-layout">
          <div>
            <div class="section-heading section-heading--compact">
              <p class="question-label">Applicant statuses</p>
              <h2 id="status-title">Plain-language labels for every application state.</h2>
            </div>
            <div class="status-grid">
              <span v-for="status in applicantStatuses" :key="status" class="status-chip">{{ status }}</span>
            </div>
          </div>

          <div>
            <div class="section-heading section-heading--compact">
              <p class="question-label">Notifications</p>
              <h2>Moments when applicants should be notified.</h2>
            </div>
            <ul class="notification-list">
              <li v-for="point in notificationPoints" :key="point">
                <Bell :size="18" aria-hidden="true" />
                {{ point }}
              </li>
            </ul>
          </div>
        </div>
      </section>

      <section class="start-section" aria-labelledby="start-title">
        <div class="service-shell start-section__layout">
          <div>
            <p class="question-label">Ready to begin?</p>
            <h2 id="start-title">Create an account, wait for business verification, then complete your application.</h2>
            <p>
              Returning applicants can sign in to continue a draft, upload documents, respond to
              corrections, or track certificate release.
            </p>
          </div>
          <div class="service-actions">
            <RouterLink class="service-button service-button--primary" to="/accreditation/register">Apply for Accreditation</RouterLink>
            <RouterLink class="service-button service-button--secondary" to="/accreditation/login">Sign In</RouterLink>
          </div>
        </div>
      </section>
    </main>

    <PublicServiceFooter />
  </div>
</template>

<script setup>
import { computed, ref } from "vue";
import {
  ArrowRight,
  Bell,
  Building2,
  CheckCircle2,
  FileText,
  Filter,
} from "@lucide/vue";
import PublicServiceFooter from "@/modules/accreditation/components/PublicServiceFooter.vue";
import PublicServiceHeader from "@/modules/accreditation/components/PublicServiceHeader.vue";
import {
  businessTypeGroups,
  getRequiredDocumentsForBusinessType,
} from "@/modules/accreditation/data/mockData";
import {
  accountCreationFlow,
  applicantStatuses,
  applicationTypes,
  businessLegalTypes,
  notificationPoints,
  processSteps,
  requirementProfiles,
  serviceIdentity,
  serviceOverview,
} from "@/modules/accreditation/data/publicServiceContent";

const selectedLegalType = ref(businessLegalTypes[0].value);
const selectedCategory = ref("Resort");
const selectedApplicationType = ref(applicationTypes[0]);

const selectedLegalProfile = computed(
  () => businessLegalTypes.find((type) => type.value === selectedLegalType.value) || businessLegalTypes[0],
);

const categoryDocuments = computed(() => {
  const documents = getRequiredDocumentsForBusinessType(selectedCategory.value);
  if (selectedApplicationType.value === "Renewal") {
    return [...documents, "Previous certificate or endorsement"];
  }
  return documents;
});
</script>

<style scoped>
@import url("https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Plus+Jakarta+Sans:wght@500;600;700;800&display=swap");

.service-page {
  min-height: 100vh;
  background: #f6f8f5;
  color: #17231e;
  font-family: Inter, system-ui, sans-serif;
  line-height: 1.6;
}

.service-page,
.service-page *,
.service-page *::before,
.service-page *::after {
  box-sizing: border-box;
}

.service-page :focus-visible {
  outline: 3px solid #c58b18;
  outline-offset: 3px;
}

.service-shell {
  width: min(100% - 48px, 1200px);
  margin: 0 auto;
}

.service-hero {
  min-height: 620px;
  background:
    linear-gradient(90deg, rgba(12, 43, 33, 0.92), rgba(12, 43, 33, 0.68) 58%, rgba(12, 43, 33, 0.28)),
    url("@/assets/hero-banner.jpg") center / cover no-repeat;
  color: #ffffff;
}

.service-hero__overlay {
  min-height: 620px;
  display: flex;
  align-items: center;
  padding: 88px 0 118px;
}

.service-hero__content {
  max-width: 790px;
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
  font-family: "Plus Jakarta Sans", system-ui, sans-serif;
  line-height: 1.15;
  letter-spacing: 0;
}

h1 {
  max-width: 760px;
  margin-bottom: 20px;
  color: #ffffff;
  font-size: clamp(42px, 6vw, 68px);
  font-weight: 800;
}

h2 {
  margin-bottom: 14px;
  font-size: clamp(27px, 4vw, 40px);
  font-weight: 700;
}

h3 {
  margin-bottom: 8px;
  font-size: 18px;
}

.service-kicker,
.question-label,
.summary-eyebrow {
  margin: 0 0 12px;
  color: #176249;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.service-kicker {
  color: rgba(255, 255, 255, 0.82);
}

.service-lede {
  max-width: 720px;
  margin-bottom: 0;
  color: rgba(255, 255, 255, 0.86);
  font-size: 19px;
}

.service-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 28px;
}

.service-button {
  min-height: 46px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 18px;
  border: 1.5px solid #176249;
  border-radius: 8px;
  color: #176249;
  background: #ffffff;
  font-size: 14px;
  font-weight: 800;
  text-decoration: none;
  cursor: pointer;
}

.service-button--primary {
  background: #176249;
  color: #ffffff;
}

.service-button--primary:hover {
  background: #104c38;
}

.service-button--secondary:hover {
  background: #e8f3ed;
}

.service-button--ghost {
  border-color: rgba(255, 255, 255, 0.72);
  background: transparent;
  color: #ffffff;
}

.service-button--ghost:hover {
  border-color: #ffffff;
  background: rgba(255, 255, 255, 0.12);
}

.service-hero .service-button--primary {
  border-color: #ffffff;
  background: #ffffff;
  color: #174d3d;
}

.service-hero .service-button--primary:hover {
  background: #e8f3ed;
}

.service-hero .service-button--secondary {
  border-color: rgba(255, 255, 255, 0.72);
  background: rgba(255, 255, 255, 0.12);
  color: #ffffff;
}

.services-section {
  padding: 68px 0 74px;
  background: #222424;
  color: #e9ddc9;
}

.services-section h2 {
  margin: 0 0 34px;
  padding-bottom: 14px;
  border-bottom: 2px solid rgba(233, 221, 201, 0.45);
  color: #e9ddc9;
  font-size: clamp(36px, 5vw, 50px);
  font-weight: 800;
  text-transform: uppercase;
}

.simple-service-card {
  border: 1px solid rgba(233, 221, 201, 0.2);
  background: #232525;
}

.simple-service-card h3 {
  margin: 0;
  padding: 13px 16px;
  background: #284f63;
  color: #ffffff;
  font-size: 19px;
  font-weight: 700;
  line-height: 1.6;
  text-transform: uppercase;
}

.simple-service-card__body {
  padding: 17px 18px 24px;
}

.simple-service-card__body p {
  max-width: 1120px;
  margin: 0 0 18px;
  color: #e9ddc9;
  font-size: 17px;
  line-height: 1.55;
}

.simple-service-card__body a {
  color: #e9ddc9;
  font-size: 17px;
  font-weight: 700;
  text-decoration: none;
}

.simple-service-card__body a:hover {
  text-decoration: underline;
  text-underline-offset: 4px;
}

.section-heading p,
.business-type-grid p,
.selection-result p,
.document-list small,
.requirement-group__items p,
.process-timeline p,
.process-timeline dd,
.account-flow-list p,
.notification-list,
.start-section p {
  color: #52665e;
  font-size: 14px;
}

.content-section,
.start-section {
  padding: 76px 0;
}

.content-section--muted {
  border-block: 1px solid #d9e1dc;
  background: #ffffff;
}

.section-heading {
  max-width: 720px;
  margin-bottom: 34px;
}

.section-heading--compact {
  margin-bottom: 24px;
}

.split-layout,
.requirements-layout,
.account-layout,
.status-layout {
  display: grid;
  grid-template-columns: minmax(260px, 0.72fr) minmax(0, 1.28fr);
  gap: 46px;
}

.split-layout > *,
.requirements-layout > *,
.account-layout > *,
.status-layout > * {
  min-width: 0;
}

.requirement-filter,
.document-panel {
  padding: 26px;
  border: 1px solid #d9e1dc;
  border-radius: 8px;
  background: #ffffff;
}

dt {
  color: #173f32;
  font-size: 12px;
  font-weight: 800;
  text-transform: uppercase;
}

dd {
  margin: 0;
}

.business-type-grid,
.status-grid {
  display: grid;
  gap: 14px;
}

.business-type-grid article,
.requirement-group__items article {
  min-width: 0;
  padding: 20px;
  border: 1px solid #d9e1dc;
  border-radius: 8px;
  background: #ffffff;
}

.business-type-grid {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.business-type-grid article.selected {
  border-color: #176249;
  box-shadow: inset 0 0 0 2px rgba(23, 98, 73, 0.18);
}

.business-type-grid button {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 0;
  border: 0;
  background: transparent;
  color: #173f32;
  font: inherit;
  font-size: 17px;
  font-weight: 800;
  text-align: left;
  cursor: pointer;
}

.business-type-grid button svg {
  color: #176249;
}

.business-type-grid p {
  margin: 14px 0;
}

.business-type-grid ul {
  display: grid;
  gap: 8px;
  margin: 0;
  padding-left: 18px;
  color: #344d44;
  font-size: 13px;
}

.selection-result {
  margin-top: 18px;
  padding: 18px 20px;
  border-left: 4px solid #b27a12;
  background: #fff8e8;
}

.selection-result strong {
  color: #5b3d06;
}

.selection-result p {
  margin: 5px 0 0;
}

.requirement-filter {
  align-self: start;
  display: grid;
  gap: 16px;
}

.filter-heading,
.panel-heading {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #173f32;
}

.requirement-filter label {
  display: grid;
  gap: 7px;
  color: #294c40;
  font-size: 13px;
  font-weight: 800;
}

.requirement-filter select {
  width: 100%;
  min-height: 44px;
  padding: 9px 11px;
  border: 1px solid #b9c9c1;
  border-radius: 5px;
  background: #ffffff;
  color: #17231e;
  font: inherit;
}

.requirement-results {
  display: grid;
  grid-template-columns: minmax(0, 0.92fr) minmax(0, 1.08fr);
  gap: 20px;
}

.panel-heading span {
  color: #52665e;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.panel-heading h3 {
  margin: 2px 0 0;
}

.document-list {
  display: grid;
  gap: 12px;
  margin: 22px 0 0;
  padding: 0;
  list-style: none;
}

.document-list li {
  display: grid;
  grid-template-columns: 18px minmax(0, 1fr);
  gap: 8px 10px;
  padding: 12px 0;
  border-top: 1px solid #e3e9e5;
}

.document-list svg {
  margin-top: 3px;
  color: #176249;
}

.document-list small {
  grid-column: 2;
}

.requirement-groups {
  display: grid;
  gap: 12px;
}

.requirement-groups details {
  border: 1px solid #d9e1dc;
  border-radius: 8px;
  background: #ffffff;
}

.requirement-groups summary {
  padding: 16px 18px;
  color: #173f32;
  font-weight: 800;
  cursor: pointer;
}

.requirement-group__items {
  display: grid;
  gap: 10px;
  padding: 0 18px 18px;
}

.requirement-group__items article {
  padding: 14px;
  background: #f8faf7;
}

.requirement-group__items strong,
.requirement-group__items span {
  display: block;
}

.requirement-group__items span {
  margin-top: 4px;
  color: #176249;
  font-size: 12px;
  font-weight: 800;
}

.requirement-group__items p {
  margin: 7px 0 0;
}

.process-timeline {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.process-timeline li {
  min-width: 0;
  display: grid;
  grid-template-columns: 36px minmax(0, 1fr);
  gap: 14px;
  padding: 20px;
  border: 1px solid #d9e1dc;
  border-radius: 8px;
  background: #ffffff;
}

.step-number,
.account-flow-list span {
  width: 32px;
  height: 32px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: #e7f2ed;
  color: #176249;
  font-size: 12px;
  font-weight: 800;
}

.process-timeline p {
  margin-bottom: 14px;
}

.process-timeline dl {
  display: grid;
  gap: 10px;
  margin: 0 0 14px;
}

.status-chip {
  display: inline-flex;
  align-items: center;
  min-height: 30px;
  padding: 5px 10px;
  border: 1px solid #b9c9c1;
  border-radius: 999px;
  background: #f8faf7;
  color: #294c40;
  font-size: 12px;
  font-weight: 800;
}

.account-layout .service-button {
  margin-top: 10px;
}

.account-flow-list {
  display: grid;
  gap: 12px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.account-flow-list li {
  display: grid;
  grid-template-columns: 34px minmax(0, 1fr);
  gap: 12px;
  padding: 16px 0;
  border-bottom: 1px solid #d9e1dc;
}

.account-flow-list p {
  margin: 3px 0 0;
}

.status-layout {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.status-grid {
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
}

.notification-list {
  display: grid;
  gap: 12px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.notification-list li {
  display: grid;
  grid-template-columns: 20px minmax(0, 1fr);
  gap: 10px;
  padding: 14px;
  border: 1px solid #d9e1dc;
  border-radius: 8px;
  background: #ffffff;
}

.notification-list svg {
  margin-top: 2px;
  color: #b27a12;
}

.start-section {
  border-top: 1px solid #d9e1dc;
  background: #ffffff;
}

.start-section__layout {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 48px;
}

.start-section__layout > div:first-child {
  max-width: 740px;
}

.start-section .service-actions {
  flex: 0 0 auto;
  margin-top: 0;
}

@media (max-width: 1080px) {
  .process-timeline {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .split-layout,
  .requirements-layout,
  .account-layout,
  .status-layout,
  .requirement-results {
    grid-template-columns: minmax(0, 1fr);
  }
}

@media (max-width: 820px) {
  .service-shell {
    width: min(100% - 32px, 1200px);
  }

  .service-hero,
  .service-hero__overlay {
    min-height: 560px;
  }

  .service-hero__overlay {
    padding: 72px 0 104px;
  }

  .business-type-grid,
  .process-timeline {
    grid-template-columns: minmax(0, 1fr);
  }

  .start-section__layout {
    align-items: flex-start;
    flex-direction: column;
  }
}

@media (max-width: 640px) {
  h1 {
    font-size: 42px;
  }

  .content-section,
  .services-section,
  .start-section {
    padding: 54px 0;
  }

  .simple-service-card h3 {
    font-size: 16px;
  }

  .simple-service-card__body p,
  .simple-service-card__body a {
    font-size: 15px;
  }

  .service-actions,
  .service-actions .service-button {
    width: 100%;
  }
}
</style>
