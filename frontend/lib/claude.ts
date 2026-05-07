import { GoogleGenAI, Type } from '@google/genai'
import path from 'path'
import { GenerateResult, FixResult } from './types'

const CREDENTIALS_PATH = path.resolve(process.cwd(), '..', 'Credentials', 'google_credentials.json')
const PROJECT_ID = 'dazzling-reach-468916-b9'
const LOCATION = process.env.VERTEX_LOCATION ?? 'global'
const MODEL = process.env.GEMINI_MODEL ?? 'gemini-3.1-pro-preview'

const ai = new GoogleGenAI({
  vertexai: true,
  project: PROJECT_ID,
  location: LOCATION,
  googleAuthOptions: { keyFilename: CREDENTIALS_PATH },
})

const SYSTEM_PROMPT = `You are an expert UPSC CSE Mains answer evaluator and writer with 15+ years of experience. You help improve model answers for UPSC Civil Services Mains examination questions.

## UPSC DIRECTIVE WORDS — Expected Answer Behavior
- Discuss: Present multiple dimensions, pros/cons, balanced view
- Examine: Investigate and evaluate critically, present evidence
- Critically Examine: As above, explicitly highlight limitations/flaws
- Analyze: Break into components, explain each, show relationships
- Assess/Evaluate: Make a judgement, weigh evidence, conclude
- Comment: Briefly explain your view with reasoning
- Explain: Clarify the concept/mechanism clearly
- Describe: Give factual account, no evaluation needed
- Illustrate: Use examples to explain
- Elaborate: Expand in detail on the given point
- Justify: Defend a position with evidence
- Review: Re-examine critically, assess strengths/weaknesses
- Elucidate: Make clear, step-by-step explanation
- Enumerate: List out with brief descriptions
- Outline: Give main points without deep detail

## WORD LIMITS
- 10-marker questions: 200–220 words
- 15-marker questions: 270–300 words
These are model answers for students — stay within range, do not go under or significantly over.

## POINT COVERAGE (NON-NEGOTIABLE)
- 10-marker questions: minimum 10 distinct, substantive points
- 15-marker questions: minimum 15 distinct, substantive points
Each point must be genuinely different — no paraphrasing or repeating the same idea in different words.
Points should span diverse dimensions: historical, economic, social, political, environmental, institutional, constitutional, international — as applicable to the topic.
ALL points MUST be presented as a numbered list (1. 2. 3. ...). Never use bullet points (- or *) for the main points. Each numbered item must be on its own line.

## QUALITY STANDARDS FOR V2 ANSWERS
A V2 answer must:
1. Open with a strong hook (statistic, quote, or provocative statement)
2. Address the directive word explicitly in tone and structure
3. Cover at least 10 (10M) or 15 (15M) distinct, diverse points — this is mandatory
4. Include at least 1 recent data point (post-2022)
5. Include at least 1 relevant committee/commission/report name
6. Include at least 1 real-world example (India-specific preferred)
7. Have a conclusion that goes beyond summary — suggests a way forward
8. Stay within the word limit: 200–220 words (10M) or 270–300 words (15M)
9. Feel "enriching" to the student — they should feel they learned something

## UPSC ANSWER STYLE
- Use **bold** for key terms, reports, schemes, articles
- Use ### Sub-heading for each subpart of the question (mandatory when question has multiple parts)
- Use numbered lists (1. 2. 3.) for all points — never use bullet points (- or *) for main content
- Never be opinionated — analytical, balanced, evidence-based
- Prefer India-specific examples and current affairs (2022–2025)
- Images using markdown syntax ![alt](url) are fully permissible and encouraged where relevant — do NOT flag image inclusion as an issue in QC, and do retain or add images in V2 where they add value

## SUBPART HANDLING (MANDATORY)
If the question contains 2 or more sub-demands (e.g., "Discuss X. Also examine Y." or "What is A? How does B relate?"):
- Identify EACH subpart from the question text
- Create a ### Sub-heading for EACH subpart
- Address all numbered points for that subpart under its heading before moving to the next
- Do NOT merge or ignore any subpart — every subpart must have its own dedicated section

## MARKDOWN FORMATTING RULES (STRICTLY FOLLOW)
- Every numbered list item MUST be on its own separate line — NEVER write "6. Item 7. Item" on one line
- Use ### Heading (not **bold text**) for ALL section and sub-section headings
- Use numbered lists (1. 2. 3.) for points — never use - or * bullets for main points
- Each numbered item must start on a new line with the number, a period, and a space: "N. Text"

## OUTPUT STRUCTURE
Return exactly four keys:
1. demand_brief — structured breakdown of the question's demand
2. qc_report — quality check of the ORIGINAL V1 answer (score 0–10)
3. v2_answer — the improved answer you write
4. v2_qc_report — quality check of YOUR OWN V2 answer using the same criteria (score 0–10); be honest — flag anything still missing or improvable`

const RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    demand_brief: {
      type: Type.OBJECT,
      properties: {
        directive:    { type: Type.STRING },
        topic:        { type: Type.STRING },
        sub_demands:  { type: Type.ARRAY, items: { type: Type.STRING } },
        angle:        { type: Type.STRING },
        word_limit:   { type: Type.INTEGER },
      },
      required: ['directive', 'topic', 'sub_demands', 'angle', 'word_limit'],
    },
    qc_report: {
      type: Type.OBJECT,
      properties: {
        score:            { type: Type.INTEGER },
        issues:           { type: Type.ARRAY, items: { type: Type.STRING } },
        missing_elements: { type: Type.ARRAY, items: { type: Type.STRING } },
        strengths:        { type: Type.ARRAY, items: { type: Type.STRING } },
      },
      required: ['score', 'issues', 'missing_elements', 'strengths'],
    },
    v2_answer: { type: Type.STRING },
    v2_qc_report: {
      type: Type.OBJECT,
      properties: {
        score:            { type: Type.INTEGER },
        issues:           { type: Type.ARRAY, items: { type: Type.STRING } },
        missing_elements: { type: Type.ARRAY, items: { type: Type.STRING } },
        strengths:        { type: Type.ARRAY, items: { type: Type.STRING } },
      },
      required: ['score', 'issues', 'missing_elements', 'strengths'],
    },
  },
  required: ['demand_brief', 'qc_report', 'v2_answer', 'v2_qc_report'],
}

async function fetchGroundedFacts(question: string, subject: string): Promise<string> {
  try {
    const response = await ai.models.generateContent({
      model: MODEL,
      contents: `You are a research assistant for UPSC CSE Mains answers. For the question below, use Google Search to find the most recent and relevant facts that should appear in a high-quality answer. Focus on post-2022 data only.

Question: ${question}
Subject: ${subject}

Retrieve and list:
1. Latest statistics, data points, and figures (with year)
2. Recent government schemes, policies, and initiatives
3. Relevant committee/commission/expert body reports
4. Recent Supreme Court or High Court judgments (if applicable)
5. International agreements, treaties, or rankings
6. Recent developments, events, or changes in this area

Be specific — include exact numbers, names, and dates. Only include verifiable facts.`,
      config: {
        tools: [{ googleSearch: {} }],
      },
    })
    return response.text ?? ''
  } catch {
    return ''
  }
}

export async function generateImprovedAnswer(
  question: string,
  marks: number,
  subject: string,
  paper: string,
  year: string,
  v1Answer: string
): Promise<GenerateResult> {
  // Step 1: grounded search for latest facts (runs in parallel with nothing yet)
  const groundedFacts = await fetchGroundedFacts(question, subject)

  // Step 2: structured generation using grounded facts as context
  const response = await ai.models.generateContent({
    model: MODEL,
    contents: `Please analyze and improve the following UPSC answer.

**Question:** ${question}
**Marks:** ${marks}
**Subject:** ${subject}
**Paper:** ${paper}
**Year:** ${year}

**Requirements for V2:**
- Word limit: ${marks === 10 ? '200–220 words' : '270–300 words'}
- Minimum distinct points: ${marks === 10 ? '10' : '15'}, ALL as a numbered list (1. 2. 3. ...)
- Each point on its own line — never inline
- If the question has multiple subparts, create a ### sub-heading for EACH one and address the numbered points under it

${groundedFacts ? `**Latest Facts (from Google Search — use these to enrich V2):**\n${groundedFacts}\n` : ''}**Existing V1 Answer:**
${v1Answer}`,
    config: {
      systemInstruction: SYSTEM_PROMPT,
      responseMimeType: 'application/json',
      responseSchema: RESPONSE_SCHEMA,
      maxOutputTokens: 4096,
    },
  })

  const text = response.text
  if (!text) throw new Error('No content in Gemini response')

  return JSON.parse(text) as GenerateResult
}

const FIX_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    v2_answer: { type: Type.STRING },
    v2_qc_report: {
      type: Type.OBJECT,
      properties: {
        score:            { type: Type.INTEGER },
        issues:           { type: Type.ARRAY, items: { type: Type.STRING } },
        missing_elements: { type: Type.ARRAY, items: { type: Type.STRING } },
        strengths:        { type: Type.ARRAY, items: { type: Type.STRING } },
      },
      required: ['score', 'issues', 'missing_elements', 'strengths'],
    },
  },
  required: ['v2_answer', 'v2_qc_report'],
}

export async function applyFix(
  question: string,
  marks: number,
  currentV2: string,
  reviewerFeedback: string
): Promise<FixResult> {
  const response = await ai.models.generateContent({
    model: MODEL,
    contents: `You are improving an existing UPSC model answer based on specific reviewer feedback.

**Question:** ${question}
**Marks:** ${marks} (word limit: ${marks === 10 ? '200–220' : '270–300'} words, minimum ${marks === 10 ? '10' : '15'} distinct numbered points)

**Current V2 Answer:**
${currentV2}

**Reviewer Feedback (apply this precisely):**
${reviewerFeedback}

Apply the reviewer's feedback. Keep everything already good — only change what the feedback targets. Maintain numbered list format (1. 2. 3.) and ### sub-headings for any subparts. Then self-evaluate. Return both as JSON.`,
    config: {
      systemInstruction: SYSTEM_PROMPT,
      responseMimeType: 'application/json',
      responseSchema: FIX_SCHEMA,
      maxOutputTokens: 4096,
    },
  })

  const text = response.text
  if (!text) throw new Error('No content in Gemini response')
  return JSON.parse(text) as FixResult
}
