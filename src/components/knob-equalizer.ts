/* eslint-disable no-return-assign */
import { LitElement, html, css, PropertyValueMap } from 'lit'
import { customElement, property } from 'lit/decorators.js'
import './round-knob'

const ctx = window.audioContext

@customElement('knob-equalizer')
export class KnobEqualizer extends LitElement {
    // @property({ type: Object }) public ctx!: AudioContext

    @property({ type: Object }) public in!: AudioNode

    @property({ type: Object }) public out!: AudioNode

    public masterGain: GainNode = ctx.createGain()

    private low: BiquadFilterNode = ctx.createBiquadFilter()

    private mid: BiquadFilterNode = ctx.createBiquadFilter()

    private high: BiquadFilterNode = ctx.createBiquadFilter()

    private filter: BiquadFilterNode = ctx.createBiquadFilter()

    protected firstUpdated(_changedProperties: PropertyValueMap<any> | Map<PropertyKey, unknown>): void {
        // this.masterGain = this.ctx.createGain()
        // this.low = this.ctx.createBiquadFilter()
        this.low.type = 'lowshelf'
        this.low.frequency.value = 320.0
        this.low.gain.value = 0.0
        this.low.connect(this.masterGain)

        // this.mid = this.ctx.createBiquadFilter()
        this.mid.type = 'peaking'
        this.mid.frequency.value = 1000.0
        this.mid.Q.value = 0.5
        this.mid.gain.value = 0.0
        this.mid.connect(this.low)

        // this.high = this.ctx.createBiquadFilter()
        this.high.type = 'highshelf'
        this.high.frequency.value = 3200.0
        this.high.gain.value = 0.0
        this.high.connect(this.mid)

        // this.filter = this.ctx.createBiquadFilter()
        this.filter.frequency.value = 20000.0
        this.filter.type = 'lowpass'
        this.filter.connect(this.high)

        this.in.connect(this.filter)
        // this.masterGain.connect(this.out)
    }

    protected updated(_changedProperties: PropertyValueMap<any> | Map<PropertyKey, unknown>): void {
        if (_changedProperties.has('in')) {
            console.log('eq connect in')
            // this.in.connect(this.filter)
        }
        if (_changedProperties.has('out')) {
            console.log('eq connect out')
            this.masterGain.connect(this.out)
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
            flex-direction: column;
        }
    `

    render() {
        return html`
            <main>
                <round-knob
                    label="GAIN"
                    radius="20"
                    min="0"
                    max="2"
                    value="1"
                    @input="${(e: CustomEvent) => (this.masterGain.gain.value = e.detail)}"
                ></round-knob>
                <round-knob
                    label="HI"
                    radius="20"
                    min="-30"
                    max="30"
                    value="0"
                    @input="${(e: CustomEvent) => this.high && (this.high.gain.value = e.detail)}"
                ></round-knob>
                <round-knob
                    label="MID"
                    radius="20"
                    min="-30"
                    max="30"
                    @input="${(e: CustomEvent) => this.mid && (this.mid.gain.value = e.detail)}"
                ></round-knob>
                <round-knob
                    label="LO"
                    radius="20"
                    min="-30"
                    max="30"
                    @input="${(e: CustomEvent) => this.low && (this.low.gain.value = e.detail)}"
                ></round-knob>
            </main>
        `
    }
}
