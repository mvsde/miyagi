"use strict";

const cloneDeep = require("clone-deep");
const path = require("path");
const tests = require("./tests.json");
const config = require("../config.json");
const helpers = require("../helpers.js");
const {
  getComponentErrorHtml,
  getDataForRenderFunction,
  getFallbackData,
  mergeRootDataWithVariationData,
  mergeWithGlobalData,
  overwriteJsonLinksWithJsonData,
} = require("./_helpers.js");

function renderMain({ app, res, build, cb }) {
  res.render(
    "index.hbs",
    {
      folders: app.get("state").menu,
      iframeSrc: build
        ? "component-all-embedded.html"
        : "/component?file=all&embedded=true",
      showAll: true,
      isComponentOverview: true,
      tests,
      projectName: config.projectName,
      userProjectName: app.get("config").projectName,
      indexPath: build
        ? "component-all-embedded.html"
        : "/component?file=all&embedded=true",
      headmanDev: !!process.env.HEADMAN_DEVELOPMENT,
      headmanProd: !process.env.HEADMAN_DEVELOPMENT,
      isBuild: helpers.isBuild(),
      theme: app.get("config").theme,
    },
    (err, html) => {
      if (res.send) {
        res.send(html);
      }

      if (cb) {
        cb(html);
      }
    }
  );
}

async function renderMainWithComponent({
  app,
  res,
  file,
  variation,
  build,
  cb,
}) {
  let iframeSrc = build
    ? `/component-${helpers.normalizeString(
        file.replace(`.${app.get("config").extension}`, "")
      )}.html`
    : `/component?file=${file}`;
  let isComponentOverview = true;
  if (variation) {
    if (build) {
      iframeSrc = iframeSrc.replace(
        ".html",
        `-${helpers.normalizeString(variation)}.html`
      );
    } else {
      iframeSrc += `&variation=${variation}`;
    }
    isComponentOverview = false;
  }

  if (build) {
    iframeSrc = iframeSrc.replace(".html", "-embedded.html");
  } else {
    iframeSrc += "&embedded=true";
  }

  await res.render(
    "index.hbs",
    {
      folders: app.get("state").menu,
      iframeSrc,
      requestedComponent: file,
      requestedVariation: variation,
      isComponentOverview,
      tests,
      projectName: config.projectName,
      userProjectName: app.get("config").projectName,
      indexPath: build
        ? "component-all-embedded.html"
        : "/component?file=all&embedded=true",
      headmanDev: !!process.env.HEADMAN_DEVELOPMENT,
      headmanProd: !process.env.HEADMAN_DEVELOPMENT,
      isBuild: helpers.isBuild(),
      theme: app.get("config").theme,
    },
    (err, html) => {
      if (res.send) {
        res.send(html);
      }

      if (cb) {
        cb(html);
      }
    }
  );
}

async function renderMainWith404({ app, res, file, variation }) {
  let iframeSrc = `/component?file=${file}`;

  if (variation) {
    iframeSrc += `&variation=${variation}`;
  }

  iframeSrc += "&embedded=true";

  await res.render("index.hbs", {
    folders: app.get("state").menu,
    iframeSrc,
    requestedComponent: null,
    requestedVariation: null,
    isComponentOverview: false,
    projectName: config.projectName,
    userProjectName: app.get("config").projectName,
    htmlValidation: false,
    accessibilityValidation: false,
    headmanDev: !!process.env.HEADMAN_DEVELOPMENT,
    headmanProd: !process.env.HEADMAN_DEVELOPMENT,
    isBuild: helpers.isBuild(),
    theme: app.get("config").theme,
  });
}

