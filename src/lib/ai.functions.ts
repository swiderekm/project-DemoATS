import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const AssessInput = z
  .object({
    cvText: z.string().optional(),
    fileName: z.string().optional(),
    fileData: z.string().optional(), // data:application/pdf;base64,...
    jobTitle: z.string().optional(),
    jobDescription: z.string().optional(),
  })
  .refine((d) => (d.cvText && d.cvText.trim().length >= 20) || !!d.fileData, {
    message: "Ingen CV-text eller fil angiven.",
  });

export const assessCv = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => AssessInput.parse(input))
  .handler(async ({ data }) => {
    const apiKey = process.env["OPENAI_API_KEY"];
    if (!apiKey) throw new Error("AI är inte konfigurerad.");

    const prompt = [
      "Du är en rekryterare. Bedöm kandidatens CV kort och sakligt på svenska.",
      data.jobTitle ? `Roll: ${data.jobTitle}` : "",
      data.jobDescription ? `Jobbeskrivning: ${data.jobDescription}` : "",
      data.cvText && data.cvText.trim() ? `CV:\n${data.cvText.slice(0, 12000)}` : "CV finns i bifogad fil.",
      "",
      "Svara med: 1) Betyg 1-10, 2) tre styrkor, 3) tre risker/luckor, 4) en rekommendation (gå vidare / avvakta / avslag). Max 180 ord.",
    ]
      .filter(Boolean)
      .join("\n");

    const content: Array<Record<string, unknown>> = [{ type: "input_text", text: prompt }];
    if (data.fileData) {
      if (data.fileData.startsWith("data:application/pdf")) {
        content.push({
          type: "input_file",
          filename: data.fileName ?? "cv.pdf",
          file_data: data.fileData,
        });
      } else if (data.fileData.startsWith("data:image/")) {
        content.push({ type: "input_image", image_url: data.fileData });
      }
    }

    const res = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        input: [{ role: "user", content }],
      }),
    });

    const json = await res.json().catch(() => null);

    if (!res.ok) {
      const apiMessage = json?.error?.message as string | undefined;
      if (res.status === 429) throw new Error("För många förfrågningar, försök igen strax.");
      if (res.status === 402) throw new Error("AI-krediter är slut. Kontrollera din OpenAI-fakturering.");
      if (res.status === 401) throw new Error("Ogiltig API-nyckel för OpenAI.");
      throw new Error(apiMessage ? `AI-fel: ${apiMessage}` : `AI-fel (${res.status}).`);
    }

    if (json?.status === "failed" || json?.status === "incomplete") {
      const reason = json?.incomplete_details?.reason || json?.error?.message || "okänd anledning";
      throw new Error(`AI kunde inte slutföra bedömningen (${reason}).`);
    }

    // Prefer the SDK-style convenience field; fall back to walking the output array.
    let text: string = json?.output_text ?? "";
    if (!text && Array.isArray(json?.output)) {
      for (const item of json.output) {
        if (item?.type === "refusal" && item?.refusal) {
          throw new Error(`AI vägrade bedöma CV:t: ${item.refusal}`);
        }
        if (Array.isArray(item?.content)) {
          for (const part of item.content) {
            if (part?.type === "output_text" && typeof part?.text === "string") {
              text += part.text;
            }
          }
        }
      }
    }

    return { assessment: text.trim() || "AI hann inte producera någon bedömning. Försök igen." };
  });