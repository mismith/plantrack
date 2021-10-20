<template>
  <li class="TreeNode">
    <slot name="node-before" v-bind="nodeProps" />
    <slot name="node" v-bind="nodeProps">
      <div
        :class="{
          TreeNodeLeaf: true,
          childrened: node.children?.length,
          ...Object.entries({ ...options, ...state }).reduce((acc, [key, item]) => {
            acc[key] = tools.is(item, node)
            return acc
          }, {}),
        }"
        @mouseenter="tools.is(options.hoverable, node) && handleChange({ hovered: tools.set(state.hovered, node, true) })"
        @mouseleave="tools.is(options.hoverable, node) && handleChange({ hovered: tools.set(state.hovered, node, false) })"
        @click="handleNodeClick"
      >
        <slot name="node-prepend" v-bind="nodeProps" />
        <slot name="node-indentable" v-bind="nodeProps" v-if="tools.is(options.indentable, node)">
          <span
            v-for="indent of (parents?.length || 0)"
            :key="indent"
            class="TreeNodeIndent"
          />
        </slot>
        <slot name="node-expandable" v-bind="nodeProps" v-if="tools.is(options.expandable, node)">
          <button
            type="button"
            @click.stop="handleExpandToggle(undefined, $event.altKey)"
            class="TreeNodeExpand"
          >
            <span>{{tools.is(state.expanded, node) ? '&minus;' : '+'}}</span>
          </button>
        </slot>
        <slot name="node-checkable" v-bind="nodeProps" v-if="tools.is(options.checkable, node)">
          <!-- @TODO: figure out why :key is necessary -->
          <input
            type="checkbox"
            :key="Math.random()"
            :checked="tools.isChecked(state, node)"
            :indeterminate="tools.isIndeterminate(state, node)"
            :disabled="tools.is(state.disabled, node)"
            @click.stop="handleCheckToggle(undefined, tools.get(options.checkable, node)?.recurse)"
            class="TreeNodeCheck"
          />
        </slot>
        <slot name="node-renamable" v-bind="nodeProps" v-if="tools.is(options.renamable, node)">
          <input
            type="text"
            :value="node.name || node.id"
            :readonly="!tools.is(state.renamed, node)"
            :disabled="tools.is(state.disabled, node)"
            @click="tools.is(state.renamed, node) && $event.stopPropagation()"
            @input="node.name = $event.target.value"
            @blur="handleChange({ renamed: tools.set(state.renamed, node, false) })"
            @keydown.enter="handleChange({ renamed: tools.toggle(state.renamed, node) })"
            @keydown.esc="handleChange({ renamed: tools.set(state.renamed, node, false) })"
            class="TreeNodeRename"
          />
        </slot>
        <slot name="node-name" v-bind="nodeProps" v-else>
          <span class="TreeNodeName">{{node.name || node.id}}</span>
        </slot>
        <slot name="node-append" v-bind="nodeProps" />
      </div>
    </slot>
    <slot name="node-after" v-bind="nodeProps" />

    <TransitionExpand>
      <TreeView
        v-if="node.children?.length && tools.is(state.expanded, node)"
        :nodes="node.children"
        :parents="[...parents, node]"
        :state="state"
        :options="options"
        :tools="tools"
        @change="handleChange"
      >
        <template v-for="(_, slot) of $slots" v-slot:[slot]="scope">
          <slot :name="slot" v-bind="scope" />
        </template>
      </TreeView>
    </TransitionExpand>
  </li>
</template>

<script lang="ts">
import { computed, defineAsyncComponent, defineComponent, PropType } from 'vue'

import TransitionExpand from './TransitionExpand.vue'
import { ITreeNode, tools as treeTools } from '.'

export default defineComponent({
  name: 'TreeNode',
  components: {
    TransitionExpand,
    TreeView: defineAsyncComponent(() => import('./TreeView.vue') as any),
  },
  props: {
    node: {
      type: Object as PropType<ITreeNode>,
      required: true,
    },
    parents: {
      type: Array as PropType<ITreeNode[]>,
      required: false,
      default: [],
    },
    state: {
      type: Object as PropType<Record<string, any>>,
      default: () => ({}),
    },
    options: {
      type: Object as PropType<Record<string, any>>,
      default: () => ({}),
    },
    tools: {
      type: Object as PropType<Record<string, any> & typeof treeTools>,
      default: () => treeTools,
    },
  },
  setup(props, { emit }) {

    function handleChange(changes: Record<string, any>) {
      emit('change', changes)
    }
    function handleNodeClick(event: MouseEvent) {
      const { node, state, options, tools } = props;

      if (tools.is(options.selectable, node) && !tools.is(state.disabled, node)) {
        handleChange({
          selected: tools.toggle(state.selected, node, { clear: (tools.get(options.selectable, node) as any)?.multiple ? !event.metaKey : true }),
        });
      } else if (node.children?.length) {
        if (tools.is(options.expandable, node)) {
          handleChange({
            expanded: tools.toggle(state.expanded, node),
          })
        }
      } else {
        if (tools.is(options.checkable, node) && !tools.is(state.disabled, node)) {
          handleChange({
            checked: tools.toggle(state.checked, node),
          })
        }
      }
    }
    function handleExpandToggle(to?: boolean, recurse = false) {
      const { node, state, options, tools } = props;
      const on = to || !tools.is(state.expanded, node)
      let expanded = tools.set(state.expanded, node, on)

      if (recurse) {
        tools.walkDescendents(node, (child) => {
          if (tools.is(options.expandable, child)) {
            expanded = tools.set(expanded, child, on)
          }
        })
      }

      handleChange({ expanded });
    }
    function handleCheckToggle(to?: boolean, recurse = false) {
      const { node, state, options, tools } = props
      const on = to || !tools.isChecked(state, node)
      let checked = tools.set(state.checked, node, on)

      if (recurse) {
        tools.walkDescendents(node, (child) => {
          if (tools.is(options.checkable, child) && !tools.is(state.disabled, child)) {
            checked = tools.set(checked, child, on)
          }
        })
      }

      handleChange({ checked })
    }

    return {
      tools: props.tools,
      nodeProps: props,
      handleChange,

      handleNodeClick,
      handleExpandToggle,
      handleCheckToggle,
    }
  },
})
</script>

<style lang="scss">
$spacing: 8px;

.TreeNode {
}
</style>