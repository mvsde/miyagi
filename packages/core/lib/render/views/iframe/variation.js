import path from "path";
import jsonToYaml from "js-yaml";
import config, { messages } from "../../../miyagi-config.js";
import {
  getTemplateFilePathFromDirectoryPath,
  normalizeString,
} from "../../../helpers.js";
import validateMocks from "../../../validator/mocks.js";
import { getVariationData } from "../../../mocks/index.js";
import log from "../../../logger.js";
import { getThemeMode, getComponentTextDirection } from "../../helpers.js";

import { getDataForRenderFunction } from "../../helpers.js";

/**
 * @param {object} object - parameter object
 * @param {object} object.app - the express instance
 * @param {object} [object.res] - the express response object
 * @param {string} object.file - the component path
 * @param {string} [object.variation] - the variation name
 * @param {boolean} [object.embedded] - defines if the component is rendered inside an iframe or not
 * @param {Function} [object.cb] - callback function
 * @param {object} object.cookies
 * @returns {Promise} gets resolved when the variation has been rendered
 */
export default async function renderIframeVariation({
  app,
  res,
  file,
  variation,
  embedded,
  cb,
  cookies,
}) {
  file = getTemplateFilePathFromDirectoryPath(app, file);
  const { raw: rawComponentData, extended: componentData } =
    await getVariationData(app, file, decodeURI(variation));
  const themeMode = getThemeMode(app, cookies);
  const componentTextDirection = getComponentTextDirection(app, cookies);

  const validatedMocks = validateMocks(app, file, [
    {
      data: componentData,
      name: variation,
    },
  ]);

  let standaloneUrl;

  if (embedded) {
    if (app.get("config").isBuild) {
      standaloneUrl = `component-${normalizeString(
        path.dirname(file)
      )}-variation-${normalizeString(variation)}.html`;
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
          copy: messages.validator.mocks[
            validatedMocks[0] ? "valid" : "invalid"
          ],
        }
      : null;

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

        if (res) {
          await res.render(
            standaloneUrl
              ? "iframe_component_variation.hbs"
              : "component_variation.hbs",
            {
              html: result,
              error: typeof result !== "string" ? result : error,
              htmlValidation: Boolean(ui.validations.html),
              accessibilityValidation: Boolean(
                standaloneUrl && ui.validations.accessibility
              ),
              standalone: !standaloneUrl,
              standaloneUrl,
              dev: process.env.NODE_ENV === "development",
              prod: process.env.NODE_ENV === "production",
              projectName: config.projectName,
              userProjectName: app.get("config").projectName,
              isBuild: app.get("config").isBuild,
              theme: themeMode
                ? Object.assign(app.get("config").ui.theme, { mode: themeMode })
                : app.get("config").ui.theme,
              mockData:
                app.get("config").files.schema.extension === "yaml"
                  ? jsonToYaml.dump(rawComponentData)
                  : JSON.stringify(rawComponentData, null, 2),
              variation,
              normalizedVariation: normalizeString(variation),
              mockValidation,
              mocks: fileContents.mocks,
              componentTextDirection:
                componentTextDirection ||
                app.get("config").components.textDirection,
              uiTextDirection: app.get("config").ui.textDirection,
              componentLanguage: app.get("config").components.lang,
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
          resolve(result);
        }
      }
    );
  });
}
