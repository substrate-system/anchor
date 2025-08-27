import { type FunctionComponent, render } from 'preact'
import { useEffect } from 'preact/hooks'
import { html } from 'htm/preact'
import { anchor } from '../src/index.js'

// create anchors on the HTML elements
const a = anchor({ visible: 'touch' })

const Example:FunctionComponent = function () {
    useEffect(() => {
        // wait until we have rendered
        a.add()
    }, [])

    return html`
        <div>hello</div>
        <h2>Another h2 tag</h2>
    `
}

// @ts-expect-error dev
window.anchor = a

render(html`<${Example} />`, document.getElementById('root')!)
