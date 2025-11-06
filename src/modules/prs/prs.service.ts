import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { I18nService } from 'nestjs-i18n';
import { PersonalRecordEntity } from './entities/personal-record.entity';
import { WorkoutEntity } from '../workouts/entities/workout.entity';
import { WorkoutExerciseEntity } from '../workouts/entities/workout-exercise.entity';
import { SeriesConfigEntity } from '../workouts/entities/series-config.entity';
import { PrResponseDto } from './dto/pr-response.dto';
import { PrListResponseDto } from './dto/pr-list-response.dto';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class PrsService {
  constructor(
    @InjectRepository(PersonalRecordEntity)
    private readonly prRepository: Repository<PersonalRecordEntity>,
    @InjectRepository(WorkoutEntity)
    private readonly workoutRepository: Repository<WorkoutEntity>,
    @InjectRepository(WorkoutExerciseEntity)
    private readonly workoutExerciseRepository: Repository<WorkoutExerciseEntity>,
    @InjectRepository(SeriesConfigEntity)
    private readonly seriesConfigRepository: Repository<SeriesConfigEntity>,
    private readonly i18n: I18nService,
    private readonly notificationsService: NotificationsService,
  ) { }

  /**
   * Calcula e atualiza PRs baseado em um treino salvo
   * Deve ser chamado após salvar um treino
   */
  async calculateAndUpdatePRs(
    workoutId: string,
    userId: string,
  ): Promise<void> {
    // Buscar o treino completo com exercícios e séries
    const workout = await this.workoutRepository.findOne({
      where: { id: workoutId },
      relations: ['exercises', 'exercises.seriesConfigs'],
    });

    if (!workout) {
      return;
    }

    // Para cada exercício do treino
    for (const exercise of workout.exercises) {
      // Encontrar o peso máximo levantado neste exercício
      let maxWeight = 0;

      for (const seriesConfig of exercise.seriesConfigs) {
        if (seriesConfig.weights && seriesConfig.weights.length > 0) {
          const seriesMax = Math.max(...seriesConfig.weights);
          if (seriesMax > maxWeight) {
            maxWeight = seriesMax;
          }
        }
      }

      if (maxWeight <= 0) {
        continue; // Pular se não houver pesos válidos
      }

      // Verificar se já existe um PR para este exercício
      const existingPR = await this.prRepository.findOne({
        where: {
          userId,
          exerciseId: exercise.exerciseId,
        },
        order: {
          maxWeight: 'DESC',
        },
      });

      // Se não existe PR ou o novo peso é maior, criar/atualizar PR
      if (!existingPR || maxWeight > Number(existingPR.maxWeight)) {
        let createdOrUpdated = false;
        if (existingPR && maxWeight > Number(existingPR.maxWeight)) {
          // Atualizar PR existente apenas se o novo peso for maior
          existingPR.maxWeight = maxWeight;
          existingPR.workoutId = workoutId;
          existingPR.date = workout.date;
          await this.prRepository.save(existingPR);
          createdOrUpdated = true;
        } else if (!existingPR) {
          // Criar novo PR
          const newPR = this.prRepository.create({
            userId,
            exerciseId: exercise.exerciseId,
            maxWeight,
            workoutId,
            date: workout.date,
          });
          await this.prRepository.save(newPR);
          createdOrUpdated = true;
        }

        // Enviar notificação
        if (createdOrUpdated) {
          try {
            await this.notificationsService.sendToUser(userId, {
              type: 'new_pr',
              title: 'Novo Recorde Pessoal! 🎉',
              body: `Você bateu um novo PR em ${exercise.name}: ${maxWeight}kg`,
              data: {
                exerciseId: exercise.exerciseId,
                workoutId,
                maxWeight,
              },
            });
          } catch (e) {
            // Ignorar falha de notificação
          }
        }
      }
    }
  }

  /**
   * Lista PRs do usuário
   */
  async findAll(
    userId: string,
    exerciseId?: string,
    recentOnly: boolean = false,
    locale: string = 'pt-BR',
  ): Promise<PrListResponseDto> {
    const queryBuilder = this.prRepository
      .createQueryBuilder('pr')
      .leftJoinAndSelect('pr.workout', 'workout')
      .leftJoin('workout.exercises', 'exercise')
      .where('pr.userId = :userId', { userId })
      .orderBy('pr.maxWeight', 'DESC');

    // Filtrar por exercício se especificado
    if (exerciseId) {
      queryBuilder.andWhere('pr.exerciseId = :exerciseId', { exerciseId });
    }

    // Filtrar apenas PRs recentes (últimos 7 dias)
    if (recentOnly) {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      queryBuilder.andWhere('pr.date >= :sevenDaysAgo', {
        sevenDaysAgo,
      });
    }

    const prs = await queryBuilder.getMany();

    // Mapear para DTO com nome do exercício
    const prResponses: PrResponseDto[] = await Promise.all(
      prs.map(async (pr) => {
        // Buscar o exercício do treino para obter nome e abreviação
        const workout = await this.workoutRepository.findOne({
          where: { id: pr.workoutId },
          relations: ['exercises'],
        });

        const exercise = workout?.exercises.find(
          (e) => e.exerciseId === pr.exerciseId,
        );

        // Traduzir nome do exercício (por enquanto retorna o nome salvo)
        // TODO: Implementar tradução baseada no locale
        const exerciseName =
          exercise?.name || (await this.getExerciseName(pr.exerciseId, locale));

        return {
          exerciseId: pr.exerciseId,
          exerciseName,
          abbreviation: exercise?.abbreviation || '',
          maxWeight: Number(pr.maxWeight),
          date: pr.date.toISOString(),
          workoutId: pr.workoutId,
        };
      }),
    );

    return {
      prs: prResponses,
    };
  }

  /**
   * Obtém o nome traduzido do exercício
   * Por enquanto retorna o nome padrão, mas pode ser expandido para usar i18n
   */
  private async getExerciseName(
    exerciseId: string,
    locale: string,
  ): Promise<string> {
    // Mapeamento básico de IDs para nomes
    // Em produção, isso pode vir de uma tabela de exercícios ou constante
    const exerciseNames: Record<string, { 'pt-BR': string; 'en': string }> = {
      '1': { 'pt-BR': 'Arranco', 'en': 'Snatch' },
      '2': { 'pt-BR': 'Arremesso', 'en': 'Clean and Jerk' },
      // Adicionar mais exercícios conforme necessário
    };

    const exercise = exerciseNames[exerciseId];
    if (exercise) {
      return locale === 'en' || locale.startsWith('en')
        ? exercise.en
        : exercise['pt-BR'];
    }

    return `Exercise ${exerciseId}`;
  }
}

