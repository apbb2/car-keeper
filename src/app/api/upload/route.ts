import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getUser } from "@/lib/supabase-server";

export async function POST(req: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const formData = await req.formData();
  const file = formData.get("file") as File;
  const vehicleId = formData.get("vehicleId") as string;

  if (!file || !vehicleId) {
    return NextResponse.json({ error: "Missing file or vehicleId" }, { status: 400 });
  }

  const ext = file.name.split(".").pop();
  const path = `vehicles/${vehicleId}/photo.${ext}`;
  const bytes = await file.arrayBuffer();

  const { error } = await supabase.storage
    .from("vehicle-photos")
    .upload(path, bytes, { contentType: file.type, upsert: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { data } = supabase.storage.from("vehicle-photos").getPublicUrl(path);
  return NextResponse.json({ url: data.publicUrl });
}
