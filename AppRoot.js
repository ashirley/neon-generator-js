"use strict";
import { LitElement, html, css } from "lit";

// import { BabylonRender } from "./BabylonRender.js";
//import { PaperRender } from "./PaperRender.js";
import { Generator } from "./generator/Generator.js";
import { FileReaderComponent } from "./svgInput/FileReaderComponent.js";
import { PaperRender } from "./PaperRender.js";
import { ThreeRender } from "./ThreeRender.js";
import { GenerationInputControls } from "./GenerationInputControls.js";

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
      display: flex;
      flex-direction: column;
      height: 100%;
    }

    h1 {
      text-align: center;
      flex: 0;
    }

    .renders {
      flex: 1;
      overflow: hidden;

      display: flex;
    }

    paper-render {
      width: 50%;
    }

    three-render {
      width: 50%;
    }

    file-reader {
      flex: 1;
    }

    generation-input-controls {
      flex: 0;
    }
  `;

  render() {
    return html`
      <h1>Neon generator</h1>
      ${this._inputFile == null
        ? html`<file-reader
            @loaded=${async (e) => {
              this._inputFile = e.detail.contents;
              await this.triggerGeneration();
            }}
          />`
        : this._perpPoints == null
        ? html`<p>Generating...</p>`
        : html`<div class="renders">
            <three-render
              perpPoints=${JSON.stringify(this._perpPoints)}
            ></three-render>
            <paper-render
              perpPoints=${JSON.stringify(this._perpPoints)}
            ></paper-render>
          </div> `}
      <generation-input-controls
        @changed=${async (e) => {
          this._generationInput = e.detail.generationInput;
          this.triggerGeneration();
        }}
        @newImageClicked=${() => {
          this._inputFile = null;
        }}
      ></generation-input-controls>
    `;
  }

  async triggerGeneration() {
    if (this._inputFile) {
      const result = await this.generator.generate(
        this._generationInput.withInputSvgData(this._inputFile)
      );
      this._perpPoints = result.perpPoints;
      this._stl = result.stl;
    }
  }
}

customElements.define("app-root", AppRoot);
