import { describe, it, expect } from 'vitest';
import { InitialLambdaController } from '../initial/controllers/initial.lambda';
import { InitialHealthService } from '../initial/application/initial-health.service';

describe('InitialLambdaController', () => {
  it('should return initial health status', async () => {
    const service = new InitialHealthService();
    const controller = new InitialLambdaController(service);

    const response = await controller.getHealth();

    expect(response.status).toBe('ok');
    expect(response.framework).toBe('Aetherion');
  });
});
