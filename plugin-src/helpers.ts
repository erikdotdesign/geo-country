export const cleanSvgPathData = (d: string): string => {
  // Remove commas
  let cleaned = d.replace(/,/g, ' ');

  // Collapse multiple spaces
  cleaned = cleaned.replace(/\s+/g, ' ').trim();

  // Ensure space between commands and numbers (e.g. L10 10 becomes L 10 10)
  cleaned = cleaned.replace(/([A-Za-z])/g, ' $1 ').trim();

  return cleaned;
};

export const splitIntoSubpaths = (path: string): string[] => {
  return path
    .split(/(?=M)/) // Split before every 'M' command
    .map(s => s.trim())
    .filter(Boolean);
};