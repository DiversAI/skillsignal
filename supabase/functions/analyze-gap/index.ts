import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { skills, target_role } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const skillList = skills.map((s: any) => `${s.name} (${s.confidence}, ${s.category})`).join(", ");

    const prompt = `You are a career intelligence analyst with deep knowledge of job market requirements and O*NET occupational data.

A user has these skills: ${skillList}

They are targeting this role: ${target_role}

Perform a detailed gap analysis:

1. Calculate a match_score (0-100) — how ready they are for this role based on their current skills
2. Identify their top strengths for this role (3-5 skills they already have that matter most)
3. Identify gaps they need to close (3-6 skills missing or weak) — for each gap provide:
   - name: specific skill name
   - importance: "critical", "important", or "nice_to_have"
   - difficulty: "easy" (weeks), "moderate" (1-3 months), or "intensive" (3-6+ months)
   - action: one specific action to start closing this gap
   - effort_estimate: human-readable estimate like "2 weeks of focused practice"
   - learn_resource: a specific free learning resource (course name + platform)
   - practice_idea: a specific practice project or exercise
   - prove_method: how to demonstrate this skill on a profile or to employers
4. Identify differentiator skills (2-3) — things they have that others applying for this role often DON'T have

Return ONLY valid JSON:
{"match_score": 67, "strengths": ["Skill 1", "Skill 2"], "gaps": [{"name": "Gap Skill", "importance": "critical", "difficulty": "moderate", "action": "Do X", "effort_estimate": "3 weeks", "learn_resource": "Course on Platform", "practice_idea": "Build X project", "prove_method": "Add to portfolio", "status": "not_started"}], "differentiators": ["Unique Skill 1"]}`;

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

    const analysis = JSON.parse(jsonStr.trim());

    return new Response(JSON.stringify(analysis), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("analyze-gap error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
