import {
  LambdaController,
  Handle,
  Route,
  IamPermissions,
} from '@aetherion/core';
import {
  ApiTag,
  ApiOperation,
  ApiResponse,
} from '@aetherion/docs';
import { InitialHealthService } from '../application/initial-health.service';
import { InitialHealthResponseDto } from '../dto/initial-health.response.dto';
import initialIamPermissions from '../infra/iam/initial.permissions.json';

@ApiTag('Initial', 'Template inicial de salud del framework Aetherion')
@LambdaController({
  lambdaName: 'initial-api',
  runtime: 'nodejs22.x',
  memorySize: 128,
  timeout: 5,
})
export class InitialLambdaController {
  constructor(private readonly health: InitialHealthService) {}

  @Handle()
  @Route({ method: 'GET', path: '/initial/health' })
  @IamPermissions(initialIamPermissions.initialHealth)
  @ApiOperation({
    summary: 'Health check inicial',
    description: 'Devuelve el estado básico del framework Aetherion (template inicial).',
  })
  @ApiResponse({
    status: 200,
    description: 'Health OK',
    type: InitialHealthResponseDto,
  })
  async getHealth(): Promise<InitialHealthResponseDto> {
    const health = this.health.getHealth();
    return InitialHealthResponseDto.fromEntity(health);
  }
}
