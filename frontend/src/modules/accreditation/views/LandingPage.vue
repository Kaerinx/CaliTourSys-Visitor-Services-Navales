<template>
  <div class="service-page">
    <PublicServiceHeader />

    <main>
      <section class="service-hero" aria-labelledby="service-title">
        <div class="service-shell service-hero__layout">
          <div>
            <p class="service-kicker">Official online service</p>
            <h1 id="service-title">{{ serviceIdentity.serviceName }}</h1>
            <p class="service-lede">{{ serviceIdentity.description }}</p>
            <p class="service-audience">
              For tourism business owners and authorized representatives operating in Calabanga.
            </p>
            <div class="service-actions">
              <a class="service-button service-button--primary" href="#eligibility-check">
                Check if your business can apply
                <ArrowRight :size="17" aria-hidden="true" />
              </a>
              <RouterLink class="service-button service-button--secondary" to="/accreditation/login">
                Sign in to an existing account
              </RouterLink>
            </div>
          </div>

        </div>
      </section>

      <section class="service-facts" aria-labelledby="facts-title">
        <div class="service-shell">
          <div class="section-heading section-heading--compact">
            <p class="question-label">What is this?</p>
            <h2 id="facts-title">A municipal service for tourism business accreditation.</h2>
            <p>
              The {{ serviceIdentity.office }} receives and reviews online accreditation and renewal
              requests. Your application is not approved until the office completes its review.
            </p>
          </div>

          <div class="service-facts__grid">
            <article v-for="detail in serviceDetails" :key="detail.label">
              <span>{{ detail.label }}</span>
              <strong>{{ detail.value }}</strong>
              <p>{{ detail.note }}</p>
              <small>LGU confirmation required</small>
            </article>
          </div>
        </div>
      </section>

      <section class="content-section" aria-labelledby="capabilities-title">
        <div class="service-shell split-layout">
          <div class="section-heading">
            <p class="question-label">What can I do here?</p>
            <h2 id="capabilities-title">Manage your accreditation request online.</h2>
            <p>
              This service supports new applications and renewals from account creation through the
              Tourism Office decision.
            </p>
          </div>

          <div class="service-list">
            <article v-for="(capability, index) in serviceCapabilities" :key="capability.title">
              <span>{{ String(index + 1).padStart(2, "0") }}</span>
              <div>
                <h3>{{ capability.title }}</h3>
                <p>{{ capability.description }}</p>
              </div>
            </article>
          </div>
        </div>
      </section>

      <section class="content-section content-section--muted" aria-labelledby="requirements-title">
        <div class="service-shell">
          <div class="section-heading">
            <p class="question-label">What do I need?</p>
            <h2 id="requirements-title">Prepare your information before starting.</h2>
            <p>
              Providing complete and readable information helps the Tourism Office review your
              request. Additional documents may be requested during review.
            </p>
          </div>

          <div class="requirements-grid">
            <article class="requirements-panel">
              <div class="panel-heading">
                <Info :size="22" aria-hidden="true" />
                <div>
                  <span>Required information</span>
                  <h3>Business and applicant details</h3>
                </div>
              </div>
              <ul>
                <li v-for="item in requiredBusinessInformation" :key="item">
                  <CheckCircle2 :size="17" aria-hidden="true" />
                  {{ item }}
                </li>
              </ul>
            </article>

            <article class="requirements-panel">
              <div class="panel-heading">
                <FileText :size="22" aria-hidden="true" />
                <div>
                  <span>Required uploads</span>
                  <h3>Common business documents</h3>
                </div>
              </div>
              <ul>
                <li v-for="document in commonPermitDocuments" :key="document">
                  <CheckCircle2 :size="17" aria-hidden="true" />
                  {{ document }}
                </li>
              </ul>
              <p class="panel-note">Additional permit uploads are shown in the application form after you select your business type.</p>
              <p class="panel-note">Accepted uploads: PDF, JPG, or PNG, up to 10MB per file.</p>
            </article>
          </div>
        </div>
      </section>

      <section class="content-section" aria-labelledby="process-title">
        <div class="service-shell">
          <div class="section-heading">
            <p class="question-label">How does the process work?</p>
            <h2 id="process-title">Five steps from preparation to decision.</h2>
            <p>
              Processing time depends on the completeness of your application and the Tourism
              Office review. Sign in regularly to check for updates.
            </p>
          </div>

          <ol class="process-list">
            <li v-for="(step, index) in processSteps" :key="step.title">
              <span>{{ index + 1 }}</span>
              <div>
                <h3>{{ step.title }}</h3>
                <p>{{ step.description }}</p>
              </div>
            </li>
          </ol>
        </div>
      </section>

      <section id="eligibility-check" class="content-section eligibility-section" aria-labelledby="eligibility-title">
        <div class="service-shell">
          <div class="section-heading">
            <p class="question-label">Can my business apply?</p>
            <h2 id="eligibility-title">Complete this advisory eligibility check.</h2>
            <p>
              This check helps you prepare. It does not approve, reject, or prevent an application.
              The Tourism Office makes the final eligibility decision.
            </p>
          </div>

          <div class="eligibility-layout">
            <form class="eligibility-form" @submit.prevent="evaluateEligibility">
              <fieldset v-for="(question, index) in eligibilityQuestions" :key="question.id">
                <legend>
                  <span>{{ index + 1 }}</span>
                  {{ question.label }}
                </legend>
                <p>{{ question.help }}</p>
                <div class="answer-options">
                  <label>
                    <input
                      v-model="answers[question.id]"
                      type="radio"
                      :name="question.id"
                      :value="true"
                      @change="resultShown = false"
                    />
                    Yes
                  </label>
                  <label>
                    <input
                      v-model="answers[question.id]"
                      type="radio"
                      :name="question.id"
                      :value="false"
                      @change="resultShown = false"
                    />
                    No or not sure
                  </label>
                </div>
              </fieldset>

              <div class="eligibility-form__actions">
                <button class="service-button service-button--primary" type="submit" :disabled="!eligibilityComplete">
                  Check my answers
                </button>
                <button class="text-button" type="button" @click="resetEligibility">
                  <RotateCcw :size="15" aria-hidden="true" />
                  Clear answers
                </button>
                <span aria-live="polite">{{ answeredCount }} of {{ eligibilityQuestions.length }} answered</span>
              </div>
            </form>

            <aside class="category-panel">
              <h3>Supported business categories</h3>
              <p>Selecting a supported category does not guarantee approval.</p>
              <details v-for="group in businessTypeGroups" :key="group.label">
                <summary>{{ group.label }}</summary>
                <p>{{ group.options.join(", ") }}</p>
              </details>
            </aside>
          </div>

          <div
            v-if="resultShown"
            ref="eligibilityResultEl"
            class="eligibility-result"
            :class="{ 'eligibility-result--guidance': !likelyEligible }"
            role="status"
            aria-live="polite"
            tabindex="-1"
          >
            <ShieldCheck v-if="likelyEligible" :size="28" aria-hidden="true" />
            <CircleHelp v-else :size="28" aria-hidden="true" />
            <div>
              <h3>{{ likelyEligible ? "Your business appears ready to start." : "Contact the Tourism Office for guidance." }}</h3>
              <p v-if="likelyEligible">
                Based on your answers, you can proceed to account registration and prepare your application.
                The Tourism Office will still verify all information.
              </p>
              <p v-else>
                You may still create an account and apply. Contact the Tourism Office first if you are unsure
                about your location, category, authority, or documents.
              </p>
              <div class="service-actions service-actions--result">
                <RouterLink class="service-button service-button--primary" to="/accreditation/register">
                  {{ likelyEligible ? "Create an account and apply" : "Continue to registration" }}
                </RouterLink>
                <a class="service-button service-button--secondary" href="#help">Contact the Tourism Office</a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section class="start-section" aria-labelledby="start-title">
        <div class="service-shell start-section__layout">
          <div>
            <p class="question-label">How do I start?</p>
            <h2 id="start-title">Check your eligibility, then create your service account.</h2>
            <p>
              New applicants should complete the advisory check first. Returning applicants can
              sign in to track or continue an existing request.
            </p>
          </div>
          <div class="service-actions">
            <a class="service-button service-button--primary" href="#eligibility-check">Check eligibility</a>
            <RouterLink class="service-button service-button--secondary" to="/accreditation/login">Sign in</RouterLink>
          </div>
        </div>
      </section>
    </main>

    <PublicServiceFooter />
  </div>
