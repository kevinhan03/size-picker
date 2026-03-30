import { useState } from "react";
import type { ChangeEvent } from "react";
import type { AdminEditForm, Product, SizeTable } from "../../types";
import { extractSizeTableFromImage, uploadSubmissionImage } from "../../api";
import { readFileAsDataUrl, resizeImage } from "../../utils/image";

interface UseAdminProductEditorOptions {
  onProductMutated: () => void;
  onProductDeleted: (id: string) => void;
  setAdminActionError: (message: string | null) => void;
}

export function useAdminProductEditor({
  onProductMutated,
  onProductDeleted,
  setAdminActionError,
}: UseAdminProductEditorOptions) {
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [adminEditForm, setAdminEditForm] = useState<AdminEditForm>({
    brand: "",
    name: "",
    category: "",
    url: "",
  });
  const [adminImagePath, setAdminImagePath] = useState<string | null>(null);
  const [adminImagePreview, setAdminImagePreview] = useState("");
  const [adminProductPhotoFile, setAdminProductPhotoFile] = useState<File | null>(null);
  const [adminSizeChartImage, setAdminSizeChartImage] = useState<string | null>(null);
  const [adminExtractedTable, setAdminExtractedTable] = useState<SizeTable | null>(null);
  const [isAdminAnalyzingTable, setIsAdminAnalyzingTable] = useState(false);
  const [isAdminActionLoading, setIsAdminActionLoading] = useState(false);

  const startProductEdit = (product: Product) => {
    setEditingProductId(product.id);
    setAdminEditForm({
      brand: product.brand,
      name: product.name,
      category: product.category === "Uncategorized" ? "" : product.category,
      url: product.url,
    });
    setAdminImagePath(product.imagePath ?? null);
    setAdminImagePreview(product.image);
    setAdminProductPhotoFile(null);
    setAdminSizeChartImage(null);
    setAdminExtractedTable(product.sizeTable ?? null);
    setAdminActionError(null);
  };

  const cancelEdit = () => {
    setEditingProductId(null);
    setAdminActionError(null);
    setAdminProductPhotoFile(null);
    setAdminSizeChartImage(null);
  };

  const handleAdminFileUpload = (event: ChangeEvent<HTMLInputElement>, type: "product" | "chart") => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (type === "product") {
      void (async () => {
        const dataUrl = await readFileAsDataUrl(file);
        setAdminProductPhotoFile(file);
        setAdminImagePreview(dataUrl);
      })();
      return;
    }

    void (async () => {
      const dataUrl = await readFileAsDataUrl(file);
      const optimizedDataUrl = await resizeImage(dataUrl, 1600);
      const optimizedBase64 = optimizedDataUrl.split(",")[1] || "";
      setAdminSizeChartImage(optimizedDataUrl);
      setIsAdminAnalyzingTable(true);
      try {
        const tableData = await extractSizeTableFromImage(optimizedBase64, "image/png");
        setAdminExtractedTable(tableData);
      } catch (extractError: unknown) {
        const message = extractError instanceof Error ? extractError.message : "Size table extraction failed.";
        setAdminActionError(`사이즈표 추출에 실패했습니다: ${message}`);
      } finally {
        setIsAdminAnalyzingTable(false);
      }
    })();
  };

  const handleAdminUpdateProduct = async (id: string) => {
    if (!adminEditForm.brand.trim() || !adminEditForm.name.trim()) {
      setAdminActionError("브랜드명과 상품명은 비워둘 수 없습니다.");
      return;
    }

    setIsAdminActionLoading(true);
    try {
      let nextImagePath = adminImagePath;
      if (adminProductPhotoFile) {
        nextImagePath = await uploadSubmissionImage(adminProductPhotoFile);
        setAdminImagePath(nextImagePath);
      }

      const response = await fetch(`/api/admin/products/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          brand: adminEditForm.brand.trim(),
          name: adminEditForm.name.trim(),
          category: adminEditForm.category || null,
          url: adminEditForm.url || null,
          imagePath: nextImagePath,
          sizeTable: adminExtractedTable,
        }),
      });
      const payload = await response.json();
      if (!response.ok || !payload?.ok) {
        throw new Error(payload?.error || "상품 수정에 실패했습니다.");
      }

      setEditingProductId(null);
      setAdminProductPhotoFile(null);
      setAdminSizeChartImage(null);
      onProductMutated();
      setAdminActionError(null);
    } catch (updateError: unknown) {
      const message = updateError instanceof Error ? updateError.message : "상품 수정에 실패했습니다.";
      setAdminActionError(message);
    } finally {
      setIsAdminActionLoading(false);
    }
  };

  const handleAdminDeleteProduct = async (id: string) => {
    if (!window.confirm("이 상품을 삭제하시겠습니까?")) return;

    setIsAdminActionLoading(true);
    try {
      const response = await fetch(`/api/admin/products/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const payload = await response.json();
      if (!response.ok || !payload?.ok) {
        throw new Error(payload?.error || "상품 삭제에 실패했습니다.");
      }

      onProductDeleted(id);
      onProductMutated();
      setAdminActionError(null);
    } catch (deleteError: unknown) {
      const message = deleteError instanceof Error ? deleteError.message : "상품 삭제에 실패했습니다.";
      setAdminActionError(message);
    } finally {
      setIsAdminActionLoading(false);
    }
  };

  const resetEditorState = () => {
    setEditingProductId(null);
    setAdminProductPhotoFile(null);
    setAdminSizeChartImage(null);
  };

  return {
    editingProductId,
    setEditingProductId,
    adminEditForm,
    setAdminEditForm,
    adminImagePreview,
    adminSizeChartImage,
    adminExtractedTable,
    setAdminExtractedTable,
    isAdminAnalyzingTable,
    isAdminActionLoading,
    startProductEdit,
    cancelEdit,
    handleAdminFileUpload,
    handleAdminUpdateProduct,
    handleAdminDeleteProduct,
    resetEditorState,
  };
}
