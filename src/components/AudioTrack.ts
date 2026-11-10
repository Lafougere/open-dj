/* eslint-disable no-return-assign */
import { LitElement, html, css, PropertyValueMap } from 'lit'
import { property, state, query } from 'lit/decorators.js'
import { classMap } from 'lit/directives/class-map.js'
import dayjs from 'dayjs/esm'
import './app-icon'
import type { RunningDisplay } from './running-display'
import './running-display'
import type { MiniMap } from './mini-map'
import './mini-map'
import './round-knob'
import './track-info'
import './step-viewer'
import './stereo-panner'
import { getBuffer } from '../lib/util'

import store from '../store'
import { AppStateType, setSynced } from '../store/appSlice'
import { TrackStateType } from '../store/trackSlice'
import { calculateBPM } from '../lib/beatmatching'
import { getBeatFilteredBuffer, resample } from '../lib/beat'
import type { OpenDj } from '../open-dj'

const pvworlet = new URL('../../../assets/worklets/phase-vocoder.js', import.meta.url).href

export class AudioTrack extends LitElement {
	@property({ type: String }) public src = ''

	@property({ type: Object }) public out!: AudioNode

	@property({ type: Object }) public ctx!: AudioContext

	@property({ type: Object }) public app!: OpenDj

	@query('mini-map') public miniMap!: MiniMap

	@query('running-display') public runningDisplay!: RunningDisplay

	@state() public audioBuffer: AudioBuffer | null = null

	@state() public isPlaying = false

	@state() public isSynced = false

	@state() private tempo = 0

	@state() private playbackRate = 1.0

	@state() private elapsed = '00:00'

	@state() private remaining = '00:00'

	@state() private currentStep = 0

	public trackTime = 0.0

	public masterGain: GainNode = window.audioContext.createGain()

	@state() private bpm = 0.0

	private prevTimeCheck = 0

	@state() private bars: number[] = []

	private sourceNode: AudioBufferSourceNode | null = null

	@state() private beatAnalysis: any = {}

	private phaseVocoderNode: any = {}

	@state() private isHeadPhoneActive = false

	@state() private isToneLocked = true

	@state() private pitchAdjustment = 0

	constructor() {
		super()

		const id = this.id as keyof TrackStateType
		// this.playbackRate = store.getState().track[id].playbackRate
		// this.tempo = store.getState().track[id].tempo
		// this.bars = store.getState().track[id].bars
		this.setupVocoder()
		this.isSynced = store.getState().app.isSynced
		store.subscribe(() => {
			console.log('SUBS')
			// this.playbackRate = store.getState().track[id].playbackRate
			// this.tempo = store.getState().track[id].tempo
			// this.bars = store.getState().track[id].bars
			this.isSynced = store.getState().app.isSynced
		})
	}

	private async setupVocoder() {
		try {
			await window.audioContext.audioWorklet.addModule(pvworlet)
			this.phaseVocoderNode = new AudioWorkletNode(window.audioContext, 'phase-vocoder-processor')
			this.phaseVocoderNode.connect(this.masterGain)
		} catch (e) {
			console.error(e)
		}
	}

	protected updated(_changedProperties: PropertyValueMap<any> | Map<PropertyKey, unknown>): void {
		// console.log('upd', _changedProperties.has('src'))
		if (_changedProperties.has('src')) {
			console.log(this.src)
			if (this.src) {
				this.loadData()
			}
		}
		if (_changedProperties.has('tempo') || _changedProperties.has('playbackRate')) {
			this.bpm = parseFloat((this.tempo * this.playbackRate).toFixed(1))
		}
		if (_changedProperties.has('bpm')) {
			if (this.bpm) {
				this.onBpmChanged()
			}
		}
		if (_changedProperties.has('currentStep')) {
			this.dispatchEvent(new CustomEvent('step', { detail: this.currentStep }))
		}
	}

	private async onBpmChanged() {
		console.log('bpmchanged', this.bpm)

		if (this.playbackRate !== 1) {
			console.time('resampledxx')
			this.audioBuffer = await resample(this.audioBuffer!, this.playbackRate)
			console.timeEnd('resampledxx')
			this.updateTimers()
		}
		this.setupBars()
		this.updateRunningDisplay()
	}

	private setupBars() {
		const bars = []
		const { guesses } = this.beatAnalysis
		const guessIndex = Math.max(
			guesses.findIndex((g: any) => g.tempo === this.tempo),
			0,
		)
		const guess = guesses[guessIndex]
		const firstKick = (guess.allPositions[0] / this.ctx.sampleRate) * (1 / this.playbackRate)
		const interval = (guess.intervalActual / this.ctx.sampleRate) * (1 / this.playbackRate)
		let firstPeak = firstKick
		while (firstPeak - interval > 0) {
			firstPeak -= interval
		}
		for (let k = 0; k < this.audioBuffer!.duration; k += interval) {
			bars.push(firstPeak + k)
		}
		this.bars = bars
	}