</template>

<script setup>
import { computed, nextTick, reactive, ref } from "vue";
import {
  ArrowRight,
  CheckCircle2,
  CircleHelp,
  FileText,
  Info,
  RotateCcw,
  ShieldCheck,
} from "@lucide/vue";
import PublicServiceFooter from "@/modules/accreditation/components/PublicServiceFooter.vue";
import PublicServiceHeader from "@/modules/accreditation/components/PublicServiceHeader.vue";
import { businessTypeGroups, commonPermitDocuments } from "@/modules/accreditation/data/mockData";
import {
  eligibilityQuestions,
  processSteps,
  requiredBusinessInformation,
  serviceCapabilities,
  serviceDetails,
  serviceIdentity,
} from "@/modules/accreditation/data/publicServiceContent";

const answers = reactive(
  Object.fromEntries(eligibilityQuestions.map((question) => [question.id, null])),
);
const resultShown = ref(false);
const eligibilityResultEl = ref(null);

const answeredCount = computed(
  () => Object.values(answers).filter((answer) => answer !== null).length,
);
const eligibilityComplete = computed(() => answeredCount.value === eligibilityQuestions.length);
const likelyEligible = computed(() => eligibilityComplete.value);

async function evaluateEligibility() {
  if (!eligibilityComplete.value) return;

  resultShown.value = true;
  await nextTick();
  eligibilityResultEl.value?.scrollIntoView({ behavior: "smooth", block: "center" });
  eligibilityResultEl.value?.focus({ preventScroll: true });
}

