import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { gaps, target_role, existing_skills } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const gapList = gaps.map((g: any) => `${g.name} (${g.importance}, ${g.difficulty})`).join(", ");
    const skillList = existing_skills.join(", ");

    const prompt = `You are a career coach creating a personalized learning path.

Target role: ${target_role}
Existing skills: ${skillList}
Gaps to close: ${gapList}

Create a prioritized learning path. Rank gaps by: impact on getting hired × inverse of effort to close (high impact + low effort = first priority).

For each gap, create a learning step with:
- skill_name: the gap skill
- why_it_matters: one sentence on why this matters for ${target_role}
- effort_estimate: realistic time estimate (e.g. "2 weeks of focused practice")
- learn: { title: specific free resource name, url: URL to the resource, type: "course" | "tutorial" | "documentation" }
- practice: a specific project idea or exercise to build this skill
- prove: how to demonstrate this skill on a DiversAI profile or to employers

Return ONLY valid JSON:
{"steps": [{"skill_name": "Skill Name", "why_it_matters": "One sentence", "effort_estimate": "2 weeks", "learn": {"title": "Course Name on Platform", "url": "https://...", "type": "course"}, "practice": "Build X project", "prove": "Add to portfolio with link", "status": "not_started"}]}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI usage limit reached." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    let jsonStr = content;
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) jsonStr = jsonMatch[1];

    const path = JSON.parse(jsonStr.trim());

    return new Response(JSON.stringify(path), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-learning-path error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
