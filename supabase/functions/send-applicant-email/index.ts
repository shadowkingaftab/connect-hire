import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  applicationId: string;
  applicantName: string;
  applicantEmail: string;
  jobTitle: string;
  status: string;
  companyName: string;
}

const getEmailContent = (status: string, applicantName: string, jobTitle: string, companyName: string) => {
  switch (status) {
    case 'shortlisted':
      return {
        subject: `Congratulations! You've been shortlisted for ${jobTitle}`,
        html: `
          <h1>Great News, ${applicantName}!</h1>
          <p>We're pleased to inform you that your application for <strong>${jobTitle}</strong> at <strong>${companyName}</strong> has been shortlisted.</p>
          <p>Our team was impressed with your profile and we would like to move forward with the next steps in the hiring process.</p>
          <p>Please expect to hear from us soon regarding the interview schedule.</p>
          <br>
          <p>Best regards,<br>The ${companyName} Team</p>
        `,
      };
    case 'rejected':
      return {
        subject: `Application Update for ${jobTitle}`,
        html: `
          <h1>Dear ${applicantName},</h1>
          <p>Thank you for your interest in the <strong>${jobTitle}</strong> position at <strong>${companyName}</strong>.</p>
          <p>After careful consideration, we have decided to move forward with other candidates whose experience more closely matches our current needs.</p>
          <p>We appreciate the time you invested in applying and encourage you to apply for future positions that match your qualifications.</p>
          <br>
          <p>Best wishes,<br>The ${companyName} Team</p>
        `,
      };
    case 'selected':
      return {
        subject: `Congratulations! You've been selected for ${jobTitle}`,
        html: `
          <h1>Congratulations, ${applicantName}!</h1>
          <p>We're thrilled to inform you that you have been selected for the <strong>${jobTitle}</strong> position at <strong>${companyName}</strong>!</p>
          <p>Your skills and experience stood out among all applicants, and we're excited to have you join our team.</p>
          <p>Our HR team will be in touch shortly with the offer details and next steps.</p>
          <br>
          <p>Welcome aboard!<br>The ${companyName} Team</p>
        `,
      };
    default:
      return {
        subject: `Application Update for ${jobTitle}`,
        html: `
          <h1>Dear ${applicantName},</h1>
          <p>This is an update regarding your application for <strong>${jobTitle}</strong> at <strong>${companyName}</strong>.</p>
          <p>Your application status has been updated to: <strong>${status}</strong></p>
          <br>
          <p>Best regards,<br>The ${companyName} Team</p>
        `,
      };
  }
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { applicationId, applicantName, applicantEmail, jobTitle, status, companyName }: EmailRequest = await req.json();

    console.log(`Sending email to ${applicantEmail} for application ${applicationId}, status: ${status}`);

    const { subject, html } = getEmailContent(status, applicantName, jobTitle, companyName);

    const emailResponse = await resend.emails.send({
      from: `${companyName} <onboarding@resend.dev>`,
      to: [applicantEmail],
      subject,
      html,
    });

    console.log("Email sent successfully:", emailResponse);

    // Update application status in database
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { error: updateError } = await supabase
      .from("job_applications")
      .update({ status })
      .eq("id", applicationId);

    if (updateError) {
      console.error("Error updating application status:", updateError);
      throw updateError;
    }

    console.log("Application status updated successfully");

    return new Response(
      JSON.stringify({ success: true, emailResponse }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-applicant-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
