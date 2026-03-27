import {
  Camera,
  Globe,
  Loader2,
  Plus,
  X,
} from 'lucide-react';
import type { useProductForm } from '../hooks/useProductForm';
import { AddProductFormFields } from './add-product/AddProductFormFields';

type ProductForm = ReturnType<typeof useProductForm>;

interface AddProductModalProps {
  form: ProductForm;
}

function ModalBody({ form }: AddProductModalProps) {
  if (form.addProductMode === 'menu') {
    return (
      <div className="space-y-5">
        <button
          type="button"
          onClick={() => form.setAddProductMode('url')}
          className="flex w-full items-center justify-between rounded-2xl border border-white/10 bg-white/[0.06] backdrop-blur-sm px-5 py-5 text-left transition hover:border-orange-500/60 hover:bg-white/[0.1]"
        >
          <div>
            <p className="text-sm font-semibold text-white sm:text-base">{'\uACF5\uC2DD \uD648\uD398\uC774\uC9C0 URL\uB85C \uCD94\uAC00'}</p>
          </div>
          <Globe className="h-5 w-5 text-orange-400" />
        </button>
        <button
          type="button"
          onClick={() => form.setAddProductMode('manual')}
          className="flex w-full items-center justify-between rounded-2xl border border-white/10 bg-white/[0.06] backdrop-blur-sm px-5 py-5 text-left transition hover:border-white/20 hover:bg-white/[0.1]"
        >
          <div>
            <p className="text-sm font-semibold text-white sm:text-base">{'\uC9C1\uC811 \uCD94\uAC00'}</p>
          </div>
          <Plus className="h-5 w-5 text-gray-300" />
        </button>
      </div>
    );
  }

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
  if (!form.isModalOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={form.closeModal} />
      <div className="ui-add-product-modal bg-[linear-gradient(180deg,rgba(255,255,255,0.14),rgba(255,255,255,0.06))] backdrop-blur-2xl rounded-3xl w-full max-w-lg shadow-[0_24px_60px_rgba(0,0,0,0.5)] overflow-hidden relative flex flex-col max-h-[90vh] border border-white/10">
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-black/20 sticky top-0 z-10 text-white backdrop-blur-sm">
          <h3 className="text-lg font-bold" style={{ color: '#00FF00' }}>{'\uC0C1\uD488 \uCD94\uAC00'}</h3>
          <button onClick={form.closeModal} className="p-2 hover:bg-white/[0.1] rounded-full transition text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 overflow-y-auto text-white space-y-4">
          <ModalBody form={form} />
        </div>
        <div className="p-6 border-t border-white/10 bg-black/20 backdrop-blur-sm flex justify-end gap-3 sticky bottom-0">
          <button onClick={form.closeModal} className="px-5 py-2.5 rounded-xl text-sm font-medium text-gray-400 bg-white/[0.06] border border-white/10 hover:bg-white/[0.12] hover:text-white transition">{'\uCDE8\uC18C'}</button>
          <button onClick={form.handleSubmitProduct} disabled={!form.isFormValid} className={`px-5 py-2.5 rounded-xl text-sm font-bold text-black transition flex items-center gap-2 ${!form.isFormValid ? 'bg-gray-700 cursor-not-allowed text-gray-500' : 'hover:bg-orange-400'}`} style={!form.isFormValid ? {} : { backgroundColor: '#F97316' }}>
            {form.isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {form.isSaving ? '\uC81C\uCD9C \uC911...' : '\uC0C1\uD488 \uB4F1\uB85D\uD558\uAE30'}
          </button>
        </div>
      </div>
    </div>
  );
}
