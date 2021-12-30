export interface ITreeNode {
  id: string
  name?: string
  children?: ITreeNode[]
  [others: string]: any
}

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
): Booleanable {
  if (typeof value === 'function') {
    return set(value(node), node, on)
  }

  let newValue = value
  if (Array.isArray(value)) {
    const index = value.indexOf(node.id)
    if (index >= 0 && !on) {
      newValue = [...value.slice(0, index), ...value.slice(index + 1)]
    } else if (index < 0 && on) {
      newValue = [...value, node.id]
    }
  } else {
    newValue = on
  }

  return newValue
}

export function toggle(
  value: Booleanable,
  node: ITreeNode,
  options: { clear?: boolean } = {},
): Booleanable {
  if (typeof value === 'function') {
    return toggle(value(node), node, options)
  }

  let newValue = value
  if (Array.isArray(value)) {
    if (options?.clear) {
      newValue = []
    }
  }
  return set(newValue, node, !is(newValue, node))
}

export function walkDescendents(
  node: ITreeNode,
  fn: (child: ITreeNode, index: number, children: ITreeNode[]) => any = () => {},
): any[] {
  return node?.children?.reduce(
    (acc, child, index, children) => acc
      .concat(fn(child, index, children))
      .concat(walkDescendents(child, fn) || []),
    [] as any[],
  ) || []
}

export function isAllChildrenChecked(state: Record<string, any>, node: ITreeNode): boolean {
  const nonDisabledChildren = node.children?.filter((child) => !is(state.disabled, child)) || []
  return Boolean(nonDisabledChildren.length && nonDisabledChildren.every((child) => isChecked(state, child)))
}
export function isChecked(state: Record<string, any>, node: ITreeNode): boolean {
  return is(state.checked, node) || isAllChildrenChecked(state, node)
}
export function isIndeterminate(state: Record<string, any>, node: ITreeNode): boolean {
  return !isChecked(state, node) && Boolean(node.children?.some((child) => isChecked(state, child) || isIndeterminate(state, child)))
}

export const tools = {
  is,
  get,
  set,
  toggle,
  walkDescendents,
  
  isAllChildrenChecked,
  isChecked,
  isIndeterminate,
}
