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

import TreeView from './TreeView.vue'
import data from '../data'
import { ITreeNode } from './TreeNode.vue'

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

  .TreeView {
    list-style: none;
    padding: 0;
    margin: 0;

    > .TreeNode {
      > div {
        display: flex;
        align-items: center;

        > button:first-child {
          appearance: none;
          background: none;
          color: inherit;
          font-size: 0;
          padding: 10px 5.5px;
          margin: 0;
          border: none;
          outline: none;
          opacity: 0.5;
          transition: all 0.1s;

          &::after {
            content: "";
            border: solid 5px transparent;
            border-left-color: currentColor;
            border-left-width: 8px;
            border-right-width: 0;
          }
        }

        > input[type="checkbox"] {
          transform: scale(1.5);
          margin: 0.4em $spacing;
        }

        &.expandable {
          &.leaf {
            > button:first-child {
              visibility: hidden;
            }
          }
        }
        &.expanded {
          > button:first-child {
            transform: rotate(90deg);
          }
        }

        &.selectable {
        }
        &.selected {
          background-color: Highlight;
          color: HighlightText;
        }
      }
      > .TreeView {
        padding-left: $spacing * 3;
      }
    }
  }
}
</style>