<script setup>
const props = defineProps({
  name: {
    type: String,
    default: 'circle',
  },
})

const paths = {
  alert: ['M12 9v4', 'M12 17h.01', 'M10.3 3.9 2.6 18a2 2 0 0 0 1.7 3h15.4a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z'],
  arrowRight: ['M5 12h14', 'm13 6 6 6-6 6'],
  audit: ['M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z', 'M14 2v6h6', 'M8 13h8', 'M8 17h5'],
  building: ['M3 21h18', 'M5 21V7l8-4v18', 'M19 21V11l-6-3', 'M9 9h1', 'M9 13h1', 'M9 17h1', 'M16 14h1', 'M16 18h1'],
  calendar: ['M8 2v4', 'M16 2v4', 'M3 10h18', 'M5 4h14a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z'],
  check: ['M20 6 9 17l-5-5'],
  circle: ['M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z'],
  dashboard: ['M3 13h8V3H3v10Z', 'M13 21h8V11h-8v10Z', 'M13 3v6h8V3h-8Z', 'M3 21h8v-6H3v6Z'],
  destinations: ['M12 21s7-4.4 7-11a7 7 0 1 0-14 0c0 6.6 7 11 7 11Z', 'M12 10.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z'],
  empty: ['M4 7h16', 'M7 7v12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V7', 'M9 7V5a3 3 0 0 1 6 0v2'],
  eye: ['M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z', 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z'],
  eyeOff: ['M3 3l18 18', 'M10.6 10.6A3 3 0 0 0 13.4 13.4', 'M9.9 4.2A10.6 10.6 0 0 1 12 4c6.5 0 10 8 10 8a18.5 18.5 0 0 1-2.1 3.2', 'M6.6 6.6C3.6 8.6 2 12 2 12s3.5 8 10 8a9.7 9.7 0 0 0 4.2-.9'],
  image: ['M21 19V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2Z', 'M8.5 10a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z', 'm21 15-5-5L5 21'],
  lock: ['M7 11V7a5 5 0 0 1 10 0v4', 'M5 11h14v10H5V11Z'],
  logOut: ['M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4', 'M16 17l5-5-5-5', 'M21 12H9'],
  mail: ['M4 4h16v16H4V4Z', 'm22 6-10 7L2 6'],
  map: ['M9 18 3 21V6l6-3 6 3 6-3v15l-6 3-6-3Z', 'M9 3v15', 'M15 6v15'],
  menu: ['M4 6h16', 'M4 12h16', 'M4 18h16'],
  message: ['M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4v8Z'],
  museum: ['M3 10h18', 'M5 10V8l7-5 7 5v2', 'M6 10v9', 'M10 10v9', 'M14 10v9', 'M18 10v9', 'M4 19h16'],
  package: ['M21 8 12 3 3 8l9 5 9-5Z', 'M3 8v8l9 5 9-5V8', 'M12 13v8'],
  refresh: ['M21 12a9 9 0 0 1-15.1 6.6L3 16', 'M3 21v-5h5', 'M3 12A9 9 0 0 1 18.1 5.4L21 8', 'M21 3v5h-5'],
  search: ['M21 21l-4.3-4.3', 'M10.5 18a7.5 7.5 0 1 0 0-15 7.5 7.5 0 0 0 0 15Z'],
  shield: ['M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z'],
  users: ['M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2', 'M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z', 'M22 21v-2a4 4 0 0 0-3-3.9', 'M16 3.1a4 4 0 0 1 0 7.8'],
}
</script>

<template>
  <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
    <path
      v-for="path in paths[props.name] || paths.circle"
      :key="path"
      :d="path"
      stroke="currentColor"
      stroke-linecap="round"
      stroke-linejoin="round"
      stroke-width="2"
    />
  </svg>
</template>
