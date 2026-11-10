/* eslint-disable no-param-reassign */
import { LitElement, html, TemplateResult, css, PropertyValues } from 'lit'
import { customElement, property, query, queryAssignedElements } from 'lit/decorators.js'
import { scrollbarStyles } from '../styles'

@customElement('v-menu')
export class VerticalMenu extends LitElement {
    @property({ type: Boolean }) public value = false

    @queryAssignedElements() private buttons!: HTMLButtonElement[]

    private focusedIndex = 0

    public firstUpdated() {
        this.tabIndex = -1
        this.addEventListener('click', () => this.close())
        this.addEventListener('focus', () => this.buttons[0].focus())
        this.addEventListener('keydown', e => this.onKeyDown(e))
        this.buttons.forEach((btn, idx) => {
            btn.tabIndex = idx + 1
        })
    }

    public close() {
        this.value = false
        this.dispatchEvent(new Event('input'))
    }

    private focusNext() {
        this.focusedIndex += 1
        if (this.focusedIndex > this.buttons.length - 1) this.focusedIndex = 0
        this.buttons[this.focusedIndex].focus()
    }

    private focusPrev() {
        this.focusedIndex -= 1
        if (this.focusedIndex < 0) this.focusedIndex = this.buttons.length - 1
        this.buttons[this.focusedIndex].focus()
    }

    private onKeyDown(e: KeyboardEvent) {
        switch (e.key) {
            case 'ArrowUp':
            case 'ArrowLeft':
                e.stopPropagation()
                this.focusPrev()
                break
            case 'ArrowDown':
            case 'ArrowRight':
                e.stopPropagation()
                this.focusNext()
                break
            default:
        }
    }

    static styles = [
        scrollbarStyles,
        css`
            :host {
                width: 100%;
                background: #29293d;
                display: flex;
                flex-direction: column;
                border: 1px solid #110e1f;
                outline: 0;
                overflow: auto;
            }
            :host * {
                box-sizing: border-box;
            }

            :host ::slotted(button) {
                width: 100%;
                background: none;
                border: 1px solid transparent;
                border-bottom: 1px solid #110e1f;
                font-size: 15px;
                cursor: pointer;
                display: flex;
                align-items: center;
                color: #999;
                justify-content: space-between;
            }
            :host ::slotted(button:last-child) {
                border-bottom: 1px solid transparent;
            }
            :host ::slotted(button:hover),
            :host ::slotted(button:focus) {
                color: #eee !important;
            }
        `,
    ]

    public render(): TemplateResult {
        return html` <slot></slot> `
    }
}
