const helpersSrc = "../../../../lib/render/menu/helpers.js";

/**
 * @param componentName
 * @param mock
 */
async function requireComponent(componentName, mock) {
  let component = await import(`../../../../lib/render/menu/${componentName}`);

  if (mock) {
    component.render = jest.fn(() => `${componentName}Html`);
  }

  return component;
}

beforeEach(() => {
  jest.resetModules();
  jest.resetAllMocks();
});

describe("lib/menu/elements/menu-item", () => {
  const app = "app";
  const id = "id";

  test("calls listItem.render with the correct params", async () => {
    const renderMenuItem = await requireComponent("menu-item");
    const renderListItem = await requireComponent("list-item", true);
    const dirObject = {};

    renderMenuItem.render(dirObject);

    expect(renderListItem.render).toHaveBeenCalled();
  });

  describe("with children", () => {
    const type = "type";
    const index = "index";
    const children = [{ index }, {}, {}];
    const request = "request";
    const directoryObject = {
      children,
      id,
      type,
    };

    test("calls renderMenu with the correct params", async () => {
      const renderMenuItem = await requireComponent("menu-item");
      const renderMenu = await requireComponent("index", true);

      renderMenuItem.render(directoryObject, request, app);

      expect(renderMenu.render).toHaveBeenCalledWith(
        app,
        children,
        request,
        index
      );
    });

    test("adds the menu html to the return value", async () => {
      const renderMenuItem = await requireComponent("menu-item");

      await requireComponent("index", true);

      expect(
        renderMenuItem
          .render(directoryObject, request, app)
          .indexOf("indexHtml")
      ).toBeGreaterThanOrEqual(0);
    });
  });

  describe("item is a component", () => {
    const request = "request";
    const directoryObject = {};

    test("calls component.render with the correct params", async () => {
      const helpers = require(helpersSrc);
      const renderMenuItem = await requireComponent("menu-item");
      const renderComponent = await requireComponent("component", true);
      helpers.directoryHasComponent = jest.fn(() => true);

      renderMenuItem.render(directoryObject, request, app);

      expect(renderComponent.render).toHaveBeenCalledWith(
        app,
        directoryObject,
        request
      );
    });

    test("adds the menuItem html to the return value", async () => {
      const helpers = require(helpersSrc);
      const renderMenuItem = await requireComponent("menu-item");
      helpers.directoryHasComponent = jest.fn(() => true);

      await requireComponent("component", true);

      expect(
        renderMenuItem
          .render(directoryObject, request, app)
          .indexOf("componentHtml")
      ).toBeGreaterThanOrEqual(0);
    });
  });

  describe("item isn't a component", () => {
    const helpers = require(helpersSrc);
    const request = "request";
    const directoryObject = {};

    helpers.directoryHasComponent = jest.fn(() => false);

    test("calls directory.render with the correct params", async () => {
      const renderMenuItem = await requireComponent("menu-item");
      const renderDirectory = await requireComponent("directory", true);

      renderMenuItem.render(directoryObject, request, app);

      expect(renderDirectory.render).toHaveBeenCalledWith(
        app,
        directoryObject,
        request
      );
    });

    test("adds the menuItem html to the return value", async () => {
      const renderMenuItem = await requireComponent("menu-item");

      await requireComponent("directory", true);

      expect(
        renderMenuItem
          .render(directoryObject, request, app)
          .indexOf("directoryHtml")
      ).toBeGreaterThanOrEqual(0);
    });
  });
});
