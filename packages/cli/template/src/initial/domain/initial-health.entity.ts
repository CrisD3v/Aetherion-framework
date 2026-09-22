export class InitialHealth {
  constructor(
    readonly status: 'ok',
    readonly message: string,
    readonly framework: string,
    readonly version: string,
  ) {}
}
