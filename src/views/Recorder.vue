<template>
  <div class="Recorder">
    <form @submit.prevent="handleSubmit">
      <fieldset>
        <label>Event</label>
        <select v-model="record.eventId">
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
        <label>Details</label>
        <TreeView
          :nodes="nodes"
          :state="treeState"
          :options="treeOptions"
        >
        </TreeView>
      </fieldset>

      <fieldset>
        <label>When</label>
        <input type="datetime-local" v-model="record.at" />
      </fieldset>

      <fieldset>
        <label>Note</label>
        <textarea v-model="record.note"></textarea>
      </fieldset>

      <fieldset>
        <button type="submit">Submit</button>
      </fieldset>
    </form>

    <pre>{{record}}</pre>
  </div>
</template>

<script lang="ts">
import { defineComponent, reactive } from 'vue'

import data from '../data'
import TreeView from '../components/TreeView.vue'
import { getPlantsInBed } from '../services/plants'

export default defineComponent({
  name: 'Recorder',
  components: {
    TreeView,
  },
  setup() {
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
    }));
    const treeState = reactive({
      expanded: [],
      selected: [],
      checked: [],
      renamed: [],
    })
    const treeOptions = reactive({
      indentable: true,
      expandable: true,
      // selectable: true,
      checkable: true,
      checkableRecurses: true,
      // renamable: true,
    })

    const payload = reactive({
      // plantId,
    })
    const record = reactive({
      eventId: undefined,
      payload,
      at: undefined,
      note: undefined,
    })

    return {
      data,
      record,

      nodes,
      treeState,
      treeOptions,

      handleSubmit() {
        // if (!record.at) {
        //   record.at = new Date();
        // }
        console.log(record);
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