import { useProductFormAutofill } from "./product-form/useProductFormAutofill";
import { useProductFormState } from "./product-form/useProductFormState";
import { useProductFormSubmit } from "./product-form/useProductFormSubmit";

interface UseProductFormOptions {
  productUrlSet: Set<string>;
  onSubmitSuccess: () => void;
}

export function useProductForm({ productUrlSet, onSubmitSuccess }: UseProductFormOptions) {
  const state = useProductFormState();

  const autofill = useProductFormAutofill({ state, productUrlSet });

  const submit = useProductFormSubmit({ state, onSubmitSuccess });

  return {
    ...state,
    ...autofill,
    ...submit,
  };
}
