<template>
  <div v-if="modelValue" class="Dialog" @click="close">
    <div @click.stop>
      <slot />
    </div>
    <button @click.prevent.stop="close">&times;</button>
  </div>
</template>

<script lang="ts">
import { defineComponent, toRefs } from 'vue'

export default defineComponent({
  name: 'Dialog',
  props: {
    modelValue: {
      type: Boolean,
    },
  },
  setup(props, { emit }) {
    const { modelValue } = toRefs(props)

    const close = () => emit('update:modelValue', false)

    return {
      modelValue,
      close,
    }
  },
})
</script>

<style lang="scss" scoped>
$spacing: 8px;

.Dialog {
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.67);
  padding: $spacing * 2;
  border-radius: calc($spacing / 2);
  z-index: 2;

  > div {
    background-color: white;
    border: 1px solid #999;
  }

  button {
    position: absolute;
    top: $spacing;
    right: $spacing;
  }

  :root.dark & {
    > div {
      background-color: black;
    }
  }
}
</style>