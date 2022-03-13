<script setup lang="ts">

</script>

<template>
  <div class="d-flex flex-column">
    <nav class="UnderlineNav color-bg-default" style="position: sticky; top: calc(48px + env(safe-area-inset-top)); z-index: 9;">
      <div class="UnderlineNav-body container-md">
        <router-link
          v-for="route in $router.options.routes.find(route => route.path.startsWith($route.path.split('/').slice(0, 2).join('/')))?.children?.filter(({ path }) => path)"
          :key="route.path"
          :to="route.path"
          class="UnderlineNav-item"
        >
          {{ route.meta?.title }}
        </router-link>
      </div>
    </nav>
    <router-view v-slot="{ Component }">
      <KeepAlive>
        <component :is="Component"></component>
      </KeepAlive>
    </router-view>
  </div>
</template>
