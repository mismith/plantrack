<template>
  <SelectMenu
    :value="modelValue.length"
    title="Tags"
    createable
    createable-type="tag"
    clearable
    editable
    class="TagSelect"
    @create="handleCreate"
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
    <template #header v-if="!tags.length"><div /></template>
    <template v-if="tags.length" #default="{ edit }">
      <div
        v-for="tag in tags"
        :key="tag.id"
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
        <Button
          v-if="edit()"
          class="btn-invisible px-2 ml-3 mr-md-n2 mt-n1 mb-n1 anim-scale-in"
          @click.stop="isEditingTag = tag"
        >
          <Octicon name="pencil" />
        </Button>
        <Button
          v-if="edit()"
          class="btn-invisible btn-danger px-2 ml-1 mr-md-n2 mt-n1 mb-n1 anim-scale-in"
          @click.stop="handleRemoveTag(tag, $event.shiftKey)"
        >
          <Octicon name="trash" />
        </Button>
      </div>
    </template>
  </SelectMenu>
</template>

<script lang="ts">
import { defineComponent, inject, PropType, Ref, toRefs } from 'vue'

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
    const { modelValue } = toRefs(props)
    const tags = useTags()

    const isAddingTag = inject<Ref>('isAddingTag')!
    function handleChange(newValue: string[]) {
      emit('update:modelValue', newValue)
    }
    function handleCreate() {
      isAddingTag.value = (newTag: ITag) => {
        handleChange(modelValue.value.concat(newTag.id))
        isAddingTag.value = false
      }
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
      isAddingTag,
      isEditingTag: inject('isEditingTag'),

      tags,
      handleChange,
      handleCreate,
      handleClear,
      handleRemoveTag,
    }
  },
})
</script>
