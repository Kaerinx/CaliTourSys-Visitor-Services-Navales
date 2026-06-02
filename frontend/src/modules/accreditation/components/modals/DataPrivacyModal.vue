<template>
  <div v-if="open" class="public-modal-backdrop" @click.self="$emit('close')">
    <section class="privacy-modal-card">
      <header class="privacy-modal-header">
        <h1>Data Privacy Notice</h1>
        <button type="button" @click="$emit('close')">x</button>
      </header>

      <div class="privacy-modal-body">
        <p>
          The Department of Tourism, in line with Republic Act 10173 or the Data
          Privacy Act of 2012, is committed to protect and secure personal
          information obtained in the performance of its mandate under The Tourism
          Act of 2009. Pursuant to its mandate, the Department collects the
          following personal information: (i) full name of applicant or its
          official representative, (ii) home/office address, (iii) e-mail address,
          (iv) contact numbers, (v) nationality, (vi) TIN, (vi) SSS/GSIS Number,
          (vii) financial information, and other personal information relevant in
          the processing of accreditation applications and other DOT applications.
        </p>

        <p>
          In compliance with the requirements of Data Privacy Act of 2012, the
          Department commits to ensure that all personal information obtained will
          be secured and remain confidential. Collected personal information will
          only be utilized for purposes of processing of applications,
          documentation, research, if applicable, and facilitation of future
          transaction. The personal information shall not be shared or disclosed
          with other parties without consent unless the disclosure is required by,
          or in compliance with applicable laws and regulations.
        </p>

        <p>
          Only the agency's designated personnel/Personal Information Controllers
          will have access to the collected information, which will be stored for
          three (3) years after the expiration of accreditation or after the
          completion of relevant transaction. The manner of disposition of physical
          documents will be based on the provision of the National Archive of the
          Philippines and/or deletion in the agency's database. Corrections of
          personal information or withdrawal of data privacy consent, if given, is
          done by informing the Department in writing through privacy@tourism.gov.ph.
        </p>
      </div>

      <footer class="privacy-modal-footer">
        <button class="btn danger" type="button" @click="$emit('close')">
          Close
        </button>
      </footer>
    </section>
  </div>
</template>

<script setup>
defineProps({
  open: { type: Boolean, required: true },
});

defineEmits(["close"]);
</script>
