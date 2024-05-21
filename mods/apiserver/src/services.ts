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
import { buildIdentityService } from "@fonoster/identity";
import {
  buildAclsService,
  buildAgentsService,
  buildCredentialsService,
  buildDomainsService,
  buildNumbersService,
  buildTrunksService
} from "@fonoster/sipnet";
import { buildApplicationsService } from "./applications";
import { buildCallsService } from "./calls";
import { influxdb } from "./calls/client";
import { prisma } from "./db";
import { identityConfig } from "./identityConfig";
import { routrConfig } from "./routrConfig";
import { buildSecretsService } from "./secrets";

const applicationsService = buildApplicationsService(prisma);
const secretsService = buildSecretsService(prisma);
const callsService = buildCallsService(influxdb);
const identityService = buildIdentityService(identityConfig);
const agentsService = buildAgentsService(routrConfig);
const domainsService = buildDomainsService(routrConfig);
const credentialsService = buildCredentialsService(routrConfig);
const trunksService = buildTrunksService(routrConfig);
const numbersService = buildNumbersService(routrConfig);
const aclsService = buildAclsService(routrConfig);

const services = Promise.all([
  applicationsService,
  secretsService,
  callsService,
  identityService,
  agentsService,
  credentialsService,
  aclsService,
  numbersService,
  trunksService,
  domainsService
]);

export default services;
