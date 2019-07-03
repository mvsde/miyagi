const toggle = require("./toggle.js");
const menuHelpers = require("../helpers.js");
const helpers = require("../../../helpers.js");
const classes = require("../classes.js");

function render(app, directory, request) {
  let html = "";

  if (
    menuHelpers.childrenOfDirectoryContainDirectory(directory) &&
    menuHelpers.directoryIsNotTopLevel(directory)
  ) {
    const expanded = menuHelpers.pathIsChildOfSecondPath(
      helpers.getShortPathFromFullPath(app, directory.fullPath),
      request.path
    );

    html += toggle.render(directory.id, expanded, directory.index);
  }

  html += `<span class="${classes.component} ${classes.component}--lvl${
    directory.index
  }">${directory.name}</span>`;

  return html;
}

module.exports = {
  render
};