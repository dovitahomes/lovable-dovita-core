import { supabase } from "@/integrations/supabase/client";

export async function getUserModulePermissions(userId: string, moduleName: string) {
  const { data, error } = await supabase
    .from("user_module_permissions")
    .select("*")
    .eq("user_id", userId)
    .eq("module_name", moduleName)
    .single();

  if (error && error.code !== "PGRST116") {
    console.error("Error fetching permissions:", error);
    return null;
  }

  return data || null;
}

export async function hasModulePermission(
  userId: string,
  moduleName: string,
  permission: "can_view" | "can_create" | "can_edit" | "can_delete"
): Promise<boolean> {
  const perms = await getUserModulePermissions(userId, moduleName);
  if (!perms) return false;
  return perms[permission] || false;
}
