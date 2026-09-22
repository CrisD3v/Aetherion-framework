import { ApiProperty } from '@aetherionfw/docs';
import { InitialHealth } from '../domain/initial-health.entity';

export class InitialHealthResponseDto {
  @ApiProperty({ description: 'Estado de salud del sistema', example: 'ok' })
  status!: 'ok';

  @ApiProperty({
    description: 'Mensaje descriptivo del estado',
    example: 'Aetherion framework initial template is running',
  })
  message!: string;

  @ApiProperty({ description: 'Nombre del framework', example: 'Aetherion' })
  framework!: string;

  @ApiProperty({ description: 'Versión del framework', example: '0.1.0' })
  version!: string;

  static fromEntity(entity: InitialHealth): InitialHealthResponseDto {
    const dto = new InitialHealthResponseDto();
    dto.status = entity.status;
    dto.message = entity.message;
    dto.framework = entity.framework;
    dto.version = entity.version;
    return dto;
  }
}
