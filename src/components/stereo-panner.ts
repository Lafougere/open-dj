import { LitElement, html, TemplateResult, css } from 'lit'
import { customElement, property } from 'lit/decorators.js'

const ctx = window.audioContext

@customElement('stereo-panner')
export class StereoPanner extends LitElement {
    @property({ type: Object }) public in!: AudioNode

    @property({ type: Object }) public out!: AudioNode

    private pannerNode = ctx.createStereoPanner()

    protected firstUpdated(): void {
        this.in.connect(this.pannerNode)
        this.pannerNode.connect(this.out)
    }

    private onInputChanged(val: number) {
        this.pannerNode.pan.value = val
    }

    static styles = css`
        :host {
            display: block;
        }
        :host * {
            box-sizing: border-box;
        }
    `

    public render(): TemplateResult {
        return html`
            <round-knob
                label="PAN"
                radius="20"
                min="-1"
                max="1"
                value="0"
                @input="${(e: CustomEvent) => this.onInputChanged(e.detail)}"
            ></round-knob>
        `
    }
}
