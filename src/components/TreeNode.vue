<template>
  <li class="TreeNode">
    <slot
      name="node"
      :node="node"
      :state="state"
      :options="options"
      :tools="tools"
    >
      <div
        :class="{
          leaf: !node.children?.length,
          ...Object.entries(options).reduce((acc, [key, option]) => {
            acc[key] = tools.is(option, node);
            return acc;
          }, {}),
          ...Object.entries(state).reduce((acc, [key, item]) => {
            acc[key] = tools.is(item, node);
            return acc;
          }, {}),
        }"
        @click="tools.is(options.selectable, node)
          ? tools.toggle(state.selected, node, !$event.metaKey)
          : (node.children?.length
            ? tools.is(options.expandable, node) && tools.toggle(state.expanded, node)
            : tools.is(options.checkable, node) && tools.toggle(state.checked, node))"
      >
        <button
          v-if="tools.is(options.expandable, node)"
          type="button"
          @click.stop="tools.toggle(state.expanded, node)"
        >
          {{tools.is(state.expanded, node) ? '&minus;' : '+'}}
        </button>
        <input
          v-if="tools.is(options.checkable, node)"
          type="checkbox"
          :checked="tools.is(state.checked, node)"
          :indeterminate="!tools.is(state.checked, node) && tools.walkChildren(node, (child) => tools.is(state.checked, child)).filter(Boolean).length > 0"
          @change="
            tools.toggle(state.checked, node);
            // tools.is(options.checkableChildren, node) && tools.walkChildren(node, (child) => tools.set(state.checked, child, tools.is(state.checked, node)));
          "
          @click.stop
        />
        <input
          v-if="tools.is(options.renamable, node) && tools.is(state.renamed, node)"
          type="text"
          v-model="node.name"
          :placeholder="node.id"
          @keydown.enter.prevent="tools.set(state.renamed, node, false)"
          @keydown.esc.prevent="tools.set(state.renamed, node, false)"
          @click.stop
        />
        <span
          v-else
          @dblclick="tools.is(options.renamable, node) && tools.toggle(state.renamed, node, true)"
        >
          {{node.name || node.id}}
        </span>
      </div>
      <slot
        name="node-append"
        :node="node"
        :state="state"
        :options="options"
        :tools="tools"
      />
    </slot>
    <TreeView
      v-if="node.children?.length && tools.is(state.expanded, node)"
      :nodes="node.children"
      :state="state"
      :options="options"
      :tools="tools"
    >
      <template v-for="(_, slot) of $slots" v-slot:[slot]="scope">
        <slot :name="slot" v-bind="scope"/>
      </template>
    </TreeView>
  </li>
</template>

<script lang="ts">
import { defineAsyncComponent, defineComponent, PropType } from 'vue'

function is(value: boolean | string[], node: ITreeNode) {
  if (typeof value === 'boolean') return value
  if (Array.isArray(value)) return value.includes(node.id)
  return false
}
function set(value: boolean | string[], node: ITreeNode, on: boolean) {
  if (typeof value === 'boolean') return value
  if (Array.isArray(value)) {
    const index = value.indexOf(node.id)
    if (index >= 0 && !on) return value.splice(index, 1)
    if (index < 0 && on) return value.push(node.id)
  }
  return false
}
function toggle(value: boolean | string[], node: ITreeNode, clear = false) {
  const on = is(value, node);
  if (typeof value === 'boolean') return set(value, node, !on)
  if (Array.isArray(value)) {
    if (clear) value.splice(0, value.length)
    return set(value, node, !on)
  }
  return false
}
function walkChildren(
  node: ITreeNode,
  fn: (child: ITreeNode, index: number, children: ITreeNode[]) => any
): any[] | undefined {
  return node?.children?.reduce(
    (acc, child, index, children) => acc
      .concat(fn(child, index, children))
      .concat(walkChildren(child, fn) || []),
    [] as ITreeNode[],
  ) || []
}
export const tools = {
  is,
  set,
  toggle,
  walkChildren,
}

// export type TreeNodeType = 'plot' | 'bed' | 'plant' | 'event'
export interface ITreeNode {
  id: string
  // type: TreeNodeType
  name?: string
  children?: ITreeNode[]
}

export default defineComponent({
  name: 'TreeNode',
  components: {
    TreeView: defineAsyncComponent(() => import('./TreeView.vue') as any),
  },
  props: {
    node: {
      type: Object as PropType<ITreeNode>,
      required: true,
    },
    state: {
      type: Object as PropType<Record<string, any>>,
      default: {},
    },
    options: {
      type: Object as PropType<Record<string, any>>,
      default: {},
    },
  },
  setup() {
    return {
      tools,
    }
  },
})
</script>

<style lang="scss">
$spacing: 8px;

.TreeNode {
}
</style>