import {
  calculateLoadFitness,
  calculateWorkload,
  INITIAL_WORKLOAD_POLICY,
  validateWorkloadPolicy,
} from './workload-policy';

describe('WorkloadPolicy', () => {
  describe('Policy validation', () => {
    describe('正常系', () => {
      it('初期値が80/90/100の場合、有効なPolicyであること', () => {
        expect(() => validateWorkloadPolicy(INITIAL_WORKLOAD_POLICY)).not.toThrow();
      });
    });

    describe('異常系', () => {
      it('targetがwarning以上の場合、日本語のvalidation errorになること', () => {
        expect(() =>
          validateWorkloadPolicy({
            target: 90,
            warning: 90,
            limit: 100,
          }),
        ).toThrow('Workload閾値はtarget < warning <= limitを満たす必要があります。');
      });
    });
  });

  describe('Workload calculation', () => {
    describe('正常系', () => {
      it('32h / 40hの場合、available 80%であること', () => {
        expect(calculateWorkload(32, 40)).toEqual({
          status: 'available',
          percentage: 80,
        });
      });

      it('浮動小数ノイズを含む50%の場合、percentage 50かつLoad Fitness 100であること', () => {
        const workload = calculateWorkload(0.1 + 0.2, 0.6);

        expect(workload).toEqual({
          status: 'available',
          percentage: 50,
        });
        expect(calculateLoadFitness(workload)).toBe(100);
      });

      it('availableHoursが0の場合、unavailableであること', () => {
        expect(calculateWorkload(8, 0)).toEqual({
          status: 'unavailable',
        });
      });
    });

    describe('異常系', () => {
      it('算定割合がInfinityになる場合、日本語のvalidation errorになること', () => {
        expect(() => calculateWorkload(Number.MAX_VALUE, 1)).toThrow(
          '算定したWorkload percentageは有限値である必要があります。',
        );
      });
    });
  });

  describe('Load Fitness', () => {
    describe('正常系', () => {
      it.each([
        [50, 100],
        [50.01, 80],
        [70, 80],
        [70.01, 50],
        [85, 50],
        [85.01, 20],
        [100, 20],
        [100.01, 0],
      ])('Workloadが%s%%の場合、Load Fitnessが%sであること', (percentage, expected) => {
        expect(
          calculateLoadFitness({
            status: 'available',
            percentage,
          }),
        ).toBe(expected);
      });

      it('Workloadがunavailableの場合、Load Fitnessが0であること', () => {
        expect(calculateLoadFitness({ status: 'unavailable' })).toBe(0);
      });
    });

    describe('異常系', () => {
      it.each([Number.POSITIVE_INFINITY, -0.0000001])(
        'percentageが%sの場合、日本語のvalidation errorになること',
        (percentage) => {
          expect(() =>
            calculateLoadFitness({
              status: 'available',
              percentage,
            }),
          ).toThrow('Workload percentageは有限の0以上の数値である必要があります。');
        },
      );
    });
  });
});
