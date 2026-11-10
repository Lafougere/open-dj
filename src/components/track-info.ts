import { LitElement, html, css, PropertyValueMap } from 'lit'
import { customElement, property, state, query } from 'lit/decorators.js'
import dayjs from 'dayjs/esm'
import { getMetaFromUrl } from '../lib/meta'

function humanFileSize(size: number) {
	const i = size === 0 ? 0 : Math.floor(Math.log(size) / Math.log(1000))
	return `${parseInt((size / 1000 ** i).toFixed(2), 10) * 1} ${['B', 'k', 'MB', 'GB', 'TB'][i]}`
}

@customElement('track-info')
export class TrackInfo extends LitElement {
	@property({ type: String }) public src = ''

	@property({ type: Number }) public tempo = 0

	@property({ type: Number }) public duration = 0

	@property({ type: Object }) public beatAnalysis: any = {}

	@state() public artist = ''

	@state() public album = ''

	@state() public title = ''

	@state() public cover = ''

	@state() private bitrate = ''

	@state() private tempoGuesses: any[] = []

	private get extension() {
		return this.src.split('.').pop() as string
	}

	// @state() private get tempoGuesses() {
	//     if (!this.beatAnalysis.guesses) return []
	//     return this.beatAnalysis.guesses.map((g: any) => ({ text: g.tempo, value: g.tempo }))
	// }

	protected updated(_changedProperties: PropertyValueMap<any> | Map<PropertyKey, unknown>): void {
		if (_changedProperties.has('src')) {
			if (this.src) {
				this.loadData()
			}
		}
		if (_changedProperties.has('beatAnalysis')) {
			if (this.beatAnalysis.guesses) {
				this.tempoGuesses = this.beatAnalysis.guesses.map((g: any) => ({ text: g.tempo, value: g.tempo }))
			}
		}
	}

	private getArtistAndTitleFromFilename(): { artist: string; title: string } {
		const filename = decodeURI(this.src.split(/(filename=|\/)/).pop() as string)
		const trackname = filename.replace(/\.(.+?)$/, '')
		if (trackname.includes(' - ')) {
			const [artist, title] = trackname.split(' - ')
			return { artist, title }
		}
		return { artist: 'Unknown', title: trackname }
	}

	private async loadData() {
		const meta = await getMetaFromUrl(this.src)

		this.album = ''
		this.artist = ''
		this.title = ''
		this.cover = ''

		if (meta && meta.common) {
			if (meta.common.title) {
				this.title = meta.common.title
			}
			if (meta.common.artist) {
				this.artist = meta.common.artist
			}
			if (meta.common.album) {
				this.album = meta.common.album + (meta.common.year ? ` (${meta.common.year})` : '')
			}
			if (meta.common.picture) {
				const [picture] = meta.common.picture
				this.cover = `data:${picture.format};base64,${picture.data.toString('base64')}`
			}
		}
		if (meta && meta.format) {
			if (meta.fomat.bitrate) {
				this.bitrate = humanFileSize(meta.format.bitrate)
			}
		}
		if (!this.title || !this.artist) {
			const { title, artist } = this.getArtistAndTitleFromFilename()
			this.title = this.title || title || 'Unknown'
			this.artist = this.artist || artist || 'Unknown'
		}
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
		}
		.cover {
			width: 96px;
			height: 96px;
			object-fit: contain;
			border-radius: 10px;
			margin-right: 10px;
			display: flex;
			align-items: center;
			justify-content: center;
			font-size: 30px;
			padding: 4px;
			font-weight: 600;
			text-transform: uppercase;
			border: 4px solid #333;
			color: #333;
			flex-shrink: 0;
		}
		.info {
			font-size: 18px;
			letter-spacing: 3px;
			color: #8aaffa;
		}

		.track-data {
			width: 100%;
			display: flex;
			justify-content: space-between;
		}
		.track-data .right {
			text-align: right;
			color: #4b5d81;
		}
	`

	render() {
		return html`
			<main>
				${this.cover
					? html`<img class="cover" src="${this.cover}" alt="${this.title}" />`
					: html`<div class="cover">${this.extension}</div>`}
				<div class="track-data">
					<div class="info">
						<div class="title">${this.title}</div>
						<div class="artist">${this.artist}</div>
						<div class="album">${this.album}</div>
					</div>
					<div class="right">
						<div>
							<combo-box
								style="width: 100px;"
								.items="${this.tempoGuesses}"
								.value="${this.tempo.toString()}"
								@change="${(e: CustomEvent) => this.dispatchEvent(new CustomEvent('tempo-updated', { detail: e.detail }))}"
							>
								<div slot="append">bpm</div>
							</combo-box>
						</div>
						<div class="duration">${dayjs().startOf('day').second(this.duration).format('mm:ss')}</div>
						<div class="bitrate">${this.bitrate ? `${this.bitrate}` : 'unknown'}</div>
					</div>
				</div>
			</main>
		`
	}
}
r
