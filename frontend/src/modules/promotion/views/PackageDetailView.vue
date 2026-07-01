<script setup>
import { computed, onMounted, ref } from 'vue'
import { getPackageById } from '../services/promotionService'

const props = defineProps({
  slug: {
    type: String,
    required: true,
  },
})

const tourismPackage = ref(null)
const isLoading = ref(false)
const errorMessage = ref('')

const packageItems = computed(() => tourismPackage.value?.items || [])

async function loadPackage() {
  isLoading.value = true
  errorMessage.value = ''

  try {
    tourismPackage.value = await getPackageById(props.slug)
  } catch (error) {
    errorMessage.value = error.message || 'Unable to load this tourism package.'
  } finally {
    isLoading.value = false
  }
}

onMounted(loadPackage)
</script>

<template>
  <div class="package-detail-page">
    <header class="site-nav">
      <div class="site-nav__inner">
        <RouterLink to="/" class="brand" aria-label="TWBIS Home">
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
          <RouterLink to="/packages" class="site-nav__link site-nav__link--active">
            Packages
          </RouterLink>
          <RouterLink to="/events" class="site-nav__link">Events</RouterLink>
          <RouterLink to="/promotion/museum" class="site-nav__link">Museum</RouterLink>
          <div class="site-nav__dropdown">
            <button class="site-nav__link site-nav__dropdown-trigger" type="button" aria-haspopup="true">
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

        <RouterLink class="login-button" :to="{ path: $route.path, query: { ...$route.query, auth: 'login' } }">
          Login
        </RouterLink>
      </div>
    </header>

    <main class="page-shell">
      <div v-if="isLoading" class="state-card">
        <p>Loading package...</p>
      </div>

      <div v-else-if="errorMessage" class="state-card">
        <h1>Package unavailable</h1>
        <p>{{ errorMessage }}</p>
        <RouterLink to="/packages">Back to Packages</RouterLink>
      </div>

      <article v-else-if="tourismPackage" class="detail-layout">
        <section class="detail-hero">
          <RouterLink to="/packages" class="back-link">Back to Packages</RouterLink>
          <span class="status-pill">{{ tourismPackage.packageStatus }}</span>
          <h1>{{ tourismPackage.name }}</h1>
          <p>{{ tourismPackage.description }}</p>
          <div class="hero-actions">
            <RouterLink to="/promotion/inquiry" class="primary-button">Send inquiry</RouterLink>
            <span>{{ tourismPackage.price }}</span>
          </div>
        </section>

        <aside class="summary-panel">
          <h2>Package Summary</h2>
          <dl>
            <div>
              <dt>Target market</dt>
              <dd>{{ tourismPackage.targetMarket }}</dd>
            </div>
            <div>
              <dt>Estimated duration</dt>
              <dd>{{ tourismPackage.estimatedDuration }}</dd>
            </div>
            <div>
              <dt>Included items</dt>
              <dd>{{ tourismPackage.itemCount }}</dd>
            </div>
            <div>
              <dt>Source module</dt>
              <dd>Product Development</dd>
            </div>
          </dl>
        </aside>

        <img
          class="detail-image"
          :src="tourismPackage.imageUrl"
          :alt="`${tourismPackage.name} image`"
        />

        <section class="items-panel">
          <h2>Included Assets</h2>
          <p v-if="packageItems.length === 0">
            The Product Development module has not attached detailed package items yet.
          </p>
          <div v-else class="item-list">
            <div v-for="item in packageItems" :key="`${item.itemType}-${item.id || item.referenceId}`" class="item-row">
              <span>{{ item.itemType }}</span>
              <div>
                <strong>{{ item.name }}</strong>
                <p>{{ item.location || item.status || 'Calabanga tourism package item' }}</p>
              </div>
            </div>
          </div>
        </section>

        <section v-if="tourismPackage.remarks" class="items-panel">
          <h2>Promotion Notes</h2>
          <p>{{ tourismPackage.remarks }}</p>
        </section>
      </article>
    </main>

    <footer class="site-footer">
      <div class="site-footer__bottom page-shell">
        <span>Copyright 2026 LGU Calabanga, Camarines Sur. All rights reserved.</span>
        <span>
          <RouterLink to="/packages">Packages</RouterLink>
          <RouterLink to="/promotion/inquiry">Contact</RouterLink>
        </span>
      </div>
    </footer>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@500;600;700;800&display=swap');

.package-detail-page {
  min-height: 100vh;
  background: #f2f0eb;
  color: #1a1a1a;
  font-family: Inter, system-ui, sans-serif;
}

a {
  color: inherit;
  text-decoration: none;
}

.page-shell {
  width: min(100% - 48px, 1200px);
  margin: 0 auto;
  padding: 112px 0 88px;
}

.site-nav {
  position: fixed;
  z-index: 50;
  top: 0;
  right: 0;
  left: 0;
  height: 64px;
  background: #ffffff;
  border-bottom: 1px solid #e8e4dc;
}

.site-nav__inner {
  width: min(100% - 48px, 1200px);
  height: 100%;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
}

