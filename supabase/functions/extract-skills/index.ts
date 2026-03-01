import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { responses } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const prompt = `You are a career skills analyst. A user has answered three reflection prompts about their lived experience. Analyze their responses and extract 5-10 concrete, workforce-relevant skills.

For each skill:
- Give a short, professional skill name (e.g. "Project Management", "Cross-functional Communication", "Community Organizing")
- Write one sentence explaining how their experience demonstrates this skill

Respond ONLY with valid JSON in this exact format:
{"skills": [{"name": "Skill Name", "evidence": "One sentence explanation"}]}

Here are their responses:

PROMPT 1 - What they've built/created/made happen:
${responses[0]}

PROMPT 2 - What people come to them for:
${responses[1]}

PROMPT 3 - Challenge they overcame:
${responses[2]}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI usage limit reached. Please add credits." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI analysis failed" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";
    
    // Extract JSON from response (handle markdown code blocks)
    let jsonStr = content;
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) jsonStr = jsonMatch[1];
    
    const parsed = JSON.parse(jsonStr.trim());
    
    // Normalize: handle flat array of alternating [name, evidence, name, evidence, ...]
    let skillsArray = parsed.skills || parsed;
    if (Array.isArray(skillsArray) && skillsArray.length > 0 && typeof skillsArray[0] === "string") {
      const normalized = [];
      for (let i = 0; i < skillsArray.length - 1; i += 2) {
        normalized.push({ name: skillsArray[i], evidence: skillsArray[i + 1] });
      }
      skillsArray = normalized;
    }

    return new Response(JSON.stringify({ skills: skillsArray }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("extract-skills error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
