import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { firstName, lastName, email, password, skills, careers, jobs, ventures, responses } = await req.json();

    if (!firstName || !lastName || !email || !password) {
      return new Response(JSON.stringify({ error: "All fields are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Step 1: Register
    const regRes = await fetch("https://diversai.co/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ firstName, lastName, email, password, userType: "jobseeker" }),
    });

    const regData = await regRes.json().catch(() => ({}));

    if (!regRes.ok) {
      return new Response(JSON.stringify({ error: regData.message || `Registration failed (${regRes.status})` }), {
        status: regRes.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Step 2: Send assessment data with session
    const token = regData?.token || regData?.accessToken || regData?.session?.access_token;
    const profileHeaders: Record<string, string> = { "Content-Type": "application/json" };
    if (token) {
      profileHeaders["Authorization"] = `Bearer ${token}`;
    }

    // Forward any set-cookie as cookie header
    const setCookie = regRes.headers.get("set-cookie");
    if (setCookie) {
      profileHeaders["Cookie"] = setCookie;
    }

    let profileSuccess = false;
    try {
      const profileRes = await fetch("https://diversai.co/api/onboarding/smart-profile/complete", {
        method: "POST",
        headers: profileHeaders,
        body: JSON.stringify({
          finalFormData: { skills, careers, jobs, ventures, responses },
        }),
      });
      profileSuccess = profileRes.ok;
    } catch (e) {
      console.error("Smart profile submission failed:", e);
    }

    return new Response(
      JSON.stringify({ success: true, profileSubmitted: profileSuccess, registration: regData }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("Error:", e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
