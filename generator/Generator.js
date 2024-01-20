import "../node_modules/paper/dist/paper-core.js";

export class Generator {
  async generate(generationInput) {
    const inputSvg = this.parseInputSvg(generationInput.inputSvgData);
    this.validateInputSvg(inputSvg, generationInput.coveredColour);
    this.scaleInputSvg(inputSvg, generationInput.length);
    const perpPoints = this.generatePerpPoints(generationInput, inputSvg);
    //TODO: optimise_perp_points_list
    //TODO: BACK PLATE
    const stl = this.generateStl(generationInput, inputSvg);
    return { perpPoints, stl };
  }

  parseInputSvg(inputSvgData) {
    // @ts-ignore
    const paperProject = paper.setup().project;
    paperProject.importSVG(inputSvgData);

    return paperProject;
  }

  validateInputSvg(inputSvg, coveredColour) {
    const paths = inputSvg.getItems({
      class: paper.Path,
    });

    if (paths.length == 0) {
      throw new Error("ERROR: no paths in input SVG");
    }

    const colours = new Set(
      paths
        .filter((p) => p.strokeColor)
        .map((p) => p.strokeColor.toString())
        .filter((c) => c)
    );

    if (colours.size <= 1) {
      //fine
    } else if (colours.size == 2 && coveredColour) {
      //make sure one of the 2 is the coveredColour
      if (!colours.has(coveredColour)) {
        throw new Error(
          `ERROR: covered color specified (${coveredColour}) not present in the input SVG which has (${JSON.stringify(
            colours
          )})`
        );
      }
    } else {
      //too many colors in input
      throw new Error(
        `ERROR: too many colors of paths in input SVG (${JSON.stringify(
          colours
        )}) ${colours.size}`
      );
    }
  }

  scaleInputSvg(inputSvg, targetLength) {
    if (targetLength == null) {
      return;
    }

    const paths = inputSvg.getItems({
      class: paper.Path,
    });
    const totalLength = paths.map((p) => p.length).reduce((a, c) => a + c, 0);
    const scale = targetLength / totalLength;

    console.log(
      `scaling '${totalLength}' by '${scale}' to match target length of '${targetLength}'`
    );

    paths.forEach((e) => e.scale(scale, new paper.Point(0, 0)));

    const newTotalLength = paths
      .map((p) => p.length)
      .reduce((a, c) => a + c, 0);
    console.log(
      `output path will have a length of ${newTotalLength}pt or ${
        (newTotalLength * 25.4) / 96
      }mm`
    );
  }

