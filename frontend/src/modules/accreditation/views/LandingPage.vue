<template>
  <div class="service-page">
    <PublicServiceHeader />

    <main>
      <section class="service-hero" aria-labelledby="service-title">
        <div class="service-hero__overlay">
          <div class="service-shell service-hero__content">
            <p class="service-kicker">Calabanga Camarines Sur</p>
            <h1 id="service-title">{{ serviceIdentity.serviceName }}</h1>
            <p class="service-lede">{{ serviceIdentity.description }}</p>
            <div class="service-actions">
              <RouterLink
                class="service-button service-button--primary"
                :to="{ name: 'accreditation-register', hash: '#business-type' }"
              >
                Apply for Accreditation
                <ArrowRight :size="17" aria-hidden="true" />
              </RouterLink>
              <RouterLink class="service-button service-button--ghost" to="/accreditation/login">Sign In</RouterLink>
            </div>
          </div>
        </div>
      </section>

      <section id="services" class="services-section" aria-labelledby="services-title">
        <div class="service-shell">
          <h2 id="services-title">Services</h2>
          <details class="service-dropdown">
            <summary>
              <div>
                <span>Tourism registration service</span>
                <h3>{{ serviceOverview.title }}</h3>
              </div>
              <ChevronDown class="service-dropdown__icon" :size="24" aria-hidden="true" />
            </summary>

            <div class="service-dropdown__content">
              <p class="service-intro">{{ certificateRegistrationDetails.purpose }}</p>

              <button class="service-more-link" type="button" @click="showServiceDetails = true">
                More details
                <FileText :size="17" aria-hidden="true" />
              </button>
            </div>
          </details>
        </div>
      </section>

      <section id="who-may-apply" class="requirements-section" aria-labelledby="who-may-apply-title">
        <div class="service-shell">
          <h2 id="who-may-apply-title">Who May Apply for Tourism Accreditation?</h2>

          <div class="requirement-accordion">
            <details class="service-dropdown requirement-row">
              <summary>
                <div>
                  <span>Tourism enterprises</span>
                  <h3>Primary Tourism Enterprises</h3>
                </div>
                <ChevronDown class="service-dropdown__icon" :size="24" aria-hidden="true" />
              </summary>
              <div class="service-dropdown__content">
                <p class="enterprise-description">
                  These are facilities and services directly related to tourism. Primary tourism
                  enterprises are periodically required to obtain DOT accreditation to ensure the
                  quality of their facilities and services.
                </p>

                <div class="enterprise-groups">
                  <section v-for="group in primaryEnterpriseGroups" :key="group.label" class="enterprise-group">
                    <h4>{{ group.label }}</h4>
                    <ul>
                      <li v-for="item in group.items" :key="item">
                        <CheckCircle2 :size="15" aria-hidden="true" />
                        <span>{{ item }}</span>
                      </li>
                    </ul>
                  </section>
                </div>
              </div>
            </details>
            <details class="service-dropdown requirement-row">
              <summary>
                <div>
                  <span>Tourism enterprises</span>
                  <h3>Secondary Tourism Enterprises</h3>
                </div>
                <ChevronDown class="service-dropdown__icon" :size="24" aria-hidden="true" />
              </summary>
              <div class="service-dropdown__content">
                <p class="enterprise-description">
                  These are facilities and services that may be related to tourism. Accreditation is
                  voluntary for secondary tourism enterprises that follow minimum DOT standards.
                </p>

                <div class="enterprise-groups">
                  <section v-for="group in secondaryEnterpriseGroups" :key="group.label" class="enterprise-group">
                    <h4>{{ group.label }}</h4>
                    <ul>
                      <li v-for="item in group.items" :key="item">
                        <CheckCircle2 :size="15" aria-hidden="true" />
                        <span>{{ item }}</span>
                      </li>
                    </ul>
                  </section>
                </div>
              </div>
            </details>
          </div>
        </div>
      </section>

      <section id="requirements" class="requirements-section" aria-labelledby="requirements-title">
        <div class="service-shell">
          <h2 id="requirements-title">Requirements</h2>

          <div class="requirement-accordion">
            <details class="service-dropdown requirement-row">
              <summary>
                <div>
                  <span>Documents</span>
                  <h3>Required documents</h3>
                </div>
                <ChevronDown class="service-dropdown__icon" :size="24" aria-hidden="true" />
              </summary>
              <div class="service-dropdown__content">
                <ul class="requirement-simple-list">
                  <li v-for="item in requiredDocuments" :key="item">{{ item }}</li>
                </ul>
              </div>
            </details>
          </div>
        </div>
      </section>

      <section id="process" class="content-section content-section--muted" aria-labelledby="process-title">
        <div class="service-shell">
          <div class="section-heading">
            <p class="question-label">Guide / Procedure</p>
            <h2 id="process-title">Simple guide to complete your application.</h2>
            <p>
              Follow these steps from account registration to certificate release.
            </p>
          </div>

          <ol class="process-timeline">
            <li
              v-for="(step, index) in processSteps"
              :key="step.title"
              :class="{ 'process-step--featured': index === 0 }"
            >
              <a
                v-if="index === 0"
                class="process-step__row process-step__row--link"
                href="#apply-for-accreditation"
                aria-label="Go to Apply for Accreditation"
              >
                <span class="step-number">{{ index + 1 }}</span>
                <div class="process-step__content">
                  <h3>{{ step.title }}</h3>
                  <p>{{ step.instruction }}</p>
                </div>
                <span class="process-step__cue">
                  Start here
                  <ChevronDown :size="17" aria-hidden="true" />
                </span>
              </a>
              <div v-else class="process-step__row">
                <span class="step-number">{{ index + 1 }}</span>
                <div class="process-step__content">
                  <h3>{{ step.title }}</h3>
                  <p>{{ step.instruction }}</p>
                </div>
              </div>
            </li>
          </ol>
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
            <RouterLink
              id="apply-for-accreditation"
              class="service-button service-button--primary"
              :to="{ name: 'accreditation-register', hash: '#business-type' }"
            >
              Apply for Accreditation
            </RouterLink>
          </div>
        </div>
      </section>
    </main>

    <PublicServiceFooter />

    <ServiceDetailsModal
      :open="showServiceDetails"
      :title="guideResource.title"
      :description="guideResource.description"
      :source="guideResource.href"
      :download-name="guideResource.downloadName"
      @close="showServiceDetails = false"
    />
  </div>
