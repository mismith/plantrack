<template>
  <Plotter />
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import Plotter from './components/Plotter.vue'

export default defineComponent({
  name: 'App',
  components: {
    Plotter
  }
})
</script>

<style>
html,
body,
#app {
  width: 100%;
  height: 100%;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
}
</style>