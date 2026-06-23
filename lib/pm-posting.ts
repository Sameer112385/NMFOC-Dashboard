import type { DailyUpdate, RevenueWBS } from '@/lib/types';
import { clampPercent, safeNumber } from '@/lib/utils';

export function getMaterialPendingCost(update: Pick<DailyUpdate, 'pending_material_cost' | 'material_sap_posted'>) {
  return update.material_sap_posted ? 0 : safeNumber(update.pending_material_cost);
}

export function getSubcontractPendingCost(
  update: Pick<DailyUpdate, 'pending_subcontractor_cost' | 'subcontract_sap_posted'>,
) {
  return update.subcontract_sap_posted ? 0 : safeNumber(update.pending_subcontractor_cost);
}

export function getManpowerPendingCost(update: Pick<DailyUpdate, 'pending_manpower_cost' | 'manpower_sap_posted'>) {
  return update.manpower_sap_posted ? 0 : safeNumber(update.pending_manpower_cost);
}

export function getEffectivePendingCost(
  update: Pick<
    DailyUpdate,
    | 'pending_material_cost'
    | 'pending_subcontractor_cost'
    | 'pending_manpower_cost'
    | 'material_sap_posted'
    | 'subcontract_sap_posted'
    | 'manpower_sap_posted'
  >,
) {
  return (
    getMaterialPendingCost(update) +
    getSubcontractPendingCost(update) +
    getManpowerPendingCost(update)
  );
}

export function getPostingSummary(update: Pick<DailyUpdate, 'material_sap_posted' | 'subcontract_sap_posted' | 'manpower_sap_posted'>) {
  return {
    material: update.material_sap_posted ? 'Posted in SAP' : 'Still Simulating',
    subcontract: update.subcontract_sap_posted ? 'Posted in SAP' : 'Still Simulating',
    manpower: update.manpower_sap_posted ? 'Posted in SAP' : 'Still Simulating',
  };
}

export function buildRevenueSimulationPatch(
  revenueRow: Pick<RevenueWBS, 'sap_actual_cost' | 'sap_planned_cost' | 'prrevpl000' | 'sap_earned_revenue'>,
  updates: Array<
    Pick<
      DailyUpdate,
      | 'pending_material_cost'
      | 'pending_subcontractor_cost'
      | 'pending_manpower_cost'
      | 'material_sap_posted'
      | 'subcontract_sap_posted'
      | 'manpower_sap_posted'
    >
  >,
) {
  const aggregatePendingCost = updates.reduce((sum, item) => sum + getEffectivePendingCost(item), 0);
  const simulatedActualCost = safeNumber(revenueRow.sap_actual_cost) + aggregatePendingCost;
  const rawSimulatedPocPercent =
    safeNumber(revenueRow.sap_planned_cost) > 0
      ? (simulatedActualCost / safeNumber(revenueRow.sap_planned_cost)) * 100
      : 0;
  const clampedSimulatedPoc = clampPercent(rawSimulatedPocPercent);
  const revenueValue = Math.abs(safeNumber(revenueRow.prrevpl000));
  const simulatedRevenue = (clampedSimulatedPoc / 100) * revenueValue;

  return {
    pm_pending_cost: aggregatePendingCost,
    simulated_actual_cost: simulatedActualCost,
    simulated_poc_percent: clampedSimulatedPoc,
    simulated_revenue: simulatedRevenue,
    revenue_difference: simulatedRevenue - safeNumber(revenueRow.sap_earned_revenue),
    status: rawSimulatedPocPercent > 100 ? 'Overrun' : rawSimulatedPocPercent > 0 ? 'Increasing' : 'Stable',
  };
}
