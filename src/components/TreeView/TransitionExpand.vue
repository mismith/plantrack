<!-- Adapted from: https://github.com/maoberlehner/transition-to-height-auto-with-vue/blob/master/src/components/TransitionExpand.vue -->

<template>
  <component
    :is="group ? 'transition-group' : 'transition'"
    name="expand"
    @enter="onEnter"
    @after-enter="onAfterEnter"
    @leave="onLeave"
  >
    <slot />
  </component>
</template>

<script>
import { Transition, TransitionGroup } from 'vue'

export default {
  name: 'TransitionExpand',
  components: {
    Transition,
    TransitionGroup,
  },
  props: {
    group: {
      type: Boolean,
      default: false,
    },
  },
  setup() {
    return {
      onAfterEnter(element) {
        element.style.height = 'auto'
      },
      onEnter(element) {
        const { width } = getComputedStyle(element)
        element.style.width = width
        element.style.position = 'absolute'
        element.style.visibility = 'hidden'
        element.style.height = 'auto'
        const { height } = getComputedStyle(element)
        element.style.width = null
        element.style.position = null
        element.style.visibility = null
        element.style.height = 0
        // Force repaint to make sure the
        // animation is triggered correctly.
        getComputedStyle(element).height
        requestAnimationFrame(() => {
          element.style.height = height
        })
      },
      onLeave(element) {
        const { height } = getComputedStyle(element)
        element.style.height = height
        // Force repaint to make sure the
        // animation is triggered correctly.
        getComputedStyle(element).height
        requestAnimationFrame(() => {
          element.style.height = 0
        })
      },
    }
  },
}
</script>

<style scoped>
* {
  will-change: height;
  /* @mismith: disabled because causes some overflow issues on nested contents */
  /* transform: translateZ(0); */
  /* backface-visibility: hidden; */
  /* perspective: 1000px; */
}
</style>

<style>
.expand-enter-active,
.expand-leave-active {
  transition: height 0.2s ease-in-out;
  overflow: hidden;
}
.expand-enter,
.expand-leave-to {
  height: 0;
}
</style>
