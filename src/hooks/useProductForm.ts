import type { ClosetSizeSelection } from "../types";
import { useProductFormAutofill } from "./product-form/useProductFormAutofill";
import { useProductFormState } from "./product-form/useProductFormState";
import { useProductFormSubmit } from "./product-form/useProductFormSubmit";

interface UseProductFormOptions {
  productUrlSet: Set<string>;
  onSubmitSuccess: () => void;
  onAddToDigbox?: (productId: string) => Promise<void>;
  onAddToCloset?: (productId: string, sizeSelection?: ClosetSizeSelection | null) => Promise<void>;
}

export function useProductForm({
  productUrlSet,
  onSubmitSuccess,
  onAddToDigbox,
  onAddToCloset,
}: UseProductFormOptions) {
  const state = useProductFormState();

  const autofill = useProductFormAutofill({ state, productUrlSet });

  const submit = useProductFormSubmit({ state, onSubmitSuccess, onAddToDigbox, onAddToCloset });

  return {
    ...state,
    ...autofill,
    ...submit,
  };
}
