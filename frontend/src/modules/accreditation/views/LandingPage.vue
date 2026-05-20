<template>
  <div class="public-page">
    <nav class="public-nav">
      <div class="public-nav-inner">
        <div class="public-brand">
          <div class="public-brand-mark">
            <Building2 :size="24" />
          </div>
          <div>
            <h2>LGU Tourism</h2>
            <p>Accreditation System</p>
          </div>
        </div>

        <div class="public-nav-actions">
          <button class="btn ghost" type="button" @click="openLogin">Login</button>
          <RouterLink class="btn primary" to="/accreditation/register">Get Started</RouterLink>
        </div>
      </div>
    </nav>

    <main class="public-main">
      <section class="hero-section">
        <h1>Business Accreditation Made Simple</h1>
        <p>
          Get your tourism business officially accredited by the LGU Tourism
          Office. Fast, secure, and fully online.
        </p>
        <div class="hero-actions">
          <RouterLink class="btn primary large" to="/accreditation/register">
            Apply for Accreditation
          </RouterLink>
          <button class="btn outline large" type="button" @click="openLogin">
            Already have an account?
          </button>
        </div>
      </section>

      <section class="feature-grid">
        <article v-for="feature in features" :key="feature.title" class="feature-card">
          <div class="feature-icon">
            <component :is="feature.icon" :size="24" />
          </div>
          <h3>{{ feature.title }}</h3>
          <p>{{ feature.description }}</p>
        </article>
      </section>

      <section class="public-callout">
        <h2>Ready to get accredited?</h2>
        <p>
          Join tourism businesses already accredited with our LGU Tourism Office.
        </p>
        <RouterLink class="btn light large" to="/accreditation/register">
          Start Your Application Now
        </RouterLink>
      </section>
    </main>

    <footer class="public-footer">
      <p>2026 LGU Tourism Office. All rights reserved.</p>
    </footer>

    <LoginModal
      :open="showLogin"
      @close="showLogin = false"
      @switch-register="switchToRegister"
    />
  </div>
</template>

<script setup>
import { ref } from "vue";
import { Building2, CheckCircle, Clock, FileText, Shield } from "@lucide/vue";
import LoginModal from "@/modules/accreditation/components/modals/LoginModal.vue";

const showLogin = ref(false);

const features = [
  {
    icon: FileText,
    title: "Easy Application",
    description: "Submit your accreditation application online with a simple step-by-step process.",
  },
  {
    icon: Clock,
    title: "Track Status",
    description: "Monitor your application progress in real time with notifications.",
  },
  {
    icon: CheckCircle,
    title: "Fast Approval",
    description: "Get quick feedback and approval from tourism office staff.",
  },
  {
    icon: Shield,
    title: "Secure and Reliable",
    description: "Your business information is protected with a structured access system.",
  },
];

function openLogin() {
  showLogin.value = true;
}

function switchToRegister() {
  showLogin.value = false;
  window.location.href = "/accreditation/register";
}
</script>
