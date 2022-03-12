<script setup lang="ts">

</script>

<template>
  <div>
    <nav class="UnderlineNav color-bg-default" style="position: sticky; top: calc(48px + env(safe-area-inset-top)); z-index: 9;">
      <div class="UnderlineNav-body container-md">
        <router-link to="/plan/layout" class="UnderlineNav-item">Layout</router-link>
        <router-link to="/plan/timing" class="UnderlineNav-item">Timing</router-link>
      </div>
    </nav>
    <router-view v-slot="{ Component }">
      <KeepAlive>
        <component :is="Component"></component>
      </KeepAlive>
    </router-view>
  </div>
</template>
