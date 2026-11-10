import { LitElement, html, TemplateResult, css, PropertyValueMap } from 'lit'
import { customElement, property, query, state } from 'lit/decorators.js'

@customElement('range-slider')
export class RangeSlider extends LitElement {
    @property({ type: Number }) public size = 120

    @property({ type: Number }) public numBars = 11

    @property({ type: Number }) public min = -1

    @property({ type: Number }) public max = 1

    @property({ type: Number }) public precision = 2

    @property({ type: Number }) public strokeWidth = 2

    @property({ type: Number }) public value = 0.5

    @property({ type: String }) public mode = 'vertical'

    @query('.bars') public cnvBars!: HTMLCanvasElement

    @query('#dragimage') public dragImage!: HTMLDivElement

    private prevPosition = 0

    private get range() {
        return Math.abs(this.min) + Math.abs(this.max)
    }

    private get direction() {
        return this.mode === 'horizontal' ? 'left' : 'top'
    }

    @state() private get pos() {
        const offset = (Math.abs(this.min) / this.range) * this.size
        const p =
            this.mode === 'vertical' ? this.size - (this.value / this.range) * this.size : offset + (this.value / this.range) * this.size

        return p
    }

    protected firstUpdated(_changedProperties: PropertyValueMap<any> | Map<PropertyKey, unknown>): void {
        const context = this.cnvBars.getContext('2d') as CanvasRenderingContext2D
        context.strokeStyle = '#555'
        context.lineWidth = this.strokeWidth
        context.lineCap = 'butt'
        if (this.mode === 'vertical') {
            this.cnvBars.width = 40
            this.cnvBars.height = this.size + 20
            context.strokeStyle = '#555'
            context.lineWidth = this.strokeWidth
            context.lineCap = 'butt'
            const space = Math.round((this.cnvBars.height - 24) / (this.numBars - 1))
            for (let i = 0; i < this.numBars; i += 1) {
                context.beginPath()
                context.moveTo(0.5, i * space + 15.5)
                context.lineTo(39.5, i * space + 15.5)
                context.closePath()

                context.stroke()
            }
        } else {
            this.cnvBars.width = this.size + 20
            this.cnvBars.height = 40
            context.strokeStyle = '#555'
            context.lineWidth = this.strokeWidth
            context.lineCap = 'butt'
            const space = Math.round((this.cnvBars.width - 24) / (this.numBars - 1))
            for (let i = 0; i < this.numBars; i += 1) {
                context.beginPath()
                context.moveTo(i * space + 15.5, 0.5)
                context.lineTo(i * space + 15.5, 39.5)
                context.closePath()

                context.stroke()
            }
        }
    }

    protected updated(_changedProperties: PropertyValueMap<any> | Map<PropertyKey, unknown>): void {
        if (_changedProperties.has('value')) {
            this.updateValue()
        }
    }

    private updateValue() {
        const value = Math.round(this.value * 10 ** this.precision) / 10 ** this.precision
        this.dispatchEvent(new CustomEvent('input', { detail: value }))
    }

    private onDragStart(e: DragEvent) {
        this.prevPosition = this.mode === 'vertical' ? e.clientY : e.clientX
        e.dataTransfer?.setDragImage(this.dragImage, 0, 0)
    }

    private onDrag(e: DragEvent) {
        e.dataTransfer?.setDragImage(this.dragImage, 0, 0)
        if (e.clientY && this.mode === 'vertical') {
            const delta = -(e.clientY - this.prevPosition)
            const ratio = this.range / this.size
            this.value += delta * ratio
            this.value = Math.max(Math.min(this.max, this.value), this.min)
            this.prevPosition = e.clientY
        } else if (e.clientX && this.mode === 'horizontal') {
            const delta = e.clientX - this.prevPosition
            const ratio = this.range / this.size
            this.value += delta * ratio
            this.value = Math.max(Math.min(this.max, this.value), this.min)
            this.prevPosition = e.clientX
        }
    }

    static styles = css`
        :host {
            display: block;
            color: inherit;
            position: relative;
            margin: 4px;
            width: 40px;
            height: 140px;
        }
        :host * {
            box-sizing: border-box;
        }
        main {
            padding: 10px;
            display: flex;
            justify-content: center;
            position: relative;
        }
        .bg {
            /* width: 100%;
            height: 100%; */
            background-color: #222;
            border-radius: 5px;
            position: relative;
            z-index: 2;
            border: 5px solid #000;
            margin-top: 1px;
            /* margin-left: -1px; */
        }
        .bars {
            position: absolute;
            top: 0;
            left: 0;
            z-index: 0;
        }
        .handle {
            width: 30px;
            height: 10px;
            background-color: #444;
            position: absolute;
            /* top: 20px; */
            left: 50%;
            transform: translate(-50%, -5px);
            border: 2px solid #505668;
            border-radius: 1px;
            cursor: pointer;
        }
        .middle {
            position: absolute;
            top: 50%;
            margin-top: -1px;
            left: 50%;
            margin-left: -18px;
            width: 36px;
            height: 2px;
            background-color: #777;
        }
        :host([mode='horizontal']) {
            height: 40px;
            width: 140px;
        }
        :host([mode='horizontal']) .bg {
            margin-left: 1px;
            margin-top: 2px;
        }
        :host([mode='horizontal']) .handle {
            width: 10px;
            height: 30px;
            top: 50%;
            transform: translate(-5px, -50%);
            margin-top: 1px;
        }
        :host([mode='horizontal']) .middle {
            margin-top: -18px;
            margin-left: -1px;
            width: 2px;
            height: 36px;
        }
    `

    public render(): TemplateResult {
        return html`
            <main style="${this.mode === 'vertical' ? `height: ${this.size + 20}px;` : `width: ${this.size + 30}px;`}">
                <canvas
                    class="bars"
                    style="${this.mode === 'vertical'
                        ? `height: ${this.size + 20}px; width: 40px;`
                        : `width: ${this.size + 25}px; height: 40px;`}"
                >
                </canvas>
                <div
                    class="bg"
                    style="${this.mode === 'vertical'
                        ? `height: ${this.size + 12}px; width: 14px;`
                        : `width: ${this.size + 30}px; height: 14px;`}"
                >
                    <div
                        class="handle"
                        style="${this.direction}: ${this.pos}px"
                        draggable="true"
                        @dragstart="${(e: DragEvent) => this.onDragStart(e)}"
                        @drag="${(e: DragEvent) => this.onDrag(e)}"
                    >
                        <div class="middle"></div>
                    </div>
                </div>
            </main>
            <span id="dragimage"></span>
        `
    }
}
