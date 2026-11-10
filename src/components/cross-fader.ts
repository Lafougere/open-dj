import { LitElement, html, TemplateResult, css, PropertyValueMap } from 'lit'
import { customElement, property } from 'lit/decorators.js'

const ctx = window.audioContext

@customElement('cross-fader')
export class CrossFader extends LitElement {
    @property({ type: Object }) public leftIn!: GainNode

    @property({ type: Object }) public rightIn!: GainNode

    @property({ type: Object }) public out!: AudioNode

    protected firstUpdated(_changedProperties: PropertyValueMap<any> | Map<PropertyKey, unknown>): void {
        this.leftIn.connect(this.out)
        this.rightIn.connect(this.out)
    }

    protected updated(_changedProperties: PropertyValueMap<any> | Map<PropertyKey, unknown>): void {}

    private onInputChanged(val: number) {
        const x = val / 100
        const gain1 = Math.cos(x * 0.5 * Math.PI)
        const gain2 = Math.cos((1.0 - x) * 0.5 * Math.PI)
        this.leftIn.gain.value = gain1
        this.rightIn.gain.value = gain2
    }

    static styles = css`
        :host {
            display: block;
            color: inherit;
            position: relative;
        }
        :host {
            box-sizing: border-box;
        }
    `

    public render(): TemplateResult {
        return html`
            <range-slider
                mode="horizontal"
                min="0"
                max="100"
                value="50"
                numBars="3"
                @input="${(e: CustomEvent) => this.onInputChanged(e.detail)}"
            ></range-slider>
        `
    }
}
