"use strict";
import {
  LitElement,
  html,
  css,
  // @ts-ignore
} from "lit";

import { SvgPreview } from "./SvgPreview.js";

export class FileReaderComponent extends LitElement {
  static styles = css`
    :host {
      overflow: scroll;
    }
    .samples {
      display: flex;
      flex-wrap: wrap;
    }
    .mainSelection {
      display: flex;
      flex-wrap: wrap;
    }
  `;

  render() {
    return html`
      <div class="mainSelection">
        ${sessionStorage.getItem("previousSvg")
          ? html`<svg-preview
              title="Load Previous"
              @click=${(e) => this.loadFromSessionStorage()}
              src=${"data:image/svg+xml;base64," +
              btoa(sessionStorage.getItem("previousSvg"))}
            >
            </svg-preview>`
          : ""}
        <input
          type="file"
          id="file-selector"
          @change=${(event) => this.readFile(event.target.files[0])}
        />
      </div>
      <h3>Samples</h3>
      <div class="samples">
        ${this.sample("2 lines", "./examples/2lines.svg")}
        ${this.sample("Arc", "./examples/arc.svg")}
        ${this.sample("Freehand Simpler", "./examples/freehand-simpler.svg")}
        ${this.sample("Lines", "./examples/lines.svg")}
        ${this.sample("Size", "./examples/size.svg")}
        ${this.sample("Toilet (small)", "./examples/toilet-small.svg")}
        ${this.sample("Tree", "./examples/tree.svg")}
        ${this.sample("2 paths", "./examples/2paths.svg")}
        ${this.sample("Curves", "./examples/curves.svg")}
        ${this.sample("Freehand", "./examples/freehand.svg")}
        ${this.sample("S Curves", "./examples/s-curves.svg")}
        ${this.sample("Spiral", "./examples/spiral.svg")}
        ${this.sample("Toilet", "./examples/toilet.svg")}
      </div>
    `;
  }

  sample(title, url) {
    return html`<svg-preview
      title=${title}
      @click=${(e) => this.loadFromUrl(url)}
      src=${url}
    >
    </svg-preview> `;
  }

  loadFromSessionStorage() {
    this.emitLoadedEvent(sessionStorage.getItem("previousSvg"));
  }

  async loadFromUrl(url) {
    const data = await fetch(url);
    this.emitLoadedEvent(await data.text());
  }

  readFile(file) {
    const reader = new FileReader();
    reader.addEventListener("load", (event) => {
      //TODO: try to save previous SVG to local storage
      try {
        sessionStorage.setItem("previousSvg", event.target.result);
      } catch (QuotaExceededError) {
        console.log("Couldn't set uploaded file into localStorage");
      }

      this.emitLoadedEvent(event.target.result);
    });
    reader.readAsText(file);
  }

  emitLoadedEvent(fileContents) {
    let myEvent = new CustomEvent("loaded", {
      detail: { contents: fileContents },
      bubbles: true,
      composed: true,
    });

    this.dispatchEvent(myEvent);
  }
}

customElements.define("file-reader", FileReaderComponent);
