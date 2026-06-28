<template>
  <footer id="help" class="service-footer">
    <div class="service-footer__inner">
      <div>
        <strong>Need help with accreditation?</strong>
        <p>Contact the {{ serviceContact.office }} before submitting if you are unsure about eligibility or requirements.</p>
      </div>
      <address>
        <span>{{ serviceContact.address }}</span>
        <a :href="`tel:${serviceContact.phone.replace(/\s/g, '')}`">{{ serviceContact.phone }}</a>
        <a :href="`mailto:${serviceContact.email}`">{{ serviceContact.email }}</a>
        <small>{{ serviceContact.note }}</small>
      </address>
    </div>
  </footer>
</template>

<script setup>
import { serviceContact } from "@/modules/accreditation/data/publicServiceContent";
</script>

<style scoped>
.service-footer {
  border-top: 1px solid #d9e1dc;
  background: #173f32;
  color: #ffffff;
}

.service-footer__inner {
  width: min(1180px, calc(100% - 40px));
  margin: 0 auto;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 48px;
  padding: 42px 0;
}

.service-footer strong {
  font-size: 18px;
}

.service-footer p,
.service-footer address {
  margin: 10px 0 0;
  color: rgba(255, 255, 255, 0.78);
  font-size: 14px;
  font-style: normal;
  line-height: 1.7;
}

.service-footer address {
  display: grid;
  gap: 4px;
}

.service-footer a {
  color: #ffffff;
  text-decoration: underline;
  text-underline-offset: 3px;
}

.service-footer small {
  margin-top: 8px;
  color: rgba(255, 255, 255, 0.62);
}

@media (max-width: 720px) {
  .service-footer__inner {
    grid-template-columns: 1fr;
    gap: 24px;
  }
}
</style>
