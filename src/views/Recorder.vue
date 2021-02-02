<template>
  <div class="Recorder">
    <form @submit.prevent="handleSubmit">
      <fieldset>
        <label>What</label>
        <select v-model="record.what">
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
        <label>Which</label>
        <select v-model="record.which" multiple>
          <option
            v-for="crop in crops"
            :key="crop.id"
            :value="crop.id"
          >
            {{crop.id}}: {{crop.name}}
          </option>
        </select>
      </fieldset>

      <fieldset>
        <label>Where</label>
        <TreeView
          :nodes="plots.map(({ beds, ...plot }) => ({
            children: beds?.map(({ plants, ...bed }) => ({
              ...bed,
              children: plants?.map(({ id, ...plant }) => ({
                ...plant,
              })),
            })),
            ...plot,
          }))"
          :state="treeState"
          :options="treeOptions"
        >
          <template #node-append="{ node, state, tools }">
            <div v-if="tools.is(state.checked, node)">
              Checked
            </div>
          </template>
        </TreeView>
      </fieldset>

      <fieldset>
        <label>When</label>
        <input type="datetime-local" v-model="record.when" />
      </fieldset>

      <fieldset>
        <label>How</label>
        <textarea v-model="record.how"></textarea>
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

export default defineComponent({
  name: 'Recorder',
  components: {
    TreeView,
  },
  setup() {
    const treeState = reactive({
      expanded: [],
      selected: [],
      checked: [],
      renamed: [],
    })
    const treeOptions = reactive({
      expandable: true,
      selectable: false,
      checkable: data.plots.reduce(
        (acc, { beds }) => acc.concat(beds.map(({ id }) => id)),
        [] as string[],
      ),
      // checkableChildren: true,
      renamable: false,
    })

    const record = reactive({
      what: [],
      which: [],
      where: treeState.checked,
      when: undefined,
      how: undefined,
    })

    return {
      ...reactive(data),
      record,

      treeState,
      treeOptions,

      handleSubmit() {
        // if (!record.datetime) {
        //   record.datetime = new Date();
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