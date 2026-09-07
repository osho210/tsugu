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

  it('浮動小数ノイズを境界判定前に正規化する', () => {
    const workload = calculateWorkload(0.1 + 0.2, 0.6);

    expect(workload).toEqual({
      status: 'available',
      percentage: 50,
    });
    expect(calculateLoadFitness(workload)).toBe(100);
  });

  it('算定割合がInfinityになる入力を拒否する', () => {
    expect(() => calculateWorkload(Number.MAX_VALUE, 1)).toThrow(
      'Calculated workload percentage must be finite.',
    );
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

  it.each([Number.POSITIVE_INFINITY, -0.0000001])(
    '不正なpercentage %s をLoad Fitnessへ渡すことを拒否する',
    (percentage) => {
      expect(() =>
        calculateLoadFitness({
          status: 'available',
          percentage,
        }),
      ).toThrow('Workload percentage must be a finite non-negative number.');
    },
  );

  it('unavailableはLoad Fitness 0にする', () => {
    expect(calculateLoadFitness({ status: 'unavailable' })).toBe(0);
  });
});
