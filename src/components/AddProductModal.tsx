import { useRef } from 'react';
import { Check, Camera, Loader2, X } from 'lucide-react';
import type { useProductForm } from '../hooks/useProductForm';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';
import { usePresence } from '../hooks/usePresence';
import { AddProductFormFields } from './add-product/AddProductFormFields';

type ProductForm = ReturnType<typeof useProductForm>;

interface AddProductModalProps {
  form: ProductForm;
}

function ModalBody({ form }: AddProductModalProps) {
  if (form.addProductMode === 'capture' && !form.isCaptureReviewReady) {
    return (
      <div className="space-y-3">
        <label className="text-sm text-gray-400">{'\uCEA1\uCC98 \uC774\uBBF8\uC9C0 \uC5C5\uB85C\uB4DC'}</label>
        <label className="cursor-pointer flex min-h-40 w-full flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-white/15 bg-white/[0.06] backdrop-blur-sm px-5 py-8 text-center transition hover:border-[#00FF00]/60 hover:bg-white/[0.09]">
          <Camera className="h-10 w-10 text-[#00FF00]" />
          <div>
            <p className="text-sm font-semibold text-white">{'\uCEA1\uCC98\uBCF8\uC744 \uC5C5\uB85C\uB4DC\uD558\uBA74 \uC0C1\uD488 \uC815\uBCF4\uB97C \uCD94\uCD9C\uD569\uB2C8\uB2E4.'}</p>
            <p className="mt-1 text-xs text-gray-400">{'\uBE0C\uB79C\uB4DC\uBA85, \uC0C1\uD488\uBA85, \uCE74\uD14C\uACE0\uB9AC, URL, \uC774\uBBF8\uC9C0, \uC0AC\uC774\uC988\uD45C\uB97C \uC790\uB3D9 \uBD84\uC11D\uD569\uB2C8\uB2E4.'}</p>
          </div>
          <input type="file" className="hidden" accept="image/*" onChange={form.handleCaptureUpload} />
        </label>
        {form.isAutofillingFromImage ? <div className="text-xs text-[#1ED760]">{'\uCEA1\uCC98 \uC774\uBBF8\uC9C0 AI \uBD84\uC11D \uC911...'}</div> : null}
        {form.isAnalyzingTable ? <div className="text-xs text-orange-400">{'\uC0AC\uC774\uC988\uD45C \uCD94\uCD9C \uC911...'}</div> : null}
        {form.autoFillError ? <div className="text-xs text-red-400">{form.autoFillError}</div> : null}
      </div>
    );
  }

  return <AddProductFormFields form={form} />;
}

export function AddProductModal({ form }: AddProductModalProps) {
  const modalScrollRef = useRef<HTMLDivElement | null>(null);
  const presence = usePresence(form.isModalOpen);
  useBodyScrollLock(modalScrollRef, form.isModalOpen);

  if (!presence.isMounted) return null;
  const close = () => presence.requestClose(form.closeModal);
  const submitLabel = form.addToDigboxOnSubmit && form.addToClosetOnSubmit
    ? '상품 등록 및 2곳에 저장'
    : form.addToClosetOnSubmit
      ? '내 옷장에 추가'
      : form.addToDigboxOnSubmit
        ? '찜 목록에 추가'
        : '상품 등록하기';
  const inlineMessage = form.submitError || (!form.isFormValid ? form.incompleteMessage : null);

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="ui-layer-scrim absolute inset-0 bg-black/75" data-visible={presence.isVisible} onClick={form.isSaving ? undefined : close} />
      <div className="ui-add-product-modal ui-layer-modal ui-floating-surface bg-[linear-gradient(180deg,#1b1b1f,#121214)] rounded-3xl w-full max-w-lg shadow-[0_24px_70px_rgba(0,0,0,0.68)] overflow-hidden relative flex flex-col max-h-[90vh] border border-white/15" data-visible={presence.isVisible}>
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-[#17171a] sticky top-0 z-10 text-white">
          <h3 className="text-lg font-bold" style={{ color: '#00FF00' }}>{'\uC0C1\uD488 \uCD94\uAC00'}</h3>
          <button onClick={close} disabled={form.isSaving} className="p-2 hover:bg-white/[0.1] rounded-full transition text-gray-400 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"><X className="w-5 h-5" /></button>
        </div>
        <div ref={modalScrollRef} className="p-6 overflow-y-auto overscroll-contain text-white space-y-4">
          <ModalBody form={form} />
        </div>
        <div className="sticky bottom-0 border-t border-white/10 bg-[#17171a] p-6">
          {inlineMessage ? <p role="status" className="mb-3 text-xs font-medium text-amber-200">{inlineMessage}</p> : null}
          <div className="flex justify-end gap-3">
          <button onClick={close} disabled={form.isSaving} className="px-5 py-2.5 rounded-xl text-sm font-medium text-gray-400 bg-white/[0.06] border border-white/10 hover:bg-white/[0.12] hover:text-white transition disabled:cursor-not-allowed disabled:opacity-40">{'\uCDE8\uC18C'}</button>
          <button onClick={form.handleSubmitProduct} disabled={!form.isFormValid || form.isSaveComplete} className={`min-w-40 justify-center px-5 py-2.5 rounded-xl text-sm font-bold text-black transition flex items-center gap-2 ${!form.isFormValid ? 'bg-gray-700 cursor-not-allowed text-gray-500' : form.isSaveComplete ? 'bg-[#86efac] text-[#14532d]' : 'bg-orange-500 hover:bg-orange-400'}`}>
            {form.isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : form.isSaveComplete ? <Check className="w-4 h-4" /> : null}
            {form.isSaving ? '저장 중…' : form.isSaveComplete ? '저장됨' : submitLabel}
          </button>
          </div>
        </div>
      </div>
    </div>
  );
}
