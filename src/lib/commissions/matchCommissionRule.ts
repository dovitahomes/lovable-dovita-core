import { supabase } from "@/integrations/supabase/client";
import { CommissionRule } from "@/hooks/useCommissionRules";

interface MatchRuleParams {
  alianzaId?: string | null;
  projectType?: string | null;
  product?: string | null;
}

/**
 * Matches commission rules with intelligent prioritization:
 * 1. Alliance-specific + project type + product
 * 2. Alliance-specific + project type
 * 3. Global + project type + product
 * 4. Global + project type
 * 5. Fallback to alliance's default percentage
 */
export async function matchCommissionRule(
  params: MatchRuleParams
): Promise<{ rule: CommissionRule | null; percent: number | null }> {
  const { alianzaId, projectType, product } = params;

  // Fetch all active rules
  const { data: rules, error } = await supabase
    .from("commission_rules")
    .select("*")
    .eq("active", true)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching commission rules:", error);
    return { rule: null, percent: null };
  }

  if (!rules || rules.length === 0) {
    // No rules found, fallback to alliance default
    if (alianzaId) {
      const { data: alianza } = await supabase
        .from("alianzas")
        .select("comision_porcentaje")
        .eq("id", alianzaId)
        .eq("activa", true)
        .single();

      if (alianza) {
        return { rule: null, percent: alianza.comision_porcentaje };
      }
    }
    return { rule: null, percent: null };
  }

  // Priority 1: Alliance-specific + project type + product
  if (alianzaId && projectType && product) {
    const match = rules.find(
      (r) =>
        r.alianza_id === alianzaId &&
        r.project_type === projectType &&
        r.product === product
    );
    if (match) return { rule: match as CommissionRule, percent: match.percent };
  }

  // Priority 2: Alliance-specific + project type
  if (alianzaId && projectType) {
    const match = rules.find(
      (r) =>
        r.alianza_id === alianzaId &&
        r.project_type === projectType &&
        !r.product
    );
    if (match) return { rule: match as CommissionRule, percent: match.percent };
  }

  // Priority 3: Global + project type + product
  if (projectType && product) {
    const match = rules.find(
      (r) =>
        !r.alianza_id &&
        r.project_type === projectType &&
        r.product === product
    );
    if (match) return { rule: match as CommissionRule, percent: match.percent };
  }

  // Priority 4: Global + project type
  if (projectType) {
    const match = rules.find(
      (r) => !r.alianza_id && r.project_type === projectType && !r.product
    );
    if (match) return { rule: match as CommissionRule, percent: match.percent };
  }

  // Priority 5: Fallback to alliance default percentage
  if (alianzaId) {
    const { data: alianza } = await supabase
      .from("alianzas")
      .select("comision_porcentaje")
      .eq("id", alianzaId)
      .eq("activa", true)
      .single();

    if (alianza) {
      return { rule: null, percent: alianza.comision_porcentaje };
    }
  }

  return { rule: null, percent: null };
}

/**
 * Get readable description of rule priority/scope
 */
export function getRuleScopeDescription(rule: CommissionRule): string {
  if (rule.alianza_id) {
    if (rule.project_type && rule.product) {
      return "Alianza específica + Tipo + Producto";
    }
    if (rule.project_type) {
      return "Alianza específica + Tipo proyecto";
    }
    return "Alianza específica";
  }

  if (rule.project_type && rule.product) {
    return "Global: Tipo + Producto";
  }
  if (rule.project_type) {
    return "Global: Tipo proyecto";
  }
  return "Global";
}
