import * as cssesc from 'cssesc'

type Node = {
  name: string
  penalty: number
  level?: number
}

type Path = Node[]

type Config = typeof defaults

const defaults = {
  root: document.body,
  className: (name: string) => true,
  tagName: (name: string) => true,
  minLength: 1,
  optimizedMinLength: 1,
  nthThreshold: 1000,
}

let config: Config

export default function s(input: Element, options: Partial<Config>) {
  if (input.nodeType !== Node.ELEMENT_NODE) {
    throw new Error(`Can't generate CSS selector for non-element node type.`)
  }

  if ('html' === input.tagName.toLowerCase()) {
    return input.tagName.toLowerCase()
  }

  config = {...defaults, ...options}

  let path: Path | null = null
  let stack: Node[][] = []
  let current: Element | null = input
  let i = 0

  outer: while (current && current !== config.root.parentElement) {
    let level: Node[] = maybe(id(current)) || maybe(...classNames(current)) || maybe(tagName(current)) || [any()]

    const nth = index(current)
    if (nth) {
      level = level.concat(level.map(node => nthChild(node, nth)))
    }

    for (let node of level) {
      node.level = i
    }

    stack.push(level)

    if (stack.length >= config.minLength) {
      const paths = sort(combinations(stack))

      if (paths.length > config.nthThreshold) {
        path = fallback(input)
        break
      }

      for (let candidate of paths) {
        if (isUnique(candidate)) {
          path = candidate
          break outer
        }
      }
    }

    current = current.parentElement
    i++
  }

  if (!path) {
    for (let candidate of sort(combinations(stack))) {
      if (isUnique(candidate)) {
        path = candidate
        break
      }
    }
  }

  if (path) {
    const optimized = sort(optimize(path, input))

    if (optimized.length > 0) {
      path = optimized[0]
    }

    return selector(path)
  } else {
    throw new Error(`Selector was not found.`)
  }
}

function fallback(input: Element): Path | null {
  let path: Path = []
  let current: Element | null = input
  let i = 0

  while (current && current !== config.root.parentElement) {
    let [node] = maybe(id(current)) || maybe(...classNames(current)) || maybe(tagName(current)) || [any()]

    const nth = index(current)
    if (nth) {
      node = nthChild(node, nth)
    }

    node.level = i
    path.push(node)

    if (path.length >= config.minLength) {
      if (isUnique(path)) {
        return path
      }
    }

    current = current.parentElement
    i++
  }

  return null
}

function selector(path: Path): string {
  let node = path[0]
  let query = node.name
  for (let i = 1; i < path.length; i++) {
    const level = path[i].level || 0

    if (node.level === level - 1) {
      query = `${path[i].name} > ${query}`
    } else {
      query = `${path[i].name} ${query}`
    }

    node = path[i]
  }
  return query
}

function penalty(path: Path): number {
  return path.map(node => node.penalty).reduce((acc, i) => acc + i, 0)
}

function isUnique(path: Path) {
  switch (document.querySelectorAll(selector(path)).length) {
    case 0:
      throw new Error(`Can't select any node with this selector: ${selector(path)}`)
    case 1:
      return true
    default:
      return false
  }
}

function id(input: Element): Node | null {
  if (input.id !== '') {
    return {
      name: '#' + cssesc(input.id, {isIdentifier: true}),
      penalty: 0,
    }
  }
  return null
}

function classNames(input: Element): Node[] {
  const names = Array.from(input.classList)
    .filter(config.className)

  return names.map((name): Node => ({
    name: '.' + cssesc(name, {isIdentifier: true}),
    penalty: 1
  }))
}

function tagName(input: Element): Node | null {
  const name = input.tagName.toLowerCase()
  if (config.tagName(name)) {
    return {
      name,
      penalty: 2
    }
  }
  return null
}

function any(): Node {
  return {
    name: '*',
    penalty: 3
  }
}

function index(input: Element): number | null {
  const parent = input.parentNode
  if (!parent) {
    return null
  }

  let child = parent.firstChild
  if (!child) {
    return null
  }

  let i = 0
  while (true) {
    if (child.nodeType === Node.ELEMENT_NODE) {
      i++
    }

    if (child === input || !child.nextSibling) {
      break
    }

    child = child.nextSibling
  }

  return i
}

function nthChild(node: Node, i: number): Node {
  return {
    name: node.name + `:nth-child(${i})`,
    penalty: node.penalty + 1
  }
}

function maybe(...level: (Node | null)[]): Node[] | null {
  const list = level.filter(notEmpty)
  if (list.length > 0) {
    return list
  }
  return null
}

function notEmpty<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined
}

function* combinations(stack: Node[][], path: Node[] = []) {
  if (stack.length > 0) {
    for (let node of stack[0]) {
      yield* combinations(stack.slice(1, stack.length), path.concat(node))
    }
  } else {
    yield path
  }
}

function sort(paths: Iterable<Path>): Path[] {
  return Array.from(paths).sort((a, b) => penalty(a) - penalty(b))
}

function* optimize(path: Path, input: Element) {
  if (path.length >= 3 && path.length > config.optimizedMinLength) {
    for (let i = 1; i < path.length - 1; i++) {
      const newPath = [...path]
      newPath.splice(i, 1)

      if (isUnique(newPath) && same(newPath, input)) {
        yield newPath
        yield* optimize(newPath, input)
      }
    }
  }
}

function same(path: Path, input: Element) {
  return document.querySelector(selector(path)) === input
}
