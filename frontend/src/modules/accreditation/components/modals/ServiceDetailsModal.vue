<template>
  <Teleport to="body">
    <div v-if="open" class="details-modal-backdrop" @click.self="close">
      <section
        ref="dialog"
        class="details-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="service-details-title"
        tabindex="-1"
      >
        <header class="details-modal__header">
          <div>
            <span>Accreditation reference</span>
            <h2 id="service-details-title">{{ title }}</h2>
          </div>
          <button type="button" aria-label="Close service details" @click="close">
            <X :size="22" aria-hidden="true" />
          </button>
        </header>

        <p class="details-modal__description">{{ description }}</p>

        <div class="details-modal__viewer">
          <iframe :src="source" :title="title" />
          <p>
            The PDF preview is unavailable in this browser. Use the download button to view the
            document.
          </p>
        </div>

        <footer class="details-modal__footer">
          <a :href="source" :download="downloadName">
            <Download :size="17" aria-hidden="true" />
            Download PDF
          </a>
          <button type="button" @click="close">Close</button>
        </footer>
      </section>
    </div>
  </Teleport>
</template>

<script setup>
import { nextTick, onBeforeUnmount, ref, watch } from "vue";
import { Download, X } from "@lucide/vue";

const props = defineProps({
  open: { type: Boolean, required: true },
  title: { type: String, required: true },
  description: { type: String, default: "" },
  source: { type: String, required: true },
  downloadName: { type: String, default: "accreditation-guide.pdf" },
});

const emit = defineEmits(["close"]);
const dialog = ref(null);
let previousOverflow = "";

function close() {
  emit("close");
}

function handleKeydown(event) {
  if (event.key === "Escape") close();
}

function releasePage() {
  window.removeEventListener("keydown", handleKeydown);
  document.body.style.overflow = previousOverflow;
}

watch(
  () => props.open,
  async (isOpen) => {
    if (!isOpen) {
      releasePage();
      return;
    }

    previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeydown);
    await nextTick();
    dialog.value?.focus();
  },
);

onBeforeUnmount(releasePage);
</script>

<style scoped>
.details-modal-backdrop {
  position: fixed;
  z-index: 1000;
  inset: 0;
  display: grid;
  place-items: center;
  padding: 24px;
  background: rgba(7, 25, 19, 0.72);
}

.details-modal {
  width: min(1080px, 100%);
  height: min(88vh, 860px);
  display: grid;
  grid-template-rows: auto auto minmax(0, 1fr) auto;
  overflow: hidden;
  border: 1px solid #cddbd4;
  border-radius: 8px;
  background: #ffffff;
  color: #17231e;
  box-shadow: 0 28px 80px rgba(7, 25, 19, 0.3);
}

.details-modal:focus {
  outline: none;
}

.details-modal__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24px;
  padding: 22px 24px 16px;
  border-bottom: 1px solid #d9e1dc;
}

.details-modal__header span {
  display: block;
  margin-bottom: 5px;
  color: #176249;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.details-modal__header h2 {
  margin: 0;
  color: #173f32;
  font-family: "Plus Jakarta Sans", Inter, system-ui, sans-serif;
  font-size: 22px;
  line-height: 1.3;
  letter-spacing: 0;
}

.details-modal__header button {
  width: 38px;
  height: 38px;
  flex: 0 0 auto;
  display: grid;
  place-items: center;
  padding: 0;
  border: 1px solid #cddbd4;
  border-radius: 6px;
  background: #ffffff;
  color: #173f32;
  cursor: pointer;
}

.details-modal__header button:hover {
  background: #e8f3ed;
}

.details-modal__description {
  margin: 0;
  padding: 14px 24px;
  color: #52665e;
  font-size: 13px;
  line-height: 1.6;
}

.details-modal__viewer {
  position: relative;
  min-height: 0;
  margin: 0 24px;
  overflow: hidden;
  border: 1px solid #cddbd4;
  background: #f4f7f5;
}

.details-modal__viewer iframe {
  position: relative;
  z-index: 1;
  width: 100%;
  height: 100%;
  display: block;
  border: 0;
  background: #ffffff;
}

.details-modal__viewer p {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  margin: 0;
  padding: 24px;
  color: #52665e;
  text-align: center;
}

.details-modal__footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 16px 24px 20px;
}

.details-modal__footer a,
.details-modal__footer button {
  min-height: 42px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 8px 16px;
  border: 1px solid #176249;
  border-radius: 6px;
  font: inherit;
  font-size: 13px;
  font-weight: 800;
  text-decoration: none;
  cursor: pointer;
}

.details-modal__footer a {
  background: #176249;
  color: #ffffff;
}

.details-modal__footer button {
  background: #ffffff;
  color: #176249;
}

@media (max-width: 640px) {
  .details-modal-backdrop {
    padding: 12px;
  }

  .details-modal {
    height: calc(100vh - 24px);
  }

  .details-modal__header {
    padding: 18px 16px 14px;
  }

  .details-modal__header h2 {
    font-size: 18px;
  }

  .details-modal__description {
    padding: 12px 16px;
  }

  .details-modal__viewer {
    margin: 0 16px;
  }

  .details-modal__footer {
    padding: 14px 16px 16px;
  }
}
</style>
