<script setup>
import { RouterLink } from "vue-router";

import logo from "@/assets/brand/love-calabanga-logo.png";
import { SHOW_MUSEUM_MODULE } from "@/config/featureFlags";
import { useNewsletterForm } from "@/modules/promotion/composables/useNewsletterForm";

const { newsletterEmail, newsletterMessage, isSubscribing, submitNewsletter } = useNewsletterForm();
</script>

<template>
  <footer class="site-footer">
    <div class="site-footer__main page-shell">
      <div>
        <RouterLink to="/home" class="footer-brand" aria-label="Love Calabanga - Home">
          <img :src="logo" alt="Love Calabanga" />
        </RouterLink>
        <p>
          The official tourism platform of the Local Government of Calabanga, Camarines Sur -
          celebrating our coast, culture, and craft.
        </p>
        <div class="social-row">
          <a aria-label="Facebook page pending" aria-disabled="true">f</a>
          <a aria-label="Instagram page pending" aria-disabled="true">◎</a>
          <a aria-label="Youtube page pending" aria-disabled="true">▶</a>
        </div>
      </div>

      <div>
        <h4>Explore</h4>
        <RouterLink to="/destinations">Destinations &amp; Map</RouterLink>
        <RouterLink to="/products">Products</RouterLink>
        <RouterLink to="/packages">Packages</RouterLink>
        <RouterLink to="/events">Events</RouterLink>
        <RouterLink v-if="SHOW_MUSEUM_MODULE" to="/promotion/museum">Virtual Museum</RouterLink>
      </div>

      <div>
        <h4>Visit</h4>
        <p>LGU Calabanga, Camarines Sur 4405</p>
        <p>+63 54 871 1234</p>
        <p>tourism@calabanga.gov.ph</p>
      </div>

      <div>
        <h4>Stay updated</h4>
        <p>Festival dates, new producers, and seasonal guides - once a month.</p>
        <form class="subscribe-form" @submit.prevent="submitNewsletter">
          <input v-model="newsletterEmail" aria-label="Email address" placeholder="you@email.com" />
          <button type="submit" :disabled="isSubscribing">
            {{ isSubscribing ? "Joining..." : "Join" }}
          </button>
        </form>
        <p v-if="newsletterMessage" class="footer-message">{{ newsletterMessage }}</p>
      </div>
    </div>

    <div class="site-footer__bottom">
      <div class="page-shell">
        <span>© 2026 LGU Calabanga, Camarines Sur. All rights reserved.</span>
        <span>
          <a aria-disabled="true">Privacy</a>
          <a aria-disabled="true">Accessibility</a>
          <RouterLink to="/promotion/inquiry">Contact</RouterLink>
        </span>
      </div>
    </div>
  </footer>
</template>

<style scoped>
.site-footer {
  background: #1b4332;
  color: #ffffff;
  font-family: Inter, system-ui, sans-serif;
}

.page-shell {
  width: min(100% - 48px, 1200px);
  margin: 0 auto;
}

.site-footer__main {
  display: grid;
  grid-template-columns: 1.35fr 1fr 1.25fr 1.25fr;
  gap: 56px;
  padding: 64px 0;
}

.site-footer p,
.site-footer a,
.site-footer small {
  color: rgba(255, 255, 255, 0.72);
  text-decoration: none;
}

.site-footer p {
  max-width: 290px;
  margin: 14px 0 0;
  font-size: 14px;
}

.footer-brand {
  display: inline-flex;
  align-items: center;
  padding: 10px 14px;
  background: #ffffff;
  border-radius: 12px;
}

.footer-brand img {
  height: 40px;
  width: auto;
  display: block;
}

.social-row {
  display: flex;
  gap: 10px;
  margin-top: 22px;
}

.social-row a {
  width: 36px;
  height: 36px;
  display: grid;
  place-items: center;
  border: 1px solid rgba(255, 255, 255, 0.22);
  border-radius: 999px;
  color: #ffffff;
  font-size: 14px;
}

.site-footer h4 {
  margin: 0 0 18px;
  color: #ffffff;
  font-family: "Plus Jakarta Sans", system-ui, sans-serif;
  font-size: 12px;
  font-weight: 500;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.site-footer__main > div:not(:first-child) a {
  display: block;
  margin-top: 11px;
  font-size: 14px;
}

.subscribe-form {
  display: flex;
  gap: 8px;
  margin-top: 16px;
}

.subscribe-form input {
  min-width: 0;
  flex: 1;
  height: 40px;
  padding: 0 12px;
  border: 1px solid rgba(255, 255, 255, 0.22);
  border-radius: 8px;
  outline: 0;
  background: rgba(255, 255, 255, 0.1);
  color: #ffffff;
  font-family: inherit;
  font-size: 14px;
}

.subscribe-form input::placeholder {
  color: rgba(255, 255, 255, 0.5);
}

.subscribe-form button {
  height: 40px;
  padding: 0 18px;
  border: 0;
  border-radius: 8px;
  background: #ffffff;
  color: #1b4332;
  font-family: inherit;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
}

.subscribe-form button:disabled {
  cursor: wait;
  opacity: 0.72;
}

.footer-message {
  margin-top: 10px !important;
  color: rgba(255, 255, 255, 0.72);
  font-size: 12px !important;
}

.site-footer__bottom {
  background: #14532d;
  border-top: 1px solid rgba(255, 255, 255, 0.2);
}

.site-footer__bottom .page-shell {
  min-height: 58px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  color: rgba(255, 255, 255, 0.72);
  font-size: 13px;
}

.site-footer__bottom a {
  margin-left: 24px;
}

@media (max-width: 1024px) {
  .site-footer__main {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 760px) {
  .page-shell {
    width: min(100% - 32px, 1200px);
  }

  .site-footer__main {
    grid-template-columns: 1fr;
    gap: 32px;
    padding: 48px 0;
  }

  .site-footer__bottom .page-shell {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
    padding: 16px 0;
  }

  .site-footer__bottom a {
    margin-left: 0;
    margin-right: 16px;
  }
}
</style>
