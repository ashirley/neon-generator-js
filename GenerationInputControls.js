"use strict";
import { LitElement, html, css } from "lit";

export class GenerationInputControls extends LitElement {
  static properties = {
    _expanded: { state: true },
  };

  constructor() {
    super();
  }

  static styles = css`
    .expanded {
      height: 200px;
    }
    .collapsed {
      height: 100px;
    }
  `;

  render() {
    return html`
      ${this._expanded
        ? html`<div
            class="expanded"
            @click=${(e) => {
              this._expanded = false;
            }}
          >
            expanded
          </div>`
        : html`<div
            class="collapsed"
            @click=${(e) => {
              this._expanded = true;
            }}
          >
            collapsed
          </div>`}
    `;
  }
}

customElements.define("generation-input-controls", GenerationInputControls);
