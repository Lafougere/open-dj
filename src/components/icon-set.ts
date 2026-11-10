import { LitElement, html, css } from 'lit'
import { customElement } from 'lit/decorators.js'

const iconset = html`
    <svg>
        <defs>
            <g id="play" viewBox="0 0 24 24"><path d="M8,5.14V19.14L19,12.14L8,5.14Z" /></g>
            <g id="headphones" viewBox="0 0 24 24">
                <path
                    d="M12,1C7,1 3,5 3,10V17A3,3 0 0,0 6,20H9V12H5V10A7,7 0 0,1 12,3A7,7 0 0,1 19,10V12H15V20H18A3,3 0 0,0 21,17V10C21,5 16.97,1 12,1Z"
                />
            </g>
            <g id="chevron-down" viewBox="0 0 24 24">
                <path d="M7.41,8.58L12,13.17L16.59,8.58L18,10L12,16L6,10L7.41,8.58Z" />
            </g>
            <g id="delete" viewBox="0 0 24 24">
                <path d="M9,3V4H4V6H5V19A2,2 0 0,0 7,21H17A2,2 0 0,0 19,19V6H20V4H15V3H9M9,8H11V17H9V8M13,8H15V17H13V8Z" />
            </g>
        </defs>
    </svg>
`

@customElement('icon-set')
export class IconSet extends LitElement {
    public getIconPath(name: string): SVGGElement {
        const g = this.shadowRoot!.querySelector(`#${name}`) as SVGGElement
        return g
    }

    static styles = css`
        :host {
            display: none;
        }
    `

    public render() {
        return html`${iconset}`
    }
}