async function renderComponent({ app, res, file, variation, embedded, cb }) {
  const componentJson = cloneDeep(
    app.get("state").fileContents[
      helpers.getFullPathFromShortPath(
        app,
        helpers.getDataPathFromTemplatePath(app, file)
      )
    ] || {}
  );
  const componentVariations = componentJson.variations;
  let componentData = componentJson.data;

  if (componentVariations && variation) {
    const variationJson = componentVariations.find(
      (vari) => vari.name === decodeURI(variation)
    );

    if (variationJson) {
      componentData = mergeRootDataWithVariationData(
        componentData,
        variationJson.data ? variationJson.data : {}
      );
    }
  }

  componentData = mergeWithGlobalData(
    app,
    await overwriteJsonLinksWithJsonData(app, componentData)
  );

  await renderSingleComponent({
    app,
    res,
    file,
    context: componentData,
    standaloneUrl: embedded
      ? helpers.isBuild()
        ? `component-${helpers.normalizeString(
            file.replace(`.${app.get("config").extension}`, "")
          )}-${helpers.normalizeString(variation)}.html`
        : `/component?file=${file}&variation=${variation}`
      : null,
    cb,
  });
}

async function renderComponentVariations({ app, res, file, embedded, cb }) {
  const componentJson = cloneDeep(
    app.get("state").fileContents[
      helpers.getFullPathFromShortPath(
        app,
        helpers.getDataPathFromTemplatePath(app, file)
      )
    ] || {}
  );
  const componentDocumentation = app.get("state").fileContents[
    helpers.getFullPathFromShortPath(
      app,
      helpers.getDocumentationPathFromTemplatePath(app, file)
    )
  ];
  const componentVariations = componentJson.variations;
  const splittedPath = file.split(path.sep);
  const fileName = splittedPath[splittedPath.length - 1];
  const context = [];
  let componentData = componentJson.data;

  if (componentData) {
    context.push({
      component: file,
      data: mergeWithGlobalData(
        app,
        componentData
          ? await overwriteJsonLinksWithJsonData(app, componentData)
          : {}
      ),
      name: fileName.slice(0, fileName.lastIndexOf(".")),
    });
  }

  if (componentVariations) {
    componentVariations.forEach((variationJson) => {
      if (variationJson.name) {
        context.push({
          component: file,
          data: componentData
            ? mergeRootDataWithVariationData(
                componentData,
                variationJson.data ? variationJson.data : {}
              )
            : variationJson.data
            ? variationJson.data
            : {},
          name: variationJson.name,
        });
      }
    });

    await Promise.all(
      context.map(async (entry, i) => {
        return new Promise(async (resolve) => {
          context[i].data = mergeWithGlobalData(
            app,
            await overwriteJsonLinksWithJsonData(app, entry.data)
          );
          resolve();
        });
      })
    ).then(async () => {
      await renderVariations({
        app,
        res,
        file,
        context,
        componentDocumentation,
        cb,
      });
    });
  } else {
    await renderVariations({
      app,
      res,
      file,
      context,
      componentDocumentation,
      cb,
    });
  }
}

async function renderComponentOverview({ app, res, embedded, cb }) {
  const arr = [];
  const promises = [];

  const components = Object.keys(app.get("state").partials).map((path) => {
    let componentJson =
      app.get("state").fileContents[
        helpers.getFullPathFromShortPath(
          app,
          helpers.getDataPathFromTemplatePath(app, path)
        )
      ] || {};
    let componentData;

    if (componentJson.data) {
      componentData = componentJson.data;
    } else if (componentJson.variations && componentJson.variations.length) {
      componentData = getFallbackData(componentJson.variations);
    }

    return [path, cloneDeep(componentData)];
  });

  components.forEach((component, i) => {
    promises.push(
      new Promise(async (resolve) => {
        const [componentPath] = component;
        let [, componentData] = component;

        if (componentData) {
          componentData = mergeWithGlobalData(
            app,
            await overwriteJsonLinksWithJsonData(app, componentData)
          );
        }

        app.render(
          componentPath,
          getDataForRenderFunction(app, componentData),
          (err, result) => {
            const [file] = components[i];

            arr[i] = {
              url: helpers.isBuild()
                ? `component-${helpers.normalizeString(
                    componentPath.replace(`.${app.get("config").extension}`, "")
                  )}-embedded.html`
                : `/component?file=${file}&embedded=true`,
              file,
              html: result || getComponentErrorHtml(err),
            };

            resolve();
          }
        );
      })
    );
  });

  await Promise.all(promises).then(async () => {
    const { validations, projectName } = app.get("config");
    const isBuild = helpers.isBuild();

    await res.render(
      "component_overview.hbs",
      {
        components: arr,
        dev: process.env.NODE_ENV === "development",
        prod: process.env.NODE_ENV === "production",
        a11yTestsPreload: validations.accessibility,
        projectName: config.projectName,
        userProjectName: projectName,
        isBuild,
        theme: app.get("config").theme,
      },
      (err, html) => {
        if (res.send) {
          res.send(html);
        }

        if (cb) {
          cb(html);
        }
      }
    );
  });
}