.brand {
  display: inline-flex;
  align-items: center;
  gap: 10px;
}

.brand__mark {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: grid;
  place-items: center;
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
  align-items: stretch;
  justify-content: center;
  gap: 14px;
}

.site-nav__link {
  position: relative;
  display: flex;
  align-items: center;
  padding: 0 6px;
  color: #1a1a1a;
  font-size: 15px;
  font-weight: 500;
}

.site-nav__link--active,
.site-nav__link:hover {
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
  content: '';
}

.login-button,
.primary-button {
  min-height: 38px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0 18px;
  border: 1.5px solid #1b4332;
  border-radius: 8px;
  color: #1b4332;
  font-size: 14px;
  font-weight: 700;
}

.primary-button {
  background: #1b4332;
  color: #ffffff;
}

.detail-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 360px;
  gap: 24px;
}

.detail-hero,
.detail-image,
.summary-panel,
.items-panel,
.state-card {
  border: 1px solid #e8e4dc;
  border-radius: 12px;
  background: #ffffff;
}

.detail-hero {
  min-height: 420px;
  display: flex;
  flex-direction: column;
  padding: 36px;
  background:
    radial-gradient(circle at 85% 10%, rgba(212, 172, 13, 0.2), transparent 30%),
    #ffffff;
}

.detail-image {
  width: 100%;
  grid-column: 1 / -1;
  min-height: 420px;
  background-color: #dfe9e4;
  object-fit: cover;
}

.back-link {
  margin-bottom: 28px;
  color: #1b4332;
  font-size: 14px;
  font-weight: 700;
}

.status-pill {
  align-self: flex-start;
  min-height: 28px;
  display: inline-flex;
  align-items: center;
  padding: 4px 12px;
  border-radius: 999px;
  background: #e6f3ee;
  color: #1b4332;
  font-size: 12px;
  font-weight: 800;
}

h1,
h2 {
  color: #14261f;
  font-family: "Plus Jakarta Sans", system-ui, sans-serif;
}

h1 {
  max-width: 780px;
  margin: 20px 0 0;
  font-size: 48px;
  line-height: 1.1;
}

.detail-hero p {
  max-width: 720px;
  margin: 18px 0 0;
  color: #5c5c5c;
  font-size: 17px;
  line-height: 1.7;
}

.hero-actions {
  display: flex;
  align-items: center;
  gap: 18px;
  margin-top: auto;
  padding-top: 36px;
  color: #14261f;
  font-weight: 800;
}

.summary-panel,
.items-panel,
.state-card {
  padding: 28px;
}

.summary-panel h2,
.items-panel h2 {
  margin: 0 0 18px;
  font-size: 20px;
}

dl {
  display: grid;
  gap: 16px;
  margin: 0;
}

dt {
  color: #6b746f;
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
}

dd {
  margin: 4px 0 0;
  color: #14261f;
  font-weight: 700;
}

.items-panel {
  grid-column: 1 / -1;
}

.items-panel > p {
  margin: 0;
  color: #5c5c5c;
  line-height: 1.65;
}

.item-list {
  display: grid;
  gap: 12px;
}

.item-row {
  display: grid;
  grid-template-columns: 96px minmax(0, 1fr);
  gap: 18px;
  padding: 16px;
  border-radius: 8px;
  background: #f6f7f4;
}

.item-row > span {
  align-self: start;
  justify-self: start;
  padding: 4px 10px;
  border-radius: 999px;
  background: #e6f3ee;
  color: #1b4332;
  font-size: 12px;
  font-weight: 800;
  text-transform: capitalize;
}

.item-row strong {
  color: #14261f;
}

.item-row p {
  margin: 4px 0 0;
  color: #5c5c5c;
}

.state-card {
  max-width: 680px;
}

.state-card h1 {
  margin-top: 0;
}

.state-card a {
  display: inline-flex;
  margin-top: 18px;
  color: #1b4332;
  font-weight: 700;
}

.site-footer {
  background: #1b4332;
  color: rgba(255, 255, 255, 0.72);
}

.site-footer__bottom {
  min-height: 64px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  padding-top: 0;
  padding-bottom: 0;
  font-size: 13px;
}

.site-footer a {
  margin-left: 22px;
  color: rgba(255, 255, 255, 0.78);
  font-weight: 700;
}

@media (max-width: 1024px) {
  .site-nav__links {
    display: none;
  }

  .detail-layout {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 720px) {
  .page-shell,
  .site-nav__inner {
    width: min(100% - 32px, 1200px);
  }

  .brand__copy,
  .login-button {
    display: none;
  }

  h1 {
    font-size: 36px;
  }

  .detail-hero,
  .summary-panel,
  .items-panel,
  .state-card {
    padding: 22px;
  }

  .hero-actions {
    align-items: flex-start;
    flex-direction: column;
  }

  .item-row {
    grid-template-columns: 1fr;
  }

  .site-footer__bottom {
    align-items: flex-start;
    flex-direction: column;
    padding-top: 18px;
    padding-bottom: 18px;
  }

  .site-footer a {
    margin: 0 18px 0 0;
  }
}
</style>




