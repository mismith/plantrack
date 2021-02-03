<template>
  <form @submit.prevent="handleSubmit" class="AddPlant">
    <fieldset>
      <label>Crop</label>
      <select v-model="cropId">
        <option
          v-for="crop in data.crops"
          :key="crop.id"
          :value="crop.id"
        >
          {{crop.id}}: {{crop.name}}
        </option>
      </select>
    </fieldset>
    <fieldset>
      <label>Bed</label>
      <TreeView
        :nodes="nodes"
        :state="treeState"
        :options="treeOptions"
      >
        <!-- <template #node-name="{ node }">
          <span class="TreeNodeName">
            {{node.name || node.id}}
            <span v-if="node.type === 'plant'">
              ({{data.crops.find(({ id }) => node.cropId)?.name}})
            </span>
          </span>
        </template> -->
      </TreeView>
    </fieldset>
  </form>
</template>

<script lang="ts">
import { defineComponent, reactive, ref } from 'vue'

import data from '../data'
import TreeView, { ITreeNode, tools } from '../components/TreeView.vue'

export default defineComponent({
  name: 'AddPlant',
  components: {
    TreeView,
  },
  setup() {
    const cropId = ref(data.crops[0]?.id)

    const nodes = data.plots.map((plot) => ({
      type: 'plot',
      children: data.beds.filter(({ plotId }) => plotId === plot.id).map((bed) => ({
        type: 'bed',
        ...bed,
      })),
      ...plot,
    }))
    const treeState = reactive({
      expanded: [],
      hovered: [],
      selected: [],
      checked: [],
      renamed: [],
    })
    const treeOptions = reactive({
      indentable: true,
      expandable: true,
      // hoverable: true,
      selectable: (node: ITreeNode) => node.type === 'bed',
      // checkable: true,
      // renamable: true,
    })

    return {
      cropId,

      nodes,
      treeState,
      treeOptions,

      data,

      handleSubmit() {
        // if (!record.at) {
        //   record.at = new Date()
        // }
        // console.log(record)
      },
    }
  },
})
</script>

<style lang="scss">
$spacing: 8px;

.AddPlant {
  fieldset > .TreeView {
    border: solid 1px rgb(118, 118, 118);
    border-radius: 2px;

    .TreeNode {
      > .TreeNodeLeaf {
        &:not(.selectable) {
          .TreeNodeName {
            opacity: 0.5;
          }
        }
      }
    }
  }
}
</style>