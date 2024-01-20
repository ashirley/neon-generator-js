"use strict";
import {
  LitElement,
  html,
  css,
  // @ts-ignore
} from "https://cdn.jsdelivr.net/gh/lit/dist@3/core/lit-core.min.js";

export class FileReaderComponent extends LitElement {
  render() {
    return html`
      ${sessionStorage.getItem("previousSvg")
        ? html`<button @click=${(e) => this.loadFromSessionStorage()}>
            Load Previous
          </button>`
        : ""}
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
