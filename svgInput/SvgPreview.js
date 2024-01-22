"use strict";
import {
  LitElement,
  html,
  css,
  // @ts-ignore
} from "https://cdn.jsdelivr.net/gh/lit/dist@3/core/lit-core.min.js";

export class SvgPreview extends LitElement {
  static properties = {
    title: {},
    src: {},
  };

  render() {
    return html`<div style="border:black solid 3px">
      <div>${this.title}</div>
      <img src="${this.src}" style="max-height: 150px; max-width: 150px;" />
    </div>`;
  }
}

customElements.define("svg-preview", SvgPreview);
