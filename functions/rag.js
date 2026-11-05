const CHUNK_SIZE = 1400;
const CHUNK_OVERLAP = 180;

const STOP_WORDS = new Set([
  "a", "an", "and", "are", "as", "at", "be", "but", "by", "can", "could",
  "did", "do", "does", "for", "from", "had", "has", "have", "how", "i",
  "if", "in", "into", "is", "it", "its", "may", "me", "my", "of", "on",
  "or", "our", "please", "should", "so", "than", "that", "the", "their",
  "them", "there", "these", "they", "this", "those", "to", "was", "we",
  "were", "what", "when", "where", "which", "who", "why", "will", "with",
  "would", "you", "your",
]);

function tokenize(value) {
  return String(value || "")
    .normalize("NFKC")
    .toLowerCase()
    .match(/[\p{L}\p{N}]+/gu)
    ?.filter((word) => word.length > 1 && !STOP_WORDS.has(word)) || [];
}

function getSearchTerms(value) {
  return [...new Set(tokenize(value))];
}

function segmentsFromText(text) {
  let section = "Document";
  let lines = [];
  const segments = [];

  const flush = () => {
    const content = lines.join("\n").trim();
    if (content) segments.push({ section, text: content });
    lines = [];
  };

  String(text || "").split(/\r?\n/).forEach((line) => {
    const heading = line.match(/^\s{0,3}#{1,6}\s+(.+?)\s*#*\s*$/);
    if (heading) {
      flush();
      section = heading[1].trim();
    } else if (line.trim()) {
      lines.push(line);
    } else {
      flush();
    }
  });

  flush();
  return segments;
}

function chunkSegments(segments) {
  const groupedSegments = [];
  segments.forEach((segment) => {
    const text = String(segment.text || "").trim();
    if (!text) return;

    const previous = groupedSegments[groupedSegments.length - 1];
    if (previous && previous.section === segment.section) {
      previous.text += `\n${text}`;
    } else {
      groupedSegments.push({ section: segment.section || "Document", text });
    }
  });

  const chunks = [];
  groupedSegments.forEach(({ section, text }) => {
    let start = 0;
    while (start < text.length) {
      let end = Math.min(start + CHUNK_SIZE, text.length);
      if (end < text.length) {
        const breakAt = Math.max(
          text.lastIndexOf("\n", end),
          text.lastIndexOf(" ", end)
        );
        if (breakAt > start + CHUNK_SIZE * 0.6) end = breakAt;
      }

      const content = text.slice(start, end).trim();
      if (content) {
        chunks.push({
          chunkIndex: chunks.length,
          content,
          section,
          keywords: [...new Set(tokenize(content))].slice(0, 120),
        });
      }

      if (end >= text.length) break;
      start = Math.max(start + 1, end - CHUNK_OVERLAP);
    }
  });

  return chunks;
}

function rankChunks(chunks, question, limit = 6) {
  const queryTerms = getSearchTerms(question);
  if (!queryTerms.length) return [];

  const normalizedQuestion = String(question || "")
    .normalize("NFKC")
    .toLowerCase()
    .trim();

  return chunks
    .map((chunk) => {
      const keywords = new Set(chunk.keywords || tokenize(chunk.content));
      const matchedTerms = queryTerms.filter((term) => keywords.has(term));
      if (!matchedTerms.length) return null;

      const normalizedContent = String(chunk.content || "")
        .normalize("NFKC")
        .toLowerCase();
      const phraseMatch = normalizedQuestion.length > 3
        && normalizedContent.includes(normalizedQuestion);

      return {
        ...chunk,
        score: matchedTerms.length / queryTerms.length + (phraseMatch ? 0.5 : 0),
      };
    })
    .filter((chunk) => chunk && chunk.score >= 0.2)
    .sort((first, second) => second.score - first.score)
    .slice(0, limit);
}

module.exports = {
  chunkSegments,
  getSearchTerms,
  rankChunks,
  segmentsFromText,
  tokenize,
};
