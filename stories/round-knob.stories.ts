import { html, TemplateResult } from 'lit'
import '../src/components/round-knob'

window.process = window.process || { env: 'development' }
export default {
    title: 'RoundKnob',
    component: 'round-knob',
    argTypes: {
        radius: { control: 'number' },
    },
}

declare global {
    interface HTMLAudioElement {
        setSinkId: (id: string) => void
    }
    interface AudioContext {
        setSinkId: (id: string) => void
    }
    interface Window {
        audioContext: AudioContext
    }
}

interface Story<T> {
    (args: T): TemplateResult
    args?: Partial<T>
    argTypes?: Record<string, unknown>
}
// @property({ type: Number }) public radius = 30

// @property({ type: Number }) public rotationMin = -135

// @property({ type: Number }) public rotationMax = 135

// @property({ type: Number }) public min = -1

// @property({ type: Number }) public max = 1

// @property({ type: Number }) public precision = 2

// @property({ type: Number }) public strokeWidth = 4

// @property({ type: Number }) public value = 0

// @property({ type: String }) public type = 'pan'

// @property({ type: String }) public label = ''

interface ArgTypes {
    radius: number
    rotationMin?: number
    rotationMax?: number
    min?: number
    max?: number
    precision?: number
    strokeWidth?: number
    value?: number
    type?: string
    label?: string
}
window.audioContext = new AudioContext()
const Template: Story<ArgTypes> = ({ radius }: ArgTypes) => html` <round-knob radius="${radius}"></round-knob> `

export const RoundKnob = Template.bind({})
RoundKnob.args = {
    radius: 20,
}
