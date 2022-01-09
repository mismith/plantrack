<template>
  <SelectMenu
    :value="modelValue.length"
    clearable
    class="TagSelect"
    @clear="handleChange([])"
  >
    <template #prepend>
      <button type="button" class="btn-octicon ml-0 mr-1" @click="isAddingTag = !isAddingTag">
        <Octicon name="plus-circle" />
      </button>
    </template>
    <template #value>
      <span
        v-for="tag in modelValue.map(tagId => tags.find(({ id }) => id === tagId)).filter(Boolean)"
        :key="tag.id"
        class="Label mr-1"
        :style="{ color: tag.color, borderColor: tag.color && 'currentColor' }"
      >
        {{tag.name}}
      </span>
    </template>
    <div class="SelectMenu-list">
      <button
        v-for="tag in tags"
        :key="tag.id"
        type="button"
        role="menuitemcheckbox"
        :aria-checked="modelValue.includes(tag.id)"
        class="SelectMenu-item"
        @click="handleChange(modelValue.includes(tag.id) ? modelValue.filter(tagId => tagId !== tag.id) : modelValue.concat(tag.id))"
      >
        <Octicon name="check" class="SelectMenu-icon SelectMenu-icon--check" />
        <span
          class="Label Label--large mr-auto"
          :style="{ color: tag.color, borderColor: tag.color && 'currentColor' }"
        >
          {{tag.name}}
        </span>
        <span class="circle btn-octicon p-1 ml-3 mr-n2" @click.stop="isEditingTag = tag">
          <Octicon name="pencil" />
        </span>
      </button>
    </div>
  </SelectMenu>
</template>

<script lang="ts">
import { defineComponent, inject, PropType } from 'vue'

import { useTags } from '../services/data'

import Button from '../components/Button.vue'
import Octicon from '../components/Octicon.vue'
import SelectMenu from '../components/SelectMenu.vue'

export default defineComponent({
  name: 'TagSelect',
  components: {
    Button,
    Octicon,
    SelectMenu,
  },
  props: {
    modelValue: {
      type: Array as PropType<string[]>,
      default: () => [],
    },
  },
  setup(props, { emit }) {
    const tags = useTags()

    function handleChange(newValue: string[]) {
      emit('update:modelValue', newValue)
    }

    return {
      isAddingTag: inject('isAddingTag'),
      isEditingTag: inject('isEditingTag'),

      tags,
      handleChange,
    }
  },
})
</script>