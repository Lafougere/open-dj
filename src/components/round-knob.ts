import { LitElement, html, TemplateResult, css, PropertyValueMap } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';

function polarToCartesian(
  centerX: number,
  centerY: number,
  radius: number,
  angleInDegrees: number,
) {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;

  return {
    x: centerX + radius * Math.cos(angleInRadians),
    y: centerY + radius * Math.sin(angleInRadians),
  };
}

function getArcPath(
  x: number,
  y: number,
  radius: number,
  startAngle: number,
  endAngle: number,
) {
  const start = polarToCartesian(x, y, radius, endAngle);
  const end = polarToCartesian(x, y, radius, startAngle);

  const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';

  const d = [
    'M',
    start.x,
    start.y,
    'A',
    radius,
    radius,
    0,
    largeArcFlag,
    0,
    end.x,
    end.y,
  ].join(' ');

  return d;
}

@customElement('round-knob')
export class RoundKnob extends LitElement {
  @property({ type: Number }) public radius = 30;

  @property({ type: Number }) public rotationMin = -135;

  @property({ type: Number }) public rotationMax = 135;

  @property({ type: Number }) public min = -1;

  @property({ type: Number }) public max = 1;

  @property({ type: Number }) public precision = 2;

  @property({ type: Number }) public strokeWidth = 4;

  @property({ type: Number }) public value = 0;

  @property({ type: String }) public type = 'pan';

  @property({ type: String }) public label = '';

  @query('#dragimage') public dragImage!: HTMLDivElement;

  @query('#bgarc') public bgarc!: SVGPathElement;

  @query('#arc') public arc!: SVGPathElement;

  @query('#dotarc') public dotarc!: SVGPathElement;

  @state() private rotation = 0;

  private prevPosition = 0;

  private get range() {
    return Math.abs(this.max) + Math.abs(this.min);
  }

  private get rotationRange() {
    return Math.abs(this.rotationMax) + Math.abs(this.rotationMin);
  }

  protected updated(
    _changedProperties: PropertyValueMap<any> | Map<PropertyKey, unknown>,
  ): void {
    if (_changedProperties.has('rotation')) {
      this.updateArc();
      this.updateValue();
    }
    if (
      _changedProperties.has('rotationMin') ||
      _changedProperties.has('rotationMax')
    ) {
      this.setupArc();
    }
    if (_changedProperties.has('value')) {
      const diff = this.value - this.min;
      const ratio = diff / this.range;
      this.rotation = this.rotationMin + this.rotationRange * ratio;
    }
  }

  private updateArc() {
    const center = this.radius;
    const radius = this.radius - this.strokeWidth;
    const dotRadius = radius - 7;
    if (this.type === 'pan') {
      if (this.rotation < 0) {
        this.arc.setAttribute(
          'd',
          getArcPath(center, center, radius, this.rotation, 0),
        );
      } else {
        this.arc.setAttribute(
          'd',
          getArcPath(center, center, radius, 0, this.rotation),
        );
      }
    } else {
      this.arc.setAttribute(
        'd',
        getArcPath(center, center, radius, this.rotationMin, this.rotation),
      );
    }
    this.dotarc.setAttribute(
      'd',
      getArcPath(center, center, dotRadius, this.rotation, this.rotation - 1),
    );
  }

  private setupArc() {
    const center = this.radius;
    const dotRadius = this.radius - this.strokeWidth - 7;
    this.bgarc.setAttribute(
      'd',
      getArcPath(
        center,
        center,
        this.radius - this.strokeWidth,
        this.rotationMin,
        this.rotationMax,
      ),
    );
    this.dotarc.setAttribute(
      'd',
      getArcPath(center, center, dotRadius, this.rotation, this.rotation - 1),
    );
  }

  private updateValue() {
    const diff = this.rotation - this.rotationMin;
    const ratio = diff / this.rotationRange;
    const value =
      Math.round((this.min + this.range * ratio) * 10 ** this.precision) /
      10 ** this.precision;
    this.dispatchEvent(new CustomEvent('input', { detail: value }));
  }

  private onDragStart(e: DragEvent) {
    this.prevPosition = e.clientY;
    e.dataTransfer?.setDragImage(this.dragImage, 0, 0);
  }

  private onDrag(e: DragEvent) {
    console.log('drag', e.clientY);
    if (e.clientY) {
      this.rotation -= e.clientY - this.prevPosition;
      this.rotation = Math.min(
        Math.max(this.rotation, this.rotationMin),
        this.rotationMax,
      );
      this.prevPosition = e.clientY;
      e.dataTransfer?.setDragImage(this.dragImage, 0, 0);
    }
  }

  static styles = css`
    :host {
      display: block;
      color: inherit;
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    :host {
      box-sizing: border-box;
    }
    #knob {
      position: relative;
      z-index: 1;
    }

    svg {
      position: absolute;
      top: 0;
      left: 0;
    }
    label {
      font-size: 8px;
      text-align: center;
      font-family: Arial, Helvetica, sans-serif;
      color: #777;
      line-height: 8px;
      letter-spacing: 2px;
    }
  `;

  public render(): TemplateResult {
    return html`
      <div
        id="knob"
        @dragstart=${(e: DragEvent) => this.onDragStart(e)}
        @drag=${(e: DragEvent) => this.onDrag(e)}
        draggable="true"
        style="width: ${this.radius * 2}px; height:${this.radius * 2}px; "
      >
        <svg
          @dragstart=${(e: DragEvent) => this.onDragStart(e)}
          @drag=${(e: DragEvent) => this.onDrag(e)}
          draggable="true"
          style="width: ${this.radius * 2}px; height:${this.radius * 2}px; "
        >
          <circle
            cx="${this.radius}"
            cy="${this.radius}"
            r="${this.radius - this.strokeWidth}"
            fill="#444"
            stroke="none"
          ></circle>
          <path
            id="bgarc"
            fill="none"
            stroke="#2c3141"
            stroke-width=${this.strokeWidth}
            stroke-linecap="round"
          />
          <path
            id="arc"
            fill="none"
            stroke="#2289f0"
            stroke-width=${this.strokeWidth}
            stroke-linecap="round"
            style=""
          />
          <path
            id="dotarc"
            fill="#ccc"
            stroke="#777"
            stroke-width="4"
            stroke-linecap="round"
            style=""
          />
        </svg>
      </div>
      <label>${this.label}</label>
      <span id="dragimage"></span>
    `;
  }
}
