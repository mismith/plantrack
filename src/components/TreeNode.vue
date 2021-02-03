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
        @click="
          tools.is(options.selectable, node)
            ? tools.toggle(state.selected, node, !$event.metaKey)
            : (node.children?.length
              ? tools.is(options.expandable, node) && tools.toggle(state.expanded, node)
              : tools.is(options.checkable, node) && tools.toggle(state.checked, node))
        "
      >
        <slot name="node-prepend" v-bind="nodeProps" />
        <slot name="node-indentable" v-bind="nodeProps" v-if="tools.is(options.indentable, node)">
          <span
            v-for="indent of (state.indent || 0)"
            :key="indent"
            class="TreeNodeIndent"
          />
        </slot>
        <slot name="node-expandable" v-bind="nodeProps" v-if="tools.is(options.expandable, node)">
          <button
            type="button"
            @click.stop="tools.toggle(state.expanded, node)"
            class="TreeNodeExpand"
          >
            <span>{{tools.is(state.expanded, node) ? '&minus;' : '+'}}</span>
          </button>
        </slot>
        <slot name="node-checkable" v-bind="nodeProps" v-if="tools.is(options.checkable, node)">
          <input
            type="checkbox"
            :checked="
              tools.is(state.checked, node)
                || (node.children?.length && tools.numLeafs(node) === tools.numChecks(node, state))
            "
            :indeterminate="
              !(
                tools.is(state.checked, node)
                  || (node.children?.length && tools.numLeafs(node) === tools.numChecks(node, state))
              )
                && Boolean(tools.numChecks(node, state))
            "
            @change="
              tools.set(
                state.checked,
                node,
                $event.target.checked,
                tools.is(options.checkableRecurses, node) && {
                  recurse: true,
                  skipChildrened: Boolean(node.children?.length),
                },
              )
            "
            @click.stop
            class="TreeNodeCheck"
          />
        </slot>
        <slot name="node-renamable" v-bind="nodeProps" v-if="tools.is(options.renamable, node)">
          <input
            type="text"
            :value="node.name || node.id"
            :readonly="!tools.is(state.renamed, node)"
            @click="tools.is(state.renamed, node) && $event.stopPropagation()"
            @input="node.name = $event.target.value"
            @blur="tools.set(state.renamed, node, false)"
            @keydown.enter="tools.toggle(state.renamed, node)"
            @keydown.esc="tools.set(state.renamed, node, false)"
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
        :state="{
          ...state,
          indent: (state?.indent || 0) + 1,
        }"
        :options="options"
        :tools="tools"
      >
        <template v-for="(_, slot) of $slots" v-slot:[slot]="scope">
          <slot :name="slot" v-bind="scope" />
        </template>
      </TreeView>
    </TransitionExpand>
  </li>
</template>

<script lang="ts">
import { defineAsyncComponent, defineComponent, PropType } from 'vue'

import TransitionExpand from './TransitionExpand.vue'

function is(value: boolean | string[], node: ITreeNode) {
  if (typeof value === 'boolean') return value
  if (Array.isArray(value)) return value.includes(node.id)
  return false
}
function set(
  value: boolean | string[],
  node: ITreeNode,
  on: boolean,
  options: { recurse?: boolean, skipChildrened?: boolean } = {},
): boolean | string[] {
  const { recurse, skipChildrened } = options
  if (!skipChildrened) {
    if (Array.isArray(value)) {
      const index = value.indexOf(node.id)
      if (index >= 0 && !on) {
        value.splice(index, 1)
      } else if (index < 0 && on) {
        value.push(node.id)
      }
    } else {
      value = on
    }
  }
  if (recurse) {
    walkChildren(node, (child) => set(value, child, on, {
      ...options,
      skipChildrened: Boolean(child.children?.length),
    }))
  }
  return value
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
  fn: (child: ITreeNode, index: number, children: ITreeNode[]) => any = () => {},
): any[] {
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
  numLeafs(node: ITreeNode) {
    return walkChildren(node, (child) => !child.children?.length).filter(Boolean).length
  },
  numChecks(node: ITreeNode, state: any) {
    return walkChildren(node, (child) => tools.is(state.checked, child)).filter(Boolean).length
  },
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
    TransitionExpand,
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
  setup({ node, state, options }) {
    return {
      tools,
      nodeProps: {
        node,
        state,
        options,
        tools,
      },
    }
  },
})
</script>

<style lang="scss">
$spacing: 8px;

.TreeNode {
}
</style>