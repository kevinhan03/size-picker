import { stripHtml } from "../product-metadata/html.js";
import {
  collectTextBlocksFromJsonData,
  extractSizeTableFromHtmlTables,
  extractSizeTableFromJsonData,
  extractSizeTableFromPlainText,
} from "./parsers.js";
import {
  alignAndValidateSizeTableByOptionLabels,
  extractOptionSizeLabelsFromHtml,
  scoreSizeTableCandidate,
} from "./validation.js";

export {
  alignAndValidateSizeTableByOptionLabels,
  collectTextBlocksFromJsonData,
  extractOptionSizeLabelsFromHtml,
};

export const extractSizeTableFromPage = ({ html, textBlocks = [], jsonData = null }) => {
  let bestTable = null;
  let bestScore = -1;

  const consider = (table, bonus = 0) => {
    if (!table) return;
    const score = scoreSizeTableCandidate(table);
    if (score < 0) return;
    const weightedScore = score + bonus;
    if (weightedScore > bestScore) {
      bestScore = weightedScore;
      bestTable = table;
    }
  };

  consider(extractSizeTableFromHtmlTables(html), 2);
  consider(extractSizeTableFromJsonData(jsonData), 0);

  for (const block of textBlocks) {
    consider(extractSizeTableFromPlainText(stripHtml(block)), 1);
  }

  consider(extractSizeTableFromPlainText(stripHtml(html)), 1);
  return bestTable;
};
