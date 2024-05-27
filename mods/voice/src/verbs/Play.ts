/*
 * Copyright (C) 2024 by Fonoster Inc (https://fonoster.com)
 * http://github.com/fonoster/fonoster
 *
 * This file is part of Fonoster
 *
 * Licensed under the MIT License (the "License");
 * you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 *
 *    https://opensource.org/licenses/MIT
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import { getLogger } from "@fonoster/logger";
import { Verb } from "./Verb";
import { DATA } from "../types";

const logger = getLogger({ service: "voice", filePath: __filename });

class Play extends Verb {
  run(url: string): Promise<void> {
    const { sessionId } = this.request;
    const { voice } = this;

    logger.verbose("sending play request", { sessionId });

    return new Promise((resolve, reject) => {
      try {
        voice.write({ playRequest: { url, sessionId } });

        const dataListener = () => {
          logger.verbose("received play response", { sessionId });

          resolve();

          voice.removeListener(DATA, dataListener);
        };

        voice.on(DATA, dataListener);
      } catch (e) {
        reject(e);
      }
    });
  }
}

export { Play };
