import path from "path";
import deepMerge from "deepmerge";
import appConfig, { messages } from "../lib/miyagi-config.js";

jest.mock("../lib/__dirname.js", () => `${process.cwd()}/lib`);

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
          jest.mock("../lib/logger.js");
          jest.mock("../lib/init/index.js");

          const init = await import("../lib/init/index.js");

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

          expect(init.default).toHaveBeenCalledWith(conf);
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

          await import("../index.js");

          expect(log).toHaveBeenNthCalledWith(
            1,
            "info",
            messages.serverStarting.replace("{{node_env}}", "test")
          );
          expect(log).toHaveBeenNthCalledWith(
            2,
            "info",
            messages.tryingToGuessExtensionBasedOnEngine
          );
          expect(log).toHaveBeenNthCalledWith(
            3,
            "warn",
            messages.templateExtensionGuessedBasedOnTemplateEngine.replace(
              "{{extension}}",
              "hbs"
            )
          );
        });

        test("calls lib/init", async () => {
          jest.mock("../lib/init/index.js");
          jest.mock("../lib/logger.js");
          jest.mock(path.resolve(process.cwd(), ".miyagi.js"), () => {
            return {
              engine: {
                name: "handlebars",
              },
              components: { folder: "src/" },
            };
          });

          const init = await import("../lib/init/index.js");

          await import("../index.js");

          expect(init.default).toHaveBeenCalled();
        });
      });

      describe("without engine defined in .miyagi.js", () => {
        test.only("it calls log with the correct error msg", async () => {
          jest.mock("../lib/logger.js");
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

          const log = await import("../lib/logger.js");

          await import("../index.js");

          expect(log.default).toHaveBeenCalledTimes(3);
          expect(log.default).toHaveBeenNthCalledWith(
            1,
            "info",
            messages.serverStarting.replace("{{node_env}}", "test")
          );
          expect(log.default).toHaveBeenNthCalledWith(
            2,
            "info",
            messages.tryingToGuessEngineBasedOnExtension
          );
          expect(log.default).toHaveBeenNthCalledWith(
            3,
            "warn",
            messages.engineGuessedBasedOnExtension.replace(
              "{{engine}}",
              "handlebars"
            )
          );
        });

        test("calls lib/init", async () => {
          jest.mock("../lib/init/index.js");
          jest.mock("../lib/logger.js");
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

          const init = await import("../lib/init/index.js");

          await import("../index.js");

          expect(init).toHaveBeenCalled();
        });
      });
    });
  });
});
