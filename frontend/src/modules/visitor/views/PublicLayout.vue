<template>
  <div class="public-shell">
    <header class="public-header">
      <RouterLink class="public-brand" to="/">
        <span class="brand-logo">⌖</span>
        <span>
          <strong>Calabanga Tourism</strong>
          <small>Camarines Sur</small>
        </span>
      </RouterLink>

      <nav class="public-nav">
        <RouterLink to="/">Home</RouterLink>
        <RouterLink to="/about">About</RouterLink>
        <RouterLink to="/destinations">Destinations</RouterLink>
        <RouterLink to="/events">Events</RouterLink>
        <RouterLink to="/inquiries">Inquiries</RouterLink>
        <span class="nav-divider"></span>
        <RouterLink to="/login">Login</RouterLink>
      </nav>
    </header>

    <RouterView />
  </div>
</template>

<style>
.public-shell {
  min-height: 100vh;
  background: #fff;
  color: #020617;
  font-family:
    Inter,
    ui-sans-serif,
    system-ui,
    -apple-system,
    BlinkMacSystemFont,
    'Segoe UI',
    sans-serif;
}

.public-header {
  position: sticky;
  top: 0;
  z-index: 10;
  height: 78px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 2rem;
  padding: 0 10vw;
  background: #fff;
  border-bottom: 1px solid #e5e7eb;
  box-shadow: 0 1px 4px rgba(15, 23, 42, 0.08);
}

.public-brand {
  display: inline-flex;
  align-items: center;
  gap: 0.9rem;
  color: inherit;
  text-decoration: none;
}

.brand-logo {
  width: 50px;
  height: 50px;
  display: grid;
  place-items: center;
  border-radius: 12px;
  background: #2563eb;
  color: #fff;
  font-size: 1.5rem;
  box-shadow: 0 3px 10px rgba(37, 99, 235, 0.25);
}

.public-brand strong {
  display: block;
  font-size: 1.35rem;
}

.public-brand small {
  display: block;
  color: #475569;
}

.public-nav {
  display: flex;
  align-items: center;
  gap: 1.8rem;
  font-weight: 650;
}

.public-nav a {
  color: #334155;
  text-decoration: none;
}

.public-nav a.router-link-active,
.public-nav a:hover {
  color: #075cff;
}

.nav-divider {
  width: 1px;
  height: 24px;
  background: #cbd5e1;
}

.public-section {
  width: min(1520px, calc(100% - 10vw));
  margin: 0 auto;
  padding: 4rem 0;
}

.public-hero {
  min-height: 500px;
  display: grid;
  place-items: center;
  text-align: center;
  color: #fff;
  background: linear-gradient(120deg, #2563eb 0%, #0ea5e9 45%, #00a84f 100%);
  box-shadow: inset 0 -80px 55px rgba(255, 255, 255, 0.65);
}

.public-hero h1 {
  margin: 0 0 1.5rem;
  font-size: clamp(3rem, 5vw, 5rem);
  letter-spacing: 0;
}

.public-hero p {
  max-width: 900px;
  margin: 0 auto 2rem;
  font-size: 1.35rem;
  line-height: 1.45;
}

.public-actions {
  display: flex;
  justify-content: center;
  gap: 1rem;
}

.public-button {
  border: 1px solid #fff;
  border-radius: 8px;
  padding: 0.9rem 1.35rem;
  background: #fff;
  color: #075cff;
  font-weight: 750;
  text-decoration: none;
}

.public-button.secondary {
  background: transparent;
  color: #fff;
}

.section-title {
  text-align: center;
  margin-bottom: 3rem;
}

.section-title h1,
.section-title h2 {
  margin: 0 0 1rem;
  font-size: 2.6rem;
}

.section-title p {
  margin: 0 auto;
  max-width: 780px;
  color: #334155;
  font-size: 1.25rem;
  line-height: 1.5;
}

.public-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1.9rem;
}

.public-card {
  border: 1px solid #e5e7eb;
  border-radius: 14px;
  background: #fff;
  overflow: hidden;
}

.image-placeholder {
  min-height: 240px;
  display: grid;
  place-items: center;
  color: #94a3b8;
  background: linear-gradient(135deg, #dbeafe, #dcfce7);
}

.public-card-body {
  padding: 1.7rem;
}

.public-card h3 {
  margin: 0 0 1rem;
  font-size: 1.45rem;
}

.public-card p {
  color: #334155;
  line-height: 1.55;
}

.public-form-card {
  max-width: 840px;
  margin: 0 auto;
  padding: 2rem;
  border: 1px solid #e5e7eb;
  border-radius: 14px;
  background: #fff;
}

.public-form-grid {
  display: grid;
  gap: 1rem;
}

.public-form-grid label {
  font-weight: 700;
}

.public-form-grid input,
.public-form-grid textarea {
  width: 100%;
  margin-top: 0.45rem;
  border: 0;
  border-radius: 9px;
  padding: 0.9rem 1rem;
  background: #f1f1f4;
  font: inherit;
}

@media (max-width: 900px) {
  .public-header {
    height: auto;
    flex-direction: column;
    align-items: flex-start;
    padding: 1rem 5vw;
  }

  .public-nav {
    flex-wrap: wrap;
    gap: 1rem;
  }

  .public-grid {
    grid-template-columns: 1fr;
  }
}
</style>
