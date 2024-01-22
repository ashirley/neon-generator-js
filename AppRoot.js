"use strict";
import {
  LitElement,
  html,
  css,
} from "https://cdn.jsdelivr.net/gh/lit/dist@3/core/lit-core.min.js";

// import { BabylonRender } from "./BabylonRender.js";
//import { PaperRender } from "./PaperRender.js";
import { Generator } from "./generator/Generator.js";
import { GenerationInput } from "./generator/GenerationInput.js";
import { FileReaderComponent } from "./svgInput/FileReaderComponent.js";
import { PaperRender } from "./PaperRender.js";

export class AppRoot extends LitElement {
  static properties = {
    _inputFile: { state: true },
    _perpPoints: { state: true },
    _stl: { state: true },
  };

  constructor() {
    super();
    this.generator = new Generator();
  }

  static styles = css`
    :host {
      display: inline-block;
      min-width: 4em;
      text-align: center;
      /* padding: 0.2em;
      margin: 0.2em 0.1em; */
    }
  `;

  render() {
    return html`
      <h1>Neon generator</h1>
      ${this._inputFile == null
        ? html`<file-reader
            @loaded=${async (e) => {
              const result = await this.generator.generate(
                new GenerationInput(e.detail.contents)
              );
              this._inputFile = e.detail.contents;
              this._perpPoints = result.perpPoints;
              this._stl = result.stl;
            }}
          />`
        : this._perpPoints == null
        ? html`<p>Generating...</p>`
        : html`<paper-render
            perpPoints=${JSON.stringify(this._perpPoints)}
            style="width: 100%; display: block;"
          ></paper-render>`}
    `;
  }
}

customElements.define("app-root", AppRoot);
