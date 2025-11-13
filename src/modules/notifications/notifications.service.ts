import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationEntity } from './entities/notification.entity';
import { NotificationSettingsEntity } from './entities/notification-settings.entity';
import { DeviceTokenEntity } from './entities/device-token.entity';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(NotificationEntity)
    private readonly notificationsRepo: Repository<NotificationEntity>,
    @InjectRepository(NotificationSettingsEntity)
    private readonly settingsRepo: Repository<NotificationSettingsEntity>,
    @InjectRepository(DeviceTokenEntity)
    private readonly deviceTokensRepo: Repository<DeviceTokenEntity>,
  ) {}

  async saveNotification(notification: {
    userId: string;
    type: string;
    title: string;
    body: string;
    data?: Record<string, unknown>;
  }): Promise<NotificationEntity> {
    const entity = this.notificationsRepo.create({
      userId: notification.userId,
      type: notification.type,
      title: notification.title,
      body: notification.body,
      data: notification.data ?? {},
    });
    return this.notificationsRepo.save(entity);
  }

  async listNotifications(
    userId: string,
    page = 1,
    limit = 20,
    unreadOnly = false,
  ) {
    const take = Math.min(Math.max(limit, 1), 100);
    const skip = (Math.max(page, 1) - 1) * take;

    const where = unreadOnly ? { userId, read: false } : { userId };

    const [rows, total] = await this.notificationsRepo.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      take,
      skip,
    });

    const unreadCount = await this.getUnreadCount(userId);

    return {
      notifications: rows,
      pagination: {
        page,
        limit: take,
        total,
        totalPages: Math.ceil(total / take),
      },
      unreadCount,
    };
  }

  async markAsRead(userId: string, id: string): Promise<void> {
    await this.notificationsRepo.update(
      { id, userId },
      { read: true, readAt: new Date() },
    );
  }

  async markAllAsRead(userId: string): Promise<number> {
    const res = await this.notificationsRepo
      .createQueryBuilder()
      .update(NotificationEntity)
      .set({ read: true, readAt: () => 'NOW()' })
      .where('user_id = :userId AND read = false', { userId })
      .returning('id')
      .execute();
    return res.raw?.length ?? 0;
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.notificationsRepo.count({ where: { userId, read: false } });
  }

  async getSettings(userId: string): Promise<NotificationSettingsEntity> {
    let settings = await this.settingsRepo.findOne({ where: { userId } });
    if (!settings) {
      settings = this.settingsRepo.create({ userId });
      settings = await this.settingsRepo.save(settings);
    }
    return settings;
  }

  async updateSettings(
    userId: string,
    partial: Partial<NotificationSettingsEntity>,
  ) {
    await this.settingsRepo.save({ userId, ...partial });
    return this.getSettings(userId);
  }

  async registerDeviceToken(
    userId: string,
    payload: {
      deviceToken: string;
      platform: 'ios' | 'android';
      deviceId?: string;
    },
  ) {
    const entity = this.deviceTokensRepo.create({
      userId,
      deviceToken: payload.deviceToken,
      platform: payload.platform,
      deviceId: payload.deviceId,
    });
    await this.deviceTokensRepo
      .createQueryBuilder()
      .insert()
      .values(entity)
      .onConflict('ON CONSTRAINT uq_user_device_token DO NOTHING')
      .execute();
  }

  async deleteDeviceToken(userId: string, deviceToken: string) {
    await this.deviceTokensRepo.delete({ userId, deviceToken });
  }

  // Helper para enviar e persistir notificação de um evento de negócio
  async sendToUser(
    userId: string,
    notification: {
      type: string;
      title: string;
      body: string;
      data?: Record<string, unknown>;
    },
  ) {
    return this.saveNotification({ userId, ...notification });
  }
}