	private async getAudioBuffer() {
		return getBuffer(this.src).then((b: ArrayBuffer) => this.ctx?.decodeAudioData(b))
	}

	private updateCursor() {
		this.miniMap.setCursorAtTime(this.trackTime)
	}

	private updateRunningDisplay() {
		this.runningDisplay.drawWave(this.trackTime)
	}

	private async loadData() {
		this.audioBuffer = await this.getAudioBuffer()
		this.updateTimers()

		calculateBPM(this.ctx, this.audioBuffer).then((result: any) => {
			this.beatAnalysis = result
			this.tempo = this.beatAnalysis.bpm
			console.log(result)
		})
	}

	public togglePlay() {
		if (this.isPlaying) {
			this.sourceNode!.stop(this.ctx.currentTime)
			this.isPlaying = false
		} else {
			this.play()
		}
	}

	public toggleSync() {
		console.log('sync')
		if (this.isSynced) {
			store.dispatch(setSynced(false))
		} else {
			// get playback rate from other track
			const otherTrack = this.id === 'leftTrack' ? this.app.rightTrack : this.app.leftTrack
			const ratio = this.tempo / (otherTrack.tempo * otherTrack.playbackRate)
			this.playbackRate = 1 / ratio

			console.log('ratio', ratio)
			console.log('this.playbackRate', this.playbackRate)
			// store.dispatch(setPlaybackRate({ track: this.id as keyof TrackStateType, rate: 1 / ratio }))
			store.dispatch(setSynced(true))
		}
		if (this.isPlaying) {
			this.play()
		}
	}

	private updateStep() {
		const now = this.ctx.currentTime
		const barIndex = this.bars.findIndex(t => t > this.trackTime - (now - this.prevTimeCheck) && t <= this.trackTime)
		if (barIndex > -1) {
			this.currentStep = barIndex % 4
		}
	}

	private updateTrackTime() {
		const now = this.ctx.currentTime
		this.trackTime += now - this.prevTimeCheck //* this.playbackRate
		this.dispatchEvent(new CustomEvent('frame', { detail: this.trackTime }))
		this.updateStep()
		this.updateCursor()
		this.updateRunningDisplay()
		this.updateTimers()
		if (this.isPlaying) {
			requestAnimationFrame(() => this.updateTrackTime())
		}
		this.prevTimeCheck = now
	}

	private updateTimers() {
		this.elapsed = dayjs().startOf('day').second(this.trackTime).format('mm:ss')
		this.remaining = this.audioBuffer
			? dayjs()
					.startOf('day')
					.second(this.audioBuffer.duration - this.trackTime)
					.format('mm:ss')
			: '00:00'
	}

	private play() {
		const otherTrack = this.id === 'leftTrack' ? this.app.rightTrack : this.app.leftTrack
		const now = this.ctx.currentTime
		if (this.sourceNode) this.sourceNode.stop(now)

		let scheduledTime = this.trackTime
		let interval = 0

		if (this.isSynced && otherTrack.isPlaying) {
			const nextBarOtherTrack = otherTrack.bars.find(t => t >= otherTrack.trackTime) || 0
			const nextBarThisTrack = this.bars.find(t => t >= this.trackTime) || 0
			scheduledTime = nextBarThisTrack || 0
			interval = nextBarOtherTrack - otherTrack.trackTime
			this.trackTime = scheduledTime - interval // - (performance.now() - t0)
		}

		this.prevTimeCheck = now
		this.sourceNode = this.ctx.createBufferSource()
		this.sourceNode.buffer = this.audioBuffer
		this.sourceNode.connect(this.phaseVocoderNode)
		this.updatePitchFactor()

		this.sourceNode.start(now, Math.max(scheduledTime - interval, 0))
		if (scheduledTime) {
			setTimeout(() => {
				// this.trackTime = scheduledTime
				requestAnimationFrame(() => this.updateTrackTime())
			}, interval * 1000)
		} else {
			requestAnimationFrame(() => this.updateTrackTime())
		}

		this.isPlaying = true
	}

	private onTimeSelect(time: number) {
		this.trackTime = time
		this.updateCursor()
		this.updateRunningDisplay()
		this.updateTimers()
		if (this.isPlaying) this.play()
	}

	private toggleHeadphone() {
		this.isHeadPhoneActive = !this.isHeadPhoneActive
		this.dispatchEvent(new CustomEvent('headphone-changed', { detail: this.isHeadPhoneActive }))
	}

