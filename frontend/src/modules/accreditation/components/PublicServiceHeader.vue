<template>
  <header class="service-header">
    <div class="service-header__inner">
      <RouterLink class="service-identity" to="/accreditation" aria-label="Business Accreditation Service home">
        <span class="service-identity__office">{{ serviceIdentity.municipality }}</span>
        <strong>{{ serviceIdentity.office }}</strong>
        <span>{{ serviceIdentity.serviceName }}</span>
      </RouterLink>

      <nav class="service-header__nav" aria-label="Accreditation service navigation">
        <RouterLink to="/">Back to tourism website</RouterLink>
        <a href="/accreditation#help">Help and contact</a>
        <RouterLink v-if="showSignIn" class="service-header__button" to="/accreditation/login">
          Sign in
        </RouterLink>
      </nav>
    </div>
  </header>
</template>

<script setup>
import { serviceIdentity } from "@/modules/accreditation/data/publicServiceContent";

defineProps({
  showSignIn: {
    type: Boolean,
    default: true,
  },
});
</script>

<style scoped>
.service-header {
  border-bottom: 1px solid #d9e1dc;
  background: #ffffff;
}

.service-header__inner {
  width: min(1180px, calc(100% - 40px));
  min-height: 76px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 32px;
}

.service-identity {
  display: grid;
  color: #163f32;
  line-height: 1.15;
  text-decoration: none;
}

.service-identity__office {
  margin-bottom: 3px;
  color: #52665e;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.service-identity strong {
  font-size: 18px;
  font-weight: 800;
}

.service-identity span:last-child {
  margin-top: 3px;
  color: #52665e;
  font-size: 12px;
}

.service-header__nav {
  display: flex;
  align-items: center;
  gap: 22px;
}

.service-header__nav a {
  color: #294c40;
  font-size: 13px;
  font-weight: 700;
  text-decoration: none;
}

.service-header__nav a:hover,
.service-header__nav a:focus-visible {
  color: #0e6b4f;
  text-decoration: underline;
  text-underline-offset: 4px;
}

.service-header__button {
  min-height: 40px;
  display: inline-flex;
  align-items: center;
  padding: 0 18px;
  border: 1px solid #166349;
  border-radius: 6px;
}

.service-header__button:hover,
.service-header__button:focus-visible {
  background: #edf7f2;
  text-decoration: none !important;
}

@media (max-width: 760px) {
  .service-header__inner {
    min-height: auto;
    align-items: flex-start;
    flex-direction: column;
    gap: 16px;
    padding: 18px 0;
  }

  .service-header__nav {
    width: 100%;
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px 16px;
  }

  .service-header__button {
    min-height: auto;
    padding: 0;
    border: 0;
  }

  .service-header__nav a {
    min-width: 0;
    font-size: 12px;
  }
}
</style>
