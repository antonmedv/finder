import { describe, it, assert, expect, beforeEach, afterEach } from 'vitest'
import { JSDOM } from 'jsdom'
import { finder } from '../finder.js'

import 'css.escape'

describe('selector - multiple elements', function () {
  let document
  beforeEach(function () {
    const dom = new JSDOM(`
        <span class="foo"></span>
        <span class="foo"></span>
        <span class="foo"></span>
        <span class="bar"></span>

        <div class="complex">
            <div>
                <button>Test</button>
            </div>
            <div>
                <div class="aaaa">
                    <button>Test</button>
                </div>
                <div class="aaaa">
                    <button>Test</button>
                </div>
                <div class="aaaa">
                    <button>Test</button>
                </div>
            </div>
        </div>

        <div class="complex2">
            <div>
                <button>Test</button>
            </div>
            <div>
                <div class="aaaa">
                    <button>Test</button>
                </div>
            </div>
            <div>
                <div class="aaaa">
                    <button>Test</button>
                </div>
            </div>
        </div>

        <div class="complex3">
            <div class="aaaa">
                <div aaa="bbbc">
                    <button>Test</button>
                </div>
            </div>
            <div aaa="bbb">
                <button>Test</button>
            </div>
            <div>
                <div class="aaaa">
                    <div>
                        <div aaa="bbb">
                            <button>Test</button>
                        </div>
                    </div>
                </div>
            </div>
            <div>
                <div class="aaaa">
                    <div>
                        <div aaa="bbb">
                            <button>Test</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div class="aaaa">
            <div aaa="bbb">
                <button>Test</button>
            </div>
        </div>`)
    document = dom.window.document
    globalThis.document = dom.window.document
    globalThis.Node = dom.window.Node
  })

  const TESTS = [
    '.foo',
    '.complex .aaaa > button',
    '.complex2 .aaaa > button',
    '.complex3 .aaaa [aaa="bbb"] > button',
  ].map((item) => [item])

  it.each(TESTS)(
    'should resolve same elements for selector: %s',
    (inputSelector) => {
      const elements = [...document.querySelectorAll(inputSelector)]
      const selector = finder(elements, {
        maxNumberOfPathChecks: 1000,
        className: () => true,
        attr: () => true,
      })
      expect(selector).to.equal(inputSelector)
      assert.sameMembers(elements, [...document.querySelectorAll(selector)])
    },
  )
})
