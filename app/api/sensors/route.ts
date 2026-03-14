import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const includeEquipment = req.nextUrl.searchParams.get("include_equipment") === "true";

  const query = includeEquipment
    ? "id, equipment_id, tag_name, unit, description, created_at, equipment(name)"
    : "id, equipment_id, tag_name, unit, description, created_at";

  const { data, error } = await supabaseServer.from("sensors").select(query).order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}

export async function POST(req: NextRequest) {
  const body = await req.json();

  if (!body?.equipment_id || !body?.tag_name || !body?.unit) {
    return NextResponse.json({ error: "equipment_id, tag_name, and unit are required" }, { status: 400 });
  }

  const payload = {
    equipment_id: String(body.equipment_id),
    tag_name: String(body.tag_name),
    unit: String(body.unit),
    description: body.description ? String(body.description) : null
  };

  const { data, error } = await supabaseServer.from("sensors").insert(payload).select("*").single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ data }, { status: 201 });
}
