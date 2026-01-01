export function needsSemanticSearch(question) {
  const q = question.toLowerCase();

  // 🔹 factual / list
  if (
    q.includes("status") ||
    q.includes("daftar") ||
    q.includes("list") ||
    q.includes("berapa") ||
    q.includes("hari ini") ||
    q.includes("open")
  ) {
    return false;
  }

  // 🔹 reasoning / vague
  return true;
}
