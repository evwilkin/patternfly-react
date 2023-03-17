/*
This code uses the fs-extra and path modules to copy the contents of the assets/images directory in the PatternFly package to a css/assets/images directory relative to the current script's location.

Specifically, the code does the following:

1 - It defines two variables, toDir and fromDir, that specify the destination directory and source directory, respectively. toDir is set to a resolved absolute path of the ../css directory relative to the current script's directory using the __dirname and resolve functions from the path module. fromDir is set to the resolved absolute path of the directory containing the package.json file of the @patternfly/patternfly package, which is found using require.resolve and dirname.

2 - It uses the copySync function from the fs-extra module to copy the contents of the assets/images directory in fromDir to the css/assets/images directory in toDir. The join function from the path module is used to create the correct paths for the source and destination directories.

Overall, this code is used to copy the image assets used in the PatternFly package to the css/assets/images directory in preparation for building the CSS-in-JS files.
*/

const { copySync } = require('fs-extra');
const { resolve, dirname, join } = require('path');

const toDir = resolve(__dirname, '../css');
const fromDir = dirname(require.resolve('@patternfly/patternfly/package.json'));

copySync(join(fromDir, 'assets/images'), join(toDir, 'assets/images'));
