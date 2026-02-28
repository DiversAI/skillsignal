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

    const prompt = `You are a career advisor with deep knowledge of real-world job markets and O*NET skill requirements.

A user has these skills: ${skillNames}

They matched these O*NET career paths: ${careerTitles}

Generate exactly 5 realistic, specific job listings that someone with these skills could pursue RIGHT NOW. For each job:

1. Create a realistic job title and company type (don't use real company names, use descriptive types like "Mid-size SaaS Company", "Regional Healthcare Network", "Education Nonprofit")
2. Set a realistic location (can be Remote, Hybrid, or a US city)
3. List the salary range
4. Identify which of the user's existing skills directly apply (skills_matched)
5. Identify 2-4 specific skills the user would need to develop (skill_gaps) — for each gap skill, provide:
   - The skill name
   - A difficulty rating: "easy" (can learn in weeks), "moderate" (1-3 months), or "intensive" (3-6+ months)
   - One specific, actionable way to close that gap (free resources preferred)
6. Calculate a match_percentage (0-100) based on how many required skills the user already has vs total required
7. Provide the O*NET SOC code this job aligns with

Order jobs from highest match percentage to lowest. Make them diverse — mix industries, remote/in-person, and seniority levels.

Respond ONLY with valid JSON:
{"jobs": [{"title": "Job Title", "company_type": "Company Type", "location": "Location", "salary_range": "$XX,XXX - $XX,XXX", "soc_code": "XX-XXXX.XX", "match_percentage": 85, "skills_matched": ["Skill 1", "Skill 2"], "skill_gaps": [{"name": "Gap Skill", "difficulty": "easy", "action": "Take free Google course on X"}], "why_youre_ready": "One encouraging sentence about why they can do this job"}]}`;

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

    const jobs = JSON.parse(jsonStr.trim());

    return new Response(JSON.stringify(jobs), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("match-jobs error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
