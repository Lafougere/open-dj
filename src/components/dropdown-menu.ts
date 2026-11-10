/* eslint-disable lit-a11y/click-events-have-key-events */
import { LitElement, html, TemplateResult, css } from 'lit'
import { customElement, property, query } from 'lit/decorators.js'
import { scrollbarStyles } from '../styles'

@customElement('dropdown-menu')
export class DropdownMenu extends LitElement {
    @property({ type: String })
    public label = ''

    // @property({type: String, reflect: true})
    // public value: string = ''

    @property({ type: String, reflect: true })
    public set value(v) {
        console.log('val', v)
        this._value = v
        this.onValueChanged()
    }

    public get value() {
        return this._value
    }

    @property({ type: String })
    public type = 'text'

    @property({ type: String })
    public name = ''

    @property({ type: Object })
    public slot: any = {}

    @property({ type: String })
    public placeholder = ''

    @property({ type: String })
    public error = ''

    @property({ type: String })
    public autocomplete = 'off'

    @query('#list') private list!: HTMLDivElement

    @query('#field') private field!: HTMLDivElement

    private _value = ''

    public firstUpdated(props: any) {
        super.firstUpdated(props)
        this.tabIndex = 0
        const input = this.shadowRoot!.querySelector('#input') as HTMLUListElement
        const field = this.shadowRoot!.querySelector('#field') as HTMLDivElement
        const list = this.shadowRoot!.querySelector('#list') as HTMLDivElement
        this.addEventListener('focus', () => input.focus())
        input.addEventListener('focus', () => field.classList.add('focus'))
        input.addEventListener('blur', () => {
            field.classList.remove('focus')
            setTimeout(() => {
                console.log(this.shadowRoot!.activeElement)
            })
        })
        this.slot = this.shadowRoot!.querySelector('#list slot') as any
        this.slot.addEventListener('slotchange', this.onSlotChanged.bind(this))
        list.addEventListener('transitionend', () => {
            if (list.classList.contains('open')) list.style.overflow = 'auto'
            else list.style.overflow = 'hidden'
        })
        // field.style.width = this.clientWidth + 'px'
        // console.log("v", this.getBoundingClientRect())
    }

    onSlotChanged() {
        const lis = Array.from(this.querySelectorAll('li'))

        lis.forEach(li => {
            li.addEventListener('click', e => {
                const selected = this.querySelector('.selected')
                console.log('click', e, li)
                this.setValue(li)
                if (selected) selected.classList.remove('selected')
                li.classList.add('selected')
            })
            if (li.getAttribute('data-value') === this.value) {
                this.setValue(li, false)
                li.classList.add('selected')
            }
        })
    }

    setValue(li: HTMLLIElement, dispatch = true) {
        console.log('set val', li.innerHTML)
        const input = this.shadowRoot!.querySelector('#input') as HTMLInputElement
        input.innerHTML = ''
        input.appendChild(li.cloneNode(true))
        this.value = li.getAttribute('data-value') as string
        this.shadowRoot!.querySelector('#list')!.classList.remove('open')
        if (dispatch) this.dispatchEvent(new CustomEvent('change', { detail: { value: this.value }, composed: true }))
    }

    // onInputChanged(e: Event) {
    //     console.log('dispatch', (<HTMLInputElement>e.target).value)
    //     this.value = (<HTMLInputElement>e.target).value
    //     this.dispatchEvent(new CustomEvent('change', { detail: { value: this.value }, composed: true }))
    // }

    onValueChanged() {
        if (!this.shadowRoot) return
        const input = this.shadowRoot.querySelector('#input') as HTMLInputElement
        if (!input) return
        const sel = `[data-value="${this.value}"]`
        console.log('selector', sel)
        const li = this.querySelector(sel) as HTMLLIElement
        if (!li) return
        this.querySelector('.selected')?.classList.remove('selected')

        input.innerHTML = ''
        input.appendChild(li.cloneNode(true))
        li.classList.add('selected')
    }

    toggleOpen() {
        const $list = this.shadowRoot!.querySelector('#list') as HTMLUListElement
        if ($list.classList.contains('open')) {
            this.shadowRoot!.querySelector('#list')!.classList.remove('open')
        } else {
            setTimeout(() => {
                this.shadowRoot!.querySelector('#list')!.classList.add('open')
                const rect = this.field.getBoundingClientRect()
                const listRect = this.list.getBoundingClientRect()
                this.list.style.top = `${rect.top + rect.height + 1}px`
                this.list.style.left = `${rect.left}px`
                this.list.style.width = `${rect.width}px`
                if (rect.top + listRect.height > window.innerHeight) {
                    this.list.style.top = `${window.innerHeight - listRect.height - 5}px`
                }
                this.querySelector('.selected')?.scrollIntoView()

                document.body.addEventListener(
                    'click',
                    () => {
                        this.shadowRoot!.querySelector('#list')!.classList.remove('open')
                    },
                    { once: true }
                )
            })
        }
    }

    reset() {
        this.value = ''
    }

