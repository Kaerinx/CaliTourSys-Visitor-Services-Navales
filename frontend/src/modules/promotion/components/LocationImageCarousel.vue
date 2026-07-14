<script setup>
import { computed, ref, watch } from "vue";

const props = defineProps({
  images: {
    type: Array,
    default: () => [],
  },
  label: {
    type: String,
    default: "Location",
  },
  accent: {
    type: String,
    default: "#1b4332",
  },
});

const scroller = ref(null);
const activeIndex = ref(0);

const normalizedImages = computed(() =>
  props.images
    .map((image, index) => {
      if (typeof image === "string") {
        return {
          id: `image-${index}`,
          url: image,
          alt: `${props.label} photo ${index + 1}`,
        };
      }
      return {
        id: image?.id || `image-${index}`,
        url: image?.url || image?.imageUrl || image?.image_url,
        alt:
          image?.alt ||
          image?.altText ||
          image?.alt_text ||
          `${props.label} photo ${index + 1}`,
      };
    })
    .filter((image) => image.url),
);

function prefersReducedMotion() {
  return window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
}

function goTo(index) {
  const lastIndex = normalizedImages.value.length - 1;
  const nextIndex = Math.max(0, Math.min(index, lastIndex));
  const slide = scroller.value?.children[nextIndex];
  if (!slide) return;

  activeIndex.value = nextIndex;
  slide.scrollIntoView({
    behavior: prefersReducedMotion() ? "auto" : "smooth",
    block: "nearest",
    inline: "start",
  });
}

function updateActiveSlide(event) {
  const element = event.currentTarget;
  if (!element.clientWidth) return;
  activeIndex.value = Math.max(
    0,
    Math.min(
      Math.round(element.scrollLeft / element.clientWidth),
      normalizedImages.value.length - 1,
    ),
  );
}

function handleKeydown(event) {
  if (event.key === "ArrowLeft") {
    event.preventDefault();
    goTo(activeIndex.value - 1);
  } else if (event.key === "ArrowRight") {
    event.preventDefault();
    goTo(activeIndex.value + 1);
  } else if (event.key === "Home") {
    event.preventDefault();
    goTo(0);
  } else if (event.key === "End") {
    event.preventDefault();
    goTo(normalizedImages.value.length - 1);
  }
}

watch(normalizedImages, () => {
  activeIndex.value = 0;
});
</script>

<template>
  <section
    class="location-carousel"
    :style="{ '--carousel-accent': accent }"
    :aria-label="`${label} gallery`"
  >
    <div
      v-if="normalizedImages.length === 0"
      class="location-carousel__placeholder"
    >
      <svg viewBox="0 0 48 48" aria-hidden="true">
        <path d="M7 10h34v28H7z" />
        <circle cx="17" cy="20" r="4" />
        <path d="m10 35 10-9 7 6 5-5 7 8" />
      </svg>
      <span>Photos coming soon</span>
    </div>

    <template v-else>
      <div
        ref="scroller"
        class="location-carousel__track"
        tabindex="0"
        role="region"
        aria-roledescription="carousel"
        :aria-label="`${label} photos. Use the left and right arrow keys to browse.`"
        @scroll.passive="updateActiveSlide"
        @keydown="handleKeydown"
      >
        <figure
          v-for="(image, index) in normalizedImages"
          :key="image.id"
          class="location-carousel__slide"
          role="group"
          aria-roledescription="slide"
          :aria-label="`${index + 1} of ${normalizedImages.length}`"
        >
          <img
            :src="image.url"
            :alt="image.alt"
            loading="lazy"
            decoding="async"
          />
        </figure>
      </div>

      <span class="location-carousel__counter" aria-live="polite">
        {{ activeIndex + 1 }} / {{ normalizedImages.length }}
      </span>

      <template v-if="normalizedImages.length > 1">
        <button
          type="button"
          class="location-carousel__arrow location-carousel__arrow--previous"
          aria-label="Previous photo"
          :disabled="activeIndex === 0"
          @click="goTo(activeIndex - 1)"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="m15 18-6-6 6-6" />
          </svg>
        </button>
        <button
          type="button"
          class="location-carousel__arrow location-carousel__arrow--next"
          aria-label="Next photo"
          :disabled="activeIndex === normalizedImages.length - 1"
          @click="goTo(activeIndex + 1)"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="m9 6 6 6-6 6" />
          </svg>
        </button>

        <div class="location-carousel__dots" aria-label="Choose a photo">
          <button
            v-for="(image, index) in normalizedImages"
            :key="`dot-${image.id}`"
            type="button"
            :class="{ 'is-active': index === activeIndex }"
            :aria-label="`Show photo ${index + 1}`"
            :aria-current="index === activeIndex ? 'true' : undefined"
            @click="goTo(index)"
          ></button>
        </div>
      </template>
    </template>
  </section>
