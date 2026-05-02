import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function uploadVehiclePhoto(file: File, vehicleId: string): Promise<string | null> {
  const ext = file.name.split(".").pop();
  const path = `vehicles/${vehicleId}/photo.${ext}`;
  const { error } = await supabase.storage
    .from("vehicle-photos")
    .upload(path, file, { upsert: true });
  if (error) return null;
  const { data } = supabase.storage.from("vehicle-photos").getPublicUrl(path);
  return data.publicUrl;
}
