import { generateEmbedding } from './embedding';

export async function getQueryEmbedding(queryText) {
  return await generateEmbedding(queryText);
}