</template>

<script setup>
import { ref } from "vue";
import {
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  FileText,
} from "@lucide/vue";
import PublicServiceFooter from "@/modules/accreditation/components/PublicServiceFooter.vue";
import PublicServiceHeader from "@/modules/accreditation/components/PublicServiceHeader.vue";
import ServiceDetailsModal from "@/modules/accreditation/components/modals/ServiceDetailsModal.vue";
import {
  certificateRegistrationDetails,
  guideResource,
  processSteps,
  serviceIdentity,
  serviceOverview,
} from "@/modules/accreditation/data/publicServiceContent";

const showServiceDetails = ref(false);

const primaryEnterpriseGroups = [
  {
    label: "Accommodation Establishments",
    items: ["Hotel", "Resort", "Apartment Hotel", "Mabuhay Accommodation", "Homestay"],
  },
  {
    label: "Travel and Tour Services",
    items: ["Travel and Tour Agency", "Travel Agency", "Tour Operator", "Online Travel Agency"],
  },
  {
    label: "Tourist Transport Operators",
    items: [
      "Tourist Land Transport Operator",
      "Tourist Water Transport Operator",
      "Tourist Air Transport Operator",
      "Motorized Banca",
    ],
  },
  {
    label: "Meetings, Incentives, Conventions and Exhibitions (MICE)",
    items: ["MICE Organizer", "MICE Facility / Venue"],
  },
  {
    label: "Adventure / Sports and Ecotourism Facilities",
    items: ["Adventure / Sports and Ecotourism Facility"],
  },
  {
    label: "Tourism Frontliner",
    items: ["Tour Guide"],
  },
];

