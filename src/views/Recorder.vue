<template>
  <div class="Recorder">
    <AddPlant v-if="isAdding" style="margin: 32px;" />
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
          <template #node-name="{ node }">
            <span class="TreeNodeName">
              <span v-if="node.type === 'entry'">
                {{node.eventId}} @ {{new Date(node.at).toISOString()}}
              </span>
              <template v-else>
                {{node.name || node.id}}
              </template>
            </span>
          </template>
        </TreeView>
      </fieldset>

      <fieldset>
        <label>Event</label>
        <select v-model="eventId">
          <option
            v-for="event in events"
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
        <button :disabled="!plantIds.length || !eventId" type="submit">Add Entry</button>
      </fieldset>
    </form>
    <pre>{{plantIds}}</pre>
  </div>
</template>

<script lang="ts">
import { defineComponent, reactive, ref, watch, watchEffect } from 'vue'

import { events, usePlantDataTree } from '../services/data'
import { database, ServerValue } from '../services/firebase'
import AddPlant from '../components/AddPlant.vue'
import TreeView, { ITreeNode, tools } from '../components/TreeView.vue'

export default defineComponent({
  name: 'Recorder',
  components: {
    AddPlant,
    TreeView,
  },
  setup() {
    const isAdding = ref(false)
    const plantIds = ref<string[]>([])
    const eventId = ref<string>()
    const at = ref<string>()
    const note = ref<string>()

    const { nodes, plants } = usePlantDataTree()
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

    watchEffect(() => {
      plantIds.value = treeState.checked.filter(
        id => plants.value?.map(({ id }) => id).includes(id)
      )
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

      events,

      async handleSubmit() {
        await Promise.all(plantIds.value.map((plantId) => {
          return database.ref(`/users/mismith/plants/${plantId}/entries`).push({
            eventId: eventId.value,
            at: at.value ? new Date(at.value).valueOf() : ServerValue.TIMESTAMP,
            // payload,
            note: note.value || null,
            createdAt: ServerValue.TIMESTAMP,
          })
        }))
        treeState.checked = []
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