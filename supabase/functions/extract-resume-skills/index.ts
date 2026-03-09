import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { text, file_base64, file_type } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    let resumeContent = text || "";

    // For base64 files, we'll send the raw text extracted from base64
    if (file_base64 && !text) {
      // Decode base64 to get raw text (simplified — works for txt-like content)
      try {
        const decoded = atob(file_base64);
        resumeContent = decoded;
      } catch {
        resumeContent = "Resume content provided as file upload. Please extract skills from the available context.";
      }
    }

    if (!resumeContent.trim()) {
      return new Response(JSON.stringify({ error: "No resume content provided" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const prompt = `You are a career intelligence analyst. Extract the verified skills from this resume — focus on what this person can actually DO, not their job titles or credentials.

Categorize as: Technical Skills, Soft Skills, Tools & Platforms, Domain Knowledge.

For each skill note: confidence level based on evidence in resume (high/medium/emerging).

Be specific — not "communication" but "cross-functional stakeholder management". Not "coding" but "Python data analysis".

Return ONLY valid JSON in this exact format:
{"technical": [{"skill": "Specific Skill Name", "confidence": "high"}], "soft": [{"skill": "Specific Skill Name", "confidence": "medium"}], "tools": [{"skill": "Specific Tool Name", "confidence": "high"}], "domain": [{"skill": "Specific Domain", "confidence": "emerging"}]}

Resume content:
${resumeContent.substring(0, 8000)}`;

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

    const skills = JSON.parse(jsonStr.trim());

    return new Response(JSON.stringify({ skills }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("extract-resume-skills error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
