/* eslint-disable no-return-assign */
import { LitElement, html, css, PropertyValueMap } from 'lit'
import { customElement, property, query } from 'lit/decorators.js'

import './knob-equalizer'
import './vu-meter'
import './range-slider'
import './cross-fader'
import type { KnobEqualizer } from './knob-equalizer'

const ctx = window.audioContext

@customElement('mixer-panel')
export class MixerPanel extends LitElement {
    // @property({ type: Object }) public ctx!: AudioContext

    @property({ type: Object }) public left!: AudioNode

    @property({ type: Object }) public right!: AudioNode

    @property({ type: Object }) public out!: AudioNode

    @property({ type: Object }) public headphoneLeftGain!: GainNode

    @property({ type: Object }) public headphoneRightGain!: GainNode

    @property({ type: Number }) public stepLeft = 0

    @property({ type: Number }) public stepRight = 0

    @query('#eqLeft') private eqLeft!: KnobEqualizer

    @query('#eqRight') private eqRight!: KnobEqualizer

    public masterGain: GainNode = ctx.createGain()

    private leftVolume: GainNode = ctx.createGain()

    private rightVolume: GainNode = ctx.createGain()

    protected firstUpdated(_changedProperties: PropertyValueMap<any> | Map<PropertyKey, unknown>): void {
        this.eqLeft.masterGain.connect(this.headphoneLeftGain)
        this.eqRight.masterGain.connect(this.headphoneRightGain)
    }

    static styles = css`
        :host {
            display: block;
            padding: 10px;
            background-color: #040507;
            background-image: radial-gradient(circle at 25% 25%, rgba(255, 255, 255, 0.1) 0, rgba(255, 255, 255, 0) 90%);
            box-shadow: inset 0 0 5px rgba(0, 0, 0, 0.5);
            border-bottom: 1px solid #111;
            background-size: 150%;
        }
        :host * {
            box-sizing: border-box;
        }

        main {
            display: block;
        }
        .eq,
        .vu,
        .vol {
            display: flex;
            justify-content: space-around;
        }
        .vu {
            padding: 10px 0;
        }
        .steps {
            padding: 4px;
            margin-bottom: 4px;
        }
        vu-meter {
            margin: auto auto;
        }
        cross-fader {
            margin-left: -8px;
        }
    `

    render() {
        return html`
            <main>
                <div class="steps">
                    <step-viewer currentStep="${this.stepLeft}"></step-viewer>
                    <step-viewer currentStep="${this.stepRight}"></step-viewer>
                </div>
                <div class="eq">
                    <knob-equalizer id="eqLeft" .in=${this.left} .out=${this.leftVolume}></knob-equalizer>
                    <vu-meter .in=${this.leftVolume} leds="30"></vu-meter>
                    <vu-meter .in=${this.rightVolume} leds="30"></vu-meter>
                    <knob-equalizer id="eqRight" .in=${this.right} .out=${this.rightVolume}></knob-equalizer>
                </div>
                <div class="vol">
                    <range-slider
                        min="0"
                        max="1"
                        value="1"
                        @input="${(e: CustomEvent) => (this.leftVolume.gain.value = e.detail)}"
                    ></range-slider>
                    <range-slider
                        min="0"
                        max="1"
                        value="1"
                        @input="${(e: CustomEvent) => (this.rightVolume.gain.value = e.detail)}"
                    ></range-slider>
                </div>
                <div class="xfade">
                    <cross-fader .leftIn="${this.leftVolume}" .rightIn="${this.rightVolume}" .out="${this.out}"></cross-fader>
                </div>
            </main>
        `
    }
}
