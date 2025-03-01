/**
 * Copyright (C) 2025 by Fonoster Inc (https://fonoster.com)
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
import {
  exchangeCredentialsRequestSchema,
  GrpcErrorMessage,
  withErrorHandlingAndValidation
} from "@fonoster/common";
import { getLogger } from "@fonoster/logger";
import * as grpc from "@grpc/grpc-js";
import { Prisma } from "../db";
import { createGetUserByEmail } from "../utils/createGetUserByEmail";
import { createIsValidVerificationCode } from "../utils/createIsValidVerificationCode";
import { ContactType } from "../verification";
import { exchangeTokens } from "./exchangeTokens";
import {
  ExchangeCredentialsRequest,
  ExchangeResponse,
  IdentityConfig
} from "./types";

const logger = getLogger({ service: "identity", filePath: __filename });

const verificationRequiredButNotProvided = (
  identityConfig: IdentityConfig,
  user: {
    emailVerified: boolean;
    phoneNumberVerified: boolean;
  }
) =>
  identityConfig.userVerificationRequired &&
  (!user.emailVerified || !user.phoneNumberVerified);

function createExchangeCredentials(
  prisma: Prisma,
  identityConfig: IdentityConfig
) {
  const isValidVerificationCode = createIsValidVerificationCode(prisma);

  const exchangeCredentials = async (
    call: { request: ExchangeCredentialsRequest },
    callback: (error?: GrpcErrorMessage, response?: ExchangeResponse) => void
  ) => {
    const { request } = call;
    const { username: email, password, verificationCode } = request;

    logger.verbose("call to exchangeCredentials", { username: email });

    const user = await createGetUserByEmail(prisma)(email);

    if (!user || user.password !== password?.trim()) {
      return callback({
        code: grpc.status.PERMISSION_DENIED,
        message: "Invalid credentials"
      });
    }

    if (verificationRequiredButNotProvided(identityConfig, user)) {
      return callback({
        code: grpc.status.PERMISSION_DENIED,
        message: "User contact information not verified"
      });
    }

    if (identityConfig.userVerificationRequired) {
      const isValid = await isValidVerificationCode({
        type: ContactType.EMAIL,
        value: email,
        code: verificationCode
      });

      if (!isValid) {
        return callback({
          code: grpc.status.PERMISSION_DENIED,
          message: "Invalid verification code"
        });
      }
    }

    callback(
      null,
      await exchangeTokens(prisma, identityConfig)(user.accessKeyId)
    );
  };

  return withErrorHandlingAndValidation(
    exchangeCredentials,
    exchangeCredentialsRequestSchema
  );
}

export { createExchangeCredentials };
