const path = require("path");
const jsonToYaml = require("json-to-pretty-yaml");
const config = require("../../../config.json");
const helpers = require("../../../helpers.js");
const validateMocks = require("../../../validator/mocks.js");
const { getVariationData } = require("../../../mocks");
const log = require("../../../logger.js");

const {
  getComponentErrorHtml,
  getDataForRenderFunction,
} = require("../../helpers.js");

/**
 * @param {object} object - parameter object
 * @param {object} object.app - the express instance
 * @param {object} [object.res] - the express response object
 * @param {string} object.file - the component path
 * @param {string} [object.variation] - the variation name
 * @param {boolean} [object.embedded] - defines if the component is rendered inside an iframe or not
 * @param {Function} [object.cb] - callback function
 * @returns {Promise} gets resolved when the variation has been rendered
 */
module.exports = async function renderIframeVariation({
  app,
  res,
  file,
  variation,
  embedded,
  cb,
}) {
  file = helpers.getTemplateFilePathFromDirectoryPath(app, file);
  const componentData = await getVariationData(app, file, decodeURI(variation));

  const validatedMocks = validateMocks(app, file, [
    {
      data: componentData,
      name: variation,
    },
  ]);

  let standaloneUrl;

  if (embedded) {
    if (app.get("config").isBuild) {
      standaloneUrl = `component-${helpers.normalizeString(
        path.dirname(file)
      )}-variation-${helpers.normalizeString(variation)}.html`;
    } else {
      standaloneUrl = `/component?file=${path.dirname(
        file
      )}&variation=${encodeURIComponent(variation)}`;
    }
  } else {
    standaloneUrl = null;
  }

  const mockValidation =
    Array.isArray(validatedMocks) && validatedMocks[0]
      ? {
          valid: validatedMocks[0],
          copy: config.messages.validator.mocks[
            validatedMocks[0] ? "valid" : "invalid"
          ],
        }
      : {};

  const fileContents = {
    mocks: {
      type: app.get("config").files.mocks.extension,
    },
  };

  return new Promise((resolve, reject) => {
    app.render(
      file,
      getDataForRenderFunction(app, componentData),
      async (error, result) => {
        if (error) {
          if (typeof error === "string") {
            log("error", error);
          }

          if (app.get("config").isBuild) {
            if (cb) {
              cb(error);
            }
            reject();
          }
        }

        const { ui } = app.get("config");
        const html = error
          ? getComponentErrorHtml(
              `${error}<br><br>${config.messages.checkShellForFurtherErrors}`
            )
          : typeof result === "string"
          ? result
          : getComponentErrorHtml(error);

        if (res) {
          await res.render(
            standaloneUrl
              ? "iframe_component_variation.hbs"
              : "component_variation.hbs",
            {
              html,
              htmlValidation: ui.validations.html,
              accessibilityValidation:
                standaloneUrl && ui.validations.accessibility,
              standalone: !standaloneUrl,
              standaloneUrl,
              dev: process.env.NODE_ENV === "development",
              prod: process.env.NODE_ENV === "production",
              projectName: config.projectName,
              userProjectName: app.get("config").projectName,
              isBuild: app.get("config").isBuild,
              theme: app.get("config").ui.theme,
              mockData:
                app.get("config").files.schema.extension === "yaml"
                  ? jsonToYaml.stringify(componentData)
                  : JSON.stringify(componentData, null, 2),
              variation,
              normalizedVariation: helpers.normalizeString(variation),
              mockValidation,
              mocks: fileContents.mocks,
              textDirection: app.get("config").components.textDirection,
            },
            (err, html) => {
              if (res.send) {
                if (err) {
                  res.send(err);
                } else {
                  res.send(html);
                }
              }

              if (cb) {
                cb(err, html);
              }
            }
          );

          resolve();
        } else {
          resolve(html);
        }
      }
    );
  });
};
