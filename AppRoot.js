"use strict";
import { LitElement, html, css } from "lit";

// import { BabylonRender } from "./BabylonRender.js";
//import { PaperRender } from "./PaperRender.js";
import { Generator } from "./generator/Generator.js";
import { GenerationInput } from "./generator/GenerationInput.js";
import { FileReaderComponent } from "./svgInput/FileReaderComponent.js";
import { PaperRender } from "./PaperRender.js";
import { ThreeRender } from "./ThreeRender.js";

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
      height: 100%;
      /* padding: 0.2em;
      margin: 0.2em 0.1em; */
    }

    #mainContent {
      display: grid;
      grid-template-columns: 50% 50%;
      height: 100%;
    }

    #mainContent h1 {
      grid-row: 1;
      grid-column: 1 / 3;
    }

    #mainContent paper-render {
      grid-row: 2;
      grid-column: 1;
    }

    #mainContent three-render {
      grid-row: 2;
      grid-column: 2;
    }

    #mainContent file-reader {
      grid-row: 2;
      grid-column: 1 / 3;
    }

    #mainContent generation-input-controls {
      grid-row: 3;
      grid-column: 1 / 3;
    }
  `;

  render() {
    return html`
      <div id="mainContent">
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
          : html`<three-render
                perpPoints=${JSON.stringify(this._perpPoints)}
              ></three-render>
              <paper-render
                perpPoints=${JSON.stringify(this._perpPoints)}
              ></paper-render>`}
      </div>
    `;
  }
}

customElements.define("app-root", AppRoot);
