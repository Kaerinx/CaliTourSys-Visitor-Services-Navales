<script setup>
import { computed, reactive, watch } from 'vue'

const props = defineProps({
  open: { type: Boolean, default: false },
  packageDetail: { type: Object, default: null },
  issues: { type: Array, default: () => [] },
  backendErrors: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
  serverError: { type: String, default: '' },
  busy: { type: Boolean, default: false },
  canApprove: { type: Boolean, default: false },
})

const emit = defineEmits(['close', 'confirm'])
const state = reactive({ remarks: '' })

const canSubmit = computed(
  () =>
    props.canApprove &&
    props.packageDetail &&
    props.packageDetail.packageStatus !== 'Ready for Promotion' &&
    !props.issues.length,
)

watch(
  () => [props.open, props.packageDetail?.id],
  () => {
    state.remarks = ''
  },
)

function formatDate(value) {
  if (!value) return 'Not recorded'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date)
}
</script>

<template>
  <Teleport to="body">
    <div v-if="open" class="readiness-modal" role="presentation" @click.self="$emit('close')">
      <section class="readiness-modal__dialog" role="dialog" aria-modal="true" aria-labelledby="readiness-title">
        <header>
          <div>
            <p>Readiness review</p>
            <h2 id="readiness-title">{{ packageDetail?.name || 'Tourism package' }}</h2>
          </div>
          <button type="button" aria-label="Close readiness review" @click="$emit('close')">x</button>
        </header>

        <div class="readiness-modal__body">
          <div v-if="loading" class="readiness-state">Loading package review...</div>
          <div v-else-if="serverError" class="readiness-error" role="alert">{{ serverError }}</div>

          <template v-else-if="packageDetail">
            <section class="readiness-summary" aria-label="Package summary">
              <article>
                <span>Readiness</span>
                <strong class="readiness-status" :data-status="packageDetail.packageStatus">
                  {{ packageDetail.packageStatus === 'Ready for Promotion' ? 'Ready for Promotion' : 'Draft' }}
                </strong>
              </article>
              <article>
                <span>Linked items</span>
                <strong>{{ packageDetail.items?.length || 0 }}</strong>
              </article>
              <article>
                <span>Plans</span>
                <strong>{{ packageDetail.planCount || 0 }}</strong>
              </article>
            </section>

            <section class="readiness-section" aria-labelledby="readiness-details-title">
              <h3 id="readiness-details-title">Package Details</h3>
              <div class="readiness-detail-grid">
                <span>
                  <strong>Category</strong>
                  {{ packageDetail.category }}
                </span>
                <span>
                  <strong>Target market</strong>
                  {{ packageDetail.targetMarket }}
                </span>
                <span>
                  <strong>Estimated duration</strong>
                  {{ packageDetail.estimatedDuration }}
                </span>
              </div>
              <p>{{ packageDetail.description }}</p>
              <p v-if="packageDetail.remarks">{{ packageDetail.remarks }}</p>
            </section>

            <section class="readiness-section" aria-labelledby="readiness-items-title">
              <h3 id="readiness-items-title">Linked Items</h3>
              <div class="readiness-items">
                <article v-for="item in packageDetail.items" :key="item.id">
                  <strong>{{ item.itemType }}: {{ item.name }}</strong>
                  <span>{{ item.location || item.description || 'Linked package item' }}</span>
                </article>
              </div>
            </section>

            <section v-if="issues.length || backendErrors.length" class="readiness-issues" aria-labelledby="readiness-issues-title">
              <h3 id="readiness-issues-title">Readiness Issues</h3>
              <ul>
                <li v-for="issue in issues" :key="issue">{{ issue }}</li>
                <li v-for="issue in backendErrors" :key="issue">{{ issue }}</li>
              </ul>
            </section>
            <div v-else class="readiness-success" role="status">
              This package has the required information for readiness approval.
            </div>

            <section class="readiness-section" aria-labelledby="readiness-history-title">
              <h3 id="readiness-history-title">Readiness History</h3>
              <div v-if="packageDetail.statusHistory?.length" class="readiness-history">
                <article v-for="history in packageDetail.statusHistory" :key="history.id">
                  <strong>{{ history.previousStatus || 'Draft' }} to {{ history.newStatus }}</strong>
                  <span>
                    {{ history.changedByName || 'Unknown user' }} - {{ history.changedByRole || 'Unknown role' }} -
                    {{ formatDate(history.changedAt) }}
                  </span>
                  <small v-if="history.remarks">{{ history.remarks }}</small>
                </article>
              </div>
              <p v-else>No readiness changes recorded yet.</p>
            </section>

            <label v-if="canApprove && packageDetail.packageStatus !== 'Ready for Promotion'" class="readiness-remarks">
              <span>Approval remarks</span>
              <textarea v-model="state.remarks" rows="3" placeholder="Optional reason or note for readiness approval"></textarea>
            </label>
          </template>
        </div>

        <footer>
          <button type="button" :disabled="busy" @click="$emit('close')">Cancel</button>
          <button
            v-if="canApprove && packageDetail?.packageStatus !== 'Ready for Promotion'"
            class="readiness-modal__primary"
            type="button"
            :disabled="busy || !canSubmit"
            @click="emit('confirm', state.remarks)"
          >
            {{ busy ? 'Marking ready...' : 'Mark Ready for Promotion' }}
          </button>
        </footer>
      </section>
    </div>
  </Teleport>
