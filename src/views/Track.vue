<script setup lang="ts">

</script>

<template>
  <div>
    <nav class="UnderlineNav color-bg-default" style="position: sticky; top: calc(48px + env(safe-area-inset-top)); z-index: 9;">
      <div class="UnderlineNav-body container-md">
        <router-link to="/track/entries" class="UnderlineNav-item">Entries</router-link>
        <router-link to="/track/photos" class="UnderlineNav-item">Photos</router-link>
        <router-link to="/track/crops" class="UnderlineNav-item">Crops</router-link>
      </div>
    </nav>
    <router-view v-slot="{ Component }">
      <KeepAlive>
        <component :is="Component"></component>
      </KeepAlive>
    </router-view>
  </div>
</template>
