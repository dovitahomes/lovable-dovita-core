/**
 * Utility to create an admin user via edge function
 * This should only be used once for initial admin setup
 */

export async function createAdminUser(
  email: string,
  password: string,
  fullName: string
) {
  try {
    const response = await fetch(
      "https://bkthkotzicohjizmcmsa.supabase.co/functions/v1/create-admin-user",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
          full_name: fullName,
          secret_key: "dovita-admin-setup-2025", // Security key
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to create admin user");
    }

    const result = await response.json();
    console.log("✅ Admin user creation result:", result);
    return result;
  } catch (error) {
    console.error("❌ Error creating admin user:", error);
    throw error;
  }
}

// Quick test function - call this from browser console
(window as any).createDovitaAdmin = async () => {
  const result = await createAdminUser(
    "eugenioguca@hotmail.com",
    "Test1234$",
    "Administrador Secundario Dovita"
  );
  console.log("Result:", result);
  return result;
};
