"use strict";
import "./node_modules/paper/dist/paper-core.js";
import {
  LitElement,
  html,
  css,
  // @ts-ignore
} from "lit";

export class PaperRender extends LitElement {
  static properties = {
    perpPoints: { type: Array },
    backPlatePerimeter: { type: Array },
  };

  render() {
    return html`<canvas
      id="paperCanvas"
      style="width: 100%; height: 100%"
      resize
    ></canvas>`;
  }

  firstUpdated() {
    // console.log("firstUpdated");
    const canvas = this.renderRoot.getElementById("paperCanvas");
    paper.setup(canvas);
    this.paperProject = paper.project;
    this.paperView = paper.view;

    const resizeObserver = new ResizeObserver((entries) => {
      this.resizeToCanvas();
    });

    resizeObserver.observe(canvas);
  }

  updated() {
    // console.log("updated");
    this.paperProject.activeLayer.removeChildren();
    //TODO: copy original SVG into debug output

    const g = new paper.Group();
    this.paperProject.activeLayer.addChild(g);

    // add perpPoints to debug
    this.perpPoints.forEach(({ covered, points }) => {
      var prev_perp_point = null;
      var first = true;
      points.forEach((point) => {
        // console.log(point);
        if (first) {
          // Add a dot for the first left point
          const firstPointCircle = new paper.Shape.Circle(
            new paper.Point(point.lo[1], point.lo[2]),
            2
          );
          firstPointCircle.fillColor = "black";
          g.addChild(firstPointCircle);
          first = false;
        }
        g.addChild(
          new paper.Path({
            segments: [
              [point.lo[1], point.lo[2]],
              [point.ro[1], point.ro[2]],
            ],
            //TODO error indexes or similar
            //TODO: can lines have descriptions or tooltips?
            strokeColor: "black",
          })
        );
        if (prev_perp_point) {
          g.addChild(
            new paper.Path({
              segments: [
                [prev_perp_point.lo[1], prev_perp_point.lo[2]],
                [point.lo[1], point.lo[2]],
              ],
              strokeColor: "black",
            })
          );
          g.addChild(
            new paper.Path({
              segments: [
                [prev_perp_point.ro[1], prev_perp_point.ro[2]],
                [point.ro[1], point.ro[2]],
              ],
              strokeColor: "black",
            })
          );
        }
        prev_perp_point = point;
      });
    });

    //back plate
    if (this.backPlatePerimeter) {
      const bpg = new paper.Group();
      this.paperProject.activeLayer.addChild(bpg);

      bpg.addChild(
        new paper.Path({
          segments: this.backPlatePerimeter.map((point) => [
            point[1],
            point[2],
          ]),
          strokeColor: "green",
          closed: true,
        })
      );
    }
    //TODO: curvature comb

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

  // downloadSVG() {
  //   var svg = project.exportSVG({ asString: true, bounds: "content" });
  //   var svgBlob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
  //   var svgUrl = URL.createObjectURL(svgBlob);
  //   var downloadLink = document.createElement("a");
  //   downloadLink.href = svgUrl;
  //   downloadLink.download = "star-template.svg";
  //   document.body.appendChild(downloadLink);
  //   downloadLink.click();
  //   document.body.removeChild(downloadLink);
  // }
}

customElements.define("paper-render", PaperRender);
