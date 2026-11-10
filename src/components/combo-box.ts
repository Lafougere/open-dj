/* eslint-disable lit-a11y/click-events-have-key-events */
import { LitElement, html, TemplateResult, css, PropertyValueMap } from 'lit'
import { customElement, property, query, state } from 'lit/decorators.js'
import { scrollbarStyles } from '../styles'
import './v-menu'

@customElement('combo-box')
export class ComboBox extends LitElement {
    @property({ type: String }) public label = ''

    // @property({type: String, reflect: true})
    // public value: string = ''

    @property({ reflect: true })
    public set value(v) {
        this._value = v
        this.onValueChanged()
    }

    public get value() {
        return this._value
    }

    @property({ type: String }) public mode = 'select'

    @property({ type: String }) public name = ''

    @property({ type: Array }) public items: any[] = []

    @property({ type: String }) public placeholder = ''

    @property({ type: String }) public error = ''

    @property({ type: String }) public autocomplete = 'off'

    @query('#list') private list!: HTMLDivElement

    @query('#field') private field!: HTMLDivElement

    @query('#input') private input!: HTMLInputElement

    @state() private showList = false

    private _value = ''

    public firstUpdated(props: any) {
        super.firstUpdated(props)
        this.tabIndex = 0
        this.addEventListener('focus', () => this.input.focus())
        this.input.addEventListener('focus', () => this.field.classList.add('focus'))
        this.input.addEventListener('blur', () => {
            this.field.classList.remove('focus')
        })
        this.list.addEventListener('transitionend', () => {
            if (this.list.classList.contains('open')) this.list.style.overflow = 'auto'
            else this.list.style.overflow = 'hidden'
        })
    }

    protected updated(_changedProperties: PropertyValueMap<any> | Map<PropertyKey, unknown>): void {
        if (_changedProperties.has('items')) {
            this.onValueChanged()
        }
    }

    onValueChanged() {
        // eslint-disable-next-line eqeqeq
        const item = this.items.find((itm: any) => itm.value == this.value)
        if (item) {
            this.input.value = item.text
            this.dispatchEvent(new CustomEvent('change', { detail: item.value }))
        }
    }

    toggleOpen() {
        this.showList = !this.showList
        this.list.classList.toggle('open')
        if (this.showList) {
            setTimeout(() => {
                const rect = this.field.getBoundingClientRect()
                const listRect = this.list.getBoundingClientRect()
                this.list.style.top = `${rect.top + rect.height + 1}px`
                this.list.style.left = `${rect.left}px`
                this.list.style.width = `${rect.width}px`
                if (rect.top + listRect.height > window.innerHeight) {
                    this.list.style.top = `${window.innerHeight - listRect.height - 5}px`
                }
                this.querySelector('.selected')?.scrollIntoView()
                this.list.focus()
                document.body.addEventListener(
                    'click',
                    () => {
                        this.list.classList.remove('open')
                        this.showList = false
                    },
                    { once: true }
                )
            })
        }
    }

    reset() {
        this.value = ''
    }

    private onButtonClicked(item: any) {
        this.value = item.value
    }

    static styles = [
        scrollbarStyles,
        css`
            :host {
                display: block;
                width: 100%;
                min-width: 60px;
                margin: 2px;
                color: #ccc;
                text-align: left;
                box-sizing: border-box;
                outline: 0;
                font-size: 0.8em;
                position: relative;
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
            }

            #input {
                width: 100%;
                border: 0;
                height: 100%;
                background: none;
                padding: 0 4px;
                color: #ccc;
                outline: 0;
                margin: 0;
                flex: 1;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
                max-width: 100%;
                cursor: pointer;
            }

            button {
                display: block;
                text-align: left;
                height: 24px;
                line-height: 24px;
                font-size: 12px;
                padding: 0 4px;
                outline: 0;
            }
            button.selected {
                background: #2289f0;
                color: #ccc;
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
                top: 100%;
                background: #0b0b16;
                border: 1px solid #2289f0;
                border-radius: 4px;
                z-index: 1000;
                margin: 0;
                max-height: 0;
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
                padding: 0;
                font-size: 0.9em;
                z-index: 0;
                cursor: pointer;
            }
            app-icon {
                color: #2289f0;
                margin: 0;
                flex-shrink: 0;
                display: block;
                width: 24px;
            }

            .truncate {
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }
        `,
    ]

    private renderItem(item: any) {
        // eslint-disable-next-line eqeqeq
        return html`<button class="truncate ${item.value == this.value ? 'selected' : ''}" @click="${() => this.onButtonClicked(item)}">
            ${item.text}
        </button> `
    }

    render(): TemplateResult {
        return html`
            <label for="input" tabindex="-1" ?hidden="${!this.label.length}">${this.label}</label>
            <div id="field">
                <slot name="prepend"></slot>

                <input
                    id="input"
                    tabindex="-1"
                    @click="${() => this.toggleOpen()}"
                    ?readonly="${this.mode === 'select'}"
                    autocomplete="off"
                />
                <div class="append" @click="${() => this.toggleOpen()}"><slot name="append"></slot></div>
                <app-icon icon="chevron-down" @click="${() => this.toggleOpen()}"></app-icon>

                <v-menu id="list" ?value="${this.showList}"> ${this.items.map(item => this.renderItem(item))} </v-menu>
            </div>
            <span class="error" ?hidden="${!this.error}">${this.error}</span>
        `
    }
}
