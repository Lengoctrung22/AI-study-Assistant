/**
 * Robust JSON extractor from LLM text output.
 * Handles markdown code fences, leading conversational text, and trailing commentary.
 *
 * @param {string} rawText Raw output from LLM
 * @param {any} fallback Fallback value if parsing fails completely
 * @returns {any} Parsed JSON object or array
 */
function extractJson(rawText, fallback = null) {
  if (!rawText || typeof rawText !== 'string') {
    return fallback;
  }

  // 1. First, strip markdown fences if clean
  let cleaned = rawText.trim();
  cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();

  // Try direct parse first
  try {
    return JSON.parse(cleaned);
  } catch (initialErr) {
    // Continue to extraction
  }

  // 1.1 Try extracting from markdown code fences anywhere in text
  const fenceMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fenceMatch) {
    try {
      return JSON.parse(fenceMatch[1].trim());
    } catch (e) {}
  }

  // 2. Try to locate outermost JSON array [...]
  const arrayMatch = cleaned.match(/\[\s*\{[\s\S]*\}\s*\]/);
  if (arrayMatch) {
    try {
      return JSON.parse(arrayMatch[0]);
    } catch (e) {}
  }

  // 3. Try to locate outermost JSON object {...}
  const objectMatch = cleaned.match(/\{[\s\S]*\}/);
  if (objectMatch) {
    try {
      return JSON.parse(objectMatch[0]);
    } catch (e) {}
  }

  // 4. Try more permissive array match
  const generalArrayMatch = cleaned.match(/\[[\s\S]*\]/);
  if (generalArrayMatch) {
    try {
      return JSON.parse(generalArrayMatch[0]);
    } catch (e) {}
  }

  if (fallback !== null) {
    return fallback;
  }

  throw new Error(`Không thể bóc tách cấu trúc JSON hợp lệ từ phản hồi AI: ${cleaned.substring(0, 120)}...`);
}

module.exports = {
  extractJson,
};
