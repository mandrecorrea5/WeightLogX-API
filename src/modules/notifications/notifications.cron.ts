import { Injectable, Logger } from '@nestjs/common';
import * as cron from 'node-cron';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationsService } from './notifications.service';
import { NotificationSettingsEntity } from './entities/notification-settings.entity';
import { WorkoutEntity } from '../workouts/entities/workout.entity';
import { UserEntity } from '../../database/entities/user.entity';

@Injectable()
export class NotificationsCronService {
  private readonly logger = new Logger(NotificationsCronService.name);

  constructor(
    private readonly notificationsService: NotificationsService,
    @InjectRepository(NotificationSettingsEntity)
    private readonly settingsRepo: Repository<NotificationSettingsEntity>,
    @InjectRepository(WorkoutEntity)
    private readonly workoutRepo: Repository<WorkoutEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
  ) {
    this.initCronJobs();
  }

  private initCronJobs(): void {
    if (process.env.ENABLE_CRON_REMINDERS !== 'false') {
      this.scheduleWorkoutReminders();
    }
    if (process.env.ENABLE_CRON_INACTIVITY !== 'false') {
      this.scheduleInactivityNotifications();
    }
  }

  private scheduleWorkoutReminders(): void {
    // Minutely check matching times for reminders
    cron.schedule('0 * * * *', async () => {
      try {
        const now = new Date();
        const hour = now.getHours().toString().padStart(2, '0');
        const minute = now.getMinutes().toString().padStart(2, '0');

        const settings = await this.settingsRepo
          .createQueryBuilder('s')
          .where('s.workoutReminders = TRUE')
          .andWhere('to_char(s.workoutReminderTime, \"HH24:MI\") = :hm', {
            hm: `${hour}:${minute}`,
          })
          .getMany();

        if (settings.length === 0) return;

        for (const s of settings) {
          const hasWorkoutToday = await this.workoutRepo
            .createQueryBuilder('w')
            .where('w.user_id = :userId', { userId: s.userId })
            .andWhere('w.date::date = CURRENT_DATE')
            .getCount();

          if (hasWorkoutToday > 0) continue;

          await this.notificationsService.sendToUser(s.userId, {
            type: 'workout_reminder',
            title: 'Lembrete de Treino',
            body: 'Não esqueça de registrar seu treino de hoje!',
          });
        }
      } catch (error) {
        this.logger.error('Erro no cron de lembretes', error);
      }
    });
  }

  private scheduleInactivityNotifications(): void {
    const days = parseInt(process.env.INACTIVITY_DAYS || '7', 10);
    const cronExp = process.env.INACTIVITY_CRON_SCHEDULE || '0 9 * * *'; // 09:00 todos os dias

    cron.schedule(cronExp, async () => {
      try {
        // Buscar atletas com trainerId definido
        const athletes = await this.userRepo
          .createQueryBuilder('u')
          .where('u.trainer_id IS NOT NULL')
          .getMany();

        for (const athlete of athletes) {
          const recentCount = await this.workoutRepo
            .createQueryBuilder('w')
            .where('w.user_id = :userId', { userId: athlete.id })
            .andWhere('w.date >= CURRENT_DATE - INTERVAL :days', {
              days: `${days} days`,
            })
            .getCount();

          if (recentCount > 0) continue; // Teve treino nos últimos N dias

          if (!athlete.trainerId) continue;

          await this.notificationsService.sendToUser(athlete.trainerId, {
            type: 'athlete_inactive',
            title: 'Atleta Inativo',
            body: `O atleta ${athlete.fullName} não treina há ${days} dias`,
            data: { athleteId: athlete.id },
          });
        }
      } catch (error) {
        this.logger.error('Erro no cron de inatividade', error);
      }
    });
  }
}