    static styles = [
        scrollbarStyles,
        css`
            :host {
                display: block;
                width: 100%;
                min-width: 60px;
                /* height: 40px; */
                margin: 2px;
                color: #ccc;
                text-align: left;
                box-sizing: border-box;
                outline: 0;
                font-size: 0.8em;
                position: relative;
                /* z-index:1000; */
                max-width: 100%;
            }
            :host * {
                box-sizing: border-box;
            }
            :host([inline]) {
                display: flex;
                flex-direction: row;
                align-items: center;
                min-width: 120px;
                height: 24px;
                overflow: auto;
            }
            :host ::slotted(app-icon) {
                color: #2289f0;
                width: 18px;
                height: 18px;
                margin-right: 8px;
            }
            #input {
                width: 100%;
                border: 0;
                height: 100%;
                background: none;
                display: flex;
                flex-direction: row;
                align-items: center;
                border-radius: 4px;
                padding: 0 4px;
                color: #ccc;
                outline: 0;
                list-style: none;
                margin: 0;
                flex: 1;
                overflow: hidden;
                /* white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis; */
                max-width: 100%;
            }
            #input li {
                /* max-width: 100%; */
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
                display: block;
                flex: 1;
                height: 24px;
                line-height: 24px;
            }
            li {
                width: 100%;
                /* display: flex; */
                display: block;
                height: 34px;
            }
            li img {
                margin-right: 8px;
            }
            #field {
                height: 24px;
                border: 1px solid #2289f0;
                border-radius: 4px;
                width: 100%;
                max-width: 100%;
                outline: 0;
                display: flex;
                background: #0b0b16;
                align-items: center;
                padding-left: 4px;
                padding-right: 4px;
                position: relative;
                cursor: pointer;
                position: relative;
                flex: 1;
                overflow: hidden;
                /* z-index:1; */
            }
            #field.focus,
            #field.focus #list {
                border-color: #58a8e9;
            }
            #field.focus .append {
                border-left-color: #58a8e9;
            }
            label {
                color: #999;
                font-size: 12px;
                margin-left: -1px;
                margin-right: 5px;
            }
            :host([inline]) label {
                white-space: nowrap;
            }
            span.error {
                font-size: 0.8em;
                display: block;
                text-align: right;
                color: #ac0f31;
            }
            #list {
                position: fixed;
                left: -1px;
                top: 24px;
                width: calc(100% + 2px);
                background: #0b0b16;
                border: 1px solid #2289f0;
                border-radius: 4px;
                z-index: 1000;
                margin: 0;
                /* border-top: 0;
                border-top-left-radius: 0;
                border-top-right-radius: 0; */
                max-height: 0;
                /* overflow: hidden; */
                transition: opacity 0.3s ease-out;
                padding: 0;
                opacity: 0;
                z-index: 100;
                pointer-events: none;
            }

            #list.open {
                max-height: 250px;
                opacity: 1;
                pointer-events: all;
            }
            .append {
                /* position: absolute;
                left: calc(100% - 0px); */
                /* margin-left:-4px; */
                /* border-left: 1px solid #0969b8; */
                padding: 0;
                height: calc(100% - 2px);
                /* overflow: hidden; */
                /* border-top-right-radius: 4px;
                border-bottom-right-radius: 4px;
                border-top-left-radius: 0;
                border-bottom-left-radius: 0; */
                z-index: 0;
                cursor: pointer;
            }
            app-icon {
                color: #0969b8;
                margin: 0;
                flex-shrink: 0;
                display: block;
                width: 24px;
            }
            :host ::slotted(button) {
                position: relative;
                /* top: -4px; */
                /* left:100%; */
                margin: 0 0 0 4px !important;
                left: -1px;
                /* padding-top: 4px !important; */
                height: 100% !important;
                /* padding-left: 12px !important; */
                /* border-left: 0 !important;
                border-top-left-radius: 0 !important;
                border-bottom-left-radius: 0 !important; */
                border: 0 !important;
                border-radius: 0 !important;
                /* border: 0 !important;
			border-radius: 0 !important; */
                width: 100% !important;
                cursor: pointer !important;
            }

            :host ::slotted(.button:active) {
                top: 0 !important;
            }
            :host ::slotted(li) {
                /* display: block; */
                padding: 0 4px;
            }
            :host ::slotted(li.selected) {
                background: #0969b8;
            }
            :host ::slotted(li:hover) {
                background: #0969b8;
            }
            .truncate {
                white-space: nowrap;
                overflow: auto;
                text-overflow: ellipsis;
            }
        `,
    ]

    render(): TemplateResult {
        return html`
            <label for="input" tabindex="-1" ?hidden="${!this.label.length}">${this.label}</label>
            <div id="field">
                <slot name="prepend"></slot>

                <ul id="input" tabindex="-1" @click="${() => this.toggleOpen()}"></ul>
                <app-icon icon="chevron-down" @click="${() => this.toggleOpen()}"></app-icon>
                <div class="append"><slot name="append"></slot></div>

                <ul id="list">
                    <slot></slot>
                </ul>
            </div>
            <span class="error" ?hidden="${!this.error}">${this.error}</span>
        `
    }
}
