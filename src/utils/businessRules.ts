import { supabase } from "@/integrations/supabase/client";

/**
 * Helper to get the effective value of a business rule
 * Resolves in order: proyecto → sucursal → global
 */
export async function getEffectiveRule(
  key: string,
  projectId?: string | null,
  sucursalId?: string | null
): Promise<any> {
  const { data, error } = await supabase.rpc("get_effective_rule", {
    p_key: key,
    p_proyecto_id: projectId || null,
    p_sucursal_id: sucursalId || null,
  });

  if (error) {
    console.error("Error fetching rule:", error);
    return null;
  }

  return data;
}

/**
 * Helper to get a specific value from a rule's JSON
 */
export async function getEffectiveRuleValue<T = any>(
  key: string,
  jsonPath: string,
  projectId?: string | null,
  sucursalId?: string | null
): Promise<T | null> {
  const ruleJson = await getEffectiveRule(key, projectId, sucursalId);
  
  if (!ruleJson) return null;

  // Navigate through JSON path (e.g., "threshold" or "items")
  const pathParts = jsonPath.split(".");
  let value = ruleJson;
  
  for (const part of pathParts) {
    if (value && typeof value === "object" && part in value) {
      value = value[part];
    } else {
      return null;
    }
  }

  return value as T;
}

// Convenience functions for common rules
export async function getPricingVarianceThreshold(
  projectId?: string | null,
  sucursalId?: string | null
): Promise<number> {
  const threshold = await getEffectiveRuleValue<number>(
    "pricing.variance_threshold_pct",
    "threshold",
    projectId,
    sucursalId
  );
  return threshold || 0.05; // Default fallback
}

export async function getConsumptionThreshold(
  projectId?: string | null,
  sucursalId?: string | null
): Promise<number> {
  const threshold = await getEffectiveRuleValue<number>(
    "consumption.near_completion_threshold_pct",
    "threshold",
    projectId,
    sucursalId
  );
  return threshold || 0.80; // Default fallback
}

export async function getGanttDeadlineWarningDays(
  projectId?: string | null,
  sucursalId?: string | null
): Promise<number> {
  const days = await getEffectiveRuleValue<number>(
    "gantt.deadline_warning_days",
    "warning_days",
    projectId,
    sucursalId
  );
  return days || 5; // Default fallback
}

export async function getDefaultIvaEnabled(
  projectId?: string | null,
  sucursalId?: string | null
): Promise<boolean> {
  const enabled = await getEffectiveRuleValue<boolean>(
    "budget.default_iva_enabled",
    "enabled",
    projectId,
    sucursalId
  );
  return enabled !== null ? enabled : true; // Default fallback
}

export async function getAllianceCommissionPercent(
  projectId?: string | null,
  sucursalId?: string | null
): Promise<number> {
  const percent = await getEffectiveRuleValue<number>(
    "commissions.alliance.percent",
    "default_percent",
    projectId,
    sucursalId
  );
  return percent || 0.02; // Default fallback
}

export async function getCollaboratorCommissionPercent(
  type: "arquitectura" | "construccion",
  projectId?: string | null,
  sucursalId?: string | null
): Promise<number> {
  const percent = await getEffectiveRuleValue<number>(
    "commissions.collaborator.percent",
    type,
    projectId,
    sucursalId
  );
  return percent || (type === "arquitectura" ? 0.03 : 0.02); // Default fallback
}

export async function getRequiredDocuments(
  type: "arq" | "ejec",
  projectId?: string | null,
  sucursalId?: string | null
): Promise<string[]> {
  const items = await getEffectiveRuleValue<string[]>(
    `docs.required_list.${type}`,
    "items",
    projectId,
    sucursalId
  );
  return items || [];
}

export async function getAlertChannels(
  projectId?: string | null,
  sucursalId?: string | null
): Promise<{ email: boolean; in_app: boolean; whatsapp: boolean }> {
  const channels = await getEffectiveRule("alerts.channels", projectId, sucursalId);
  return channels || { email: true, in_app: true, whatsapp: false };
}

export async function isOCGroupingEnabled(
  projectId?: string | null,
  sucursalId?: string | null
): Promise<boolean> {
  const enabled = await getEffectiveRuleValue<boolean>(
    "finance.oc_grouping_enabled",
    "enabled",
    projectId,
    sucursalId
  );
  return enabled !== null ? enabled : true;
}
