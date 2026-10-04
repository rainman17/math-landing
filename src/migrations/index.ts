import * as migration_20261004_125732_initial from './20261004_125732_initial';

export const migrations = [
  {
    up: migration_20261004_125732_initial.up,
    down: migration_20261004_125732_initial.down,
    name: '20261004_125732_initial'
  },
];
