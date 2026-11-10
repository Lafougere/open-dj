import { LitElement, html, css, PropertyValueMap } from 'lit'
import { property, query, customElement } from 'lit/decorators.js'

const MAX_CANVAS_WIDTH = 32000

@customElement('running-display')
export class RunningDisplay extends LitElement {
	@property({ type: Object }) public buffer: AudioBuffer | null = null

	@property({ type: String }) public color = '#2289f0dd'

	@property({ type: Number }) public height = 100

	@property({ type: Number }) public seconds = 3.0

	@property({ type: Array }) public bars: number[] = []

	@property({ type: Number }) public playbackRate: number = 1.0

	@query('canvas') private cnv!: HTMLCanvasElement

	public waveHeight = 100

	private cache: HTMLCanvasElement[] = []

	protected updated(_changedProperties: PropertyValueMap<any> | Map<PropertyKey, unknown>): void {
		if (_changedProperties.has('buffer')) {
			if (this.buffer) {
				this.createCache()
				this.drawWave(0)
			}
		}
		if (_changedProperties.has('bars')) {
			if (this.bars.length) {
				this.createCache()
				this.drawWave(0)
			}
		}
	}

	public drawWave(centerInSeconds: number) {
		const context = this.cnv.getContext('2d') as CanvasRenderingContext2D
		const rect = this.getBoundingClientRect()
		const center = Math.floor((centerInSeconds * rect.width) / this.seconds)
		const startSecond = centerInSeconds - this.seconds / 2
		const endSecond = centerInSeconds + this.seconds / 2
		const barsToDraw = this.bars.filter(sec => sec >= startSecond && sec <= endSecond)
		this.cnv.width = rect.width
		this.cnv.height = rect.height
		let leftEdgeIndex = Math.floor((center - rect.width / 2) / MAX_CANVAS_WIDTH)
		if (leftEdgeIndex < 0) leftEdgeIndex = 0
		let rightEdgeIndex = Math.floor((center + rect.width / 2) / MAX_CANVAS_WIDTH)
		if (rightEdgeIndex >= this.cache.length) rightEdgeIndex = this.cache.length - 1

		for (const bar of barsToDraw) {
			const index = this.bars.indexOf(bar)
			context.fillStyle = index % 4 === 0 ? '#ddd' : '#aaa'
			const offsetSeconds = bar - startSecond
			const offsetPixels = (offsetSeconds * rect.width) / this.seconds
			context.fillRect(offsetPixels, 1, 1, rect.height)
		}
		for (let i = leftEdgeIndex; i <= rightEdgeIndex; i += 1) {
			context.drawImage(this.cache[i], rect.width / 2 - center + MAX_CANVAS_WIDTH * i, 0)
		}
	}

	private createCache() {
		if (!this.buffer) return
		const rect = this.getBoundingClientRect()
		const step = (this.seconds * this.buffer.sampleRate) / rect.width
		const newLength = Math.floor((this.buffer.duration / this.seconds) * rect.width)
		const data = this.buffer.getChannelData(0)

		this.cache = []
		for (let j = 0; j < newLength; j += MAX_CANVAS_WIDTH) {
			// create canvas with width of the reduced-in-size buffer's length.
			const canvas = document.createElement('canvas')
			const width = newLength - j
			canvas.width = width > MAX_CANVAS_WIDTH ? MAX_CANVAS_WIDTH : width
			canvas.height = rect.height
			const drawCTX = canvas.getContext('2d') as CanvasRenderingContext2D
			const amp = rect.height / 2 - 10
			drawCTX.clearRect(0, 0, newLength, rect.height)
			// set the color for the waveform display
			drawCTX.fillStyle = this.color

			// draw the canvas
			for (let i = 0; i < width; i += 1) {
				let min = 1.0
				let max = -1.0
				const offset = Math.floor((i + j) * step)
				for (let k = 0; k < step; k += 1) {
					const datum = data[offset + k]
					if (datum < min) min = datum
					if (datum > max) max = datum
				}
				drawCTX!.fillRect(i, (1 + min) * amp + 8.5, 1, Math.max(1, (max - min) * amp - 4.5))
				// let max = 0.0
				// const offset = Math.floor((i + j) * step)
				// for (let k = 0; k < step; k += 1) {
				//     let datum = data[offset + k]
				//     if (datum < 0) datum = -datum
				//     if (datum > max) max = datum
				// }
				// max = Math.floor(max * rect.height * 0.75)
				// drawCTX.fillRect(i, rect.height, 1, -max)
			}
			this.cache.push(canvas)
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
		}
		:host * {
			box-sizing: border-box;
		}

		canvas {
			width: 100%;
			height: 100px;
			border: 3px solid #444;
			background: #83aaf7;
			background: #111;
			border-radius: 15px;
		}
		#middle {
			position: absolute;
			left: 50%;
			top: 3px;
			width: 1px;
			height: calc(100% - 10px);
			background: red;
		}
	`

	render() {
		return html`
			<canvas style="height: ${this.height}px;" @click=${(e: MouseEvent) => this.onCanvasClick(e)}></canvas>
			<div id="middle"></div>
		`
	}
}
