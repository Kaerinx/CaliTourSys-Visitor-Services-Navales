<template>
  <main>
    <section
      class="page-hero photo-hero"
      :style="{ '--hero-image': `url(${tourismImages.aboutCover})` }"
    >
      <span class="hero-kicker">About Calabanga Tourism</span>
      <h1>Promoting sustainable local tourism</h1>
      <p>
        The Calabanga Tourism Office supports responsible travel, cultural appreciation, and
        visitor services that highlight the heart of Bicol.
      </p>
    </section>

    <section class="public-section">
      <div class="public-grid">
        <article class="public-card public-card-body value-card">
          <span class="value-icon">01</span>
          <h3>Our Mission</h3>
          <p>
            To promote Calabanga as a premier tourism destination through sustainable development,
            cultural preservation, and excellent visitor services.
          </p>
        </article>
        <article class="public-card public-card-body value-card">
          <span class="value-icon">02</span>
          <h3>Our Vision</h3>
          <p>
            A thriving tourism industry that highlights Calabanga's natural resources, rich cultural
            heritage, and vibrant community.
          </p>
        </article>
        <article class="public-card public-card-body value-card">
          <span class="value-icon">03</span>
          <h3>Visitor Services</h3>
          <p>
            Assistance for travel planning, accommodation inquiries, destination information, and
            local tourism support.
          </p>
        </article>
      </div>

      <section class="about-story">
        <div>
          <span class="pill">Welcome to Calabanga</span>
          <h2>Nature, heritage, and community in one destination</h2>
        </div>
        <div>
          <p>
            Calabanga is a first-class municipality in Camarines Sur known for agricultural lands,
            coastal resources, warm hospitality, and meaningful cultural experiences.
          </p>
          <p>
            From eco-tourism parks and resort destinations to heritage exhibits and community
            festivals, Calabanga offers travelers a grounded and memorable Bicol experience.
          </p>
        </div>
      </section>
    </section>
  </main>
</template>

<script setup>
import { tourismImages } from '../../../data/tourismImages'
</script>

<style scoped>
.value-card {
  min-height: 260px;
}

.value-icon {
  width: 46px;
  height: 46px;
  display: grid;
  place-items: center;
  margin-bottom: 1.4rem;
  border-radius: 50%;
  background: var(--soft-green);
  color: var(--primary-green);
  font-weight: 900;
}

.about-story {
  display: grid;
  grid-template-columns: 0.9fr 1.1fr;
  gap: clamp(1.5rem, 4vw, 4rem);
  margin-top: 2rem;
  border-radius: 24px;
  padding: clamp(1.75rem, 5vw, 4rem);
  background: #fff;
  box-shadow: 0 16px 38px rgba(15, 23, 42, 0.07);
}

.about-story h2 {
  margin: 1rem 0 0;
  font-size: clamp(2rem, 4vw, 3.25rem);
  line-height: 1.08;
}

.about-story p {
  margin-top: 0;
  color: var(--muted);
  font-size: 1.08rem;
  line-height: 1.75;
}

@media (max-width: 900px) {
  .about-story {
    grid-template-columns: 1fr;
  }
}
</style>
