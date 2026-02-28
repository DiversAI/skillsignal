import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { skills, careers } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const skillNames = skills.map((s: { name: string }) => s.name).join(", ");
    const careerTitles = careers.map((c: { title: string; soc_code: string }) => `${c.title} (${c.soc_code})`).join(", ");

    const prompt = `You are an entrepreneurship advisor who helps non-traditional founders turn their skills into viable businesses.

A user has these skills: ${skillNames}

They matched these O*NET career paths: ${careerTitles}

Generate exactly 5 realistic entrepreneur/business venture ideas that someone with these skills could pursue. For each venture:

1. Create a specific, compelling venture name and a one-line pitch
2. Categorize the business model: "Service-Based", "Product-Based", "Digital/Online", "Freelance/Consulting", or "Social Enterprise"
3. Estimate startup cost range: "Under $500", "$500-$2K", "$2K-$10K", or "$10K+"
4. Estimate time to first revenue: "1-2 weeks", "1-3 months", or "3-6 months"
5. Identify which of the user's existing skills directly apply (skills_matched)
6. Identify 2-3 specific skills/resources the user would need to develop (skill_gaps) — for each:
   - The skill or resource name
   - A difficulty rating: "easy" (can learn in weeks), "moderate" (1-3 months), or "intensive" (3-6+ months)
   - One specific, actionable way to get started (free resources preferred)
7. Calculate a readiness_percentage (0-100) based on how ready they are to start this venture TODAY
8. Provide 2-3 concrete first steps to launch

Order ventures from highest readiness percentage to lowest. Make them diverse — mix business models, investment levels, and scales.

Respond ONLY with valid JSON:
{"ventures": [{"name": "Venture Name", "pitch": "One-line pitch", "model": "Service-Based", "startup_cost": "Under $500", "time_to_revenue": "1-3 months", "readiness_percentage": 85, "skills_matched": ["Skill 1", "Skill 2"], "skill_gaps": [{"name": "Gap Skill", "difficulty": "easy", "action": "Take free course on X"}], "first_steps": ["Step 1", "Step 2", "Step 3"], "why_youre_ready": "One encouraging sentence about why they can do this"}]}`;

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

    const ventures = JSON.parse(jsonStr.trim());

    return new Response(JSON.stringify(ventures), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("match-ventures error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
