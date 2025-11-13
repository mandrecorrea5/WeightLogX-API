import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity, UserStatus } from '../../database/entities/user.entity';
import { WorkoutEntity } from '../workouts/entities/workout.entity';
import { RankingResponseDto, RankingUserDto } from './dto/ranking-response.dto';

@Injectable()
export class RankingService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(WorkoutEntity)
    private readonly workoutRepository: Repository<WorkoutEntity>,
  ) {}

  async getCenterRanking(
    userId: string,
    limit?: number,
  ): Promise<RankingResponseDto> {
    // Buscar o usuário autenticado para obter o centro de treinamento
    const currentUser = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!currentUser) {
      throw new NotFoundException('User not found');
    }

    // Se o usuário não tem centro de treinamento, retorna ranking vazio
    if (!currentUser.trainingCenterId) {
      return {
        users: [],
        total: 0,
      };
    }

    // Buscar todos os usuários do mesmo centro de treinamento
    const centerUsers = await this.userRepository.find({
      where: {
        trainingCenterId: currentUser.trainingCenterId,
        status: UserStatus.ACTIVE, // Apenas usuários ativos
      },
      select: ['id', 'fullName', 'profileImageUrl'],
    });

    // Contar treinos executados para cada usuário
    // Um treino é considerado "executado" se tiver pelo menos uma série com pesos preenchidos
    const usersWithWorkoutCount = await Promise.all(
      centerUsers.map(async (user) => {
        const workoutCount = await this.countExecutedWorkouts(user.id);
        return {
          id: user.id,
          name: user.fullName,
          profileImageUrl: user.profileImageUrl,
          quantidadeTreinos: workoutCount,
        };
      }),
    );

    // Filtrar usuários que têm pelo menos 1 treino executado
    const usersWithWorkouts = usersWithWorkoutCount.filter(
      (user) => user.quantidadeTreinos > 0,
    );

    // Ordenar por quantidade de treinos (decrescente)
    usersWithWorkouts.sort(
      (a, b) => b.quantidadeTreinos - a.quantidadeTreinos,
    );

    // Aplicar limite se fornecido
    const limitedUsers = limit
      ? usersWithWorkouts.slice(0, limit)
      : usersWithWorkouts;

    // Adicionar posição no ranking
    const rankedUsers: RankingUserDto[] = limitedUsers.map((user, index) => ({
      ...user,
      position: index + 1,
    }));

    return {
      users: rankedUsers,
      total: usersWithWorkouts.length,
    };
  }

  /**
   * Conta treinos executados de um usuário
   * Um treino é considerado "executado" se tiver pelo menos uma série com pesos preenchidos
   */
  private async countExecutedWorkouts(userId: string): Promise<number> {
    const workouts = await this.workoutRepository
      .createQueryBuilder('workout')
      .leftJoinAndSelect('workout.exercises', 'exercise')
      .leftJoinAndSelect('exercise.seriesConfigs', 'seriesConfig')
      .where('workout.userId = :userId', { userId })
      .getMany();

    let executedWorkoutsCount = 0;

    for (const workout of workouts) {
      let hasExecutedSeries = false;

      for (const exercise of workout.exercises) {
        for (const seriesConfig of exercise.seriesConfigs) {
          if (seriesConfig.weights && seriesConfig.weights.length > 0) {
            hasExecutedSeries = true;
            break;
          }
        }
        if (hasExecutedSeries) {
          break;
        }
      }

      if (hasExecutedSeries) {
        executedWorkoutsCount++;
      }
    }

    return executedWorkoutsCount;
  }
}

