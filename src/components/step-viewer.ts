import { LitElement, html, css } from 'lit'
import { customElement, property } from 'lit/decorators.js'

@customElement('step-viewer')
export class StepViewer extends LitElement {
    @property({ type: Number }) public steps = 4

    @property({ type: Number }) public currentStep = 0

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
        div {
            flex: 1;
            margin: 2px 4px;
            background: #444;
            height: 4px;
            background-image: radial-gradient(circle at 30% 50%, rgba(255, 255, 255, 0.25) 0, rgba(255, 255, 255, 0) 120%);
            box-shadow: inset 0 0 3px rgba(0, 0, 0, 0.5);
        }
        div.active {
            background-color: #2289f0;
        }
    `

    render() {
        return html`
            <main>${[...Array(this.steps).keys()].map(i => html`<div class="${i === this.currentStep ? 'active' : ''}"></div>`)}</main>
        `
    }
}
