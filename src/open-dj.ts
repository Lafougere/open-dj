/* eslint-disable no-await-in-loop */
/* eslint-disable no-return-assign */
/* eslint-disable no-undef */
import { LitElement, html, css, PropertyValueMap } from 'lit'
import { customElement, property, state, query } from 'lit/decorators.js'
// import * as ytdlClient from 'ytdl-client'
import './components/audio-track.js'
import './components/icon-set.js'
import './components/mixer-panel.js'
import './components/dropdown-menu.js'
import './components/combo-box.js'
import type { MixerPanel } from './components/mixer-panel.js'
import type { AudioTrack } from './components/AudioTrack.js'
import { getMetaFromUrl } from './lib/meta.js'
import { getLastFolderHandle, humanFileSize, saveDirHandle } from './lib/util.js'
import { scrollbarStyles } from './styles/theme.js'

// const ytdlClient = require('ytdl-client')

const logo = new URL('../../assets/open-wc-logo.svg', import.meta.url).href
const demo1 = new URL('../../assets/Bitkit - Logical.mp3', import.meta.url).href
const demo2 = new URL('../../assets/Indoor - The Key.mp3', import.meta.url).href
const demo3 = new URL('../../assets/TheUnderworld.ogg', import.meta.url).href
const demo4 = new URL('../../assets/California Sunshine - Last Feeling.mp3', import.meta.url).href

declare global {
	interface HTMLAudioElement {
		setSinkId: (id: string) => void
	}
	interface AudioContext {
		setSinkId: (id: string) => void
	}
	interface Window {
		audioContext: AudioContext
		USB: any
	}
	interface Navigator {
		usb: any
		hid: any
	}
}

interface HeadphoneSettings {
	left: { volume: number; active: boolean }
	right: { volume: number; active: boolean }
}

@customElement('open-dj')
export class OpenDj extends LitElement {
	@property({ type: String }) titleProp = 'DJ app'

	public ctx: AudioContext = window.audioContext

	public masterGain: GainNode = this.ctx.createGain()

	public leftTrackGain: GainNode = this.ctx.createGain()

	public rightTrackGain: GainNode = this.ctx.createGain()

	public headphoneGainLeft: GainNode = this.ctx.createGain()

	public headphoneGainRight: GainNode = this.ctx.createGain()

	@query('#leftTrack') public leftTrack!: AudioTrack

	@query('#rightTrack') public rightTrack!: AudioTrack

	@query('mixer-panel') public mixer!: MixerPanel

	@query('#upload') private uploadField!: HTMLInputElement

	private headphoneSettings: HeadphoneSettings = {
		left: { volume: 1, active: false },
		right: { volume: 1, active: false },
	}

	@state() private mediaDevices: any[] = []

	@state() private mainDeviceId = ''

	@state() private headphoneDeviceId = ''

	@state() private stepLeft = 0

	@state() private stepRight = 0

	@state() private leftTrackSrc = demo1

	@state() private rightTrackSrc = demo4

	private headphoneAudioElement = new Audio()

	@state() private files: any[] = []

	private isDraggingTrack = false

	constructor() {
		super()
		this.masterGain.connect(this.ctx.destination)
		this.headphoneGainLeft.gain.value = 0
		this.headphoneGainRight.gain.value = 0

		navigator.mediaDevices.getUserMedia({ audio: true }).then(async stream => {
			await this.refreshDevices()
			this.detectDevices()
			this.setMainOutputDevice()
			this.setupHeadphoneStream()
		})
		this.addEventListener('dragover', e => e.preventDefault())
		this.addEventListener('drop', e => this.onFileDrop(e))
		this.loadDirHandle()
	}

	private async loadDirHandle() {
		const h = await getLastFolderHandle()
		console.log(h)
		if (h) {
			this.loadFiles(h.handle)
		}
	}

	protected updated(_changedProperties: PropertyValueMap<any> | Map<PropertyKey, unknown>): void {
		if (_changedProperties.has('mainDeviceId')) {
			this.setMainOutputDevice()
		}
		if (_changedProperties.has('headphoneDeviceId')) {
			this.setHeadphoneOutputDevice()
		}
	}

