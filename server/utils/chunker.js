/**
 * Text Chunking Utility
 * Splits long text into overlapping chunks for embedding
 */

const chunkText = (text, options = {}) => {
  const {
    chunkSize = 800,
    overlap = 100,
    separator = '\n\n',
  } = options;

  if (!text || text.length === 0) return [];

  // First, try splitting by paragraphs
  const paragraphs = text.split(/\n\s*\n/).filter((p) => p.trim().length > 0);

  const chunks = [];
  let currentChunk = '';
  let charOffset = 0;

  for (const paragraph of paragraphs) {
    const trimmed = paragraph.trim();

    if ((currentChunk + '\n\n' + trimmed).length > chunkSize && currentChunk.length > 0) {
      chunks.push({
        text: currentChunk.trim(),
        charStart: charOffset,
        charEnd: charOffset + currentChunk.trim().length,
      });

      // Keep overlap
      const words = currentChunk.split(' ');
      const overlapWords = words.slice(-Math.floor(overlap / 5));
      charOffset += currentChunk.length - overlapWords.join(' ').length;
      currentChunk = overlapWords.join(' ') + '\n\n' + trimmed;
    } else {
      if (currentChunk.length > 0) {
        currentChunk += '\n\n' + trimmed;
      } else {
        currentChunk = trimmed;
      }
    }
  }

  if (currentChunk.trim().length > 0) {
    chunks.push({
      text: currentChunk.trim(),
      charStart: charOffset,
      charEnd: charOffset + currentChunk.trim().length,
    });
  }

  // Handle case where single chunk is too large
  const finalChunks = [];
  for (const chunk of chunks) {
    if (chunk.text.length > chunkSize * 1.5) {
      // Split by sentences
      const sentences = chunk.text.split(/(?<=[.!?])\s+/);
      let subChunk = '';
      for (const sentence of sentences) {
        if ((subChunk + ' ' + sentence).length > chunkSize && subChunk.length > 0) {
          finalChunks.push({ ...chunk, text: subChunk.trim() });
          subChunk = sentence;
        } else {
          subChunk += (subChunk ? ' ' : '') + sentence;
        }
      }
      if (subChunk.trim().length > 0) {
        finalChunks.push({ ...chunk, text: subChunk.trim() });
      }
    } else {
      finalChunks.push(chunk);
    }
  }

  return finalChunks.map((chunk, index) => ({
    ...chunk,
    index,
  }));
};

module.exports = { chunkText };
