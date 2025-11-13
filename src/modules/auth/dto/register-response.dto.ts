import { ApiProperty } from '@nestjs/swagger';
import { VerificationMethod } from '../enums/verification-method.enum';

export class RegisterResponseDto {
  @ApiProperty({ example: 'Registro pendente de confirmação.' })
  message: string;

  @ApiProperty({ description: 'Identificador da verificação', format: 'uuid' })
  verificationId: string;

  @ApiProperty({
    description: 'Canal utilizado para envio do código',
    enum: VerificationMethod,
  })
  verificationMethod: VerificationMethod;

  @ApiProperty({
    description: 'Destino do código (email ou telefone sem máscara)',
  })
  target: string;
}
