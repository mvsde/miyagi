import init from "./index.js";
import { updateConfigForRendererIfNecessary } from "../helpers.js";

/**
 * Runs the renderer to either start the server or create a build
 *
 * @param {object} config - the user configuration object
 */
export default async function initRendering(config) {
  config = await updateConfigForRendererIfNecessary(config);

  if (config) {
    init(config);
  }
}
