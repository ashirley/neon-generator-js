import "../node_modules/paper/dist/paper-core.js";

export class Generator {
  async generate(generationInput) {
    const inputSvg = this.parseInputSvg(generationInput.inputSvgData);
    this.validateInputSvg(inputSvg, generationInput.coveredColour);
    this.scaleInputSvg(inputSvg, generationInput.length);
    const perpPoints = this.generatePerpPoints(generationInput, inputSvg);
    //TODO: optimise_perp_points_list
    const { backPlatePerimeter, backPlatePerimeterDebug } =
      this.generateBackPlatePerimeter(generationInput, perpPoints);

    //TODO: handle errors and warnings
    // - e.g. detect overlapping perimeter or discontinuous lines.
    return { perpPoints, backPlatePerimeter, backPlatePerimeterDebug };
  }

  parseInputSvg(inputSvgData) {
    // @ts-ignore
    const paperProject = paper.setup().project;
    paperProject.importSVG(inputSvgData);

    const paths = paperProject.getItems({
      class: paper.Path,
    });

    // optimise the paths so they are as contiguous as possible
    // TODO: more sophistication
    paths.forEach((p, i) => {
      if (i > 0 && !this.pathsAreContinuous(paths[i - 1], p)) {
        //reverse the path and see if that helps, if not put it back
        p.reverse();
        if (!this.pathsAreContinuous(paths[i - 1], p)) {
          p.reverse();
        }
      }
    });

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
        // current segment
        const curr_segment = path.curves[i];
        // next segment, if any
        next_segment =
          i + 1 < path.curves.length
            ? path.curves[i + 1] // still in this path, use the next curve
            : j + 1 < paths.length &&
              this.pathsAreContinuous(path, paths[j + 1])
            ? paths[j + 1].firstCurve // going to next path and it is contiguous
            : null; // either there is no next path or it isn't contiguous
        var curr_join = null; // angle between the current segment and the next

        // console.debug(i, curr_segment, next_segment);

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
          // console.log(curr_join, curr_segment.getNormalAtTime(1));

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

    // console.log(perp_points_lists);
    return perp_points_lists;
  }

