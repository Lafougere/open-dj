import { LitElement, html, TemplateResult, css, PropertyValueMap } from 'lit'
import { customElement, property, query } from 'lit/decorators.js'
import './wave-form'

@customElement('mini-map')
export class MiniMap extends LitElement {
    @property({ type: Object }) public buffer: AudioBuffer | null = null

    @query('#cursor') private cnv!: HTMLCanvasElement

    public setCursorAtTime(seconds: number) {
        if (!this.buffer) return
        const ctx = this.cnv.getContext('2d') as CanvasRenderingContext2D
        const ratio = seconds / this.buffer.duration
        const pixel = Math.round(this.cnv.width * ratio)
        ctx.clearRect(0, 0, this.cnv.width, this.cnv.height)
        ctx.fillStyle = 'red'
        ctx.fillRect(pixel, 2, 2, 36)
    }

    protected updated(_changedProperties: PropertyValueMap<any> | Map<PropertyKey, unknown>): void {
        if (_changedProperties.has('buffer')) {
            if (this.buffer) {
                this.setupCanvas()
            }
        }
    }

    private setupCanvas() {
        const rect = this.cnv.getBoundingClientRect()
        this.cnv.width = rect.width
        this.cnv.height = rect.height
        this.setCursorAtTime(0)
    }

    static styles = css`
        :host {
            display: block;
            height: 40px;
            position: relative;
        }
        :host * {
            box-sizing: border-box;
        }
        canvas {
            position: absolute;
            width: 100%;
            height: 40px;
            top: 0;
            pointer-events: none;
        }
    `

    public render(): TemplateResult {
        return html`
            <wave-form .buffer=${this.buffer} height="40"></wave-form>
            <canvas id="cursor"></canvas>
        `
    }
}
