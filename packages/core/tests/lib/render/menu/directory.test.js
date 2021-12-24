import deepMerge from "deepmerge";
import config from "../../../../lib/miyagi-config.js";

const helpersSrc = "../../../../lib/render/menu/helpers.js";

/**
 * @param componentName
 * @param mock
 */
async function requireComponent(componentName, mock) {
  let component = await import(
    `../../../../lib/render/menu/${componentName}.js`
  );

  if (mock) {
    component.render = jest.fn(() => `${componentName}Html`);
  }

  return component;
}

beforeEach(() => {
  jest.resetModules();
  jest.resetAllMocks();
});

describe("lib/menu/elements/directory", () => {
  const fullPath = "foo/bar";
  const id = 1;
  const index = 2;
  const name = "name";
  const directoryObject = {
    fullPath,
    id,
    index,
    name,
  };
  const request = {
    path: "foo/bar",
    variation: "baz",
  };
  const app = require("express")();
  app.set(
    "config",
    deepMerge(config.defaultUserConfig, {
      components: {
        folder: "srcFolder",
      },
    })
  );

  test("adds the component name with correct index to the html", async () => {
    const directory = await requireComponent("directory");

    expect(
      directory
        .render(app, directoryObject, request)
        .indexOf(
          '<span class="Menu-component Menu-component--lvl2">name</span>'
        )
    ).toBeGreaterThanOrEqual(0);
  });

  describe("has directory as child and is not in the first level", () => {
    describe("when expanded", () => {
      test("calls toggle.render with the correct params", async () => {
        const directory = await requireComponent("directory");
        const toggle = await requireComponent("toggle", true);
        const helpers = require(helpersSrc);

        helpers.childrenOfDirectoryContainDirectory = jest.fn(() => true);
        helpers.childrenOfDirectoryContainDirectory = jest.fn(() => true);
        helpers.directoryIsNotTopLevel = jest.fn(() => true);
        helpers.pathIsParentOfOrEqualRequestedPath = jest.fn(() => true);

        directory.render(app, directoryObject, request);

        expect(toggle.render).toHaveBeenCalledWith(
          `${directoryObject.id}-components`,
          true,
          directoryObject.index
        );
      });
    });

    describe("when not expanded", () => {
      test("calls toggle.render with the correct params", async () => {
        const directory = await requireComponent("directory");
        const toggle = await requireComponent("toggle", true);
        const helpers = require(helpersSrc);

        helpers.childrenOfDirectoryContainDirectory = jest.fn(() => true);
        helpers.childrenOfDirectoryContainDirectory = jest.fn(() => true);
        helpers.directoryIsNotTopLevel = jest.fn(() => true);
        helpers.pathIsParentOfOrEqualRequestedPath = jest.fn(() => false);

        directory.render(app, directoryObject, request);

        expect(toggle.render).toHaveBeenCalledWith(
          `${directoryObject.id}-components`,
          false,
          directoryObject.index
        );
      });
    });

    test("adds the toggle html to the return value", async () => {
      const directory = await requireComponent("directory");
      await requireComponent("toggle", true);

      const helpers = require(helpersSrc);
      helpers.childrenOfDirectoryContainDirectory = jest.fn(() => true);
      helpers.childrenOfDirectoryContainDirectory = jest.fn(() => true);
      helpers.directoryIsNotTopLevel = jest.fn(() => true);

      expect(
        directory.render(app, directoryObject, request).indexOf("toggleHtml")
      ).toBeGreaterThanOrEqual(0);
    });
  });
});
