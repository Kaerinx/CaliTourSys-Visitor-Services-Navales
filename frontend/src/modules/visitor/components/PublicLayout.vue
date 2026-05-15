<template>
  <div>
    <nav class="public-nav">
      <RouterLink class="brand" to="/">
        <span class="brand-mark">⌖</span>
        <span><strong>Calabanga Tourism</strong><span>Camarines Sur</span></span>
      </RouterLink>
      <div class="public-links">
        <RouterLink to="/">Home</RouterLink>
        <RouterLink to="/about">About</RouterLink>
        <RouterLink to="/destinations">Destinations</RouterLink>
        <RouterLink to="/events">Events</RouterLink>
        <RouterLink to="/inquiries">Inquiries</RouterLink>
        <RouterLink to="/login">Login</RouterLink>
      </div>
    </nav>
    <slot />
    <footer class="site-footer">
      <div class="page footer-grid">
        <div>
          <h2>⌖ Calabanga Tourism Office</h2>
          <p>Discover the beauty and culture of Calabanga, Camarines Sur</p>
        </div>
        <div>
          <h2>Contact Us</h2>
          <p>Municipal Hall, Calabanga</p>
          <p>Camarines Sur, Philippines</p>
          <p>Email: tourism@calabanga.gov.ph</p>
          <p>Phone: (054) 123-4567</p>
        </div>
        <div>
          <h2>Quick Links</h2>
          <p>Destinations</p>
          <p>Events</p>
          <p>Submit Inquiry</p>
          <p>Staff Login</p>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup>
import '../styles.css'
</script>
