/*
This code exports a single function called generateClassMaps which generates a map of CSS class names to their corresponding CSS selectors by reading and parsing CSS files. The output is a map of file names to classMaps.

The function works in the following way:

It requires and initializes some external modules: path, fs-extra, glob, and camel-case.

It defines a function called getCSSClasses that takes a CSS string as input and returns an array of all the CSS class names present in the string.

It defines a function called formatClassName that takes a CSS class name as input, removes any leading .pf- prefix, and converts the remaining name to camelCase.

It defines a function called isModifier that takes a CSS class name as input and returns a boolean indicating whether the class name starts with the .pf-m- prefix.

It defines a function called getClassMaps that takes a CSS string as input, extracts all the distinct CSS class names present in the string, and returns a map of formatted CSS class names to their corresponding CSS selectors. It calls the formatClassName and isModifier functions to transform each class name appropriately.

It defines the main generateClassMaps function that does the following:
a. It finds the path to the patternfly.css file using require.resolve() and path.dirname().
b. It searches for all .css files in the patternfly.css directory using glob.sync().
c. It excludes certain files from the search using the ignore option.
d. It also searches for all .css files in the src/css directory.
e. It reads the content of each file, calls the getClassMaps function on the CSS string, and adds the resulting class map to a map of file names to class maps.
f. It returns the final map of file names to class maps.

Overall, this code provides a utility for extracting and mapping CSS class names and selectors from CSS files, which could be useful for various purposes such as dynamic styling or generating documentation.
*/



const path = require('path');
const fs = require('fs-extra');
const glob = require('glob');
const camelcase = require('camel-case');

const pfVersion = 5;

/**
 * @param {string} cssString - CSS string
 */
function getCSSClasses(cssString) {
  return cssString.match(/(\.)(?!\d)([^\s.,{[>+~#:)]*)(?![^{]*})/g);
}

/**
 * @param {string} className - Class name
 */
function formatClassName(className) {
  return camelcase(className.replace(/pf-((c|l|m|u|is|has)-)?/g, ''));
}

/**
 * @param {string} className - Class name
 */
function isModifier(className) {
  return Boolean(className && className.startsWith) && className.startsWith('.pf-m-');
}

/**
 * @param {string} cssString - CSS string
 */
function getClassMaps(cssString) {
  const res = {};
  const distinctClasses = new Set(getCSSClasses(cssString));

  distinctClasses.forEach(className => {
    const key = formatClassName(className);
    const value = className.replace('.', '').trim().concat(`-v${pfVersion}`);
    if (isModifier(className)) {
      res.modifiers = res.modifiers || {};
      res.modifiers[key] = value;
    } else {
      res[key] = value;
    }
  });

  const ordered = {};
  Object.keys(res)
    .sort()
    .forEach(key => (ordered[key] = res[key]));

  return ordered;
}

/**
 * @returns {any} Map of file names to classMaps
 */
function generateClassMaps() {
  const pfStylesDir = path.dirname(require.resolve('@patternfly/patternfly/patternfly.css'));

  const patternflyCSSFiles = glob.sync('**/*.css', {
    cwd: pfStylesDir,
    ignore: ['assets/**', '*.css', 'base/**'],
    absolute: true
  });
  const srcCSSFiles = glob.sync('src/css/**/*.css');

  const res = {};
  patternflyCSSFiles
    .concat(srcCSSFiles)
    .map(file => path.resolve(file)) // Normalize path for Windows
    .forEach(file => {
      res[file] = getClassMaps(fs.readFileSync(file, 'utf8'));
    });

  return res;
}

module.exports = {
  generateClassMaps
};