const secondaryEnterpriseGroups = [
  {
    label: "Tourism-related Enterprises",
    items: [
      "Restaurant",
      "Food / Local Cuisine",
      "Tourism Training Center",
      "Target Shooting Range",
      "Department Store / Shopping Mall / Tourist Shop / Specialty Shop",
      "Farm Tourism Camp",
      "Gallery / Museum",
      "Tourism Entertainment Complex",
      "Tourism Recreation Center",
      "Zoo",
      "Rest Area / Restroom",
      "Surfing Camp",
    ],
  },
  {
    label: "Health and Wellness Services",
    items: ["Ambulatory Clinic", "Spa", "Tertiary Hospital"],
  },
  {
    label: "Tourism Frontliner",
    items: ["Tourism Trainer", "Surfing Instructor"],
  },
];

const requiredDocuments = certificateRegistrationDetails.requirements;
</script>

<style scoped>
@import url("https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Plus+Jakarta+Sans:wght@500;600;700;800&display=swap");

.service-page {
  min-height: 100vh;
  background: #f2f0eb;
  color: #1a1a1a;
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
    linear-gradient(90deg, rgba(12, 43, 33, 0.88), rgba(12, 43, 33, 0.76) 58%, rgba(12, 43, 33, 0.62)),
    url("@/assets/accreditation-quipayo-church-banner.jpg") center / cover no-repeat;
  color: #ffffff;
}

.service-hero__overlay {
  min-height: 620px;
  display: flex;
  align-items: center;
  padding: 88px 0 118px;
}

.service-hero__content {
  max-width: none;
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
  color: #1b4332;
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
  color: #1b4332;
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
  border: 1.5px solid #1b4332;
  border-radius: 8px;
  color: #1b4332;
  background: #ffffff;
  font-size: 14px;
  font-weight: 800;
  text-decoration: none;
  cursor: pointer;
}

.service-button--primary {
  background: #1b4332;
  color: #ffffff;
}

.service-button--primary:hover {
  background: #14532d;
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
  color: #1b4332;
}

.service-hero .service-button--primary:hover {
  background: #e8f3ed;
}

.service-hero .service-button--secondary {
  border-color: rgba(255, 255, 255, 0.72);
  background: rgba(255, 255, 255, 0.12);
  color: #ffffff;
}

.services-section,
.requirements-section {
  background: #ffffff;
  color: #1b4332;
}

.services-section {
  padding: 68px 0 32px;
}

.requirements-section {
  padding: 24px 0 72px;
}

.services-section .service-shell,
.requirements-section .service-shell {
  width: min(100% - 48px, 1200px);
}

.services-section h2,
.requirements-section h2 {
  margin: 0 0 30px;
  padding-bottom: 15px;
  border-bottom: 1px solid #d9e1dc;
  color: #1b4332;
  font-family: "Plus Jakarta Sans", system-ui, sans-serif;
  font-size: clamp(30px, 3.2vw, 38px);
  font-weight: 600;
  line-height: 1.1;
}

.service-dropdown {
  border-block: 1px solid #d9e1dc;
  background: transparent;
}

.service-dropdown summary {
  min-height: 78px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  padding: 15px 0 16px;
  color: #1b4332;
  cursor: pointer;
  list-style: none;
}

.service-dropdown summary::-webkit-details-marker {
  display: none;
}

.service-dropdown summary span {
  display: block;
  margin-bottom: 6px;
  color: #49665b;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.service-dropdown summary h3 {
  margin: 0;
  color: #1b4332;
  font-family: "Plus Jakarta Sans", system-ui, sans-serif;
  font-size: clamp(18px, 2vw, 21px);
  font-weight: 600;
  line-height: 1.3;
}

.service-dropdown__icon {
  flex: 0 0 auto;
  color: #1b4332;
  transition: transform 160ms ease;
}

.service-dropdown[open] .service-dropdown__icon {
  transform: rotate(180deg);
}

.service-dropdown__content {
  display: grid;
  gap: 24px;
  padding: 4px 0 28px;
  border-top: 1px solid #d9e1dc;
}

.service-dropdown__content p {
  color: #344d44;
  font-size: 16px;
  line-height: 1.6;
}

.service-dropdown__content p {
  max-width: 1120px;
  margin: 0;
}

.service-intro {
  padding-top: 18px;
}