  pathsAreContinuous(path, nextPath) {
    return path.lastSegment.point.isClose(nextPath.firstSegment.point, 1);
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

  // How much do we favour following the concave shape rather than taking a new shortcut?
  concave_factor_new = 1.1;

  // How much do we favour following the concave shape rather than extending a shortcut?
  concave_factor_extend = 1.001;

  /**
   * Given a line forming a closed shape, find the shape which covers the whole line with "reasonable" concave sections.
   *
   * In a vague sense, this should fill in any "deep" concave sections but leave any shallow once.
   * For example, a "c" shape should be closed to form a flattened circle but a "Y" shape will only have the top closed, not the left or right edge.
   */
  generateBackPlatePerimeter(generationInput, perpPoints) {
    if (!generationInput.backPlate) {
      return { backPlatePerimeter: null, backPlatePerimeterDebug: null };
    }

    //TODO: look at more than the first list.
    const left = perpPoints[0].points.map((p) => p.lo);
    const right = perpPoints[0].points.map((p) => p.ro).reverse();
    const initialPerimeter = left.concat(right);

    // iterate round the shape looking for concave points, trying to eliminate them if the shortcut is sufficiently better.
    // if a point is eliminated, consider the next point (still using the same previous point to help define the angle)
    // if a point is concave but not eliminated, remove it optimistically but remember it for later
    // if a point is convex, consider the next point (using the point just considered as the previous point to help define the angle)
    // repeat until we do a whole loop without eliminating any points

    var workingShape = initialPerimeter.map((v, i) => [i, v]);
    const possible_shortcuts = {}; // start index -> ([indexes of removed points], original distance)
    const complete_shortcuts = new Set(); // the indexes adjacent to removed nodes. This may include removed nodes.
    var debugRetval = [];
    var curr_index = 1;
    var prev_index = 0;
    var alternating = true;

    var loops_remaining = workingShape.length;

    while (loops_remaining >= 0) {
      loops_remaining = loops_remaining - 1;

      // const prev2_index = this.prevIndex(workingShape, prev_index);
      // const prev2_point = initialPerimeter[prev2_index];
      const prev_point = initialPerimeter[prev_index];
      const curr_point = initialPerimeter[curr_index];
      const next_index = this.nextIndex(workingShape, curr_index);
      const next_point = initialPerimeter[next_index];
      // const next2_index = this.nextIndex(workingShape, next_index);
      // const next2_point = initialPerimeter[next2_index];

      // console.log("mt", prev_index, curr_index, next_index);

      if (this.isConcave(prev_point, curr_point, next_point)) {
        // if (
        //   this.isConcave(curr_point, next_point, next2_point) &&
        //   !this.isConcave(prev_point, next_point, next2_point)
        // ) {
        //   //by taking this shortcut, the angle between this and the next line will go from concave to convex.
        //   // The only way this can happen is if we are crossing ourselves which we shouldn't allow
        //   // look at next point
        //   prev_index = curr_index;
        //   curr_index = next_index;
        // } else if (
        //   this.isConcave(prev2_point, prev_point, curr_point) &&
        //   !this.isConcave(prev2_point, prev_point, next_point)
        // ) {
        //   //by taking this shortcut, the angle between this and the next line will go from concave to convex.
        //   // The only way this can happen is if we are crossing ourselves which we shouldn't allow
        //   // look at next point
        //   prev_index = curr_index;
        //   curr_index = next_index;
        const intersectingIndex = this.intersectsAny(
          prev_point,
          next_point,
          workingShape
        );
        if (intersectingIndex) {
          //by taking this shortcut, the we are crossing ourselves which we shouldn't allow
          // look at next point
          prev_index = curr_index;
          curr_index = next_index;
        } else {
          const original_distance1 =
            prev_index in possible_shortcuts
              ? possible_shortcuts[prev_index][1]
              : this.distance(prev_point, curr_point);
          const original_distance2 =
            curr_index in possible_shortcuts
              ? possible_shortcuts[curr_index][1]
              : this.distance(curr_point, next_point);
          const original_distance = original_distance1 + original_distance2;

          const shortcut_distance = this.distance(prev_point, next_point);

          const concave_factor =
            complete_shortcuts.has(prev_index) ||
            complete_shortcuts.has(curr_index)
              ? this.concave_factor_extend
              : this.concave_factor_new;

          if (original_distance < concave_factor * shortcut_distance) {
            // console.log(
            //   `concave-small  ${(
            //     (original_distance / shortcut_distance - 1) *
            //     100
            //   ).toLocaleString(undefined, {
            //     maximumFractionDigits: 2,
            //     minimumFractionDigits: 2,
            //   })}%`
            // );

            var y;
            // This is a concave edge but isn't enough on its own to warrant removing yet.
            if (prev_index in possible_shortcuts) {
              // We have already got a possible shortcut from this node. Add this node to the list temporarily removed
              y = possible_shortcuts[prev_index][0];
            } else {
              // This is the first shortcut, start a new list of removed points.
              y = [];
            }
            y = y.concat([curr_index]);
            if (curr_index in possible_shortcuts) {
              // We have already got a possible shortcut from curr -> next which is incorporated into this shortcut.
              // Add these nodes to the list of temporarily removed
              y = y.concat(possible_shortcuts[curr_index][0]);
            }
            possible_shortcuts[prev_index] = [y, original_distance];

            // this new shortcut subsumes this so remove it
            if (curr_index in possible_shortcuts) {
              delete possible_shortcuts[curr_index];
            }
          } else {
            // console.log(
            //   `concave-big  ${(
            //     (original_distance / shortcut_distance - 1) *
            //     100
            //   ).toLocaleString(undefined, {
            //     maximumFractionDigits: 2,
            //     minimumFractionDigits: 2,
            //   })}%`
            // );
            // This was worth removing, remove from possible_shortcuts
            if (prev_index in possible_shortcuts) {
              delete possible_shortcuts[prev_index];
            }
            if (curr_index in possible_shortcuts) {
              delete possible_shortcuts[curr_index];
            }
            complete_shortcuts.add(prev_index);
            complete_shortcuts.add(next_index);
          }
          // console.log(
          //   prev_index,
          //   curr_index,
          //   JSON.stringify(possible_shortcuts)
          // );

          // regardless of whether shortcut is worth it, remove curr_index from the shape and consider another angle.
          workingShape = workingShape.filter((x) => x[0] != curr_index);

          // 50% of the time consider angle at prev -> next -> next-next
          // 50% of the time consider angle at prev-prev -> prev -> next
          // We alternate like this as it gives better (but not perfect) results in spirals
          if (alternating) {
            curr_index = next_index;
            loops_remaining = workingShape.length;
          } else {
            curr_index = prev_index;
            prev_index = this.prevIndex(workingShape, prev_index);
            loops_remaining = workingShape.length + 1;
          }

          alternating = !alternating;
        }
      } else {
        // console.log("convex");
        // convex, look at next point
        prev_index = curr_index;
        curr_index = next_index;
      }
      debugRetval.push({
        points: workingShape.map((x) => x[1]),
        nextPoint: initialPerimeter[curr_index],
      });
    }

    // console.log("After removing possible mouths", workingShape);

    // restore edges which were shortcuts we were considering but didn't end up taking.
    if (possible_shortcuts.length == 0) {
      return workingShape.map((x) => x[1]);
    }

    // console.log("reinstating", possible_shortcuts);

    var retval = [];
    var prev_starting_index = -1;
    const keys = Object.keys(possible_shortcuts)
      .map((k) => Number(k))
      .sort((a, b) => a - b);
    // console.log(keys);
    for (const starting_index of keys) {
      // put points up to the start of the deleted shortcut into the result
      const from_working = workingShape
        .filter((x) => prev_starting_index < x[0] && x[0] <= starting_index)
        .map((x) => x[1]);
      retval = retval.concat(from_working);
      // console.log("re1", prev_starting_index, starting_index, from_working);
      prev_starting_index = Number(starting_index);

      // put the missing deleted shortcut into the result
      for (const i of possible_shortcuts[starting_index][0]) {
        // console.log("re2", starting_index, i, initialPerimeter[i]);
        retval = retval.concat(initialPerimeter[i]);
      }
    }

    // if there are more points in working shape, add them
    const fromWorkingEnd = workingShape
      .filter((x) => prev_starting_index < x[0])
      .map((x) => x[1]);
    retval = retval.concat(fromWorkingEnd);
    // console.log("re3", prev_starting_index, fromWorkingEnd);

    // console.log("After reinstating", retval);

    return { backPlatePerimeter: retval, backPlatePerimeterDebug: debugRetval };
  }

  intersectsAny(prev_point, next_point, otherPoints) {
    const l = new paper.Path.Line(prev_point, next_point);
    var prev_t = otherPoints[otherPoints.length - 1];
    for (const t of otherPoints) {
      const x = new paper.Path.Line(prev_t[1], t[1]);
      if (
        !(
          prev_point === prev_t[1] ||
          prev_point === t[1] ||
          next_point === prev_t[1] ||
          next_point === t[1]
        ) &&
        x.intersects(l)
      ) {
        return t[0];
      }
      prev_t = t;
    }
    return null;
  }

  /**
   * Given a list of (indexes and values) and a target index, look for the target index in the list then get the next index (in list order).
   * This will wrap round the source list (so the next after the last is the first) and return None if the target can't be found.
   */
  nextIndex(source, targetIndex) {
    var seen = false;
    for (const x of source) {
      if (seen) {
        // previous index was the target, this is the next.
        return x[0];
      }

      if (x[0] === targetIndex) {
        seen = true;
      }
    }
    if (seen) {
      // last index was the target, wrap around and return the first index
      return source[0][0];
    }

    // didn't find the target index
    return null;
  }

  prevIndex(source, targetIndex) {
    if (source.length > 0) {
      var prev = source[source.length - 1][0];
      for (const x of source) {
        if (x[0] == targetIndex) {
          return prev;
        }
        prev = x[0];
      }
    }

    // didn't find the target index
    return null;
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

  isConcave(prevPoint, currPoint, nextPoint) {
    // @ts-ignore
    const cp = currPoint
      .subtract(prevPoint)
      .cross(nextPoint.subtract(currPoint));
    return cp <= 0;
  }

  /**
   * distance between 2 points.
   */
  distance(a, b) {
    return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
  }
}
