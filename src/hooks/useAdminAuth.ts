import { useCallback, useState } from "react";
import { useAdminProductEditor } from "./admin/useAdminProductEditor";
import { useAdminSession } from "./admin/useAdminSession";
import { useBrandRules } from "./admin/useBrandRules";

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

  const handleAdminLogout = useCallback(async () => {
    await session.handleAdminLogout();
    editor.resetEditorState();
    brandRules.resetBrandRulesState();
    setAdminActionError(null);
  }, [brandRules, editor, session]);

  return {
    ...session,
    ...editor,
    ...brandRules,
    adminActionError,
    setAdminActionError,
    handleAdminLogout,
  };
}