async function renderSingleComponent({
  app,
  res,
  file,
  context,
  standaloneUrl,
  cb,
}) {
  return new Promise((resolve) => {
    app.render(
      file,
      getDataForRenderFunction(app, context),
      async (err, result) => {
        const { validations, projectName } = app.get("config");
        const isBuild = helpers.isBuild();

        await res.render(
          standaloneUrl ? "component_frame.hbs" : "component.hbs",
          {
            html: result || getComponentErrorHtml(err),
            htmlValidation: validations.html,
            accessibilityValidation: validations.accessibility,
            standaloneUrl,
            dev: process.env.NODE_ENV === "development",
            prod: process.env.NODE_ENV === "production",
            projectName: config.projectName,
            userProjectName: projectName,
            isBuild,
            theme: app.get("config").theme,
          },
          (err, html) => {
            if (res.send) {
              res.send(html);
            }

            if (cb) {
              cb(html);
            }
          }
        );

        resolve();
      }
    );
  });
}

async function renderVariations({
  app,
  res,
  file,
  context,
  componentDocumentation,
  cb,
}) {
  const variations = [];
  const promises = [];
  const { extension } = app.get("config");

  context.forEach((entry, i) => {
    promises.push(
      new Promise((resolve) => {
        app.render(
          file,
          getDataForRenderFunction(app, entry.data),
          (err, result) => {
            const { name } = context[i];
            const baseName = file.replace(`.${extension}`, "");
            const variation = name ? name : baseName;

            variations[i] = {
              url: helpers.isBuild()
                ? `component-${helpers.normalizeString(
                    baseName
                  )}-${helpers.normalizeString(variation)}-embedded.html`
                : `/component?file=${file}&variation=${variation}&embedded=true`,
              file,
              html: result || getComponentErrorHtml(err),
              variation,
            };

            resolve(result);
          }
        );
      })
    );
  });

  await Promise.all(promises).then(async () => {
    const { validations, projectName } = app.get("config");
    const isBuild = helpers.isBuild();

    await res.render(
      "component_variations.hbs",
      {
        variations,
        dev: process.env.NODE_ENV === "development",
        prod: process.env.NODE_ENV === "production",
        a11yTestsPreload: validations.accessibility,
        projectName: config.projectName,
        userProjectName: projectName,
        isBuild,
        theme: app.get("config").theme,
        documentation: componentDocumentation,
      },
      (err, html) => {
        if (res.send) {
          res.send(html);
        }

        if (cb) {
          cb(html);
        }
      }
    );
  });
}

async function renderComponentNotFound({ app, res, embedded, target }) {
  await res.render(embedded ? "component_frame.hbs" : "component.hbs", {
    html: `<p class="HeadmanError">${target} not found.</p>`,
    dev: process.env.NODE_ENV === "development",
    prod: process.env.NODE_ENV === "production",
    projectName: config.projectName,
    userProjectName: app.get("config").projectName,
    htmlValidation: false,
    accessibilityValidation: false,
    isBuild: helpers.isBuild(),
    theme: app.get("config").theme,
  });
}

module.exports = {
  renderMain,
  renderMainWithComponent,
  renderMainWith404,
  renderComponent,
  renderComponentVariations,
  renderComponentOverview,
  renderComponentNotFound,
};