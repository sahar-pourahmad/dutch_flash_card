export function parseCSV(text, chapter) {
  const lines = text.trim().split('\n');
  return lines.slice(1)
    .map(line => splitCSVLine(line))
    .filter(fields => fields[0]?.trim())
    .map(([word, definition, example = '']) => ({
      id: `${chapter}__${word.trim()}`,
      word: word.trim(),
      definition: definition?.trim() ?? '',
      example: example?.trim() ?? '',
      chapter,
    }));
}

function splitCSVLine(line) {
  const fields = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    if (line[i] === '"') {
      inQuotes = !inQuotes;
    } else if (line[i] === ',' && !inQuotes) {
      fields.push(current);
      current = '';
    } else {
      current += line[i];
    }
  }
  fields.push(current);
  return fields;
}

export async function fetchChapter(spreadsheetId, tabName) {
  const url = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(tabName)}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to fetch "${tabName}": ${response.status}`);
  const text = await response.text();
  return parseCSV(text, tabName);
}

export async function fetchAllChapters(spreadsheetId, chapters) {
  const results = await Promise.all(
    chapters.map(ch => fetchChapter(spreadsheetId, ch))
  );
  return results.flat();
}