  /**
   * Walk the path, generating a list of 2d coordinates on a line perpendicular to the line of the path.
   * The points are for:
   *  * outer left wall
   *  * inner left wall
   *  * inner left wall + delta
   *  * inner right wall - delta
   *  * inner right wall
   *  * outer right wall
   * When the elements of the path meet, the angle of the "perpendicular" line is altered to ease the transition
   * and allow a neat join
   *
   * We actually return a list of lists as we split the paths into contiguous sections. For example, if inputSvg contains
   * 2 non-contiguous straight lines, we will return a list of 2 lists, each inner list will have 2 PerpendicularPoints
   * (one for the start of the line and one for the end) with 6 points each.
   */
  generatePerpPoints(generationInput, inputSvg) {
    const paths = inputSvg.getItems({
      class: paper.Path,
    });
    const scaled_total_length = paths
      .map((p) => p.length)
      .reduce((a, c) => a + c, 0);

    const perp_points_lists = [];
    var perp_points_list_num = -1;
    var prev_covered = null;
    var next_segment = null;

    for (let j = 0; j < paths.length; j++) {
      const path = paths[j];
      const covered =
        path.strokeColor === generationInput.coveredColour &&
        generationInput.coveredColour != null;
      if (prev_covered !== covered || next_segment == null) {
        // This is discontinuous with the previous path so start a new perp_points_list
        perp_points_list_num++;
        perp_points_lists.push({ covered, points: [] });
        var prev_join = null; // angle between previous segment and curr
      }

      // console.debug(path);
      for (let i = 0; i < path.curves.length; i++) {
        //TODO: what were called segments in python are called curves in paper.js
        const curr_segment = path.curves[i]; // current segment
        next_segment =
          i + 1 < path.curves.length
            ? path.curves[i + 1]
            : j + 1 < paths.length &&
              path.lastSegment.point.isClose(paths[j + 1].firstSegment.point, 1)
            ? paths[j + 1].firstCurve
            : null; // next segment, if any
        var curr_join = null; // angle between the current segment and the next

        console.debug(i, curr_segment, next_segment);

        if (!curr_segment.hasHandles()) {
          //this is a line - Straight lines only need 2 perpendicular_points along the normal at the start and end
          // (although we only put the end in if the next segment won't duplicate it).

          // angle between curr segment and next (if any)
          curr_join = this.join_angle(next_segment, curr_segment);

          if (curr_join == null) {
            // not joining the next segment, add both a start and an end.
            perp_points_lists[perp_points_list_num].points.push(
              this.perpendicular_points(
                curr_segment.getPointAtTime(0),
                prev_join,
                curr_segment.getNormalAtTime(0),
                generationInput.profileSize
              ),
              this.perpendicular_points(
                curr_segment.getPointAtTime(1),
                curr_join,
                curr_segment.getNormalAtTime(0),
                generationInput.profileSize
              )
            );
          } else {
            // joining the next segment, just add a start and leave the next segment to do our end (it's start)
            perp_points_lists[perp_points_list_num].points.push(
              this.perpendicular_points(
                curr_segment.getPointAtTime(0),
                prev_join,
                curr_segment.getNormalAtTime(0),
                generationInput.profileSize
              )
            );
          }
        } else {
          // this is a curve to interpolate
          curr_join = this.join_angle(next_segment, curr_segment);
          console.log(curr_join, curr_segment.getNormalAtTime(1));

          perp_points_lists[perp_points_list_num].points.push(
            this.perpendicular_points(
              curr_segment.getPointAtTime(0),
              prev_join,
              curr_segment.getNormalAtTime(0),
              generationInput.profileSize
            )
          );
          const steps = this.steps_for_segment(
            curr_segment,
            scaled_total_length,
            generationInput.resolution
          );
          for (let j = 1; j < steps; j++) {
            perp_points_lists[perp_points_list_num].points.push(
              this.perpendicular_points(
                curr_segment.getPointAtTime(j / steps),
                null,
                curr_segment.getNormalAtTime(j / steps),
                generationInput.profileSize
              )
            );
          }

          if (curr_join == null) {
            // not joining the next segment, add an end along the normal of the curve
            perp_points_lists[perp_points_list_num].points.push(
              this.perpendicular_points(
                curr_segment.getPointAtTime(1),
                curr_join,
                curr_segment.getNormalAtTime(1),
                generationInput.profileSize
              )
            );
          }
        }

        prev_join = curr_join;
      }

      prev_covered = covered;
    }

    console.log(perp_points_lists);
    return perp_points_lists;
  }

  /**
   * generate points along the join line, centered on the given point with the given normal.
   */
  perpendicular_points(center, join, normal, profile) {
    // find the angle between the join line and the normal
    // 1/cos(angle) is how much bigger the distances should be between center and the perpendicular points
    if (join == null) {
      join = normal;
    }

    const angle = join.getAngleInRadians(normal);
    const multiple = 1 / Math.cos(angle);

    const a = join.multiply(multiple).multiply(profile.channel_width / 2);
    const b = join
      .multiply(multiple)
      .multiply(profile.channel_width / 2 + profile.wall_width);
    const delta = join.multiply(multiple).multiply(0.2);

    return {
      lo: center.add(b),
      li: center.add(a),
      lid: center.add(a).subtract(delta),
      c: center,
      rid: center.subtract(a).add(delta),
      ri: center.subtract(a),
      ro: center.subtract(b),
    };
  }

  /*
def perpendicular_points(center, join, normal, profile) -> PerpendicularPoints:
    if join is None:
        join = normal

    angle = Point(0).angle_to(normal).as_radians - Point(0).angle_to(join).as_radians
    multiple = 1 / cos(angle)

    a = join * multiple * (profile.channel_width / 2)
    b = join * multiple * (profile.channel_width / 2 + profile.wall_width)
    delta = join * multiple * 0.2
    return PerpendicularPoints(center + b, center + a, center + a - delta, center, center - a + delta, center - a, center - b)
*/

  generateStl(generationInput, inputSvg) {
    //TODO
  }

  join_angle(next_segment, curr_segment) {
    if (next_segment == null) {
      return null;
    }

    return curr_segment
      .getNormalAtTime(1)
      .add(next_segment.getNormalAtTime(0))
      .normalize();
  }

  steps_for_segment(curr_segment, scaled_total_length, resolution) {
    return Math.max(
      2,
      Math.ceil((curr_segment.length / scaled_total_length) * resolution)
    );
  }
}
