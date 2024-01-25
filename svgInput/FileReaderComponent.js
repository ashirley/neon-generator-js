"use strict";
import {
  LitElement,
  html,
  css,
  // @ts-ignore
} from "lit";

import { SvgPreview } from "./SvgPreview.js";

export class FileReaderComponent extends LitElement {
  render() {
    return html`
      ${sessionStorage.getItem("previousSvg")
        ? html`<svg-preview
            title="Load Previous"
            @click=${(e) => this.loadFromSessionStorage()}
            src=${"data:image/svg+xml;base64," +
            btoa(sessionStorage.getItem("previousSvg"))}
          >
          </svg-preview>`
        : ""}
      <!-- 2lines.svg  arc.svg     freehand-simpler.svg  lines.svg     size.svg    toilet-small.svg  tree.svg
2paths.svg  curves.svg  freehand.svg          s-curves.svg  spiral.svg  toilet.svg -->
      <svg-preview
        title="2 lines"
        @click=${(e) => this.loadFromUrl("/examples/2lines.svg")}
        src="/examples/2lines.svg"
      >
      </svg-preview>
      <input
        type="file"
        id="file-selector"
        @change=${(event) => this.readFile(event.target.files[0])}
      />
    `;
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
