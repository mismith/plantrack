<template>
  <div class="Recorder">
    <AddPlant v-if="isAdding" />
    <form @submit.prevent="handleSubmit">
      <fieldset>
        <label>
          Plant(s)
          <button @click="isAdding = !isAdding">Add Plant</button>
        </label>
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

      <fieldset>
        <label>Event</label>
        <select v-model="eventId">
          <option
            v-for="event in data.events"
            :key="event.id"
            :value="event.id"
          >
            {{event.id}}
          </option>
        </select>
      </fieldset>

      <fieldset>
        <label>When</label>
        <input type="datetime-local" v-model="at" />
      </fieldset>

      <fieldset>
        <label>Note</label>
        <textarea v-model="note"></textarea>
      </fieldset>

      <fieldset>
        <button type="submit">Submit</button>
      </fieldset>
    </form>
    <pre>{{plantIds}}</pre>
  </div>
</template>

<script lang="ts">
import { defineComponent, reactive, ref, watch } from 'vue'

import data from '../data'
import AddPlant from '../components/AddPlant.vue'
import TreeView, { ITreeNode, tools } from '../components/TreeView.vue'
import { getPlantsInBed } from '../services/plants'

export default defineComponent({
  name: 'Recorder',
  components: {
    AddPlant,
    TreeView,
  },
  setup() {
    const isAdding = ref(false)
    const plantIds = ref([])
    const eventId = ref()
    const at = ref(new Date().toISOString())
    const note = ref()

    const nodes = data.plots.map((plot) => ({
      type: 'plot',
      children: data.beds.filter(({ plotId }) => plotId === plot.id).map((bed) => ({
        type: 'bed',
        children: getPlantsInBed(bed.id, data).map((plant) => ({
          type: 'plant',
          ...plant,
        })),
        ...bed,
      })),
      ...plot,
    }))
    const treeState = reactive({
      expanded: [],
      hovered: [],
      selected: [],
      checked: [],
      disabled: (node: ITreeNode) => node.type !== 'plant' && !tools.walkChildren(
        node,
        (child) => child.type === 'plant',
      ).filter(Boolean).length,
      renamed: [],
    })
    const treeOptions = reactive({
      indentable: true,
      expandable: true,
      hoverable: true,
      // selectable: true,
      // selectable: (node: ITreeNode) => node.type === 'plant',
      checkable: {
        recurse: true, // (node: ITreeNode) => Boolean(node.children?.length),
      },
      // renamable: true,
    })

    const allPlantIds = data.plants.map(({ id }) => id)
    watch(treeState.checked, () => {
      plantIds.value = treeState.checked.filter(id => allPlantIds.includes(id))
    })

    return {
      isAdding,
      plantIds,
      eventId,
      at,
      note,

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

.Recorder {
  form {
    display: flex;
    flex-direction: column;

    fieldset {
      display: flex;
      flex-direction: column;

      textarea {
        resize: vertical;
      }
    }
  }
}
</style>