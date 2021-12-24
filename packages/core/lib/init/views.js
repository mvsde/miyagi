/**
 * Module for registering the views in express
 *
 * @module initViews
 */

import path from "path";
import config from "../miyagi-config.js";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default function initViews(app) {
  app.set("views", [
    path.join(__dirname, `../../${config.folders.views}`),
    path.resolve(app.get("config").components.folder),
  ]);
}
