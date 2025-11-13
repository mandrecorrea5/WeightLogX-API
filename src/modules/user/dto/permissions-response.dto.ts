import { ApiProperty } from '@nestjs/swagger';

export class PermissionDto {
  @ApiProperty({
    description: 'Recurso (resource)',
    example: 'workouts',
  })
  resource: string;

  @ApiProperty({
    description: 'Ações permitidas',
    example: ['create', 'read', 'update', 'delete'],
    type: [String],
  })
  actions: string[];
}

export class PermissionsResponseDto {
  @ApiProperty({
    description: 'Role do usuário',
    example: 'atleta',
  })
  role: string;

  @ApiProperty({
    description: 'Lista de permissões',
    type: [PermissionDto],
  })
  permissions: PermissionDto[];
}
