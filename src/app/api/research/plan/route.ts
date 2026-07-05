import { NextResponse } from "next/server";
import { generateResearchPlan } from "@/lib/research/hypothesis-engine";
import type { ResearchTemplateId } from "@/lib/research/types";
import { RESEARCH_TEMPLATES } from "@/lib/research/templates";

export const dynamic = "force-dynamic";

const VALID_IDS = new Set(RESEARCH_TEMPLATES.map((t) => t.id));

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { question?: string; templateId?: string };
    const question = body.question?.trim() ?? "";
    const templateId = (body.templateId ?? "differential_expression") as ResearchTemplateId;

    if (question.length < 10) {
      return NextResponse.json(
        { error: "Please enter a research question or finding (at least 10 characters)." },
        { status: 400 }
      );
    }

    if (!VALID_IDS.has(templateId)) {
      return NextResponse.json({ error: "Invalid research template." }, { status: 400 });
    }

    const plan = await generateResearchPlan({ question, templateId });
    return NextResponse.json(plan);
  } catch (err) {
    console.error("[research/plan]", err);
    return NextResponse.json({ error: "Failed to generate research plan." }, { status: 500 });
  }
}
