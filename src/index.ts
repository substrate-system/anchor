'use strict'

export type AnchorOpts = {
    // Characters like  '#', '¶', '❡', or '§'.
    icon:string;
    visible:'hover'|'always'|'touch';
    placement:'right'|'left';
    ariaLabel:string;  // any text, default "Anchor"
    class:string;  // css class name
    base:string;  // any base URI
    // Using Math.floor here will ensure the value is Number-cast and an integer.
    truncate:number;
    titleText:string;  // any text
}

export function anchor (opts:Partial<AnchorOpts> = {}):Anchor {
    const a = new Anchor(opts)
    a.add()

    return a
}

export class Anchor {
    opts:Partial<AnchorOpts>
    els:HTMLElement[] = []

    constructor (opts:Partial<AnchorOpts> = {
        icon: '\uE9CB',
        visible: 'always'
    }) {
        this.opts = opts
        this._applyRemainingDefaultOptions(this.opts)
    }

    /**
     * Assign options to the internal options object, and provide defaults.
     * @param {AnchorOpts} opts - Options object. This will be mutated.
     */
    private _applyRemainingDefaultOptions (opts:Partial<AnchorOpts>):void {
        // Accepts characters (and also URLs?), like  '#', '¶', '❡', or '§'.
        opts.icon = opts.icon || '\uE9CB'
        opts.visible = opts.visible || 'hover'
        opts.placement = opts.placement || 'right'
        opts.ariaLabel = opts.ariaLabel || 'Anchor'
        opts.class = opts.class || ''
        // Accepts any base URI.
        opts.base = opts.base || ''
        // Using Math.floor here will ensure the value is Number-cast and
        // an integer.
        opts.truncate = opts.truncate ? Math.floor(opts.truncate) : 64
        opts.titleText = opts.titleText || ''  // any text.
    }

    /**
     * Check to see if this device supports touch. Uses criteria pulled
     * from Modernizr:
     * https://github.com/Modernizr/Modernizr/blob/da22eb27631fc4957f67607fe6042e85c0a84656/feature-detects/touchevents.js#L40
     *
     * @return {boolean} - true if the current device supports touch.
     */
    isTouchDevice ():boolean {
        return Boolean(
            'ontouchstart' in window ||
            // @ts-expect-error old
            (window.DocumentTouch &&
            // @ts-expect-error old
            document instanceof window.DocumentTouch)
        )
    }

    /**
     * Determine if this element already has an AnchorJS link on it.
     * Uses this technique: https://stackoverflow.com/a/5898748/1154642
     * @param    {HTMLElement}  el - a DOM node
     * @return   {Boolean}     true/false
     */
    hasAnchorJSLink (el:HTMLElement):boolean {
        const firstClass = (el.firstChild as HTMLElement).className
        const lastClass = (el.lastChild as HTMLElement).className
        const hasLeftAnchor = (el.firstChild &&
            (' ' + firstClass + ' ').indexOf(' anchorjs-link ') > -1)
        const hasRightAnchor = (el.lastChild &&
            (' ' + lastClass + ' ').indexOf(' anchorjs-link ') > -1)

        return hasLeftAnchor || hasRightAnchor || false
    }

