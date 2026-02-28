import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { skills } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const skillList = skills.map((s: { name: string }) => s.name).join(", ");

    const prompt = `You are a career counselor with expert knowledge of the O*NET occupational database maintained by the U.S. Department of Labor.

Given these skills: ${skillList}

Suggest 5-8 career paths that align well with this skill set. For each career, provide:
- The official O*NET occupation title
- The O*NET SOC code (e.g. "13-1161.00")
- A brief explanation of why their skills match
- Typical salary range (US median)
- Growth outlook (e.g. "Faster than average", "Much faster than average", "Average")
- Whether it's a "Bright Outlook" occupation per O*NET

Include a mix of traditional and non-traditional career paths. Prioritize roles accessible to non-traditional candidates (no strict degree requirements where possible).

Respond ONLY with valid JSON in this exact format:
{"careers": [{"title": "Occupation Title", "soc_code": "XX-XXXX.XX", "match_reason": "Why their skills match", "salary_range": "$XX,XXX - $XX,XXX", "growth": "Faster than average", "bright_outlook": true, "education": "Typical entry education level"}]}`;

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

    let jsonStr = content;
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) jsonStr = jsonMatch[1];

    const careers = JSON.parse(jsonStr.trim());

    return new Response(JSON.stringify(careers), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("suggest-careers error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
