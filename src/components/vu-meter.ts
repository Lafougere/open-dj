/* eslint-disable no-return-assign */
import { LitElement, html, css, PropertyValueMap } from 'lit'
import { customElement, property, query } from 'lit/decorators.js'

const ctx = window.audioContext

@customElement('vu-meter')
export class VuMeter extends LitElement {
    @property({ type: Object }) public in!: AudioNode

    @property({ type: Number }) public leds = 20

    @query('#bg') private bgCanvas!: HTMLCanvasElement

    @query('#leds') private vuCanvas!: HTMLCanvasElement

    private analyser: AnalyserNode = ctx.createAnalyser()

    private sampleBuffer: Float32Array = new Float32Array(2048)

    protected firstUpdated(_changedProperties: PropertyValueMap<any> | Map<PropertyKey, unknown>): void {
        this.in.connect(this.analyser)
        this.analyser.fftSize = 2048

        this.bgCanvas.width = 12
        this.bgCanvas.height = this.leds * 5
        const canvasCtx = this.bgCanvas.getContext('2d') as CanvasRenderingContext2D
        canvasCtx.fillStyle = '#10ee2244'
        for (let i = this.leds - 1; i >= 0; i -= 1) {
            canvasCtx.fillRect(0.5, i * 5 + 0.5, 12, 2)
            if (i <= this.leds * 0.4) {
                canvasCtx.fillStyle = '#fbff0644'
            }
            if (i <= this.leds * 0.2) {
                canvasCtx.fillStyle = '#ec171744'
            }
        }
        requestAnimationFrame(() => this.updateVU())
    }

    private updateVU() {
        this.analyser.getFloatTimeDomainData(this.sampleBuffer)
        let sumOfSquares = 0
        for (let i = 0; i < this.sampleBuffer.length; i += 1) {
            sumOfSquares += this.sampleBuffer[i] ** 2
        }
        const avgPowerDecibels = 10 * Math.log10(sumOfSquares / this.sampleBuffer.length)
        this.vuCanvas.width = 12
        this.vuCanvas.height = this.leds * 5
        if (avgPowerDecibels === -Infinity) {
            requestAnimationFrame(() => this.updateVU())
            return
        }
        // if (this.min === '') {
        //     this.min = 0
        //     this.max = avgPowerDecibels
        // } else if (avgPowerDecibels > -100) {
        //     this.min = Math.min(this.min as number, avgPowerDecibels)
        //     this.max = Math.max(this.max as number, avgPowerDecibels)
        // }
        // let peakInstantaneousPower = 0
        // for (let i = 0; i < this.sampleBuffer.length; i += 1) {
        //     const power = this.sampleBuffer[i] ** 2
        //     peakInstantaneousPower = Math.max(power, peakInstantaneousPower)
        // }
        // const peakInstantaneousPowerDecibels = 10 * Math.log10(peakInstantaneousPower)
        // const decibels = Math.max(100.0 + peakInstantaneousPowerDecibels, 0)

        // avgPowerDecibels is a negative value
        // we consider anything under -60 to be inaudible
        // and above -10 to be too loud
        const diff = -60 - avgPowerDecibels
        const pct = diff * -2 // to get percentage

        const avgDecibels = Math.max(pct, 1)
        // console.log(peakInstantaneousPowerDecibels)
        // console.log(avgDecibels)
        // const maxBar = Math.floor((avgDecibels - 30) * (this.leds / 65))
        const maxBar = Math.floor(avgDecibels / (120 / this.leds))

        const canvasCtx = this.vuCanvas.getContext('2d') as CanvasRenderingContext2D
        canvasCtx.fillStyle = '#10ee22'
        if (maxBar > 0) {
            for (let j = this.leds; j >= this.leds - maxBar; j -= 1) {
                canvasCtx.fillRect(0.5, j * 5 + 0.5, 12, 2)
                if (j <= this.leds * 0.4) {
                    canvasCtx.fillStyle = '#fbff06cc'
                }
                if (j <= this.leds * 0.2) {
                    canvasCtx.fillStyle = '#ec1717cc'
                }
            }
        }

        requestAnimationFrame(() => this.updateVU())
    }

    static styles = css`
        :host {
            display: block;
        }
        :host * {
            box-sizing: border-box;
        }

        main {
            display: flex;
            flex-direction: column;
            position: relative;
            width: 12px;
        }

        canvas {
            position: absolute;
            width: 12px;
            top: 0;
            left: 0;
        }
    `

    render() {
        return html`
            <main style="height: ${this.leds * 5}px;">
                <canvas id="bg" style="height: ${this.leds * 5}px;"></canvas>
                <canvas id="leds" style="height: ${this.leds * 5}px"></canvas>
            </main>
        `
    }
}