</template>

<style scoped>
* {
  box-sizing: border-box;
}

.readiness-modal {
  position: fixed;
  inset: 0;
  z-index: 76;
  display: grid;
  place-items: center;
  padding: 16px;
  overflow: hidden;
  background: rgba(15, 23, 42, 0.46);
}

.readiness-modal__dialog {
  display: flex;
  flex-direction: column;
  width: min(820px, 100%);
  max-height: calc(100vh - 32px);
  overflow: hidden;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #fff;
  box-shadow: 0 24px 70px rgba(15, 23, 42, 0.24);
}

header,
footer {
  display: flex;
  flex: 0 0 auto;
  gap: 12px;
  align-items: center;
  justify-content: space-between;
  padding: 14px 18px;
  border-bottom: 1px solid #e2e8f0;
}

footer {
  border-top: 1px solid #e2e8f0;
  border-bottom: 0;
  background: #fff;
}

header button {
  display: grid;
  width: 34px;
  min-height: 34px;
  padding: 0;
  place-items: center;
  font-size: 1rem;
  line-height: 1;
}

p,
h2,
h3 {
  margin: 0;
}

header p {
  color: #0f766e;
  font-size: 0.72rem;
  font-weight: 900;
  text-transform: uppercase;
}

h2 {
  margin-top: 3px;
  color: #0f172a;
  font-size: 1.18rem;
}

h3 {
  color: #0f172a;
  font-size: 0.9rem;
}

.readiness-modal__body {
  display: grid;
  gap: 16px;
  min-width: 0;
  padding: 16px 18px;
  overflow-x: hidden;
  overflow-y: auto;
}

.readiness-state,
.readiness-error,
.readiness-success,
.readiness-issues {
  padding: 12px 14px;
  border-radius: 8px;
  font-weight: 800;
}

.readiness-state {
  color: #475569;
  background: #f8fafc;
}

.readiness-error,
.readiness-issues {
  color: #991b1b;
  border: 1px solid #fecaca;
  background: #fef2f2;
}

.readiness-success {
  color: #0f766e;
  border: 1px solid #99f6e4;
  background: #ccfbf1;
}

.readiness-issues ul {
  margin: 8px 0 0;
  padding-left: 18px;
}

.readiness-summary,
.readiness-detail-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(150px, 100%), 1fr));
  gap: 12px;
}

.readiness-summary article,
.readiness-items article,
.readiness-history article {
  display: grid;
  gap: 4px;
  padding: 12px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #f8fafc;
}

.readiness-summary span,
.readiness-detail-grid strong,
.readiness-items span,
.readiness-history span,
.readiness-history small {
  color: #64748b;
  font-size: 0.78rem;
  font-weight: 800;
}

.readiness-summary strong {
  color: #0f172a;
  font-size: 1.2rem;
}

.readiness-section {
  display: grid;
  gap: 10px;
}

.readiness-section p {
  color: #334155;
  line-height: 1.5;
}

.readiness-detail-grid > span,
.readiness-items,
.readiness-history {
  display: grid;
  gap: 8px;
}

.readiness-detail-grid > span {
  padding: 12px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
}

.readiness-detail-grid strong,
.readiness-items strong,
.readiness-history strong {
  display: block;
  color: #0f172a;
}

.readiness-status {
  display: inline-flex;
  align-items: center;
  width: max-content;
  min-height: 26px;
  padding: 0 10px;
  border-radius: 999px;
  color: #475569;
  border: 1px solid #e2e8f0;
  background: #fff;
  font-size: 0.78rem !important;
}

.readiness-status[data-status='Ready for Promotion'] {
  color: #166534;
  border-color: #bbf7d0;
  background: #dcfce7;
}

.readiness-status[data-status='Archived'] {
  color: #991b1b;
  border-color: #fecaca;
  background: #fef2f2;
}

.readiness-remarks {
  display: grid;
  gap: 6px;
}

.readiness-remarks span {
  color: #334155;
  font-size: 0.84rem;
  font-weight: 800;
}

textarea {
  width: 100%;
  min-height: 76px;
  padding: 8px 10px;
  color: #0f172a;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  background: #fff;
  font: inherit;
  line-height: 1.45;
  resize: vertical;
}

button {
  min-height: 36px;
  padding: 0 13px;
  color: #334155;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  background: #fff;
  font: inherit;
  font-weight: 800;
}

.readiness-modal__primary {
  color: #fff;
  border-color: #0f766e;
  background: #0f766e;
}

button:disabled {
  cursor: wait;
  opacity: 0.65;
}

textarea:focus,
button:focus-visible {
  border-color: #0ea5e9;
  outline: 3px solid rgba(14, 165, 233, 0.16);
}

@media (max-width: 640px) {
  .readiness-modal {
    padding: 10px;
  }

  .readiness-modal__dialog {
    max-height: calc(100vh - 20px);
  }

  header,
  footer,
  .readiness-modal__body {
    padding: 12px 14px;
  }
}

@media (max-width: 460px) {
  footer {
    align-items: stretch;
    flex-direction: column-reverse;
  }

  footer button {
    width: 100%;
  }
}
</style>
