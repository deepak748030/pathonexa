const path = require('node:path');
const { getDefaultConfig } = require('expo/metro-config');

// Metro 0.83 currently pulls image-size 1.x. Its ICNS, HEIF, and JXL parsers
// have upstream denial-of-service advisories. PathoNexa does not use those
// asset formats, so disable the parsers before Metro's asset module loads.
const metroDirectory = path.dirname(require.resolve('metro/package.json'));
const imageSizePath = require.resolve('image-size', { paths: [metroDirectory] });
const { disableTypes } = require(imageSizePath);
disableTypes(['heif', 'icns', 'jxl', 'jxl-stream']);

module.exports = getDefaultConfig(__dirname);
