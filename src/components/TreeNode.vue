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
        @mouseenter="tools.is(options.hoverable, node) && tools.set(state.hovered, node, true)"
        @mouseleave="tools.is(options.hoverable, node) && tools.set(state.hovered, node, false)"
        @click="
          tools.is(options.selectable, node) && !tools.is(state.disabled, node)
            ? tools.toggle(state.selected, node, tools.get(options.selectable, node)?.multiple ? !$event.metaKey : true)
            : (node.children?.length
              ? tools.is(options.expandable, node) && tools.toggle(state.expanded, node)
              : tools.is(options.checkable, node) && !tools.is(state.disabled, node) && tools.toggle(state.checked, node))
        "
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
            @click.stop="tools.toggle(state.expanded, node); $event.altKey && tools.walkChildren(node, (child) => tools.set(state.expanded, child, tools.is(state.expanded, node)))"
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
              || (
                node.children?.length
                && tools.numLeafs(node) === tools.numChecks(node, state)
              )
            "
            :indeterminate="
              !(
                tools.is(state.checked, node)
                || (
                  node.children?.length
                  && tools.numLeafs(node) === tools.numChecks(node, state)
                )
              )
              && Boolean(tools.numChecks(node, state))
            "
            :disabled="tools.is(state.disabled, node)"
            @change="
              tools.set(
                state.checked,
                node,
                $event.target.checked,
                typeof options.checkable === 'object' && options.checkable,
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
            :disabled="tools.is(state.disabled, node)"
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
        :parents="[...parents, node]"
        :state="state"
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

export type Booleanable = string[] | ((node?: ITreeNode) => Booleanable) | boolean | object
export function get(value: Booleanable, node: ITreeNode): boolean | object {
  if (typeof value === 'function') {
    return get(value(node), node)
  }
  if (Array.isArray(value)) {
    return value.includes(node.id)
  }
  return value
}
export function is(value: Booleanable, node: ITreeNode): boolean {
  return Boolean(get(value, node))
}
export function set(
  value: Booleanable,
  node: ITreeNode,
  on: boolean,
  options: { recurse?: Booleanable } = {},
): Booleanable {
  if (typeof value === 'function') {
    return set(value(node), node, on, options)
  }
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

  if (options.recurse && is(options.recurse, node)) {
    walkChildren(node, (child) => set(value, child, on, options))
  }
  return value
}
export function toggle(value: Booleanable, node: ITreeNode, clear = false): Booleanable {
  if (typeof value === 'function') {
    return toggle(value(node), node, clear)
  }
  if (Array.isArray(value)) {
    if (clear) value.splice(0, value.length)
  }
  return set(value, node, !is(value, node))
}
export function walkChildren(
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
  get,
  set,
  toggle,
  walkChildren,
  numLeafs(node: ITreeNode) {
    return walkChildren(node, (child) => !child.children?.length).filter(Boolean).length
  },
  numChecks(node: ITreeNode, state: any) {
    return walkChildren(node, (child) => is(state.checked, child)).filter(Boolean).length
  },
}

export interface ITreeNode {
  id: string
  name?: string
  children?: ITreeNode[]
  [others: string]: any
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
    parents: {
      type: Array as PropType<ITreeNode[]>,
      required: false,
      default: [],
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
  setup({ node, parents, state, options }) {
    return {
      tools,
      nodeProps: {
        node,
        parents,
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