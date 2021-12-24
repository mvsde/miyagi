import path from "path";
import deepMerge from "deepmerge";
import appConfig from "../lib/miyagi-config.js";

const nodeEnv = process.env.NODE_ENV;

afterEach(() => {
  jest.resetModules();
  jest.resetAllMocks();
  process.env.NODE_ENV = nodeEnv;
});

const origProcessCwd = process.cwd();
process.cwd = jest.fn(() => `${origProcessCwd}/tests`);

describe("index", () => {
  describe("start", () => {
    jest.mock("../lib/init/args.js", () => {
      return {
        argv: {
          _: ["start"],
        },
      };
    });

    describe("with parseable result from .miyagi.js", () => {
      describe("with templates.extension, components.folder and engine.name defined in .miyagi.js", () => {
        test("calls lib/init with parsed config", async () => {
          const init = await import("../lib/init.js");
          jest.mock("../lib/logger");
          jest.mock("../lib/init");

          process.argv = ["", "", "start"];

          await import("../index.js");

          const conf = deepMerge(appConfig.defaultUserConfig, {
            isBuild: false,
            isComponentGenerator: false,
            engine: {
              name: "handlebars",
            },
            files: {
              templates: {
                extension: "hbs",
              },
            },
            components: {
              folder: "src",
            },
            userFileName: ".miyagi.js",
          });

          expect(init).toHaveBeenCalledWith(conf);
        });
      });

      describe("without extension defined in .miyagi.js", () => {
        test("it calls log with the correct error msg", async () => {
          const log = await import("../lib/logger.js");

          jest.mock("../lib/logger");
          jest.mock(
            path.resolve(process.cwd(), ".miyagi.js"),
            () => ({
              engine: {
                name: "handlebars",
              },
              components: { folder: "src" },
            }),
            { virtual: true }
          );

          await await import("../index.js");

          expect(log).toHaveBeenNthCalledWith(
            1,
            "info",
            appConfig.messages.serverStarting.replace("{{node_env}}", "test")
          );
          expect(log).toHaveBeenNthCalledWith(
            2,
            "info",
            appConfig.messages.tryingToGuessExtensionBasedOnEngine
          );
          expect(log).toHaveBeenNthCalledWith(
            3,
            "warn",
            appConfig.messages.templateExtensionGuessedBasedOnTemplateEngine.replace(
              "{{extension}}",
              "hbs"
            )
          );
        });

        test("calls lib/init", async () => {
          const init = await import("../lib/init");
          jest.mock("../lib/init");
          jest.mock("../lib/logger");
          jest.mock(path.resolve(process.cwd(), ".miyagi.js"), () => {
            return {
              engine: {
                name: "handlebars",
              },
              components: { folder: "src/" },
            };
          });

          await await import("../index.js");

          expect(init).toHaveBeenCalled();
        });
      });

      describe("without engine defined in .miyagi.js", () => {
        test("it calls log with the correct error msg", async () => {
          const log = await import("../lib/logger.js");

          jest.mock("../lib/logger");
          jest.mock(path.resolve(process.cwd(), ".miyagi.js"), () => {
            return {
              files: {
                templates: {
                  extension: "hbs",
                },
              },
              components: { folder: "src/" },
            };
          });

          await await import("../index.js");

          expect(log).toHaveBeenNthCalledWith(
            1,
            "info",
            appConfig.messages.serverStarting.replace("{{node_env}}", "test")
          );
          expect(log).toHaveBeenNthCalledWith(
            2,
            "info",
            appConfig.messages.tryingToGuessEngineBasedOnExtension
          );
          expect(log).toHaveBeenNthCalledWith(
            3,
            "warn",
            appConfig.messages.engineGuessedBasedOnExtension.replace(
              "{{engine}}",
              "handlebars"
            )
          );
        });

        test.only("calls lib/init", async () => {
          const init = await import("../lib/init");
          jest.mock("../lib/init");
          jest.mock("../lib/logger");
          jest.mock(path.resolve(process.cwd(), ".miyagi.js"), () => {
            return {
              files: {
                templates: {
                  extension: "hbs",
                },
              },
              components: { folder: "src/" },
            };
          });

          await await import("../index.js");

          expect(init).toHaveBeenCalled();
        });
      });
    });
  });
});
