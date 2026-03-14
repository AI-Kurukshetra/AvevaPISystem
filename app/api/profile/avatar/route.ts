import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { supabaseServer } from "@/lib/supabase/server";

const bucketName = "profile-images";
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

function extensionFromFilename(name: string) {
  const ext = name.split(".").pop()?.toLowerCase();
  if (!ext) return "png";
  if (!/^[a-z0-9]+$/.test(ext)) return "png";
  return ext;
}

async function ensureBucket() {
  const { data: buckets, error: listError } = await supabaseServer.storage.listBuckets();
  if (listError) {
    return listError.message;
  }

  const exists = buckets.some((bucket) => bucket.name === bucketName || bucket.id === bucketName);
  if (exists) {
    return null;
  }

  const { error: createError } = await supabaseServer.storage.createBucket(bucketName, {
    public: true,
    fileSizeLimit: 5 * 1024 * 1024,
    allowedMimeTypes: ["image/png", "image/jpeg", "image/webp", "image/gif"]
  });

  return createError?.message ?? null;
}

export async function POST(req: Request) {
  const form = await req.formData();
  const file = form.get("file");
  const userId = form.get("userId");
  const accessToken = form.get("accessToken");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "File is required." }, { status: 400 });
  }

  if (typeof userId !== "string" || !userId.trim()) {
    return NextResponse.json({ error: "userId is required." }, { status: 400 });
  }

  if (typeof accessToken !== "string" || !accessToken.trim()) {
    return NextResponse.json({ error: "accessToken is required." }, { status: 401 });
  }

  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ error: "Only image files are allowed." }, { status: 400 });
  }

  const authClient = createClient(supabaseUrl, anonKey);
  const { data: authData, error: authError } = await authClient.auth.getUser(accessToken);
  if (authError || !authData.user) {
    return NextResponse.json({ error: "Invalid session." }, { status: 401 });
  }

  if (authData.user.id !== userId) {
    return NextResponse.json({ error: "Unauthorized upload target." }, { status: 403 });
  }

  const bucketError = await ensureBucket();
  if (bucketError) {
    return NextResponse.json({ error: bucketError }, { status: 500 });
  }

  const ext = extensionFromFilename(file.name);
  const path = `${userId}/avatar-${Date.now()}.${ext}`;
  const bytes = new Uint8Array(await file.arrayBuffer());

  const upload = await supabaseServer.storage.from(bucketName).upload(path, bytes, {
    contentType: file.type,
    upsert: true,
    cacheControl: "3600"
  });

  if (upload.error) {
    return NextResponse.json({ error: upload.error.message }, { status: 500 });
  }

  const { data } = supabaseServer.storage.from(bucketName).getPublicUrl(path);
  return NextResponse.json({ publicUrl: data.publicUrl });
}
