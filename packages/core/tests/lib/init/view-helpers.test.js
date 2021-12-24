import deepMerge from "deepmerge";
import express from "express";
import handlebars from "handlebars";
import viewHelpers from "../../../lib/init/view-helpers.js";
import config from "../../../lib/miyagi-config.js";

const { registerHelper } = handlebars;

jest.mock("../../../lib/render/menu/index.js", () => {
  return {
    render: jest.fn(() => "menuHtml"),
  };
});

afterEach(() => {
  jest.resetModules();
  jest.resetAllMocks();
});

describe("lib/init/view-helpers", () => {
  const app = express();
  app.set(
    "config",
    deepMerge(config.defaultUserConfig, {
      assets: {
        css: ["index.css"],
        js: [
          { src: "index.js", position: "head" },
          { src: "body.js", position: "body" },
        ],
      },
    })
  );

  describe("", () => {
    test("calls handlebars.registerHelper with menu", () => {
      handlebars.registerHelper = jest.fn();
      viewHelpers(app);

      expect(handlebars.registerHelper.mock.calls[0][0]).toEqual("menu");
      expect(typeof handlebars.registerHelper.mock.calls[0][1]).toEqual(
        "function"
      );
    });

    test("calls handlebars.registerHelper with cssFiles", () => {
      handlebars.registerHelper = jest.fn();
      viewHelpers(app);

      expect(handlebars.registerHelper.mock.calls[1][0]).toEqual("cssFiles");
    });

    describe("calls handlebars.registerHelper with jsFiles", () => {
      describe("with type=module", () => {
        const tempApp = express();
        tempApp.set("config", {
          assets: {
            css: ["index.css"],
            js: app
              .get("config")
              .assets.js.map((entry) => ({ ...entry, type: "module" })),
          },
        });

        handlebars.registerHelper = jest.fn();
        viewHelpers(tempApp);

        expect(handlebars.registerHelper.mock.calls[2][0]).toEqual(
          "jsFilesHead"
        );
        expect(handlebars.registerHelper.mock.calls[2][1]).toEqual(
          '<script src="index.js" type="module"></script>'
        );
        expect(handlebars.registerHelper.mock.calls[3][0]).toEqual(
          "jsFilesBody"
        );
        expect(handlebars.registerHelper.mock.calls[3][1]).toEqual(
          '<script src="body.js" type="module"></script>'
        );
      });

      describe("without type=module", () => {
        handlebars.registerHelper = jest.fn();
        viewHelpers(app);

        expect(handlebars.registerHelper.mock.calls[2][0]).toEqual(
          "jsFilesHead"
        );
        expect(handlebars.registerHelper.mock.calls[2][1]).toEqual(
          '<script src="index.js"></script>'
        );
        expect(handlebars.registerHelper.mock.calls[3][0]).toEqual(
          "jsFilesBody"
        );
        expect(handlebars.registerHelper.mock.calls[3][1]).toEqual(
          '<script src="body.js"></script>'
        );
      });
    });
  });

  describe("menu", () => {
    app.set(
      "config",
      deepMerge(config.defaultUserConfig, {
        assets: {
          css: ["index.css"],
          js: [{ src: "index.js" }],
        },
      })
    );

    test("returns the result from render/menu/index", () => {
      handlebars.registerHelper = registerHelper;
      viewHelpers(app);

      const template = handlebars.compile("{{#menu}}{{/menu}}");

      expect(template()).toEqual("menuHtml");
    });
  });
});
