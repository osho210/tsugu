const WORKLOAD_PERCENTAGE_DECIMALS = 6;

/**
 * TeamごとのWorkload運用閾値。
 */
export type WorkloadPolicy = {
  target: number;
  warning: number;
  limit: number;
};

/**
 * Workload算定結果。稼働可能時間がない状態を数値で偽装しない。
 */
export type WorkloadResult =
  | {
      status: 'available';
      percentage: number;
    }
  | {
      status: 'unavailable';
    };

/**
 * Product Source of Truthで定義されたMVP初期Workload閾値。
 */
export const INITIAL_WORKLOAD_POLICY: WorkloadPolicy = {
  target: 80,
  warning: 90,
  limit: 100,
};

/**
 * Team Workload Policyの閾値関係を検証する。
 *
 * @throws Target / Warning / Limitが非負かつ昇順でない場合。
 */
export function validateWorkloadPolicy(policy: WorkloadPolicy): void {
  const values = [policy.target, policy.warning, policy.limit];

  if (values.some((value) => !Number.isFinite(value) || value < 0)) {
    throw new Error('Workload thresholds must be finite non-negative numbers.');
  }

  if (!(policy.target < policy.warning && policy.warning <= policy.limit)) {
    throw new Error('Workload thresholds must satisfy target < warning <= limit.');
  }
}

/**
 * 予測負荷時間を稼働可能時間に対する割合へ変換する。
 * percentageは浮動小数ノイズを避けるため小数6桁へ正規化する。
 *
 * @throws 時間が負数・非有限値、または算定割合が非有限値の場合。
 */
export function calculateWorkload(
  predictedWorkloadHours: number,
  availableHours: number,
): WorkloadResult {
  if (
    !Number.isFinite(predictedWorkloadHours) ||
    !Number.isFinite(availableHours) ||
    predictedWorkloadHours < 0 ||
    availableHours < 0
  ) {
    throw new Error('Workload hours must be finite non-negative numbers.');
  }

  if (availableHours === 0) {
    return { status: 'unavailable' };
  }

  const rawPercentage = (predictedWorkloadHours / availableHours) * 100;

  if (!Number.isFinite(rawPercentage)) {
    throw new Error('Calculated workload percentage must be finite.');
  }

  return {
    status: 'available',
    percentage: normalizePercentage(rawPercentage),
  };
}

/**
 * WorkloadをProduct初期bandに基づく0..100のLoad Fitnessへ変換する。
 */
export function calculateLoadFitness(workload: WorkloadResult): number {
  if (workload.status === 'unavailable') {
    return 0;
  }

  const percentage = normalizePercentage(workload.percentage);

  if (!Number.isFinite(percentage) || percentage < 0) {
    throw new Error('Workload percentage must be a finite non-negative number.');
  }

  if (percentage <= 50) {
    return 100;
  }

  if (percentage <= 70) {
    return 80;
  }

  if (percentage <= 85) {
    return 50;
  }

  if (percentage <= 100) {
    return 20;
  }

  return 0;
}

function normalizePercentage(value: number): number {
  return Number(value.toFixed(WORKLOAD_PERCENTAGE_DECIMALS));
}
