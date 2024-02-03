export class GenerationInput {
  constructor(inputSvgData, length, resolution, profileSize) {
    this.inputSvgData = inputSvgData;
    //Target length in pts, the output is scaled so the path is this long. lengths in other units will need scaling (e.g. '260mm' by (96/25.4) = 983 or '500cm' by (96/2.54) = 18898). If not specified, the output won't be scaled
    this.length = length;
    //Roughly how many arcs in the whole path, the higher the smoother but bigger output", default=500, type=int)
    this.resolution = resolution;
    //The size of the profile the LED sits in. e.g. { channel_width: 10, channel_depth: 15, wall_width: 2 }
    this.profileSize = profileSize;
    //The colour of the line which represents a covered section of the supports e.g. '#ff1414'. If not specified, the input SVG must be a single colour.
    this.coveredColour = null; //coveredColour
    //Add a back plate to the output STL. This adds strength but uses more material
    // this.backPlate = backPlate || false
  }

  withInputSvgData(inputSvgData) {
    return new GenerationInput(
      inputSvgData,
      this.length,
      this.resolution,
      this.profileSize
    );
  }
}
