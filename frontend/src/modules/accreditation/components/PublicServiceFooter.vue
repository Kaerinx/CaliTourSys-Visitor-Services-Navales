<template>
  <footer id="help" class="service-footer">
    <div class="service-footer__main">
      <div>
        <div class="footer-brand">
          <span class="footer-brand__mark">T</span>
          <span>
            <strong>TWBIS</strong>
            <small>Calabanga Tourism</small>
          </span>
        </div>
        <p>
          The official tourism platform of the Local Government of Calabanga, Camarines Sur,
          supporting local destinations, products, events, and business accreditation.
        </p>
      </div>

      <div>
        <h4>Explore</h4>
        <RouterLink to="/destinations">Destinations &amp; Map</RouterLink>
        <RouterLink to="/products">Products</RouterLink>
        <RouterLink to="/packages">Packages</RouterLink>
        <RouterLink to="/events">Events</RouterLink>
        <RouterLink to="/promotion/museum">Virtual Museum</RouterLink>
      </div>

      <div>
        <h4>Accreditation</h4>
        <RouterLink to="/accreditation">Online Accreditation</RouterLink>
        <RouterLink to="/accredited-establishments">Accredited Establishments</RouterLink>
        <RouterLink to="/accreditation/register">Create account</RouterLink>
        <RouterLink to="/accreditation/login">Sign in</RouterLink>
      </div>

      <div>
        <h4>Need help?</h4>
        <p>Contact the {{ serviceContact.office }} before submitting if you are unsure about eligibility or requirements.</p>
        <address>
          <span>{{ serviceContact.address }}</span>
          <a :href="`tel:${serviceContact.phone.replace(/\s/g, '')}`">{{ serviceContact.phone }}</a>
          <a :href="`mailto:${serviceContact.email}`">{{ serviceContact.email }}</a>
          <small>{{ serviceContact.note }}</small>
        </address>
      </div>
    </div>

    <div class="service-footer__bottom">
      <div>
        <span>&copy; 2026 LGU Calabanga, Camarines Sur. All rights reserved.</span>
        <span>
          <a aria-disabled="true">Privacy</a>
          <a aria-disabled="true">Accessibility</a>
          <RouterLink to="/promotion/inquiry">Contact</RouterLink>
        </span>
      </div>
    </div>
  </footer>
</template>

<script setup>
import { serviceContact } from "@/modules/accreditation/data/publicServiceContent";
</script>

<style scoped>
.service-footer {
  background: #1b4332;
  color: #ffffff;
}

.service-footer__main {
  width: min(100% - 48px, 1200px);
  margin: 0 auto;
  display: grid;
  grid-template-columns: 1.35fr 1fr 1fr 1.35fr;
  gap: 56px;
  padding: 64px 0;
}

.footer-brand {
  display: inline-flex;
  align-items: center;
  gap: 10px;
}

.footer-brand__mark {
  width: 36px;
  height: 36px;
  display: grid;
  place-items: center;
  border-radius: 10px;
  background: #ffffff;
  color: #1b4332;
  font-family: "Plus Jakarta Sans", system-ui, sans-serif;
  font-weight: 700;
}

.footer-brand span:last-child {
  display: flex;
  flex-direction: column;
  line-height: 1.05;
}

.footer-brand strong {
  color: #ffffff;
  font-family: "Plus Jakarta Sans", system-ui, sans-serif;
  font-size: 20px;
  font-weight: 700;
}

.footer-brand small,
.service-footer p,
.service-footer a,
.service-footer address,
.service-footer small {
  color: rgba(255, 255, 255, 0.72);
}

.service-footer p {
  max-width: 310px;
  margin: 14px 0 0;
  font-size: 14px;
  line-height: 1.7;
}

.service-footer h4 {
  margin: 0 0 18px;
  color: #ffffff;
  font-size: 12px;
  font-weight: 500;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.service-footer__main > div:not(:first-child) a {
  display: block;
  margin-top: 11px;
  font-size: 14px;
  text-decoration: none;
}

.service-footer__main > div:not(:first-child) a:hover {
  color: #ffffff;
  text-decoration: underline;
  text-underline-offset: 4px;
}

.service-footer address {
  display: grid;
  gap: 5px;
  margin-top: 14px;
  font-size: 14px;
  font-style: normal;
  line-height: 1.7;
}

.service-footer address a {
  margin-top: 0 !important;
  text-decoration: underline;
  text-underline-offset: 3px;
}

.service-footer__bottom {
  background: #14532d;
  border-top: 1px solid rgba(255, 255, 255, 0.2);
}

.service-footer__bottom > div {
  width: min(100% - 48px, 1200px);
  min-height: 58px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  color: rgba(255, 255, 255, 0.72);
  font-size: 13px;
}

.service-footer__bottom a {
  margin-left: 24px;
  text-decoration: none;
}

.service-footer__bottom a:hover {
  color: #ffffff;
}

@media (max-width: 1024px) {
  .service-footer__main {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 720px) {
  .service-footer__main {
    width: min(100% - 32px, 1200px);
    grid-template-columns: 1fr;
    gap: 30px;
    padding: 48px 0;
  }

  .service-footer__bottom > div {
    width: min(100% - 32px, 1200px);
    align-items: flex-start;
    flex-direction: column;
    padding: 18px 0;
  }

  .service-footer__bottom a {
    margin: 0 18px 0 0;
  }
}
</style>
