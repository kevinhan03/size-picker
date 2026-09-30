import { useEffect, useRef, useState } from 'react';
import type { AddProductFormData } from '../../types';
import { runSizeExtraction, type SizeExtractionResult } from '../../api/size-extraction';
import { normalizeSizeTable, normalizeSizeTableForRegistration } from '../../utils/sizeTable';

export function useSizeExtraction(state: {
  formData: AddProductFormData;
  isModalOpen: boolean;
  setFormData: React.Dispatch<React.SetStateAction<AddProductFormData>>;
}) {
  const [sizeExtraction, setSizeExtraction] = useState<SizeExtractionResult | null>(null);
  const active = useRef<{ controller: AbortController; urls: Set<string> } | null>(null);
  useEffect(() => {
    if (active.current && (!state.isModalOpen || !active.current.urls.has(state.formData.url.trim()))) {
      active.current.controller.abort();
      active.current = null;
      setSizeExtraction(null);
    }
  }, [state.formData.url, state.isModalOpen]);
  useEffect(() => () => { active.current?.controller.abort(); }, []);
  const cancelSizeExtraction = () => {
    active.current?.controller.abort();
    active.current = null;
    setSizeExtraction(null);
  };
  const acceptCanonicalSizeUrl = (url: string) => { active.current?.urls.add(url.trim()); };
  const startSizeExtraction = (url: string, refresh = false) => {
    active.current?.controller.abort();
    const controller = new AbortController();
    active.current = { controller, urls: new Set([url.trim()]) };
    setSizeExtraction({ status: 'processing', table: null, source: null, sourceUrl: null, confidence: null });
    void runSizeExtraction(url, controller.signal, (result) => {
      if (controller.signal.aborted) return;
      setSizeExtraction(result);
      const rawTable = result.status === 'found' ? normalizeSizeTable(result.table) : null;
      if (rawTable) state.setFormData(prev => controller.signal.aborted || prev.extractedTable || prev.sizeChartImage ? prev : {
        ...prev,
        extractedTable: normalizeSizeTableForRegistration(prev.category, rawTable),
        rawExtractedTable: rawTable,
      });
    }, refresh).catch(() => {
      if (!controller.signal.aborted) setSizeExtraction({ status: 'failed', table: null, source: null, sourceUrl: null, confidence: null });
    });
  };
  return { sizeExtraction, startSizeExtraction, cancelSizeExtraction, acceptCanonicalSizeUrl };
}
