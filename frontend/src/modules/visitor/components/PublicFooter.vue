<template>
  <footer class="public-footer">
    <div class="public-footer-inner">
      <section class="footer-column footer-office">
        <div class="footer-heading">
          <span class="footer-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none">
              <path
                d="M12 21s7-5.1 7-11.2A7 7 0 0 0 5 9.8C5 15.9 12 21 12 21Z"
                stroke="currentColor"
                stroke-width="2"
              />
              <circle cx="12" cy="9.8" r="2.4" stroke="currentColor" stroke-width="2" />
            </svg>
          </span>
          <h2>Calabanga Tourism Office</h2>
        </div>
        <p>Discover the beauty and culture of Calabanga, Camarines Sur.</p>
      </section>

      <section class="footer-column">
        <h2>Contact Us</h2>
        <address>
          <span>Municipal Hall, Calabanga</span>
          <span>Camarines Sur, Philippines</span>
          <span>Email: tourism@calabanga.gov.ph</span>
          <span>Phone: (054) 123-4567</span>
        </address>
      </section>

      <nav class="footer-column footer-links" aria-label="Footer quick links">
        <h2>Quick Links</h2>
        <RouterLink to="/destinations">Destinations</RouterLink>
        <RouterLink to="/events">Events</RouterLink>
        <RouterLink to="/inquiries">Submit Inquiry</RouterLink>
        <RouterLink to="/login">Staff Login</RouterLink>
      </nav>
    </div>

    <div class="footer-bottom">
      <p>© 2026 Calabanga Tourism Office. All rights reserved.</p>
    </div>
  </footer>
</template>

<style scoped>
.public-footer {
  margin-top: 0;
  background: #174933;
  color: rgba(255, 255, 255, 0.92);
}

.public-footer-inner {
  width: min(1520px, calc(100% - clamp(2rem, 8vw, 10rem)));
  display: grid;
  grid-template-columns: 1.25fr 1fr 0.9fr;
  gap: clamp(2rem, 5vw, 5rem);
  margin: 0 auto;
  padding: clamp(3rem, 6vw, 4.5rem) 0 2.25rem;
}

.footer-column {
  min-width: 0;
}

.footer-heading {
  display: flex;
  align-items: center;
  gap: 0.8rem;
}

.footer-icon {
  width: 34px;
  height: 34px;
  display: grid;
  place-items: center;
  flex: 0 0 34px;
  border-radius: 999px;
  color: #fff;
  background: rgba(255, 255, 255, 0.12);
}

.footer-icon svg {
  width: 22px;
  height: 22px;
}

.public-footer h2 {
  margin: 0 0 1.1rem;
  color: #fff;
  font-size: 1.25rem;
  line-height: 1.25;
}

.footer-heading h2 {
  margin-bottom: 0;
}

.public-footer p,
.public-footer address {
  margin: 1rem 0 0;
  color: rgba(255, 255, 255, 0.78);
  line-height: 1.7;
}

.public-footer address {
  display: grid;
  gap: 0.45rem;
  font-style: normal;
}

.footer-links {
  display: grid;
  align-content: start;
  gap: 0.65rem;
}

.footer-links a {
  width: fit-content;
  color: rgba(255, 255, 255, 0.78);
  text-decoration: none;
  transition:
    color 160ms ease,
    opacity 160ms ease,
    text-decoration-color 160ms ease;
}

.footer-links a:hover,
.footer-links a:focus-visible {
  color: #fff;
  text-decoration: underline;
  text-decoration-thickness: 2px;
  text-underline-offset: 4px;
  outline: none;
}

.footer-bottom {
  width: min(1520px, calc(100% - clamp(2rem, 8vw, 10rem)));
  margin: 0 auto;
  border-top: 1px solid rgba(255, 255, 255, 0.18);
  padding: 1.35rem 0 1.6rem;
  text-align: center;
}

.footer-bottom p {
  margin: 0;
  color: rgba(255, 255, 255, 0.74);
  font-size: 0.95rem;
}

@media (max-width: 900px) {
  .public-footer-inner {
    grid-template-columns: 1fr;
    gap: 2rem;
  }
}
</style>
