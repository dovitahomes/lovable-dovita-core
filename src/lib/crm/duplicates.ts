import { supabase } from "@/integrations/supabase/client";

export interface DuplicateLead {
  id: string;
  nombre_completo: string;
  email: string;
  telefono: string;
  status: string;
  presupuesto_referencia: number | null;
  created_at: string;
  similarity_score: number;
  match_reasons: string[];
}

interface DetectDuplicatesParams {
  nombre_completo?: string;
  email?: string;
  telefono?: string;
  excludeId?: string;
}

/**
 * Detecta leads duplicados basándose en múltiples criterios:
 * - Email exacto (100% match)
 * - Teléfono exacto (100% match)
 * - Nombre similar (fuzzy match >70%)
 * - Combinación de nombre + email/teléfono
 */
export async function detectDuplicates({
  nombre_completo,
  email,
  telefono,
  excludeId,
}: DetectDuplicatesParams): Promise<DuplicateLead[]> {
  const duplicates: DuplicateLead[] = [];
  
  // 1. Buscar por email exacto
  if (email?.trim()) {
    let query = supabase
      .from('leads')
      .select('*')
      .ilike('email', email.trim());
    
    if (excludeId) {
      query = query.neq('id', excludeId);
    }

    const { data: emailMatches } = await query;

    if (emailMatches && emailMatches.length > 0) {
      emailMatches.forEach(lead => {
        duplicates.push({
          ...lead,
          similarity_score: 100,
          match_reasons: ['Email idéntico'],
        });
      });
    }
  }

  // 2. Buscar por teléfono exacto (sin formateo)
  if (telefono?.trim()) {
    const cleanPhone = telefono.replace(/\D/g, ''); // Remover no-dígitos
    if (cleanPhone.length >= 10) {
      let query = supabase
        .from('leads')
        .select('*')
        .ilike('telefono', `%${cleanPhone.slice(-10)}%`); // Últimos 10 dígitos
      
      if (excludeId) {
        query = query.neq('id', excludeId);
      }

      const { data: phoneMatches } = await query;

      if (phoneMatches && phoneMatches.length > 0) {
        phoneMatches.forEach(lead => {
          // Evitar duplicar si ya se encontró por email
          if (!duplicates.find(d => d.id === lead.id)) {
            duplicates.push({
              ...lead,
              similarity_score: 100,
              match_reasons: ['Teléfono idéntico'],
            });
          } else {
            // Agregar razón adicional si ya existe
            const existing = duplicates.find(d => d.id === lead.id);
            if (existing && !existing.match_reasons.includes('Teléfono idéntico')) {
              existing.match_reasons.push('Teléfono idéntico');
            }
          }
        });
      }
    }
  }

  // 3. Buscar por nombre similar (fuzzy match)
  if (nombre_completo?.trim()) {
    const searchName = nombre_completo.trim().toLowerCase();
    let query = supabase
      .from('leads')
      .select('*');
    
    if (excludeId) {
      query = query.neq('id', excludeId);
    }

    const { data: nameMatches } = await query;

    if (nameMatches && nameMatches.length > 0) {
      nameMatches.forEach(lead => {
        if (duplicates.find(d => d.id === lead.id)) return; // Ya encontrado

        const leadName = (lead.nombre_completo || '').toLowerCase();
        const similarity = calculateStringSimilarity(searchName, leadName);

        // Threshold de 70% de similitud
        if (similarity >= 70) {
          duplicates.push({
            ...lead,
            similarity_score: similarity,
            match_reasons: [`Nombre similar (${similarity}%)`],
          });
        }
      });
    }
  }

  // Ordenar por similarity_score descendente
  return duplicates.sort((a, b) => b.similarity_score - a.similarity_score);
}

/**
 * Calcula similitud entre dos strings usando Levenshtein distance
 * Retorna un porcentaje de 0-100
 */
function calculateStringSimilarity(str1: string, str2: string): number {
  if (!str1 || !str2) return 0;
  if (str1 === str2) return 100;

  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;

  if (longer.length === 0) return 100;

  const distance = levenshteinDistance(longer, shorter);
  const similarity = ((longer.length - distance) / longer.length) * 100;

  return Math.round(similarity);
}

/**
 * Implementación de Levenshtein Distance
 * Calcula el número mínimo de ediciones (inserciones, eliminaciones, sustituciones)
 * necesarias para transformar una string en otra
 */
function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }

  return matrix[str2.length][str1.length];
}

/**
 * Hook de React para detectar duplicados
 */
export function useDetectDuplicates() {
  return {
    detectDuplicates,
  };
}
