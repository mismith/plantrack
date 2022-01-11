<template>
  <SelectMenu
    :value="modelValue.length"
    createable
    createable-type="tag"
    clearable
    class="TagSelect"
    @create="isAddingTag = true"
    @clear="handleClear"
  >
    <template #value>
      <Tag
        v-for="tagId in modelValue"
        :key="tagId"
        :tag-id="tagId"
        class="mr-1"
      />
    </template>
    <div v-if="tags.length" class="SelectMenu-list">
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
        <Tag
          :tag-id="tag.id"
          class="Label--large mr-auto"
        />
        <span class="circle btn-octicon py-1 px-2 ml-3" @click.stop="isEditingTag = tag">
          <Octicon name="pencil" />
        </span>
        <span class="circle btn-octicon btn-octicon-danger py-1 px-2 ml-0 mr-n3" @click.stop="handleRemoveTag(tag, $event.shiftKey)">
          <Octicon name="trash" />
        </span>
      </button>
      <!-- @TODO: add fallback -->
    </div>
  </SelectMenu>
</template>

<script lang="ts">
import { defineComponent, inject, PropType } from 'vue'

import { Tag as ITag, useTags } from '../services/data'
import { useAsyncWrapper } from '../services/errors'

import Button from '../components/Button.vue'
import Octicon from '../components/Octicon.vue'
import SelectMenu from '../components/SelectMenu.vue'
import { database, getUserRefPath } from '../services/firebase'
import Tag from './Tag.vue'

export default defineComponent({
  name: 'TagSelect',
  components: {
    Button,
    Octicon,
    SelectMenu,
    Tag,
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
    function handleClear(...args: any) {
      emit('clear', ...args)
    }

    const toast = inject<Function>('toast')
    const [runAsync] = useAsyncWrapper()
    async function handleRemoveTag(tag: ITag, skipConfirm = false) {
      if (skipConfirm || window.confirm('Are you sure?')) {
        runAsync(async () => {
          await database.ref(getUserRefPath(`/tags/${tag.id}`)).remove()
          toast?.(`Tag deleted successfully`, 'success')
        })
      }
    }

    return {
      isAddingTag: inject('isAddingTag'),
      isEditingTag: inject('isEditingTag'),

      tags,
      handleChange,
      handleClear,
      handleRemoveTag,
    }
  },
})
</script>
