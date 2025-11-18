import { test, assert, expect } from 'vitest'
import { JSDOM } from 'jsdom'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { finder } from '../finder.js'

import 'css.escape'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

function check({ file, html, query }, config = {}) {
  config = {
    timeoutMs: Infinity,
    maxNumberOfPathChecks: 2_000,
    ...config,
  }
  const dom = file
    ? new JSDOM(readFileSync(path.join(__dirname, file), 'utf8'))
    : new JSDOM(html)
  globalThis.document = dom.window.document
  globalThis.Node = dom.window.Node
  const selectors = []
  for (let node of document.querySelectorAll(query ?? '*')) {
    let css
    try {
      css = finder(node, config)
    } catch (err) {
      assert.ok(
        false,
        err.toString() + '\n    Node: ' + node.outerHTML.substring(0, 100),
      )
    }
    assert.equal(
      document.querySelectorAll(css).length,
      1,
      `Selector "${css}" selects more then one node.`,
    )
    assert.equal(
      document.querySelector(css),
      node,
      `Selector "${css}" selects another node.`,
    )
    selectors.push(css)
  }
  expect(selectors).toMatchSnapshot()
}

test('github', () => {
  check({ file: 'pages/github.com.html' })
})

test('stripe', () => {
  check({ file: 'pages/stripe.com.html' })
})

test('deployer', () => {
  check({ file: 'pages/deployer.org.html' })
})

test('tailwindcss', () => {
  check({ file: 'pages/tailwindcss.html' })
})

test('google', () => {
  check({
    file: 'pages/google.com.html',
    query: '[href]',
  })
})

test('duplicate', () => {
  const html = `

  <div id="foo"></div>
  <div id="foo"></div>
  `
  check({ html })
})

test('duplicate:sub-nodes', () => {
  const html = `
  <div id="foo"><i></i></div>
  <div id="foo"><i></i></div>
  `
  check({ html })
})


test('bad-class-names', () => {
  const html = `
  <div class="css-175oi2r"></div>
  <div class="css-y6a5a9i"></div>
  `
  check({ html })
})

test('shadow-dom', () => {
  const html = `
  <div id="app">
    <div id="host1" class="shadow-host"></div>
    <div id="host2" class="shadow-host"></div>
    <div id="regular">Regular element</div>
  </div>
  `
  const dom = new JSDOM(html)
  globalThis.document = dom.window.document
  globalThis.Node = dom.window.Node
  globalThis.ShadowRoot = dom.window.ShadowRoot || class ShadowRoot {}
  
  // Create shadow DOM
  const host1 = document.getElementById('host1')
  const shadow1 = host1.attachShadow({ mode: 'open' })
  shadow1.innerHTML = `
    <div class="shadow-content">
      <h1 id="shadow-title">Shadow Title</h1>
      <p class="shadow-text">This is in shadow DOM</p>
      <button id="shadow-button">Click me</button>
    </div>
  `
  
  const host2 = document.getElementById('host2')
  const shadow2 = host2.attachShadow({ mode: 'open' })
  shadow2.innerHTML = `
    <div class="outer">
      <div class="middle">
        <div class="inner">
          <span id="nested-span">Nested span</span>
        </div>
      </div>
    </div>
  `
  
  const selectors = []
  
  // Test elements in first shadow root
  const shadowElements1 = [
    shadow1.querySelector('#shadow-title'),
    shadow1.querySelector('.shadow-text'),
    shadow1.querySelector('#shadow-button'),
  ]
  
  for (let node of shadowElements1) {
    if (!node) continue
    let css
    try {
      css = finder(node, { root: shadow1, timeoutMs: Infinity, maxNumberOfPathChecks: 2_000 })
    } catch (err) {
      assert.ok(
        false,
        err.toString() + '\n    Node: ' + node.outerHTML.substring(0, 100),
      )
    }
    assert.equal(
      shadow1.querySelectorAll(css).length,
      1,
      `Selector "${css}" selects more than one node.`,
    )
    assert.equal(
      shadow1.querySelector(css),
      node,
      `Selector "${css}" selects another node.`,
    )
    selectors.push(css)
  }
  
  // Test element in second shadow root
  const nestedSpan = shadow2.querySelector('#nested-span')
  if (nestedSpan) {
    let css
    try {
      css = finder(nestedSpan, { root: shadow2, timeoutMs: Infinity, maxNumberOfPathChecks: 2_000 })
    } catch (err) {
      assert.ok(
        false,
        err.toString() + '\n    Node: ' + nestedSpan.outerHTML.substring(0, 100),
      )
    }
    assert.equal(
      shadow2.querySelectorAll(css).length,
      1,
      `Selector "${css}" selects more than one node.`,
    )
    assert.equal(
      shadow2.querySelector(css),
      nestedSpan,
      `Selector "${css}" selects another node.`,
    )
    selectors.push(css)
  }
  
  // Test regular elements (outside shadow DOM) including shadow hosts
  for (let node of document.querySelectorAll('#app, #host1, #host2, #regular')) {
    let css
    try {
      css = finder(node, { timeoutMs: Infinity, maxNumberOfPathChecks: 2_000 })
    } catch (err) {
      assert.ok(
        false,
        err.toString() + '\n    Node: ' + node.outerHTML.substring(0, 100),
      )
    }
    assert.equal(
      document.querySelectorAll(css).length,
      1,
      `Selector "${css}" selects more than one node.`,
    )
    assert.equal(
      document.querySelector(css),
      node,
      `Selector "${css}" selects another node.`,
    )
    selectors.push(css)
  }
  
  expect(selectors).toMatchSnapshot()
})
