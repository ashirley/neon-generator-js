"use strict";
import { LitElement, html, css } from "lit";
import { GenerationInput } from "./generator/GenerationInput.js";

export class GenerationInputControls extends LitElement {
  static properties = {
    _expanded: { state: true },
    _length: { state: true },
    _resolution: { state: true },
    _lengthCheck: { state: true },
    _lengthVal: { state: true },
    _lengthUnit: { state: true },
    _profileType: { state: true },
  };

  constructor() {
    super();
    //TODO: don't initialise and store if we havn't explicitly set them
    this._resolution = 500;
    this._lengthUnit = "mm";
    this._profileType = "10mm";
    this._profileCustomChannelWidth = 10;
    this._profileCustomChannelDepth = 15;
    this._profileCustomWallWidth = 2;
  }

  static styles = css`
    .expanded {
      height: 200px;
    }
    .collapsed {
      height: 1.5em;
      padding: 0.25em;
    }
    label {
      padding-left: 1em;
    }
    .collapsed #lengthCheck {
      margin-left: 0;
      margin-right: 0;
    }
  `;

  //TODO: preserve previous choices in localstorage

  render() {
    return html`
      ${this._expanded
        ? html`<div class="expanded">
            <button
              @click=${(e) => {
                this._expanded = false;
              }}
            >
              ...
            </button>
            <label class="resolutionContainer"
              >Resolution
              <input
                id="resolution"
                name="resolution"
                value=${this._resolution}
                type="number"
                size="5"
                @change=${(e) => {
                  this._resolution = e.target.value;
                  this.fireEvent();
                }}
              />
            </label>
            <label class="lengthContainer"
              >Fixed Length
              <input
                id="lengthCheck"
                name="lengthCheck"
                ?checked=${this._lengthCheck}
                type="checkbox"
                @change=${(e) => {
                  this._lengthCheck = e.target.checked;
                  this.fireEvent();
                }}
              />
              <input
                id="lengthVal"
                name="lengthVal"
                value=${this._lengthVal}
                type="number"
                ?disabled=${!this._lengthCheck}
                size="10"
                @change=${(e) => {
                  this._lengthVal = e.target.value;
                  this.fireEvent();
                }}
              />
              <select
                id="lengthUnit"
                name="lengthUnit"
                ?disabled=${!this._lengthCheck}
                @change=${(e) => {
                  this._lengthUnit = e.target.selectedOptions[0].value;
                  this.fireEvent();
                }}
              >
                <option value="pts" ?selected=${this._lengthUnit === "pts"}>
                  pts
                </option>
                <option value="mm" ?selected=${this._lengthUnit === "mm"}>
                  mm
                </option>
                <option value="cm" ?selected=${this._lengthUnit === "cm"}>
                  cm
                </option>
              </select>
            </label>
            <label class="profileContainer"
              >Profile
              <select
                id="profileType"
                name="profileType"
                @change=${(e) => {
                  this._profileType = e.target.selectedOptions[0].value;
                  this.fireEvent();
                }}
              >
                <option
                  value="custom"
                  ?selected=${this._profileType === "custom"}
                >
                  Custom...
                </option>
                <option
                  value="noodle"
                  ?selected=${this._profileType === "noodle"}
                  title="Thin, flexible LED filament"
                >
                  Noodle
                </option>
                <option
                  value="10mm"
                  ?selected=${this._profileType === "10mm"}
                  title="Standard 10mm wide LED neon"
                >
                  10mm
                </option>
              </select>
              ${this._profileType === "custom"
                ? html`<input
                      id="profileCustomChannelWidth"
                      name="profileCustomChannelWidth"
                      value=${this._profileCustomChannelWidth}
                      type="number"
                      size="5"
                      @change=${(e) => {
                        this._profileCustomChannelWidth = e.target.value;
                        this.fireEvent();
                      }}
                    />
                    <input
                      id="profileCustomChannelDepth"
                      name="profileCustomChannelDepth"
                      value=${this._profileCustomChannelDepth}
                      type="number"
                      size="5"
                      @change=${(e) => {
                        this._profileCustomChannelDepth = e.target.value;
                        this.fireEvent();
                      }}
                    />
                    <input
                      id="profileCustomWallWidth"
                      name="profileCustomWallWidth"
                      value=${this._profileCustomWallWidth}
                      type="number"
                      size="5"
                      @change=${(e) => {
                        this._profileCustomWallWidth = e.target.value;
                        this.fireEvent();
                      }}
                    />`
                : ""}
            </label>
          </div>`
        : html`<div class="collapsed">
            <button
              @click=${(e) => {
                this._expanded = true;
              }}
            >
              ...
            </button>

            <label class="lengthContainer">
              <input
                id="lengthCheck"
                name="lengthCheck"
                ?checked=${this._lengthCheck}
                type="checkbox"
                @change=${(e) => {
                  this._lengthCheck = e.target.checked;
                  this.fireEvent();
                }}
              />
              <input
                id="lengthVal"
                name="lengthVal"
                value=${this._lengthVal}
                type="number"
                ?disabled=${!this._lengthCheck}
                size="5"
                @change=${(e) => {
                  this._lengthVal = e.target.value;
                  this.fireEvent();
                }}
              />
              <select
                id="lengthUnit"
                name="lengthUnit"
                ?disabled=${!this._lengthCheck}
                @change=${(e) => {
                  this._lengthUnit = e.target.selectedOptions[0].value;
                  this.fireEvent();
                }}
              >
                <option value="pts" ?selected=${this._lengthUnit === "pts"}>
                  pts
                </option>
                <option value="mm" ?selected=${this._lengthUnit === "mm"}>
                  mm
                </option>
                <option value="cm" ?selected=${this._lengthUnit === "cm"}>
                  cm
                </option>
              </select>
            </label>
            <label class="profileContainer">
              <select
                id="profileType"
                name="profileType"
                @change=${(e) => {
                  this._profileType = e.target.selectedOptions[0].value;
                  this.fireEvent();
                }}
              >
                <option
                  value="custom"
                  ?selected=${this._profileType === "custom"}
                >
                  Custom...
                </option>
                <option
                  value="noodle"
                  ?selected=${this._profileType === "noodle"}
                  title="Thin, flexible LED filament"
                >
                  Noodle
                </option>
                <option
                  value="10mm"
                  ?selected=${this._profileType === "10mm"}
                  title="Standard 10mm wide LED neon"
                >
                  10mm
                </option>
              </select>
            </label>
          </div>`}
    `;
  }

