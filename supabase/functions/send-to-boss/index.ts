import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface Applicant {
  name: string;
  age: number | null;
  experienceYears: number | null;
  resumeUrl: string | null;
}

interface SendToBossRequest {
  bossEmail: string;
  jobTitle: string;
  companyName: string;
  optionalMessage?: string;
  shortlistedApplicants: Applicant[];
}

const generateApplicantRow = (applicant: Applicant, index: number): string => {
  const resumeLink = applicant.resumeUrl 
    ? `<a href="${applicant.resumeUrl}" target="_blank" style="color: #2563eb; text-decoration: underline;">View Resume</a>`
    : 'No resume';
  
  return `
    <tr style="border-bottom: 1px solid #e5e7eb;">
      <td style="padding: 12px; text-align: left;">${index + 1}</td>
      <td style="padding: 12px; text-align: left;">${applicant.name}</td>
      <td style="padding: 12px; text-align: center;">${applicant.age ?? 'N/A'}</td>
      <td style="padding: 12px; text-align: center;">${applicant.experienceYears ?? 0} years</td>
      <td style="padding: 12px; text-align: center;">${resumeLink}</td>
    </tr>
  `;
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      bossEmail, 
      jobTitle, 
      companyName, 
      optionalMessage, 
      shortlistedApplicants 
    }: SendToBossRequest = await req.json();

    console.log(`Sending shortlisted candidates to boss: ${bossEmail}`);
    console.log(`Job: ${jobTitle}, Applicants count: ${shortlistedApplicants.length}`);

    if (!bossEmail || !jobTitle || !shortlistedApplicants.length) {
      throw new Error("Missing required fields: bossEmail, jobTitle, or shortlistedApplicants");
    }

    const applicantRows = shortlistedApplicants
      .map((applicant, index) => generateApplicantRow(applicant, index))
      .join('');

    const optionalMessageHtml = optionalMessage 
      ? `<div style="background-color: #f3f4f6; padding: 16px; border-radius: 8px; margin-bottom: 24px;">
           <strong>Message from HR:</strong>
           <p style="margin: 8px 0 0 0;">${optionalMessage}</p>
         </div>`
      : '';

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Shortlisted Candidates</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #1e40af; color: white; padding: 24px; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0; font-size: 24px;">Shortlisted Candidates for ${jobTitle}</h1>
          <p style="margin: 8px 0 0 0; opacity: 0.9;">${companyName}</p>
        </div>
        
        <div style="background-color: #ffffff; padding: 24px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
          ${optionalMessageHtml}
          
          <p style="margin-bottom: 16px;">
            Please find below the list of <strong>${shortlistedApplicants.length}</strong> shortlisted candidate(s) for your review:
          </p>
          
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
            <thead>
              <tr style="background-color: #f9fafb;">
                <th style="padding: 12px; text-align: left; border-bottom: 2px solid #e5e7eb;">#</th>
                <th style="padding: 12px; text-align: left; border-bottom: 2px solid #e5e7eb;">Name</th>
                <th style="padding: 12px; text-align: center; border-bottom: 2px solid #e5e7eb;">Age</th>
                <th style="padding: 12px; text-align: center; border-bottom: 2px solid #e5e7eb;">Experience</th>
                <th style="padding: 12px; text-align: center; border-bottom: 2px solid #e5e7eb;">Resume</th>
              </tr>
            </thead>
            <tbody>
              ${applicantRows}
            </tbody>
          </table>
          
          <p style="color: #6b7280; font-size: 14px;">
            This email was sent by the HR team at ${companyName}.
          </p>
        </div>
      </body>
      </html>
    `;

    const emailResponse = await resend.emails.send({
      from: `${companyName} Hiring <onboarding@resend.dev>`,
      to: [bossEmail],
      subject: `Shortlisted Candidates for ${jobTitle}`,
      html: emailHtml,
    });

    console.log("Email sent successfully to boss:", emailResponse);

    return new Response(
      JSON.stringify({ success: true, emailResponse }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-to-boss function:", error);
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
