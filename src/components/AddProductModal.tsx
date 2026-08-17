import { useRef } from 'react';
import { Check, Camera, Loader2, X } from 'lucide-react';
import type { useProductForm } from '../hooks/useProductForm';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';
import { usePresence } from '../hooks/usePresence';
import { useLocaleContext } from '../contexts/LocaleContext';
import { AddProductFormFields } from './add-product/AddProductFormFields';

type ProductForm = ReturnType<typeof useProductForm>;

interface AddProductModalProps {
  form: ProductForm;
}

function ModalBody({ form }: AddProductModalProps) {
  const { t } = useLocaleContext();
  if (form.addProductMode === 'capture' && !form.isCaptureReviewReady) {
    return (
      <div className="space-y-3">
        <label className="text-sm text-gray-400">{t("addProduct.captureUpload")}</label>
        <label className="cursor-pointer flex min-h-40 w-full flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-white/15 bg-white/[0.06] backdrop-blur-sm px-5 py-8 text-center transition hover:border-[#00FF00]/60 hover:bg-white/[0.09]">
          <Camera className="h-10 w-10 text-[#00FF00]" />
          <div>
            <p className="text-sm font-semibold text-white">{t("addProduct.captureDescription")}</p>
            <p className="mt-1 text-xs text-gray-400">{t("addProduct.captureHelp")}</p>
          </div>
          <input type="file" className="hidden" accept="image/*" onChange={form.handleCaptureUpload} />
        </label>
        {form.isAutofillingFromImage ? <div className="text-xs text-[#1ED760]">{t("addProduct.analyzingImage")}</div> : null}
        {form.isAnalyzingTable ? <div className="text-xs text-orange-400">{t("addProduct.analyzingSizeTable")}</div> : null}
        {form.autoFillError ? <div className="text-xs text-red-400">{form.autoFillError}</div> : null}
      </div>
    );
  }

  return <AddProductFormFields form={form} />;
}

export function AddProductModal({ form }: AddProductModalProps) {
  const { t } = useLocaleContext();
  const modalScrollRef = useRef<HTMLDivElement | null>(null);
  const presence = usePresence(form.isModalOpen);
  useBodyScrollLock(modalScrollRef, form.isModalOpen);

  if (!presence.isMounted) return null;
  const close = () => presence.requestClose(form.closeModal);
  const submitLabel = t("addProduct.submit");
  const inlineMessage = form.submitError || (!form.isFormValid ? form.incompleteMessage : null);
  const saveSummary = form.addToDigboxOnSubmit && form.addToClosetOnSubmit
    ? t("addProduct.saveSummaryBoth")
    : form.addToClosetOnSubmit
      ? t("addProduct.saveSummaryCloset")
      : form.addToDigboxOnSubmit
        ? t("addProduct.saveSummarySaved")
        : t("addProduct.saveSummaryNone");

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="ui-layer-scrim absolute inset-0 bg-black/75" data-visible={presence.isVisible} onClick={form.isSaving ? undefined : close} />
      <div className="ui-add-product-modal ui-layer-modal ui-floating-surface bg-[linear-gradient(180deg,#1b1b1f,#121214)] rounded-3xl w-full max-w-lg shadow-[0_24px_70px_rgba(0,0,0,0.68)] overflow-hidden relative flex flex-col max-h-[90vh] border border-white/15" data-visible={presence.isVisible}>
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-[#17171a] sticky top-0 z-10 text-white">
          <h3 className="text-lg font-bold" style={{ color: '#00FF00' }}>{t("addProduct.title")}</h3>
          <button onClick={close} disabled={form.isSaving} className="p-2 hover:bg-white/[0.1] rounded-full transition text-gray-400 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"><X className="w-5 h-5" /></button>
        </div>
        <div ref={modalScrollRef} className="p-6 overflow-y-auto overscroll-contain text-white space-y-4">
          <ModalBody form={form} />
        </div>
        <div className="sticky bottom-0 border-t border-white/10 bg-[#17171a] p-6">
          <p role="status" className={`mb-3 text-xs font-medium ${inlineMessage ? 'text-amber-200' : 'text-gray-500'}`}>{inlineMessage || saveSummary}</p>
          <div className="flex justify-end gap-3">
          <button onClick={close} disabled={form.isSaving} className="px-5 py-2.5 rounded-xl text-sm font-medium text-gray-400 bg-white/[0.06] border border-white/10 hover:bg-white/[0.12] hover:text-white transition disabled:cursor-not-allowed disabled:opacity-40">{t("common.cancel")}</button>
          <button onClick={form.handleSubmitProduct} disabled={!form.isFormValid || form.isSaveComplete} className={`min-w-40 justify-center px-5 py-2.5 rounded-xl text-sm font-bold text-black transition flex items-center gap-2 ${!form.isFormValid ? 'bg-gray-700 cursor-not-allowed text-gray-500' : form.isSaveComplete ? 'bg-[#86efac] text-[#14532d]' : 'bg-orange-500 hover:bg-orange-400'}`}>
            {form.isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : form.isSaveComplete ? <Check className="w-4 h-4" /> : null}
            {form.isSaving ? t("addProduct.saving") : form.isSaveComplete ? t("addProduct.saved") : submitLabel}
          </button>
          </div>
        </div>
      </div>
    </div>
  );
}
