/**
 * Copyright 2023 LINE Corporation
 *
 * LINE Corporation licenses this file to you under the Apache License,
 * version 2.0 (the "License"); you may not use this file except in compliance
 * with the License. You may obtain a copy of the License at:
 *
 *   https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations
 * under the License.
 */
import type { z } from 'zod';

import type {
  memberInfoFormSchema,
  memberInfoSchema,
  memberSchema,
} from './member.schema';

export type Member = z.infer<typeof memberSchema>;
export type MemberInfo = z.infer<typeof memberInfoSchema>;
export type MemberInfoForm = z.infer<typeof memberInfoFormSchema>;
