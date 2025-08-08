import Color from 'colorjs.io';

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

export const getGeoFill = () => {
  const bgPaint = figma.currentPage.backgrounds?.[0];
  const bgColor = bgPaint
    ? new Color("srgb", [
        bgPaint.color.r,
        bgPaint.color.g,
        bgPaint.color.b
      ])
    : new Color("white");

  const black = new Color("srgb", [0, 0, 0]);
  const white = new Color("srgb", [1, 1, 1]);

  const contrastWithBlack = bgColor.contrast(black, "APCA");
  const contrastWithWhite = bgColor.contrast(white, "APCA");

  return Math.abs(contrastWithBlack) > Math.abs(contrastWithWhite) 
    ? { r: 0, g: 0, b: 0 } 
    : { r: 1, g: 1, b: 1 };
};