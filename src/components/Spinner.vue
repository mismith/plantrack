<template>
  <svg
    style="box-sizing: content-box; color: var(--color-icon-primary)"
    :width="size"
    :height="size"
    viewBox="0 0 16 16"
    fill="none"
    data-view-component="true"
    class="anim-rotate"
  >
    <circle
      cx="8"
      cy="8"
      r="7"
      stroke="currentColor"
      stroke-opacity="0.25"
      :stroke-width="thickness"
      vector-effect="non-scaling-stroke"
    ></circle>
    <path
      d="M15 8a7.002 7.002 0 00-7-7"
      stroke="currentColor"
      :stroke-width="thickness"
      stroke-linecap="round"
      vector-effect="non-scaling-stroke"
    ></path>
  </svg>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'Spinner',
  props: {
    size: {
      type: Number,
      default: 16,
    },
    thickness: {
      type: Number,
      default: 2,
    },
  },
})
</script>
