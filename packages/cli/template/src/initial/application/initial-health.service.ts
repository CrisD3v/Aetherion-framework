import { Injectable } from '@aetherion/core';
import { InitialHealth } from '../domain/initial-health.entity';

@Injectable()
export class InitialHealthService {
  getHealth(): InitialHealth {
    return new InitialHealth(
      'ok',
      'Aetherion framework initial template is running',
      'Aetherion',
      '0.1.0',
    );
  }
}