.service-more-link {
  min-height: 42px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  justify-self: start;
  gap: 8px;
  padding: 8px 16px;
  border: 1px solid #1b4332;
  border-radius: 8px;
  background: #ffffff;
  color: #1b4332;
  font-family: inherit;
  font-size: 13px;
  font-weight: 700;
  text-decoration: none;
  cursor: pointer;
}

.service-more-link:hover {
  background: #e8f3ed;
}

.requirement-accordion .requirement-row + .requirement-row {
  border-top: 0;
}

.requirement-simple-list {
  display: grid;
  gap: 10px;
  margin: 0;
  padding-left: 20px;
  color: #344d44;
  font-size: 16px;
  line-height: 1.6;
}

.enterprise-description {
  max-width: 860px;
}

.enterprise-groups {
  max-width: 900px;
  display: grid;
  gap: 26px;
}

.enterprise-group {
  display: grid;
  gap: 12px;
}

.enterprise-group h4 {
  margin: 0;
  color: #49665b;
  font-family: "Plus Jakarta Sans", system-ui, sans-serif;
  font-size: 15px;
  font-weight: 500;
}

.enterprise-group ul {
  display: grid;
  gap: 11px;
  margin: 0;
  padding: 0 0 0 38px;
  list-style: none;
}

.enterprise-group li {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  color: #1a1a1a;
  font-size: 14px;
  line-height: 1.45;
}

.enterprise-group svg {
  flex: 0 0 auto;
  margin-top: 2px;
  color: #1b4332;
}

.section-heading p,
.process-timeline p,
.process-timeline dd,
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

.split-layout {
  display: grid;
  grid-template-columns: minmax(260px, 0.72fr) minmax(0, 1.28fr);
  gap: 46px;
}

.split-layout > * {
  min-width: 0;
}

dt {
  color: #1b4332;
  font-size: 12px;
  font-weight: 800;
  text-transform: uppercase;
}

dd {
  margin: 0;
}

.process-timeline {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 0;
  margin: 0;
  padding: 0;
  border-top: 1px solid #d9e1dc;
  list-style: none;
}

.process-timeline li {
  min-width: 0;
  border-bottom: 1px solid #d9e1dc;
}

.process-step__row {
  display: grid;
  grid-template-columns: 36px minmax(0, 1fr) auto;
  align-items: center;
  gap: 18px;
  padding: 20px 0;
}

.process-step__row--link {
  margin: 8px 0;
  padding: 18px 16px;
  border-left: 3px solid #1b4332;
  background: #edf5f1;
  color: inherit;
  text-decoration: none;
  transition:
    background-color 160ms ease,
    box-shadow 160ms ease;
}

.process-step__row--link:hover,
.process-step__row--link:focus-visible {
  background: #e3f0e9;
  box-shadow: inset 0 0 0 1px #b8cec3;
}

.process-step__row--link:focus-visible {
  outline: 2px solid #1b4332;
  outline-offset: 2px;
}

.step-number {
  width: 32px;
  height: 32px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: #e7f2ed;
  color: #1b4332;
  font-size: 12px;
  font-weight: 800;
}

.process-timeline p {
  margin: 6px 0 0;
  color: #4d625a;
  font-size: 14px;
}

.process-step__cue {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: #1b4332;
  font-size: 13px;
  font-weight: 800;
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

#apply-for-accreditation {
  scroll-margin-top: 96px;
}

@media (max-width: 1080px) {
  .split-layout {
    grid-template-columns: minmax(0, 1fr);
  }
}

@media (max-width: 820px) {
  .service-shell,
  .services-section .service-shell,
  .requirements-section .service-shell {
    width: min(100% - 32px, 1200px);
  }

  .service-hero,
  .service-hero__overlay {
    min-height: 560px;
  }

  .service-hero__overlay {
    padding: 72px 0 104px;
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
  .start-section {
    padding: 54px 0;
  }

  .services-section {
    padding: 54px 0 26px;
  }

  .requirements-section {
    padding: 20px 0 54px;
  }

  .service-actions,
  .service-actions .service-button {
    width: 100%;
  }

  .process-step__row {
    grid-template-columns: 36px minmax(0, 1fr);
    align-items: start;
  }

  .process-step__cue {
    grid-column: 2;
    margin-top: 4px;
  }
}
</style>
