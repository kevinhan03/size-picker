import { useCallback, useState } from "react";
import { useAdminProductEditor } from "./admin/useAdminProductEditor";
import { useAdminSession } from "./admin/useAdminSession";
import { useBrandRules } from "./admin/useBrandRules";
import { useInstagramProducts } from "./admin/useInstagramProducts";

interface UseAdminAuthOptions {
  isAdminPage: boolean;
  onProductMutated: () => void;
  onProductDeleted: (id: string) => void;
}

export function useAdminAuth({ isAdminPage, onProductMutated, onProductDeleted }: UseAdminAuthOptions) {
  const [adminActionError, setAdminActionError] = useState<string | null>(null);

  const brandRules = useBrandRules({
    onProductMutated,
    setAdminActionError,
  });

  const session = useAdminSession({
    isAdminPage,
    onAuthenticated: brandRules.loadBrandRules,
  });

  const editor = useAdminProductEditor({
    onProductMutated,
    onProductDeleted,
    setAdminActionError,
  });

  const instagram = useInstagramProducts({
    onProductMutated,
    setAdminActionError,
  });

  const handleAdminLogout = useCallback(async () => {
    await session.handleAdminLogout();
    editor.resetEditorState();
    brandRules.resetBrandRulesState();
    instagram.resetInstagramState();
    setAdminActionError(null);
  }, [brandRules, editor, instagram, session]);

  return {
    ...session,
    ...editor,
    ...brandRules,
    ...instagram,
    adminActionError,
    setAdminActionError,
    handleAdminLogout,
  };
}
