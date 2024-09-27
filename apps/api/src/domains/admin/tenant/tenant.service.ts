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
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SchedulerRegistry } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { CronJob } from 'cron';
import { DateTime } from 'luxon';
import { Repository } from 'typeorm';
import { Transactional } from 'typeorm-transactional';

import { LockTypeEnum } from '@/domains/operation/scheduler-lock/lock-type.enum';
import { SchedulerLockService } from '@/domains/operation/scheduler-lock/scheduler-lock.service';
import { ChannelEntity } from '../channel/channel/channel.entity';
import { FeedbackEntity } from '../feedback/feedback.entity';
import { FeedbackService } from '../feedback/feedback.service';
import { IssueEntity } from '../project/issue/issue.entity';
import { ProjectEntity } from '../project/project/project.entity';
import { UserTypeEnum } from '../user/entities/enums';
import { UserEntity } from '../user/entities/user.entity';
import type { FeedbackCountByTenantIdDto } from './dtos';
import { SetupTenantDto, UpdateTenantDto } from './dtos';
import {
  TenantAlreadyExistsException,
  TenantNotFoundException,
} from './exceptions';
import { TenantEntity } from './tenant.entity';

@Injectable()
export class TenantService {
  private logger = new Logger(TenantService.name);
  constructor(
    @InjectRepository(TenantEntity)
    private readonly tenantRepo: Repository<TenantEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
    @InjectRepository(ChannelEntity)
    private readonly channelRepo: Repository<ChannelEntity>,
    @InjectRepository(ProjectEntity)
    private readonly projectRepo: Repository<ProjectEntity>,
    @InjectRepository(FeedbackEntity)
    private readonly feedbackRepo: Repository<FeedbackEntity>,
    private readonly configService: ConfigService,
    private readonly feedbackService: FeedbackService,
    private readonly schedulerRegistry: SchedulerRegistry,
    private readonly schedulerLockService: SchedulerLockService,
  ) {}

  @Transactional()
  async create(dto: SetupTenantDto) {
    const tenants = await this.tenantRepo.find({ take: 1 });
    if (tenants.length > 0) throw new TenantAlreadyExistsException();
    const newTenant = new TenantEntity();
    const savedTenant = await this.tenantRepo.save(
      Object.assign(newTenant, dto),
    );

    const user = new UserEntity();
    user.email = 'user@feedback.com';
    user.hashPassword =
      '$2b$10$87iuFh.Yty8esbdmuB4bz.NNVh0thMWtf0MPfajzqjvxHfRf6zR0C';
    user.type = UserTypeEnum.SUPER;
    await this.userRepo.save(user);

    return savedTenant;
  }

  @Transactional()
  async update(dto: UpdateTenantDto) {
    const tenant = await this.findOne();
    return await this.tenantRepo.save(Object.assign(tenant, dto));
  }

  async findOne() {
    const tenants = await this.tenantRepo.find();
    if (tenants.length === 0) throw new TenantNotFoundException();

    return {
      ...tenants[0],
      useEmailVerification: this.configService.get<boolean>('smtp.use'),
    };
  }

  async countByTenantId(dto: FeedbackCountByTenantIdDto) {
    return {
      total: await this.feedbackRepo.count({
        where: { channel: { project: { tenant: { id: dto.tenantId } } } },
      }),
    };
  }

  async deleteOldFeedback() {
    const channels = await this.channelRepo.find();
    const feedbackIdsToDelete: number[] = [];

    interface Feedback {
      id: number;
      [key: string]: any;
      issues?: IssueEntity[];
    }

    for (const { id } of channels) {
      const feedbacks = await this.feedbackService.findByChannelId({
        channelId: id,
        query: {
          createdAt: {
            gte: DateTime.fromJSDate(new Date(0)).toFormat('yyyy-MM-dd'),
            lt: DateTime.now().minus({ month: 6 }).toFormat('yyyy-MM-dd'),
          },
        },
        page: 1,
        limit: 1000,
      });
      console.log(feedbacks);

      for (const feedback of feedbacks.items) {
        feedbackIdsToDelete.push((feedback as Feedback).id);
      }
      await this.feedbackService.deleteByIds({
        channelId: id,
        feedbackIds: feedbackIdsToDelete,
      });
    }
    console.log(channels);
    // this.feedbackService.findByChannelId(channels[0].id);
  }

  async addCronJob() {
    const projects = await this.projectRepo.find();

    if (projects.length === 0) {
      throw new NotFoundException(`Project not found`);
    }

    const timezoneOffset = projects[0].timezone.offset;

    const cronHour = (24 - Number(timezoneOffset.split(':')[0])) % 24;

    const job = new CronJob(`0 * * * * *`, async () => {
      if (
        await this.schedulerLockService.acquireLock(
          LockTypeEnum.FEEDBACK_COUNT,
          1000 * 60 * 5,
        )
      ) {
        try {
          await this.deleteOldFeedback();
        } finally {
          await this.schedulerLockService.releaseLock(
            LockTypeEnum.FEEDBACK_COUNT,
          );
        }
      } else {
        this.logger.log({
          message: 'Failed to acquire lock for deleting old feedback',
        });
      }
    });
    this.schedulerRegistry.addCronJob(`delete-old-feedback`, job);
    job.start();
    console.log('Cron job started');
  }
}
