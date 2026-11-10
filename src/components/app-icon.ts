import { LitElement, html, TemplateResult, css } from 'lit'
import { customElement, property } from 'lit/decorators.js'
import { IconSet } from './icon-set'

@customElement('app-icon')
export class AppIcon extends LitElement {
    @property({ type: String }) public icon = ''

    @property({ type: String }) public href = ''

    private iconset: IconSet = document.querySelector('icon-set')!

    public getIcon(name: string): SVGElement {
        return this.iconset && this.iconset.getIconPath(name)
    }

    public updated(): void {
        const svg = this.shadowRoot!.querySelector('svg') as SVGElement
        const iconG = this.getIcon(this.icon)
        svg.innerHTML = ''
        Array.from(iconG.querySelectorAll('path')).forEach((p: any) => {
            svg.appendChild(p.cloneNode(true))
        })
    }

    static styles = css`
        :host {
            display: inline-block;
            width: 24px;
            height: 24px;
            margin: 2px;
            color: inherit;
        }
        :host(.mini) {
            width: 20px;
            height: 20px;
        }
        :host([disabled]) {
            opacity: 0.5;
            cursor: auto !important;
            pointer-events: none;
        }
        svg {
            width: 100%;
            height: 100%;
            display: block;
            color: inherit;
        }
        path {
            fill: currentColor;
        }
    `

    public render(): TemplateResult {
        // this.iconset = this.iconset || document.querySelector('icon-set')
        const iconG = this.getIcon(this.icon)
        if (!iconG) throw new Error(`Missing icon ${this.icon}`)
        const vb = iconG.getAttribute('viewBox') || '0 0 24 24'
        return html`<svg viewBox="${vb}"></svg>`
    }
}