    /**
     * Urlify - Refine text so it makes a good ID.
     *
     * To do this, we remove apostrophes, replace non-safe characters
     * with hyphens, remove extra hyphens, truncate, trim hyphens, and
     * make lowercase.
     *
     * @param  {string} text - Any text. Usually pulled from the webpage element
     *   we are linking to.
     * @return {string} - hyphen-delimited text for use in IDs and URLs.
     */
    urlify (text:string):string {
        // Decode HTML characters such as '&nbsp;' first.
        const textareaElement = document.createElement('textarea')
        textareaElement.innerHTML = text
        text = textareaElement.value

        // Regex for finding the non-safe URL characters (many need escaping):
        //   & +$,:;=?@"#{}|^~[`%!'<>]./()*\ (newlines, tabs, backspace,
        //   vertical tabs, and non-breaking space)
        const nonsafeChars = /[& +$,:;=?@"#{}|^~[`%!'<>\]./()*\\\n\t\b\v\u00A0]/g

        // The reason we include this _applyRemainingDefaultOptions is so urlify
        // can be called independently,
        // even after setting options. This can be useful for tests or
        // other applications.
        if (!this.opts.truncate) {
            this._applyRemainingDefaultOptions(this.opts)
        }

        // Note: we trim hyphens after truncating because truncating can cause
        // dangling hyphens.
        // Example string:                      // " ⚡⚡ Don't forget: URL fragments should be i18n-friendly, hyphenated, short, and clean."
        return text.trim()                      // "⚡⚡ Don't forget: URL fragments should be i18n-friendly, hyphenated, short, and clean."
            .replace(/'/gi, '')                   // "⚡⚡ Dont forget: URL fragments should be i18n-friendly, hyphenated, short, and clean."
            .replace(nonsafeChars, '-')           // "⚡⚡-Dont-forget--URL-fragments-should-be-i18n-friendly--hyphenated--short--and-clean-"
            .replace(/-{2,}/g, '-')               // "⚡⚡-Dont-forget-URL-fragments-should-be-i18n-friendly-hyphenated-short-and-clean-"
            .substring(0, this.opts.truncate)  // "⚡⚡-Dont-forget-URL-fragments-should-be-i18n-friendly-hyphenated"
            .replace(/^-+|-+$/gm, '')             // "⚡⚡-Dont-forget-URL-fragments-should-be-i18n-friendly-hyphenated"
            .toLowerCase()                       // "⚡⚡-dont-forget-url-fragments-should-be-i18n-friendly-hyphenated"
    }

    /**
     * Add anchor links to page elements.
     *
     * @param  {String|Array|Nodelist} selector - A CSS selector for targeting
     * the elements you wish to add anchor links to. Also accepts an array or
     * nodeList containing the relavant elements.
     * @return {this}
     */
    add (selector?:string|Array<Node>|NodeList):this {
        let elementID
        let index
        let count
        let tidyText
        let newTidyText
        let anchor
        let hrefBase
        const indexesToDrop:number[] = []

        // We reapply options here because somebody may have overwritten the
        // default options object when setting options.
        // For example, this overwrites all options but visible:
        //
        // anchors.options = { visible: 'always'; }
        this._applyRemainingDefaultOptions(this.opts)

        // Provide a sensible default selector, if none is given.
        if (!selector) {
            selector = 'h2, h3, h4, h5, h6'
        }

        const elements = _getElements(selector)

        if (elements.length === 0) {
            return this
        }

        _addBaselineStyles()

        // We produce a list of existing IDs so we don't generate a duplicate.
        const elsWithIds = document.querySelectorAll('[id]')
        const idList = Array.prototype.map.call(elsWithIds, (el) => {
            return el.id as string
        })

        for (let i = 0; i < elements.length; i++) {
            if (this.hasAnchorJSLink(elements[i])) {
                indexesToDrop.push(i)
                continue
            }

            if (elements[i].hasAttribute('id')) {
                elementID = elements[i].getAttribute('id')
            } else if (elements[i].hasAttribute('data-anchor-id')) {
                elementID = elements[i].getAttribute('data-anchor-id')
            } else {
                tidyText = this.urlify(elements[i].textContent!)

                // Compare our generated ID to existing IDs (and increment it
                // if needed)
                // before we add it to the page.
                newTidyText = tidyText
                count = 0
                do {
                    if (index !== undefined) {
                        newTidyText = tidyText + '-' + count
                    }

                    index = idList.indexOf(newTidyText)
                    count += 1
                } while (index !== -1)

                index = undefined
                idList.push(newTidyText)

                elements[i].setAttribute('id', newTidyText)
                elementID = newTidyText
            }

            // The following code efficiently builds this DOM structure:
            // `<a class="anchorjs-link ${this.options.class}"
            //     aria-label="${this.options.ariaLabel}"
            //     data-anchorjs-icon="${this.options.icon}"
            //     title="${this.options.titleText}"
            //     href="this.options.base#${elementID}">
            // </a>;`
            anchor = document.createElement('a')
            anchor.className = 'anchorjs-link ' + this.opts.class
            anchor.setAttribute('aria-label', this.opts.ariaLabel)
            anchor.setAttribute('data-anchorjs-icon', this.opts.icon)
            if (this.opts.titleText) {
                anchor.title = this.opts.titleText
            }

            // Adjust the href if there's a <base> tag.
            // See https://github.com/bryanbraun/anchorjs/issues/98
            hrefBase = (document.querySelector('base') ?
                window.location.pathname + window.location.search :
                '')
            hrefBase = this.opts.base || hrefBase
            anchor.href = hrefBase + '#' + elementID

            if (this.opts.visible === 'always') {
                anchor.style.opacity = '1'
            }

            console.log('aaaaaaaaa')
            console.log('this.opts.visible', this.opts.visible)
            console.log('this.isTouchDevice', this.isTouchDevice())

            if (this.opts.visible === 'touch' && this.isTouchDevice()) {
                anchor.style.opacity = '1'
            }

            if (this.opts.icon === '\uE9CB') {
                anchor.style.font = '1em/1 anchorjs-icons'

                // We set lineHeight = 1 here because the `anchorjs-icons` font
                // family could otherwise affect the
                // height of the heading. This isn't the case for icons with
                // `placement: left`, so we restore
                // line-height: inherit in that case, ensuring they remain
                // positioned correctly. For more info,
                // see https://github.com/bryanbraun/anchorjs/issues/39.
                if (this.opts.placement === 'left') {
                    anchor.style.lineHeight = 'inherit'
                }
            }

            if (this.opts.placement === 'left') {
                anchor.style.position = 'absolute'
                anchor.style.marginLeft = '-1.25em'
                anchor.style.paddingRight = '.25em'
                anchor.style.paddingLeft = '.25em'
                elements[i].insertBefore(anchor, elements[i].firstChild)
            } else { // if the option provided is `right` (or anything else).
                anchor.style.marginLeft = '.1875em'
                anchor.style.paddingRight = '.1875em'
                anchor.style.paddingLeft = '.1875em'
                elements[i].appendChild(anchor)
            }
        }

        for (let i = 0; i < indexesToDrop.length; i++) {
            elements.splice(indexesToDrop[i] - i, 1)
        }

        this.els = this.els.concat(elements)

        return this
    }

    /**
     * Remove all anchorjs-links from elements targeted by the selector.
     *
     * @param  {string|Array|Nodelist} selector - A CSS selector string
     *   targeting elements with anchor links,
     *   OR a nodeList / array containing the DOM elements.
     * @return {this} The AnchorJS object
     */
    remove (selector:string|Node[]|NodeList):this {
        let index:number
        let domAnchor:HTMLElement
        const elements = _getElements(selector)

        for (let i = 0; i < elements.length; i++) {
            domAnchor = elements[i].querySelector('.anchorjs-link')!
            if (domAnchor) {
                // Drop the element from our main list, if it's in there.
                index = this.els.indexOf(elements[i])
                if (index !== -1) {
                    this.els.splice(index, 1)
                }

                // Remove the anchor from the DOM.
                elements[i].removeChild(domAnchor)
            }
        }

        return this
    }

    /**
     * Remove all anchorjs links. Mostly used for tests.
     */
    removeAll () {
        this.remove(this.els)
    }
}

/**
 * _addBaselineStyles
 * Adds baseline styles to the page, used by all AnchorJS links regardless of
 * configuration.
 */
function _addBaselineStyles () {
    // We don't want to add global baseline styles if they've been added before.
    if (document.head.querySelector('style.anchorjs') !== null) {
        return
    }

    const style = document.createElement('style')
    const linkRule =
    '.anchorjs-link{' +
        'opacity:0;' +
        'text-decoration:none;' +
        '-webkit-font-smoothing:antialiased;' +
        '-moz-osx-font-smoothing:grayscale' +
    '}'
    const hoverRule =
    ':hover>.anchorjs-link,' +
    '.anchorjs-link:focus{' +
        'opacity:1' +
    '}'
    const anchorjsLinkFontFace = '@font-face{' +
        // Icon from icomoon; 10px wide & 10px tall; 2 empty below & 4 above
        'font-family:anchorjs-icons;' +
        'src:url(data:n/a;base64,AAEAAAALAIAAAwAwT1MvMg8yG2cAAAE4AAAAYGNtYXDp3gC3AAABpAAAAExnYXNwAAAAEAAAA9wAAAAIZ2x5ZlQCcfwAAAH4AAABCGhlYWQHFvHyAAAAvAAAADZoaGVhBnACFwAAAPQAAAAkaG10eASAADEAAAGYAAAADGxvY2EACACEAAAB8AAAAAhtYXhwAAYAVwAAARgAAAAgbmFtZQGOH9cAAAMAAAAAunBvc3QAAwAAAAADvAAAACAAAQAAAAEAAHzE2p9fDzz1AAkEAAAAAADRecUWAAAAANQA6R8AAAAAAoACwAAAAAgAAgAAAAAAAAABAAADwP/AAAACgAAA/9MCrQABAAAAAAAAAAAAAAAAAAAAAwABAAAAAwBVAAIAAAAAAAIAAAAAAAAAAAAAAAAAAAAAAAMCQAGQAAUAAAKZAswAAACPApkCzAAAAesAMwEJAAAAAAAAAAAAAAAAAAAAARAAAAAAAAAAAAAAAAAAAAAAQAAg//0DwP/AAEADwABAAAAAAQAAAAAAAAAAAAAAIAAAAAAAAAIAAAACgAAxAAAAAwAAAAMAAAAcAAEAAwAAABwAAwABAAAAHAAEADAAAAAIAAgAAgAAACDpy//9//8AAAAg6cv//f///+EWNwADAAEAAAAAAAAAAAAAAAAACACEAAEAAAAAAAAAAAAAAAAxAAACAAQARAKAAsAAKwBUAAABIiYnJjQ3NzY2MzIWFxYUBwcGIicmNDc3NjQnJiYjIgYHBwYUFxYUBwYGIwciJicmNDc3NjIXFhQHBwYUFxYWMzI2Nzc2NCcmNDc2MhcWFAcHBgYjARQGDAUtLXoWOR8fORYtLTgKGwoKCjgaGg0gEhIgDXoaGgkJBQwHdR85Fi0tOAobCgoKOBoaDSASEiANehoaCQkKGwotLXoWOR8BMwUFLYEuehYXFxYugC44CQkKGwo4GkoaDQ0NDXoaShoKGwoFBe8XFi6ALjgJCQobCjgaShoNDQ0NehpKGgobCgoKLYEuehYXAAAADACWAAEAAAAAAAEACAAAAAEAAAAAAAIAAwAIAAEAAAAAAAMACAAAAAEAAAAAAAQACAAAAAEAAAAAAAUAAQALAAEAAAAAAAYACAAAAAMAAQQJAAEAEAAMAAMAAQQJAAIABgAcAAMAAQQJAAMAEAAMAAMAAQQJAAQAEAAMAAMAAQQJAAUAAgAiAAMAAQQJAAYAEAAMYW5jaG9yanM0MDBAAGEAbgBjAGgAbwByAGoAcwA0ADAAMABAAAAAAwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAAH//wAP) format("truetype")' +
    '}'
    const pseudoElContent =
    '[data-anchorjs-icon]::after{' +
        'content:attr(data-anchorjs-icon)' +
    '}'

    style.className = 'anchorjs'
    style.appendChild(document.createTextNode('')) // Necessary for Webkit.

    // We place it in the head with the other style tags, if possible, so as to
    // not look out of place. We insert before the others so these styles can be
    // overridden if necessary.
    const firstStyleEl = document.head.querySelector('[rel="stylesheet"],style')
    if (firstStyleEl === undefined) {
        document.head.appendChild(style)
    } else {
        document.head.insertBefore(style, firstStyleEl)
    }

    style.sheet?.insertRule(linkRule, style.sheet?.cssRules.length)
    style.sheet?.insertRule(hoverRule, style.sheet?.cssRules.length)
    style.sheet?.insertRule(pseudoElContent, style.sheet?.cssRules.length)
    style.sheet?.insertRule(anchorjsLinkFontFace, style.sheet?.cssRules.length)
}

/**
 * Turns a selector, nodeList, or array of elements into an array of elements
 * (so we can use array methods).
 * It also throws errors on any other inputs. Used to handle inputs to
 * .add and .remove.
 *
 * @param  {string|Array|Nodelist} input A CSS selector string targeting
 * elements with anchor links, OR a nodeList / array containing the DOM elements.
 * @return {Array<HTMLElement>} - An array containing the elements we want.
 */
function _getElements (input:string|Array<Node>|NodeList):Array<HTMLElement> {
    let elements
    if (typeof input === 'string') {
        // See https://davidwalsh.name/nodelist-array for the technique
        // transforming nodeList -> Array.
        elements = [].slice.call(document.querySelectorAll(input))
    } else if (Array.isArray(input) || input instanceof NodeList) {
        elements = [].slice.call(input)
    } else {
        throw new TypeError('The selector provided to AnchorJS was invalid.')
    }

    return elements
}
