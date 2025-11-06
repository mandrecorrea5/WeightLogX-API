import { Injectable } from '@nestjs/common';

export interface Permission {
  resource: string;
  actions: string[];
}

@Injectable()
export class PermissionsService {
  /**
   * Retorna as permissões baseadas no role do usuário
   */
  getPermissionsByRole(roleName: string): Permission[] {
    switch (roleName) {
      case 'admin':
        return this.getAdminPermissions();
      case 'treinador':
        return this.getTrainerPermissions();
      case 'atleta':
      default:
        return this.getAthletePermissions();
    }
  }

  /**
   * Permissões para atleta
   */
  private getAthletePermissions(): Permission[] {
    return [
      {
        resource: 'workouts',
        actions: ['create', 'read', 'update', 'delete', 'send-to-trainer'],
      },
      {
        resource: 'prs',
        actions: ['read'],
      },
      {
        resource: 'reports',
        actions: ['read'],
      },
      {
        resource: 'profile',
        actions: ['read', 'update'],
      },
      {
        resource: 'exercises',
        actions: ['read'],
      },
      {
        resource: 'training-centers',
        actions: ['read', 'create'],
      },
    ];
  }

  /**
   * Permissões para treinador
   */
  private getTrainerPermissions(): Permission[] {
    return [
      {
        resource: 'workouts',
        actions: ['read', 'update'], // Pode ver e atualizar treinos dos atletas
      },
      {
        resource: 'prs',
        actions: ['read'],
      },
      {
        resource: 'reports',
        actions: ['read'],
      },
      {
        resource: 'profile',
        actions: ['read', 'update'],
      },
      {
        resource: 'exercises',
        actions: ['read', 'create', 'update'],
      },
      {
        resource: 'training-centers',
        actions: ['read', 'create'],
      },
      {
        resource: 'athletes',
        actions: ['read'], // Pode ver lista de atletas
      },
    ];
  }

  /**
   * Permissões para admin
   */
  private getAdminPermissions(): Permission[] {
    return [
      {
        resource: 'workouts',
        actions: ['create', 'read', 'update', 'delete'],
      },
      {
        resource: 'prs',
        actions: ['read', 'delete'],
      },
      {
        resource: 'reports',
        actions: ['read'],
      },
      {
        resource: 'profile',
        actions: ['read', 'update'],
      },
      {
        resource: 'exercises',
        actions: ['create', 'read', 'update', 'delete'],
      },
      {
        resource: 'training-centers',
        actions: ['create', 'read', 'update', 'delete'],
      },
      {
        resource: 'users',
        actions: ['create', 'read', 'update', 'delete', 'change-role'],
      },
      {
        resource: 'athletes',
        actions: ['read', 'update'],
      },
      {
        resource: 'trainers',
        actions: ['read', 'create', 'update', 'delete'],
      },
    ];
  }
}

