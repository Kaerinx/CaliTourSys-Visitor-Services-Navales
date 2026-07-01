<template>
  <header class="service-header">
    <div class="service-header__inner">
      <RouterLink class="brand" to="/" aria-label="TWBIS Home">
        <span class="brand__mark">T</span>
        <span class="brand__copy">
          <span class="brand__name">TWBIS</span>
          <span class="brand__tagline">Calabanga Tourism</span>
        </span>
      </RouterLink>

      <nav class="site-nav__links" aria-label="Primary navigation">
        <RouterLink to="/" class="site-nav__link">Home</RouterLink>
        <RouterLink to="/destinations" class="site-nav__link">Destination</RouterLink>
        <RouterLink to="/products" class="site-nav__link">Products</RouterLink>
        <RouterLink to="/packages" class="site-nav__link">Packages</RouterLink>
        <RouterLink to="/events" class="site-nav__link">Events</RouterLink>
        <RouterLink to="/promotion/museum" class="site-nav__link">Museum</RouterLink>
        <div class="site-nav__dropdown">
          <button class="site-nav__link site-nav__dropdown-trigger site-nav__link--active" type="button" aria-haspopup="true">
            Accreditation
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="m6 9 6 6 6-6" />
            </svg>
          </button>
          <div class="site-nav__dropdown-menu">
            <RouterLink to="/accreditation">Online Accreditation</RouterLink>
            <RouterLink to="/accredited-establishments">Accredited Establishments</RouterLink>
          </div>
        </div>
        <RouterLink to="/promotion/inquiry" class="site-nav__link">Inquiries</RouterLink>
      </nav>

      <div class="site-nav__actions">
        <a class="help-link" href="/accreditation#help">Help</a>
        <RouterLink v-if="showSignIn" class="login-button" to="/accreditation/login">Sign in</RouterLink>
      </div>
    </div>
  </header>
</template>

<script setup>
defineProps({
  showSignIn: {
    type: Boolean,
    default: true,
  },
});
</script>

<style scoped>
.service-header {
  position: sticky;
  z-index: 50;
  top: 0;
  height: 64px;
  border-bottom: 1px solid #e8e4dc;
  background: #ffffff;
}

.service-header__inner {
  width: min(100% - 48px, 1200px);
  height: 100%;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 32px;
}

.brand {
  display: inline-flex;
  align-items: center;
  flex: 0 0 auto;
  gap: 10px;
  text-decoration: none;
}

.brand__mark {
  width: 36px;
  height: 36px;
  display: grid;
  place-items: center;
  border-radius: 10px;
  background: #1b4332;
  color: #ffffff;
  font-family: "Plus Jakarta Sans", system-ui, sans-serif;
  font-weight: 700;
}

.brand__copy {
  display: flex;
  flex-direction: column;
  line-height: 1.05;
}

.brand__name {
  color: #1b4332;
  font-family: "Plus Jakarta Sans", system-ui, sans-serif;
  font-size: 20px;
  font-weight: 700;
}

.brand__tagline {
  color: #5c5c5c;
  font-size: 11px;
}

.site-nav__links {
  display: flex;
  align-self: stretch;
  align-items: center;
  justify-content: center;
  gap: 14px;
}

.site-nav__link {
  position: relative;
  display: flex;
  align-items: center;
  padding: 0 6px;
  border: 0;
  background: transparent;
  color: #1a1a1a;
  font: inherit;
  font-size: 15px;
  font-weight: 500;
  text-decoration: none;
  cursor: pointer;
}

.site-nav__link--active,
.site-nav__link:hover,
.site-nav__link:focus-visible {
  color: #1b4332;
}

.site-nav__link--active::after {
  position: absolute;
  right: 6px;
  bottom: 19px;
  left: 6px;
  height: 2px;
  border-radius: 999px;
  background: #1b4332;
  content: "";
}

.site-nav__dropdown-trigger.site-nav__link--active::after {
  content: none;
}

.site-nav__dropdown {
  position: relative;
  display: inline-flex;
  align-items: center;
}

.site-nav__dropdown-trigger {
  height: 100%;
  gap: 4px;
}

.site-nav__dropdown-trigger svg {
  width: 16px;
  height: 16px;
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 2;
}

.site-nav__dropdown-menu {
  position: absolute;
  top: calc(100% - 6px);
  left: 50%;
  width: 220px;
  display: grid;
  gap: 4px;
  padding: 10px;
  border: 1px solid #e8e4dc;
  border-radius: 12px;
  background: #ffffff;
  box-shadow: 0 18px 45px rgba(26, 26, 26, 0.12);
  opacity: 0;
  pointer-events: none;
  transform: translate(-50%, 8px);
  transition: opacity 0.18s ease, transform 0.18s ease;
}

.site-nav__dropdown:hover .site-nav__dropdown-menu,
.site-nav__dropdown:focus-within .site-nav__dropdown-menu {
  opacity: 1;
  pointer-events: auto;
  transform: translate(-50%, 0);
}

.site-nav__dropdown-menu a {
  padding: 10px 12px;
  border-radius: 8px;
  color: #1a1a1a;
  font-size: 14px;
  font-weight: 500;
  text-decoration: none;
}

.site-nav__dropdown-menu a:hover,
.site-nav__dropdown-menu a.router-link-active {
  background: #f2f0eb;
  color: #1b4332;
}

.site-nav__actions {
  display: flex;
  align-items: center;
  flex: 0 0 auto;
  gap: 12px;
}

.help-link,
.login-button {
  color: #1b4332;
  font-size: 14px;
  font-weight: 500;
  text-decoration: none;
}

.help-link:hover {
  text-decoration: underline;
  text-underline-offset: 4px;
}

.login-button {
  height: 38px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0 18px;
  border: 1.5px solid #1b4332;
  border-radius: 8px;
}

.login-button:hover,
.login-button:focus-visible {
  background: #d8f3dc;
}

@media (max-width: 1120px) {
  .site-nav__links {
    display: none;
  }
}

@media (max-width: 640px) {
  .service-header__inner {
    width: min(100% - 32px, 1200px);
    gap: 18px;
  }

  .help-link {
    display: none;
  }

  .brand__name {
    font-size: 18px;
  }

  .login-button {
    height: 36px;
    padding: 0 14px;
    font-size: 13px;
  }
}
</style>
