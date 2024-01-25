"use strict";
import {
  LitElement,
  html,
  css,
  // @ts-ignore
} from "lit";

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
