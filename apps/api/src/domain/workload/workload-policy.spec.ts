import {
  calculateLoadFitness,
  calculateWorkload,
  INITIAL_WORKLOAD_POLICY,
  validateWorkloadPolicy,
} from './workload-policy';

describe('WorkloadPolicy', () => {
  it('初期値80/90/100を有効なPolicyとして扱う', () => {
    expect(() => validateWorkloadPolicy(INITIAL_WORKLOAD_POLICY)).not.toThrow();
  });

  it('Target >= Warningを拒否する', () => {
    expect(() =>
      validateWorkloadPolicy({
        target: 90,
        warning: 90,
        limit: 100,
      }),
    ).toThrow('Workload thresholds must satisfy target < warning <= limit.');
  });

  it('40h中32hの予測負荷を80%として算定する', () => {
    expect(calculateWorkload(32, 40)).toEqual({
      status: 'available',
      percentage: 80,
    });
  });

  it('availableHours 0をunavailableとして扱う', () => {
    expect(calculateWorkload(8, 0)).toEqual({
      status: 'unavailable',
    });
  });

  it.each([
    [50, 100],
    [50.01, 80],
    [70, 80],
    [70.01, 50],
    [85, 50],
    [85.01, 20],
    [100, 20],
    [100.01, 0],
  ])('Workload %s%% のLoad Fitnessを%sにする', (percentage, expected) => {
    expect(
      calculateLoadFitness({
        status: 'available',
        percentage,
      }),
    ).toBe(expected);
  });

  it('unavailableはLoad Fitness 0にする', () => {
    expect(calculateLoadFitness({ status: 'unavailable' })).toBe(0);
  });
});