function resetEligibility() {
  for (const question of eligibilityQuestions) answers[question.id] = null;
  resultShown.value = false;
}
</script>

<style scoped>
@import url("https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap");

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
  outline: 3px solid #d4711b;
  outline-offset: 3px;
}

.service-shell {
  width: min(100% - 48px, 1200px);
  margin: 0 auto;
}

.service-hero {
  position: relative;
  overflow: hidden;
  border-bottom: 1px solid #164225;
  background:
    radial-gradient(circle at 82% 18%, rgba(216, 243, 220, 0.18), transparent 26%),
    radial-gradient(circle at 12% 88%, rgba(212, 113, 27, 0.2), transparent 30%),
    linear-gradient(135deg, #1b4332 0%, #2d6a4f 52%, #14532d 100%);
  color: #ffffff;
}

.service-hero__layout {
  min-height: 560px;
  display: flex;
  align-items: center;
  padding: 84px 0 92px;
}

.service-kicker,
.question-label {
  margin: 0 0 12px;
  color: #1b4332;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.service-kicker {
  color: rgba(255, 255, 255, 0.78);
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
  color: #1a1a1a;
  font-family: "Plus Jakarta Sans", system-ui, sans-serif;
  line-height: 1.2;
  white-space: normal;
}

h1 {
  max-width: 720px;
  margin-bottom: 20px;
  color: #ffffff;
  font-size: clamp(42px, 6vw, 64px);
  font-weight: 700;
  letter-spacing: 0;
  line-height: 1.05;
}

h2 {
  margin-bottom: 14px;
  font-size: clamp(28px, 4vw, 40px);
  font-weight: 600;
  letter-spacing: 0;
}

h3 {
  margin-bottom: 8px;
  font-size: 17px;
}

.service-lede {
  max-width: 720px;
  margin-bottom: 12px;
  color: rgba(255, 255, 255, 0.82);
  font-size: 19px;
}

.service-audience {
  margin-bottom: 0;
  color: rgba(255, 255, 255, 0.72);
  font-size: 14px;
  font-weight: 600;
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
  font-size: 14px;
  font-weight: 700;
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

.service-button--secondary {
  background: #ffffff;
}

.service-button--secondary:hover {
  background: #d8f3dc;
}

.service-hero .service-button--primary {
  border-color: #ffffff;
  background: #ffffff;
  color: #1b4332;
}

.service-hero .service-button--primary:hover {
  background: #d8f3dc;
}

.service-hero .service-button--secondary {
  border-color: rgba(255, 255, 255, 0.72);
  background: transparent;
  color: #ffffff;
}

.service-hero .service-button--secondary:hover {
  border-color: #ffffff;
  background: rgba(255, 255, 255, 0.12);
}

.service-button:disabled {
  cursor: not-allowed;
  opacity: 0.52;
}

.service-hero__layout > *,
.split-layout > *,
.requirements-grid > *,
.eligibility-layout > * {
  min-width: 0;
}

.requirements-panel ul {
  display: grid;
  gap: 13px;
  margin: 20px 0;
  padding: 0;
  list-style: none;
}

.requirements-panel li {
  display: grid;
  grid-template-columns: 18px minmax(0, 1fr);
  gap: 10px;
  color: #3f3f3f;
  font-size: 14px;
}

.requirements-panel li svg {
  margin-top: 3px;
  color: #1b4332;
}

.service-facts,
.content-section,
.start-section {
  padding: 76px 0;
}

.service-facts {
  background: #fffdf8;
}

.section-heading {
  max-width: 720px;
  margin-bottom: 34px;
}

.section-heading--compact {
  margin-bottom: 28px;
}

.section-heading p:last-child,
.start-section p,
.service-list p,
.process-list p,
.requirements-panel p,
.category-panel p,
.eligibility-form fieldset p,
.eligibility-result p {
  color: #5c5c5c;
  font-size: 15px;
}

.service-facts__grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
}

.service-facts__grid article {
  display: grid;
  align-content: start;
  padding: 22px;
  border-left: 4px solid #1b4332;
  background: #f2f0eb;
}

.service-facts__grid span,
.panel-heading span {
  color: #5c5c5c;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.service-facts__grid strong {
  margin-top: 8px;
  color: #1a1a1a;
  font-size: 18px;
}

.service-facts__grid p {
  margin: 8px 0 14px;
  color: #5c5c5c;
  font-size: 13px;
}

.service-facts__grid small {
  align-self: end;
  color: #8a5c00;
  font-size: 11px;
  font-weight: 800;
}

.split-layout {
  display: grid;
  grid-template-columns: minmax(280px, 0.7fr) minmax(0, 1.3fr);
  gap: 64px;
}

.service-list {
  border-top: 1px solid #e8e4dc;
}

.service-list article {
  display: grid;
  grid-template-columns: 42px minmax(0, 1fr);
  gap: 16px;
  padding: 22px 0;
  border-bottom: 1px solid #e8e4dc;
}

.service-list article > span {
  color: #1b4332;
  font-size: 13px;
  font-weight: 800;
}

.service-list p,
.process-list p {
  margin-bottom: 0;
}

.content-section--muted {
  border-block: 1px solid #e8e4dc;
  background: #fffdf8;
}

.requirements-grid,
.eligibility-layout {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 22px;
}

.requirements-panel,
.eligibility-form,
.category-panel {
  padding: 26px;
  border: 1px solid #e8e4dc;
  border-radius: 8px;
  background: #ffffff;
}

.panel-heading {
  display: grid;
  grid-template-columns: 24px minmax(0, 1fr);
  gap: 12px;
}

.panel-heading svg {
  color: #1b4332;
}

.panel-heading h3 {
  margin-top: 3px;
}

.panel-note {
  margin: 20px 0 0;
  padding-top: 16px;
  border-top: 1px solid #e8e4dc;
}

.process-list {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 0;
  margin: 0;
  padding: 0;
  list-style: none;
}

.process-list li {
  min-height: 230px;
  padding: 22px;
  border-top: 4px solid #1b4332;
  border-right: 1px solid #e8e4dc;
  background: #fffdf8;
}

.process-list li:first-child {
  border-left: 1px solid #e8e4dc;
}

.process-list li > span {
  width: 32px;
  height: 32px;
  display: grid;
  place-items: center;
  margin-bottom: 36px;
  border-radius: 50%;
  background: #d8f3dc;
  color: #1b4332;
  font-size: 13px;
  font-weight: 800;
}

.eligibility-section {
  scroll-margin-top: 20px;
  background: #f2f0eb;
}

.eligibility-form {
  display: grid;
  gap: 0;
  padding: 0 26px;
}

.eligibility-form fieldset {
  margin: 0;
  padding: 24px 0;
  border: 0;
  border-bottom: 1px solid #e8e4dc;
}

.eligibility-form legend {
  display: grid;
  grid-template-columns: 28px minmax(0, 1fr);
  gap: 10px;
  color: #1a1a1a;
  font-size: 15px;
  font-weight: 800;
}

.eligibility-form legend span {
  width: 26px;
  height: 26px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: #d8f3dc;
  color: #1b4332;
  font-size: 12px;
}

.eligibility-form fieldset p {
  margin: 8px 0 12px 38px;
  font-size: 13px;
}

.answer-options {
  display: grid;
  grid-template-columns: repeat(2, 145px);
  gap: 10px;
  margin-left: 38px;
}

.answer-options label {
  min-height: 46px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 7px 12px;
  border: 1px solid #e8e4dc;
  border-radius: 5px;
  color: #3f3f3f;
  font-size: 13px;
  font-weight: 700;
  line-height: 1.2;
  white-space: nowrap;
  cursor: pointer;
}

.answer-options label:has(input:checked) {
  border-color: #1b4332;
  background: #d8f3dc;
}

.answer-options input {
  width: 16px;
  height: 16px;
  min-height: 0;
  flex: 0 0 16px;
  margin: 0;
  accent-color: #1b4332;
}

.eligibility-form__actions {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 14px;
  padding: 24px 0;
}

.eligibility-form__actions span {
  margin-left: auto;
  color: #5c5c5c;
  font-size: 12px;
  font-weight: 700;
}

.text-button {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px;
  border: 0;
  background: transparent;
  color: #1b4332;
  font-size: 13px;
  font-weight: 800;
  cursor: pointer;
}

.category-panel h3 {
  font-size: 20px;
}

.category-panel details {
  border-top: 1px solid #e8e4dc;
}

.category-panel details:last-child {
  border-bottom: 1px solid #e8e4dc;
}

.category-panel summary {
  padding: 14px 2px;
  color: #1a1a1a;
  font-size: 13px;
  font-weight: 800;
  cursor: pointer;
}

.category-panel details p {
  margin: -4px 0 16px;
  font-size: 12px;
}

.eligibility-result {
  margin-top: 22px;
  display: grid;
  grid-template-columns: 30px minmax(0, 1fr);
  gap: 16px;
  padding: 24px;
  border: 1px solid #95d5b2;
  border-left: 5px solid #1b4332;
  background: #d8f3dc;
}

.eligibility-result > svg {
  color: #1b4332;
}

.eligibility-result--guidance {
  border-color: #e2c37b;
  border-left-color: #9a6800;
  background: #fff9e8;
}

.eligibility-result--guidance > svg {
  color: #8a5c00;
}

.service-actions--result {
  margin-top: 18px;
}

.start-section {
  border-top: 1px solid #e8e4dc;
  background: #fffdf8;
}

.start-section__layout {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 48px;
}

.start-section__layout > div:first-child {
  max-width: 700px;
}

.start-section .service-actions {
  flex: 0 0 auto;
  margin-top: 0;
}

@media (max-width: 1000px) {
  .service-hero__layout,
  .split-layout,
  .eligibility-layout {
    grid-template-columns: minmax(0, 1fr);
    gap: 36px;
  }

  .service-facts__grid {
    grid-template-columns: 1fr;
  }

  .process-list {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .process-list li,
  .process-list li:first-child {
    min-height: auto;
    display: grid;
    grid-template-columns: 42px minmax(0, 1fr);
    gap: 14px;
    padding: 20px;
    border: 1px solid #e8e4dc;
    border-left: 4px solid #1b4332;
  }

  .process-list li > span {
    margin-bottom: 0;
  }

  .start-section__layout {
    align-items: flex-start;
    flex-direction: column;
  }
}

@media (max-width: 720px) {
  .service-shell {
    width: min(100% - 32px, 1200px);
  }

  .service-hero__layout {
    min-height: auto;
    padding: 64px 0;
  }

  h1 {
    font-size: 42px;
  }

  .service-facts,
  .content-section,
  .start-section {
    padding: 54px 0;
  }

  .requirements-grid {
    grid-template-columns: minmax(0, 1fr);
  }

  .requirements-panel,
  .category-panel {
    padding: 22px;
  }

  .eligibility-form {
    padding: 0 20px;
  }

  .eligibility-form fieldset p,
  .answer-options {
    margin-left: 0;
  }

  .answer-options {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .service-actions,
  .service-actions .service-button {
    width: 100%;
  }

  .eligibility-form__actions {
    align-items: stretch;
    flex-direction: column;
  }

  .eligibility-form__actions span {
    margin-left: 0;
  }
}
</style>
