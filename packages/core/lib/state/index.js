/**
 * Module for saving all relevant data
 *
 * @module state
 */

import { getPartials } from "./partials.js";
import { getFileContents } from "./file-contents.js";
import getCSS from "./css.js";
import { getMenu } from "./menu/index.js";
import getFlatMenu from "./flat-menu.js";
import { getSourceTree } from "./source-tree.js";

/**
 * @param {object} app - the express instance
 * @param {object} methods - object with keys defining what should be set
 * @param {object} state - the state object
 * @returns {Promise} gets resolved after the state has been updated
 */
function setSourceTreeAndMenu(app, methods, state) {
  return new Promise((resolve) => {
    if (methods.sourceTree) {
      state.sourceTree = getSourceTree(app);
    }

    app.set("state", state);

    if (methods.menu) {
      state.menu = getMenu(app);
      state.flatMenu = getFlatMenu(state.menu, app.get("config").isBuild);
      resolve();
    } else {
      resolve();
    }
  });
}

export default async function setState(app, methods) {
  const promises = [];
  const state = app.get("state") || {};

  if (methods.fileContents) {
    if (typeof methods.fileContents === "object") {
      state.fileContents = methods.fileContents;

      promises.push(
        new Promise((resolve) => {
          setSourceTreeAndMenu(app, methods, state).then(resolve);
        })
      );
    } else {
      promises.push(
        new Promise((resolve) => {
          getFileContents(app).then((data) => {
            state.fileContents = data;

            setSourceTreeAndMenu(app, methods, state).then(resolve);
          });
        })
      );
    }
  } else {
    promises.push(
      new Promise((resolve) => {
        setSourceTreeAndMenu(app, methods, state).then(resolve);
      })
    );
  }

  if (methods.partials) {
    promises.push(
      new Promise((resolve) => {
        getPartials(app).then((result) => {
          state.partials = result;
          resolve();
        });
      })
    );
  }

  if (methods.css) {
    promises.push(
      new Promise((resolve) => {
        getCSS(app).then((result) => {
          state.css = result;
          resolve();
        });
      })
    );
  }

  return Promise.all(promises).then(() => {
    app.set("state", state);
    return app.get("state");
  });
}