  firstUpdated() {
    //send the initial settings
    this.fireEvent();
  }

  fireEvent() {
    const lengthInPts = (() => {
      if (this._lengthCheck && this._lengthVal != null) {
        switch (this._lengthUnit) {
          case "mm":
            return Math.round((this._lengthVal * 96) / 25.4);
          case "cm":
            return Math.round((this._lengthVal * 960) / 25.4);
          case "pts":
            return this._lengthVal;
          default:
            console.log(
              `Unknown unit '${this._lengthUnit}' cannot convert to pts.`
            );
            return this._lengthVal;
        }
      }
      return null;
    })();

    const profileSize = (() => {
      switch (this._profileType) {
        case "custom":
          return {
            channel_width: this._profileCustomChannelWidth,
            channel_depth: this._profileCustomChannelDepth,
            wall_width: this._profileCustomWallWidth,
          };
        case "noodle":
          return { channel_width: 2, channel_depth: 2, wall_width: 1 };
        case "10mm":
          return { channel_width: 10, channel_depth: 15, wall_width: 2 };
        default:
          console.log(
            `Unknown profile type '${this._lengthUnit}'. Assuming 10mm.`
          );
          return { channel_width: 10, channel_depth: 15, wall_width: 2 };
      }
    })();

    console.log(
      this._resolution,
      this._lengthCheck,
      this._lengthVal,
      this._lengthUnit,
      lengthInPts,
      JSON.stringify(profileSize)
    );

    let myEvent = new CustomEvent("changed", {
      detail: {
        generationInput: new GenerationInput(
          null,
          lengthInPts,
          this._resolution,
          profileSize
        ),
      },
      bubbles: true,
      composed: true,
    });

    this.dispatchEvent(myEvent);
  }
}

customElements.define("generation-input-controls", GenerationInputControls);
