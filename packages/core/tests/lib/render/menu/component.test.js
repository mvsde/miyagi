const helpersSrc = "../../../../lib/render/menu/helpers.js";
const directoryIndex = 1;
const directoryId = 2;
const directoryShortPath = "foo/bar";
const directoryName = "bar";
const directory = {
  shortPath: directoryShortPath,
  name: directoryName,
  index: directoryIndex,
  id: directoryId,
};

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

const app = {
  get() {
    return {
      isBuild: false,
    };
  },
};

describe("lib/menu/elements/component", () => {
  describe("with current directory === requested directory", () => {
    const requestPath = "foo/bar";
    const request = {
      path: requestPath,
    };

    describe("without requested variation", () => {
      test("renders the link with active state", async () => {
        const helpers = require(helpersSrc);
        const component = await requireComponent("component");
        helpers.activeState = "activeState";

        expect(
          component.render(app, directory, request).indexOf("activeState")
        ).toBeGreaterThanOrEqual(0);
      });
    });

    describe("with requested variation", () => {
      test("renders the link without active state", async () => {
        const component = await requireComponent("component");

        expect(
          component
            .render(
              app,
              directory,
              Object.assign(request, { variation: "variation" })
            )
            .indexOf("activeState")
        ).toBeGreaterThanOrEqual(-1);
      });
    });
  });

  describe("with current directory !== requested directory", () => {
    const request = {
      path: "foo/baz",
    };

    test("renders the link without active state", async () => {
      const component = await requireComponent("component");

      expect(
        component.render(app, directory, request).indexOf("activeState")
      ).toBeGreaterThanOrEqual(-1);
    });
  });

  describe("with componentHasVariations being truthy", () => {
    test("adds the toggle html to the return value", async () => {
      const helpers = require(helpersSrc);
      const component = await requireComponent("component");
      await requireComponent("variations", true);
      await requireComponent("toggle", true);
      helpers.componentHasVariations = jest.fn(() => true);
      helpers.childrenOfDirectoryContainDirectory = jest.fn(() => false);

      expect(
        component.render(app, {}, {}).indexOf("toggleHtml")
      ).toBeGreaterThanOrEqual(0);
    });

    describe("requested component is the current component", () => {
      test("calls toggle.render with the correct params", async () => {
        const helpers = require(helpersSrc);
        const component = await requireComponent("component");
        const renderToggle = await requireComponent("toggle", true);
        await requireComponent("variations", true);
        helpers.componentHasVariations = jest.fn(() => true);
        helpers.childrenOfDirectoryContainDirectory = jest.fn(() => false);
        helpers.pathIsParentOfOrEqualRequestedPath = jest.fn(() => true);

        component.render(app, directory, { path: directory.shortPath });

        expect(renderToggle.render).toHaveBeenCalledWith(
          `${directoryId}-variations`,
          true,
          directoryIndex
        );
      });
    });

    describe("requested component is not the current component", () => {
      test("calls toggle.render with the correct params", async () => {
        const helpers = require(helpersSrc);
        const component = await requireComponent("component");
        const renderToggle = await requireComponent("toggle", true);
        await requireComponent("variations", true);
        helpers.componentHasVariations = jest.fn(() => true);
        helpers.childrenOfDirectoryContainDirectory = jest.fn(() => false);
        helpers.pathIsParentOfOrEqualRequestedPath = jest.fn(() => false);

        component.render(app, directory, {
          path: directory.shortPath + "different-directory",
        });

        expect(renderToggle.render).toHaveBeenCalledWith(
          `${directoryId}-variations`,
          false,
          directoryIndex
        );
      });
    });
  });

  describe("with childrenOfDirectoryContainDirectory being truthy", () => {
    test("adds the toggle html to the return value", async () => {
      const helpers = require(helpersSrc);
      const component = await requireComponent("component");
      await requireComponent("toggle", true);
      await requireComponent("variations", true);
      helpers.componentHasVariations = jest.fn(() => false);
      helpers.childrenOfDirectoryContainDirectory = jest.fn(() => true);

      expect(
        component.render(app, {}, {}).indexOf("toggleHtml")
      ).toBeGreaterThanOrEqual(0);
    });

    describe("request directory is parent of current directory", () => {
      const request = {
        path: directoryShortPath,
      };

      test("calls toggle.render with the correct params", async () => {
        const helpers = require(helpersSrc);
        const component = await requireComponent("component");
        const renderToggle = await requireComponent("toggle", true);
        helpers.componentHasVariations = jest.fn(() => false);
        helpers.childrenOfDirectoryContainDirectory = jest.fn(() => true);
        helpers.pathIsParentOfOrEqualRequestedPath = jest.fn(() => true);

        component.render(app, directory, request);

        expect(renderToggle.render).toHaveBeenCalledWith(
          `${directoryId}-variations`,
          true,
          directoryIndex
        );
      });
    });

    describe("request directory is not parent of current directory", () => {
      const request = {
        path: "foo/baz",
      };

      test("calls toggle.render with the correct params", async () => {
        const helpers = require(helpersSrc);
        const component = await requireComponent("component");
        const renderToggle = await requireComponent("toggle", true);
        helpers.componentHasVariations = jest.fn(() => false);
        helpers.childrenOfDirectoryContainDirectory = jest.fn(() => true);
        helpers.pathIsParentOfOrEqualRequestedPath = jest.fn(() => false);

        component.render(app, directory, request);

        expect(renderToggle.render).toHaveBeenCalledWith(
          `${directoryId}-variations`,
          false,
          directoryIndex
        );
      });
    });
  });

  describe("with componentHasVariations and childrenOfDirectoryContainDirectory being falsy", () => {
    test("doesn't call toggle.render", async () => {
      const helpers = require(helpersSrc);
      const component = await requireComponent("component");
      const renderToggle = await requireComponent("toggle", true);
      helpers.componentHasVariations = jest.fn(() => false);
      helpers.childrenOfDirectoryContainDirectory = jest.fn(() => false);

      component.render(app, {}, {});

      expect(renderToggle.render).not.toHaveBeenCalled();
    });

    test("doesn't add the toggle html to the return value", async () => {
      const helpers = require(helpersSrc);
      const component = await requireComponent("component");
      await requireComponent("toggle", true);
      helpers.componentHasVariations = jest.fn(() => false);
      helpers.childrenOfDirectoryContainDirectory = jest.fn(() => false);

      expect(component.render(app, {}, {}).indexOf("toggleHtml")).toBe(-1);
    });
  });
});