</template>

<style scoped>
.location-carousel {
  position: relative;
  width: 100%;
  overflow: hidden;
  aspect-ratio: 16 / 10;
  min-height: 220px;
  background:
    radial-gradient(
      circle at 30% 30%,
      rgba(255, 255, 255, 0.28),
      transparent 42%
    ),
    linear-gradient(
      135deg,
      var(--carousel-accent),
      color-mix(in srgb, var(--carousel-accent) 58%, white)
    );
}

.location-carousel__track {
  width: 100%;
  height: 100%;
  display: flex;
  overflow-x: auto;
  overflow-y: hidden;
  scroll-behavior: smooth;
  scroll-snap-type: x mandatory;
  scrollbar-width: none;
  overscroll-behavior-x: contain;
  touch-action: pan-x pan-y;
}

.location-carousel__track::-webkit-scrollbar {
  display: none;
}

.location-carousel__track:focus-visible {
  outline: 3px solid rgba(255, 255, 255, 0.9);
  outline-offset: -5px;
}

.location-carousel__slide {
  width: 100%;
  height: 100%;
  flex: 0 0 100%;
  margin: 0;
  scroll-snap-align: start;
  scroll-snap-stop: always;
}

.location-carousel__slide img {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
}

.location-carousel__placeholder {
  position: absolute;
  inset: 0;
  display: grid;
  place-content: center;
  justify-items: center;
  gap: 10px;
  color: rgba(255, 255, 255, 0.92);
  font-size: 14px;
  font-weight: 600;
}

.location-carousel__placeholder svg {
  width: 54px;
  height: 54px;
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 2;
}

.location-carousel__counter {
  position: absolute;
  right: 14px;
  bottom: 14px;
  padding: 5px 10px;
  border-radius: 999px;
  background: rgba(16, 24, 20, 0.72);
  color: #ffffff;
  font-size: 12px;
  font-weight: 700;
  backdrop-filter: blur(6px);
}

.location-carousel__arrow {
  position: absolute;
  top: 50%;
  width: 42px;
  height: 42px;
  display: grid;
  place-items: center;
  padding: 0;
  border: 1px solid rgba(255, 255, 255, 0.5);
  border-radius: 999px;
  background: rgba(16, 24, 20, 0.68);
  color: #ffffff;
  transform: translateY(-50%);
  cursor: pointer;
  backdrop-filter: blur(6px);
}

.location-carousel__arrow--previous {
  left: 14px;
}

.location-carousel__arrow--next {
  right: 14px;
}

.location-carousel__arrow:disabled {
  opacity: 0.35;
  cursor: default;
}

.location-carousel__arrow svg {
  width: 22px;
  height: 22px;
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 2;
}

.location-carousel__dots {
  position: absolute;
  bottom: 18px;
  left: 50%;
  display: flex;
  gap: 6px;
  transform: translateX(-50%);
}

.location-carousel__dots button {
  width: 8px;
  height: 8px;
  padding: 0;
  border: 1px solid rgba(255, 255, 255, 0.9);
  border-radius: 999px;
  background: rgba(16, 24, 20, 0.45);
  cursor: pointer;
  transition:
    width 160ms ease,
    background-color 160ms ease;
}

.location-carousel__dots button.is-active {
  width: 24px;
  background: #ffffff;
}

@media (max-width: 520px) {
  .location-carousel {
    min-height: 210px;
    aspect-ratio: 4 / 3;
  }

  .location-carousel__arrow {
    width: 38px;
    height: 38px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .location-carousel__track {
    scroll-behavior: auto;
  }

  .location-carousel__dots button {
    transition: none;
  }
}
</style>
