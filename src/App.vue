<template>
  <!-- <Plotter /> -->
  <Recorder />
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import Plotter from './components/Plotter.vue'
import Recorder from './components/Recorder.vue'

export default defineComponent({
  name: 'App',
  components: {
    Plotter,
    Recorder,
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