	private async onFileDrop(e: DragEvent) {
		console.log('drop', e.dataTransfer?.getData('text/plain'))
		e.preventDefault()
		if (e.dataTransfer?.files.length) {
			const audioFiles = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('audio/'))
			for (const file of audioFiles) {
				console.log(file.type)
				this.uploadFile(file)
			}
		}
		const text = e.dataTransfer?.getData('text/plain')
		if (text) {
			if (/^https?:\/\/(www.)?youtube\.com/.test(text)) {
				const [json, blob] = await Promise.all([
					fetch(`http://localhost:5555/?info=${text}`).then(r => r.json()),
					fetch(`http://localhost:5555/?url=${text}`).then(r => r.blob()),
				])
				console.log(json)
				const url = URL.createObjectURL(blob)
				// const meta = await getMetaFromUrl(url)
				const { title } = json.videoDetails
				const audioFormats = json.formats.filter((f: any) => f.mimeType.startsWith('audio'))
				audioFormats.sort((a: any, b: any) => b.audioBitrate - a.audioBitrate)
				const [bestFormat] = audioFormats
				const bitrate = bestFormat.audioBitrate
				const [mimeType] = bestFormat.mimeType.split(';')
				const filename = `${title}.${mimeType.replace('audio/', '')}`
				const bpm = ''
				this.files.push({
					url,
					title,
					bitrate,
					cover: json.videoDetails.thumbnails[0].url,
					extension: mimeType.replace('audio/', ''),
					bpm,
					type: mimeType,
					size: parseInt(bestFormat.contentLength, 10),
					filename,
				})
				this.files = [...this.files]
				console.log(this.files)
				// const info = ytdlClient.getInfo('https://www.youtube.com/watch?v=WPdbEbwNTcU')
				// console.log(info)
			}
		}
	}

	private setMainOutputDevice() {
		const deviceId: string = this.mainDeviceId === 'default' ? '' : this.mainDeviceId
		this.ctx.setSinkId(deviceId)
	}

	private setHeadphoneOutputDevice() {
		const deviceId: string = this.headphoneDeviceId === 'default' ? '' : this.headphoneDeviceId
		this.headphoneAudioElement.setSinkId(deviceId)
	}

	private setupHeadphoneStream() {
		const streamNode = this.ctx.createMediaStreamDestination()
		this.headphoneGainLeft.connect(streamNode)
		this.headphoneGainRight.connect(streamNode)
		this.headphoneAudioElement.controls = false
		document.body.appendChild(this.headphoneAudioElement).srcObject = streamNode.stream
		this.headphoneAudioElement.setSinkId(this.headphoneDeviceId)
		this.headphoneAudioElement.play()
	}

	private async detectDevices() {
		let headphoneDevice = this.mediaDevices.find(d => /(usb|head)/i.test(d.label))
		if (!headphoneDevice) {
			headphoneDevice = this.mediaDevices[this.mediaDevices.length - 1]
		}
		let mainDevice = this.mediaDevices.find(d => d !== headphoneDevice && d.deviceId !== 'default')
		if (!mainDevice) {
			;[mainDevice] = this.mediaDevices
		}
		this.headphoneDeviceId = headphoneDevice.deviceId
		this.mainDeviceId = mainDevice.deviceId
	}

	private async refreshDevices() {
		const devs = await navigator.mediaDevices.enumerateDevices()
		const audioOutputDevices = devs.filter(device => device.kind === 'audiooutput')
		this.mediaDevices = audioOutputDevices
		const devicess = await navigator.usb.getDevices()
		console.log(devicess)
		const devicesz = await navigator.hid.getDevices()
		console.log(devicesz)
		devicesz.forEach((device: any) => {
			console.log(`HID: ${device.productName}`)
		})
	}

	private setHeadphoneActive(dir: keyof HeadphoneSettings, active: boolean) {
		this.headphoneSettings[dir].active = active
		this.updateHeadphoneGain()
	}

	private setHeadphoneVolume(dir: keyof HeadphoneSettings, volume: number) {
		this.headphoneSettings[dir].volume = volume
		this.updateHeadphoneGain()
	}

	private updateHeadphoneGain() {
		this.headphoneGainLeft.gain.value = this.headphoneSettings.left.active ? this.headphoneSettings.left.volume : 0
		this.headphoneGainRight.gain.value = this.headphoneSettings.right.active ? this.headphoneSettings.right.volume : 0
	}

	private async uploadFile(file: File) {
		const url = URL.createObjectURL(file)
		const meta = await getMetaFromUrl(url)
		let title = meta.common.artist ? `${meta.common.artist} - ` : ''
		title += meta.common.title ? meta.common.title : ''
		if (!title) title = file.name
		const bitrate = meta.format?.bitrate
		let cover = ''
		if (meta.common.picture) {
			const [picture] = meta.common.picture
			cover = `data:${picture.format};base64,${picture.data.toString('base64')}`
		}
		const bpm = meta.common.bpm ? `${meta.common.bpm} bpm` : ''
		this.files.push({
			url,
			title,
			bitrate,
			cover,
			extension: file.name.split('.').pop(),
			bpm,
			type: file.type,
			size: file.size,
			filename: file.name,
		})
		this.files = [...this.files]
	}

	private async uploadFiles(e: Event) {
		const { files } = e.target as any
		for (const f of files) {
			this.uploadFile(f)
		}
	}

	private onTrackDragStart(e: DragEvent, name: string, src: string) {
		e.dataTransfer?.setData('text/plain', `${src}#filename=${name}`)
		this.isDraggingTrack = true
	}

	private onTrackDragEnd() {
		this.isDraggingTrack = false
	}

	private onTrackDrop(side: string, e: DragEvent) {
		if (this.isDraggingTrack) {
			e.stopPropagation()
			if (side === 'left') {
				this.leftTrackSrc = e.dataTransfer?.getData('text/plain') as string
			} else {
				this.rightTrackSrc = e.dataTransfer?.getData('text/plain') as string
			}
		}
	}

	private async listLocalFiles(dirHandle: any, path: string): Promise<any[]> {
		const files = []
		for await (const [name, handle] of dirHandle) {
			if (!name.startsWith('.')) {
				const { kind } = handle
				const dirs = path.split('/')
				dirs.push(name)
				const fullPath = dirs.join('/').replace('//', '/')
				if (handle.kind === 'directory') {
					files.push({ name, handle, kind, path, fullPath, relativePath: fullPath })
					files.push(...(await this.listLocalFiles(handle, fullPath)))
				} else {
					const file = await (handle as FileSystemFileHandle).getFile()
					files.push({ name, handle, kind, path, fullPath, file, relativePath: path })
				}
			}
		}
		return files
	}

	private async loadFiles(dirHandle: FileSystemDirectoryHandle) {
		const f = await this.listLocalFiles(dirHandle, '/')
		for (const file of f.filter((fl: any) => fl.kind === 'file' && fl.file.type.startsWith('audio'))) {
			const url = URL.createObjectURL(file.file)
			const meta = await getMetaFromUrl(url)
			let title = meta.common.artist ? `${meta.common.artist} - ` : ''
			title += meta.common.title ? meta.common.title : ''
			if (!title) title = file.name
			const bitrate = meta.format?.bitrate
			let cover = ''
			if (meta.common.picture) {
				const [picture] = meta.common.picture
				cover = `data:${picture.format};base64,${picture.data.toString('base64')}`
			}
			const bpm = meta.common.bpm ? `${meta.common.bpm} bpm` : ''
			this.files.push({
				url,
				title,
				bitrate,
				cover,
				extension: file.name.split('.').pop(),
				bpm,
				type: file.file.type,
				size: file.file.size,
				filename: file.name,
			})
			this.files = [...this.files]
		}
	}

	private async openDir() {
		const dirHandle: any = await (<any>window).showDirectoryPicker()
		saveDirHandle(dirHandle, '/')
		console.log(dirHandle)

		this.loadFiles(dirHandle)
	}

	static styles = [
		scrollbarStyles,
		css`
			:host {
				min-height: 100vh;
				max-width: 100%;
				display: flex;
			}

			main {
				height: 100vh;
				flex-grow: 1;
				display: flex;
				flex-direction: column;
			}
			header {
				display: flex;
				padding: 2px;
				background-color: #1d1d1d;
				border-bottom: 1px solid #333;
				padding: 2px 10px;
			}
			combo-box {
				margin-right: 21px;
			}

			#decks {
				display: flex;
			}
			audio-track {
				flex: 1;
			}
			#files {
				background-color: #10151f;
				background-image: radial-gradient(circle at 25% 25%, rgba(255, 255, 255, 0.1) 0, rgba(255, 255, 255, 0) 150%);
				box-shadow: inset 0 0 5px rgba(0, 0, 0, 0.5);
				border-top: 1px solid #333;
				flex: 1;
				overflow: auto;
				color: #777;
				display: flex;
				flex-direction: column;
			}
			.files {
				flex: 1;
				overflow: auto;
			}
			button {
				/* background: #0c4e85; */
				background: none;
				padding: 2px 10px;
				color: #999;
				border: 2px solid #444;
				border-radius: 5px;
				margin-right: 5px;
				cursor: pointer;
				margin: 2px;
			}
			button.active {
				background: #2289f0;
				color: #ddd;
				border: 2px solid #bbb;
			}
			.file {
				display: flex;
				align-items: center;
				cursor: grab;
				width: 100%;
			}
			.cover {
				object-fit: cover;

				width: 48px;
				height: 48px;
				border-radius: 6px;
				margin-right: 10px;
				display: flex;
				align-items: center;
				justify-content: center;
				font-size: 20px;
				padding: 2px;
				font-weight: 600;
				text-transform: uppercase;
				border: 3px solid #333;
				color: #333;
			}
			.file .title {
				flex: 1;
			}
			.file > div {
				margin: 5px;
			}
		`,
	]

	renderFile(file: any, index: number) {
		return html`
			<div
				class="file"
				@dragstart="${(e: DragEvent) => this.onTrackDragStart(e, file.filename, file.url)}"
				@dragend="${() => this.onTrackDragEnd()}"
				draggable="true"
			>
				<div>
					${this.files[index].cover
						? html`<img class="cover" src="${file.cover}" alt="${file.title}" draggable="false" />`
						: html`<div class="cover">${file.extension}</div>`}
				</div>
				<div class="title">${file.title}</div>
				<div>${file.bpm}</div>
				<div>${humanFileSize(file.size)}</div>
				<div>${file.type}</div>
				<div>${humanFileSize(file.bitrate)}</div>
				<div>
					<app-icon
						icon="delete"
						@click="${() => {
							this.files.splice(index, 1)
							this.requestUpdate()
						}}"
					></app-icon>
				</div>
			</div>
		`
	}

	render() {
		return html`
			<main>
				<header>
					<combo-box
						inline
						label="Main output"
						style="width:300px;"
						mode="select"
						.value="${this.mainDeviceId}"
						.items="${this.mediaDevices.map(device => ({
							text: device.label,
							value: device.deviceId,
						}))}"
						@change="${(e: CustomEvent) => (this.mainDeviceId = e.detail)}"
						@click="${() => this.refreshDevices()}"
					></combo-box>
					<combo-box
						inline
						label="Headphone output"
						style="width:300px;"
						mode="select"
						.value="${this.headphoneDeviceId}"
						.items="${this.mediaDevices.map(device => ({
							text: device.label,
							value: device.deviceId,
						}))}"
						@change="${(e: CustomEvent) => (this.headphoneDeviceId = e.detail)}"
						@click="${() => this.refreshDevices()}"
					></combo-box>
				</header>
				<section id="decks">
					<audio-track
						id="leftTrack"
						.src=${this.leftTrackSrc}
						.out=${this.leftTrackGain}
						.ctx=${this.ctx}
						.app=${this}
						@headphone-changed="${(e: CustomEvent) => this.setHeadphoneActive('left', e.detail)}"
						@headphone-volume="${(e: CustomEvent) => this.setHeadphoneVolume('left', e.detail)}"
						@step="${(e: CustomEvent) => (this.stepLeft = e.detail)}"
						@drop="${(e: DragEvent) => this.onTrackDrop('left', e)}"
						@dragover="${(e: DragEvent) => e.preventDefault()}"
					></audio-track>
					<mixer-panel
						.left="${this.leftTrackGain}"
						.right="${this.rightTrackGain}"
						.headphoneLeftGain="${this.headphoneGainLeft}"
						.headphoneRightGain="${this.headphoneGainRight}"
						.out=${this.masterGain}
						stepLeft=${this.stepLeft}
						stepRight=${this.stepRight}
					></mixer-panel>
					<audio-track
						id="rightTrack"
						.src=${this.rightTrackSrc}
						.out=${this.rightTrackGain}
						.ctx=${this.ctx}
						.app=${this}
						@headphone-changed="${(e: CustomEvent) => this.setHeadphoneActive('right', e.detail)}"
						@headphone-volume="${(e: CustomEvent) => this.setHeadphoneVolume('right', e.detail)}"
						@step="${(e: CustomEvent) => (this.stepRight = e.detail)}"
						@drop="${(e: DragEvent) => this.onTrackDrop('right', e)}"
						@dragover="${(e: DragEvent) => e.preventDefault()}"
					></audio-track>
				</section>
				<section id="files">
					<header>
						<button @click="${() => this.uploadField.click()}">IMPORT</button>
						<input
							type="file"
							id="upload"
							multiple
							accept="audio/*"
							@change="${(e: Event) => this.uploadFiles(e)}"
							style="display: none"
						/>
						<button @click="${() => this.openDir()}">SELECT AUDIO FILES LOCATION</button>
					</header>
					<div class="files">${this.files.map((f, index) => this.renderFile(f, index))}</div>
				</section>
			</main>
		`
	}
}
