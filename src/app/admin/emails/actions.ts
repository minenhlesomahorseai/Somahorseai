"use server";

import { revalidatePath } from "next/cache";

import { isAdminUser } from "@/lib/auth/admin";
import { retryEmailDelivery } from "@/lib/email";
import { createClient } from "@/lib/supabase/server";

export async function retryDelivery(formData: FormData): Promise<void> {
  const deliveryId = String(formData.get("deliveryId") ?? "");
  if (!deliveryId) throw new Error("Invalid email delivery");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!(await isAdminUser(supabase, user))) throw new Error("Not authorized");

  const result = await retryEmailDelivery(deliveryId);
  if (!result.sent && result.error) throw new Error(result.error);
  revalidatePath("/admin/emails");
  revalidatePath("/admin");
}

