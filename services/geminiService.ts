import { GoogleGenAI } from "@google/genai";
import { Project } from "../types";

const SYSTEM_INSTRUCTION = `You are an expert Project Management Office (PMO) Analyst for Apjatel. 
Your job is to analyze project data provided in JSON format and produce a concise, professional Executive Summary.
Focus on:
1. Overall Portfolio Health (Progress vs Timeline).
2. Budget Utilization Risks (Spent vs Budget).
3. Critical blockers or delayed projects.
4. Actionable recommendations for the Vendor.
Keep the tone professional, objective, and constructive. Use Markdown formatting.`;

export const generateExecutiveSummary = async (projects: Project[]): Promise<string> => {
  if (!process.env.API_KEY) {
    return "API Key is missing. Please configure the environment.";
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // Prepare data for the model
    const dataContext = JSON.stringify(projects.map(p => ({
        name: p.name,
        status: p.status,
        progress: `${p.progress}%`,
        budget: p.budget,
        spent: p.spent,
        deadline: p.endDate
    })));

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Here is the current project data for this vendor: ${dataContext}. Please provide an Executive Summary.`,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.3, // Lower temperature for more factual analysis
      }
    });

    return response.text || "No summary generated.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Failed to generate Executive Summary due to an error. Please try again later.";
  }
};
