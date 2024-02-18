"use strict";
import "./node_modules/paper/dist/paper-core.js";
import {
  LitElement,
  html,
  css,
  // @ts-ignore
} from "lit";

export class BackPlateDebug extends LitElement {
  static properties = {
    backPlatePerimeter: { type: Array },
    backPlatePerimeterDebug: { type: Array },
  };

  render() {
    return html`<canvas
      id="paperCanvas-backPlateDebug"
      style="width: 100%; height: 100%"
      resize
    ></canvas>`;
  }

  firstUpdated() {
    const canvas = this.renderRoot.getElementById("paperCanvas-backPlateDebug");
    paper.setup(canvas);
    this.paperProject = paper.project;
    this.paperView = paper.view;

    this.paperProject.activeLayer.applyMatrix = false;

    const resizeObserver = new ResizeObserver((entries) => {
      this.resizeToCanvas();
    });

    resizeObserver.observe(canvas);
  }

  updated() {
    // console.log("updated");
    this.paperProject.activeLayer.removeChildren();
    //TODO: copy original SVG into debug output

    const bpg = new paper.Group();
    this.paperProject.activeLayer.addChild(bpg);

    bpg.addChild(
      new paper.Path({
        segments: this.backPlatePerimeter.map((point) => [point[1], point[2]]),
        strokeColor: "green",
        closed: true,
      })
    );

    this.g = new paper.Group();
    this.paperProject.activeLayer.addChild(this.g);

    this.paperView.onFrame = (event) => {
      const indexToShow = Math.floor(
        event.time % this.backPlatePerimeterDebug.length
      );
      if (this.indexToShow !== indexToShow) {
        // console.log(this.backPlatePerimeterDebug[indexToShow].nextPoint);
        this.indexToShow = indexToShow;

        this.g.removeChildren();
        this.g.addChild(
          new paper.Path({
            segments: this.backPlatePerimeterDebug[indexToShow].points.map(
              (point) => [point[1], point[2]]
            ),
            strokeColor: "black",
            closed: true,
          })
        );

        const nextPoint = this.backPlatePerimeterDebug[indexToShow].nextPoint;
        const nextPointCircle = new paper.Shape.Circle(
          [nextPoint[1], nextPoint[2]],
          2
        );
        nextPointCircle.fillColor = "red";

        this.g.addChild(nextPointCircle);
      }
    };

    this.resizeToCanvas();
  }

  resizeToCanvas() {
    // console.log("resizing");

    //TODO: center the image on the axis with room

    const newCanvasBounds = this.paperView.element.getBoundingClientRect();
    this.paperView.setViewSize(newCanvasBounds.width, newCanvasBounds.height);

    const sb = this.paperProject.activeLayer.strokeBounds;

    var min_x = sb.x;
    var max_x = sb.x + sb.width;
    var min_y = sb.y;
    var max_y = sb.y + sb.height;

    const x_padding = (max_x - min_x) * 0.05;
    const y_padding = (max_y - min_y) * 0.05;
    min_x = min_x - x_padding;
    max_x = max_x + x_padding;
    min_y = min_y - y_padding;
    max_y = max_y + y_padding;

    // this.paperProject.activeLayer.addChild(
    //   new paper.Path.Rectangle({
    //     point: [min_x + x_padding, min_y + y_padding],
    //     size: [x_padding, x_padding],
    //     fillColor: "black",
    //   })
    // );

    this.paperProject.activeLayer.transform(
      new paper.Matrix()
        .translate(
          new paper.Point(
            this.paperView.bounds.x - min_x,
            this.paperView.bounds.y - min_y
          )
        )
        .scale(
          Math.min(
            this.paperView.bounds.width / (max_x - min_x),
            this.paperView.bounds.height / (max_y - min_y)
          ),
          new paper.Point(min_x, min_y)
        )
    );

    // this.paperProject.activeLayer.fitBounds(
    //   this.paperProject.activeLayer.strokeBounds
    // );
  }
}

customElements.define("back-plate-debug", BackPlateDebug);
