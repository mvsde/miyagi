const path = require("path");
const fs = require("fs");
const logger = require("../logger.js");
const {
  messages,
  dataFileType,
  documentationFileType,
} = require("../config.json");

function getFullComponentPath(componentName, config) {
  return path.join(config.srcFolder, componentName);
}

function getFiles(fileNames, opts) {
  if (opts) {
    if (opts.startsWith("--skip=")) {
      const files = [];
      const targets = opts.replace("--skip=", "").split(",");
      Object.entries(fileNames).forEach(([alias, name]) => {
        if (!targets.includes(alias)) {
          files.push(name);
        }
      });

      return files;
    } else if (opts.startsWith("--only=")) {
      return opts
        .replace("--only=", "")
        .split(",")
        .map((entry) => fileNames[entry]);
    } else {
      return Object.values(fileNames);
    }
  } else {
    return Object.values(fileNames);
  }
}

function createComponentFiles(componentPath, files) {
  const promises = [];

  files.forEach((file) => {
    promises.push(
      new Promise((resolve) => {
        const fullFilePath = path.join(componentPath, file);

        fs.writeFile(
          fullFilePath,
          "",
          { flag: "wx" },
          function createComponentFilesCallback(err) {
            if (err) {
              if (err.code == "EEXIST") {
                logger.log(
                  "warn",
                  messages.generator.fileAlreadyExists.replace(
                    "${name}",
                    fullFilePath
                  )
                );
              } else {
                logger.log(
                  "error",
                  messages.generator.unknownError.replace(
                    "${name}",
                    fullFilePath
                  )
                );
              }
            }

            resolve();
          }
        );
      })
    );
  });

  return Promise.all(promises);
}

function createComponentFolder(componentPath) {
  fs.mkdir(componentPath, { recursive: true }, function createComponentCallback(
    err
  ) {
    if (err) {
      logger.log(
        "error",
        messages.generator.unknownError.replace("${name}", componentPath)
      );
    }
  });
}

module.exports = async function generator(params, config) {
  if (!params.length === 0) {
    return logger.log("error", messages.generator.noComponentNameDefined);
  }

  const [componentNameWithFolder, opts] = params;
  const componentName = componentNameWithFolder.split(path.sep).slice(-1);
  const fileNames = {
    tpl: `${componentName}.${config.extension}`,
    data: `${componentName}.${dataFileType}`,
    docs: `${componentName}.${documentationFileType}`,
    css: `${componentName}.css`,
    js: `${componentName}.js`,
  };
  const componentPath = getFullComponentPath(componentNameWithFolder, config);
  const filesToCreate = getFiles(fileNames, opts);

  await createComponentFolder(componentPath);
  await createComponentFiles(componentPath, filesToCreate);

  logger.log("info", messages.generator.done);
};