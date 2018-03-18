import hyperx from 'hyperx'
import h from './h'
import patch, { createElement } from './patch'
import Observable from '../Observable'
import { createReactiveTag } from '../core'

const hx = hyperx(h, { attrToProp: false })

// type Tag a b = [String] -> ...[a] -> b

// htmlTag :: Tag a VirtualDOM
const htmlTag = hx

// render :: Observable VirtualDOM -> DOMElement -> Promise Error ()
const render = (component, element) => {
  let rootNode

  return component.forEach(newTree => {
    if (!rootNode) {
      rootNode = createElement(newTree)
      element.appendChild(rootNode)
    } else {
      patch(rootNode, newTree)
    }
  })
}

const createRenderProcess = vdom$ =>
  new Observable(observer => {
    let domNode
    let tree

    return vdom$.subscribe({
      complete: () => observer.complete(),
      error: e => observer.error(e),
      next: newTree => {
        tree = newTree

        const onMount = newTree.lifecycle.mount
        tree.lifecycle.mount = node => {
          domNode = node
          if (onMount) onMount(node)
        }

        tree.lifecycle.render = node => {
          domNode = node
          patch(domNode, tree)
        }

        if (!domNode) observer.next(tree)
        else patch(domNode, tree)
      }
    })
  })

// toComponent :: Tag a (Observable VirtalDOM) -> Tag a Component
const toComponent = tag => (strings, ...variables) =>
  createRenderProcess(tag(strings, ...variables))

// html :: [String] -> ...[Variable a] -> Observable VirtualDOM
const html = toComponent(createReactiveTag(htmlTag))

export { html, render }
