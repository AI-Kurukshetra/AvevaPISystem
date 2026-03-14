import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export async function GET() {
  const { data, error } = await supabaseServer
    .from("sites")
    .select("id, name, areas(id, name, production_lines(id, name, equipment(id, name)))")
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const type = body?.type;
  const payload = body?.payload;

  const tableMap: Record<string, string> = {
    site: "sites",
    area: "areas",
    line: "production_lines",
    equipment: "equipment"
  };

  const table = tableMap[type];
  if (!table) {
    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  }

  const parentRequirements: Record<string, string> = {
    area: "site_id",
    line: "area_id",
    equipment: "production_line_id"
  };

  const parentKey = parentRequirements[type];
  if (!payload?.name || (parentKey && !payload?.[parentKey])) {
    return NextResponse.json({ error: "Missing required fields for selected type" }, { status: 400 });
  }

  const { data, error } = await supabaseServer.from(table).insert(payload).select("*").single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ data }, { status: 201 });
}
