<script lang="ts">
import { computed, defineComponent, h, toRefs } from 'vue'
import octicons from '@primer/octicons'

export default defineComponent({
  name: 'Octicon',
  props: {
    name: {
      type: String,
      required: true,
    },
    size: {
      type: Number,
      default: 16,
      validator(v: number) {
        return [16, 24].includes(v)
      },
    },
  },
  setup(props) {
    const { name, size } = toRefs<any>(props)
    const octicon = computed(() => octicons[name.value])

    return () => h('svg', {
      ...octicon.value.heights[size.value].options,
      innerHTML: octicon.value.heights[size.value].path,
    })
  },
})
</script>
