import { test } from '@substrate-system/tapzero'
import { anchor, Anchor } from '../src/index.js'

test('Anchor', async t => {
    const anchor = new Anchor({
        visible: 'touch'
    })
    t.ok(anchor, 'should be an example')
})

test('anchor function', async t => {
    const a = anchor({ class: 'example-class' })
    t.ok(document.getElementById(a.urlify('The h2 tag')),
        'should add IDs to h2 elements')

    t.ok(!document.getElementById(a.urlify('The h1 tag')),
        'should not add IDs to h1 tags')

    t.ok(document.querySelector('a.example-class'),
        'should create an a tag with the class we passed in')
})
