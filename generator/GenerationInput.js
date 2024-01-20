export class GenerationInput {
  constructor(inputSvgData) {
    this.inputSvgData = inputSvgData;
    //Target length in pts, the output is scaled so the path is this long. lengths in other units will need scaling (e.g. '260mm' by (96/25.4) = 983 or '500cm' by (96/2.54) = 18898). If not specified, the output won't be scaled
    this.length = 983; //TODO: length
    //Roughly how many arcs in the whole path, the higher the smoother but bigger output", default=500, type=int)
    this.resolution = 50; //TODO resolution || 500
    //The size of the profile the LED sits in. Either 'noodle', '10mm' or a colon-seperated triplet of <channel_width>:<channel_depth>:<wall_width> in mm e.g. '10:15:2'
    this.profileSize = { channel_width: 10, channel_depth: 15, wall_width: 2 };
    //The colour of the line which represents a covered section of the supports e.g. '#ff1414'. If not specified, the input SVG must be a single colour.
    this.coveredColour = null; //coveredColour
    //Add a back plate to the output STL. This adds strength but uses more material
    // this.backPlate = backPlate || false
  }

  // def parse_profile_spec(spec):
  // if spec == "noodle":
  //     return ProfileSpec(2, 2, 1)
  // elif spec == "10mm":
  //     return ProfileSpec(10, 15, 2)
  // else:
  //     # is it 3, colon separated, numbers
  //     m = re.search("^([0-9.]+):([0-9.]+):([0-9.]+)$", spec)
  //     if m is None:
  //         raise argparse.ArgumentTypeError("Profile spec should be 3 numbers separated by colons, units are not allowed")
  //     return ProfileSpec(float(m.group(1)), float(m.group(2)), float(m.group(3)))
}