	private updatePitchFactor() {
		if (!this.phaseVocoderNode.parameters) return
		const pitchFactorParam = this.phaseVocoderNode.parameters.get('pitchFactor')
		if (this.isToneLocked) {
			pitchFactorParam.value = 1 / this.playbackRate + this.pitchAdjustment
		} else {
			pitchFactorParam.value = 1 + this.pitchAdjustment
		}
	}

	private toggleToneLock() {
		this.isToneLocked = !this.isToneLocked
		this.updatePitchFactor()
	}

	private adjustPitch(val: number) {
		this.pitchAdjustment = val
		this.updatePitchFactor()
	}

	static styles = css`
		:host {
			padding: 10px;
			background-color: #040507;
			background-image: radial-gradient(circle at 25% 25%, rgba(255, 255, 255, 0.1) 0, rgba(255, 255, 255, 0) 90%);
			box-shadow: inset 0 0 5px rgba(0, 0, 0, 0.5);
			border-bottom: 1px solid #111;
			background-size: 150%;
			position: relative;
		}
		:host * {
			box-sizing: border-box;
		}

		mini-map {
			border-radius: 5px;
			margin-top: 10px;
		}

		button {
			/* background: #0c4e85; */
			background: none;
			padding: 2px 10px;
			color: #999;
			border: 2px solid #444;
			border-radius: 5px;
			margin-right: 5px;
		}
		button.active {
			background: #2289f0;
			color: #ddd;
			border: 2px solid #bbb;
		}
		.info {
			font-size: 0.9em;
			color: #6a9bff;
		}
		.info div {
			display: flex;
		}
		.info dt {
			width: 110px;
		}
		.controls {
			margin-top: 10px;
			display: flex;
			justify-content: space-between;
		}
		.knobs {
			display: flex;
		}
		.knobs > * {
			margin-left: 10px;
		}
		step-viewer {
			margin: 10px auto;
		}

		#headphones {
			position: absolute;
			bottom: 10px;
			right: 10px;
			display: flex;
			justify-content: flex-end;
			align-items: center;
		}
		#headphones app-icon {
			width: 42px;
			height: 42px;

			color: #444;
			cursor: pointer;
		}
		#headphones app-icon.active {
			color: #2289f0;
		}
	`

	render() {
		return html`
			<header>
				<track-info
					tempo="${this.tempo}"
					duration="${this.audioBuffer?.duration || 0}"
					src="${this.src}"
					.beatAnalysis="${this.beatAnalysis}"
					@tempo-updated=${(e: CustomEvent) => (this.tempo = e.detail)}
				></track-info>
			</header>
			<main>
				<mini-map .buffer=${this.audioBuffer} @time-select=${(e: CustomEvent) => this.onTimeSelect(e.detail)}></mini-map>

				<div>
					<step-viewer currentStep="${this.currentStep}"></step-viewer>
				</div>
				<running-display .buffer=${this.audioBuffer} .bars=${this.bars} .playbackRate=${this.playbackRate}></running-display>
				<div class="controls">
					<div class="buttons">
						<button @click=${() => this.togglePlay()} class=${classMap({ active: this.isPlaying })}>
							<app-icon icon="play"></app-icon>
						</button>
						<button @click=${() => this.toggleSync()} class=${classMap({ active: this.isSynced })}>SYNC</button>
						<button @click=${() => this.toggleToneLock()} class=${classMap({ active: this.isToneLocked })}>TONE LOCK</button>
					</div>
					<div class="knobs">
						<stereo-panner .in="${this.masterGain}" .out="${this.out}"></stereo-panner>
						<round-knob
							label="PITCH"
							radius="20"
							min="-0.2"
							max="0.2"
							value="0"
							@input="${(e: CustomEvent) => this.adjustPitch(e.detail)}"
						></round-knob>
					</div>
				</div>
				<dl class="info">
					<div>
						<dt>Current bpm:</dt>
						<dd>${this.bpm}</dd>
					</div>
					<div>
						<dt>Elapsed:</dt>
						<dd>${this.elapsed}</dd>
					</div>
					<div>
						<dt>Remaining:</dt>
						<dd>${this.remaining}</dd>
					</div>
				</dl>
				<div id="headphones">
					<round-knob
						type="volume"
						radius="15"
						min="0"
						max="1"
						value="1"
						@input="${(e: CustomEvent) => this.dispatchEvent(new CustomEvent('headphone-volume', { detail: e.detail }))}"
					></round-knob>
					<app-icon
						icon="headphones"
						class="${classMap({ active: this.isHeadPhoneActive })}"
						@click="${() => this.toggleHeadphone()}"
					></app-icon>
				</div>
			</main>
		`
	}
}
