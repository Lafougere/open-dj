import { LitElement, html, css, PropertyValueMap } from 'lit'
import { property, query } from 'lit/decorators.js'

export class WaveForm extends LitElement {
    @property({ type: Object }) public buffer: AudioBuffer | null = null

    @property({ type: String }) public color = '#2289f0'

    @property({ type: Number }) public height = 100

    @query('canvas') private cnv!: HTMLCanvasElement

    public waveHeight = 100

    protected updated(_changedProperties: PropertyValueMap<any> | Map<PropertyKey, unknown>): void {
        if (_changedProperties.has('buffer')) {
            if (this.buffer) {
                this.drawWave()
            }
        }
    }

    private drawWave() {
        console.log('drawwaves')
        const rect = this.cnv.getBoundingClientRect()
        const context = this.cnv.getContext('2d')
        const data = this.buffer!.getChannelData(0)
        const step = Math.floor(data.length / rect.width)
        const amp = rect.height / 2 - 2
        this.cnv.width = rect.width
        this.cnv.height = rect.height
        context!.fillStyle = this.color
        for (let i = 0; i < rect.width; i += 1) {
            let min = 1.0
            let max = -1.0
            for (let j = 0; j < step; j += 1) {
                const datum = data[i * step + j]
                if (datum < min) min = datum
                if (datum > max) max = datum
            }
            context!.fillRect(i, (1 + min) * amp + 3, 1, Math.max(1, (max - min) * amp - 2))
        }
    }

    private onCanvasClick(e: MouseEvent) {
        if (!this.buffer) return
        const rect = this.cnv.getBoundingClientRect()
        const ratio = e.offsetX / rect.width
        this.dispatchEvent(new CustomEvent('time-select', { detail: this.buffer.duration * ratio, composed: true }))
    }

    static styles = css`
        :host {
            display: block;
            position: relative;
            border-radius: 5px;
        }
        :host * {
            box-sizing: border-box;
        }

        canvas {
            width: 100%;
            border: 2px solid #333;
            background: #111;
            border-radius: 5px;
        }
    `

    render() {
        return html` <canvas style="height: ${this.height}px;" @click=${(e: MouseEvent) => this.onCanvasClick(e)}></canvas> `
    }
}
