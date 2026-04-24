import { useEffect, useState } from "react";
import type { ChangeEvent } from "react";
import type { AdminEditForm, SizeTable } from "../../types";
import { extractSizeTableFromImage, uploadSubmissionImage } from "../../api";
import { readFileAsDataUrl, resizeImage } from "../../utils/image";
import { CATEGORY_OPTIONS } from "../../constants";

interface UseInstagramProductsOptions {
  onProductMutated: () => void;
  setAdminActionError: (message: string | null) => void;
}

export function useInstagramProducts({
  onProductMutated,
  setAdminActionError,
}: UseInstagramProductsOptions) {
  const [instagramForm, setInstagramForm] = useState<AdminEditForm>({
    brand: "",
    name: "",
    category: CATEGORY_OPTIONS[0] ?? "",
    url: "",
  });
  const [instagramImagePath, setInstagramImagePath] = useState<string | null>(null);
  const [instagramImagePreview, setInstagramImagePreview] = useState("");
  const [instagramProductPhotoFile, setInstagramProductPhotoFile] = useState<File | null>(null);
  const [instagramSizeChartImage, setInstagramSizeChartImage] = useState<string | null>(null);
  const [instagramExtractedTable, setInstagramExtractedTable] = useState<SizeTable | null>(null);
  const [isInstagramLoading, setIsInstagramLoading] = useState(false);
  const [isInstagramAnalyzing, setIsInstagramAnalyzing] = useState(false);
  const [instagramProfileUrl, setInstagramProfileUrl] = useState("");

  useEffect(() => {
    fetch("/api/site-settings")
      .then((r) => r.json())
      .then((payload) => {
        if (payload?.ok) setInstagramProfileUrl(payload.data?.instagramUrl ?? "");
      })
      .catch(() => {});
  }, []);

  const handleInstagramFileUpload = (
    event: ChangeEvent<HTMLInputElement>,
    type: "product" | "chart"
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (type === "product") {
      void (async () => {
        const dataUrl = await readFileAsDataUrl(file);
        setInstagramProductPhotoFile(file);
        setInstagramImagePreview(dataUrl);
      })();
      return;
    }

    void (async () => {
      const dataUrl = await readFileAsDataUrl(file);
      const optimizedDataUrl = await resizeImage(dataUrl, 1600);
      const optimizedBase64 = optimizedDataUrl.split(",")[1] || "";
      setInstagramSizeChartImage(optimizedDataUrl);
      setIsInstagramAnalyzing(true);
      try {
        const tableData = await extractSizeTableFromImage(optimizedBase64, "image/png");
        setInstagramExtractedTable(tableData);
      } catch (extractError: unknown) {
        const message =
          extractError instanceof Error ? extractError.message : "Size table extraction failed.";
        setAdminActionError(`사이즈표 추출에 실패했습니다: ${message}`);
      } finally {
        setIsInstagramAnalyzing(false);
      }
    })();
  };

  const handleInstagramCreate = async () => {
    if (!instagramForm.brand.trim() || !instagramForm.name.trim()) {
      setAdminActionError("브랜드명과 상품명은 비워둘 수 없습니다.");
      return;
    }
    if (!instagramProductPhotoFile && !instagramImagePath) {
      setAdminActionError("상품 이미지를 업로드해 주세요.");
      return;
    }

    setIsInstagramLoading(true);
    try {
      let nextImagePath = instagramImagePath;
      if (instagramProductPhotoFile) {
        nextImagePath = await uploadSubmissionImage(instagramProductPhotoFile);
        setInstagramImagePath(nextImagePath);
      }

      const response = await fetch("/api/admin/instagram-products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          brand: instagramForm.brand.trim(),
          name: instagramForm.name.trim(),
          category: instagramForm.category || null,
          url: instagramForm.url || null,
          imagePath: nextImagePath,
          sizeTable: instagramExtractedTable,
        }),
      });
      const payload = await response.json();
      if (!response.ok || !payload?.ok) {
        throw new Error(payload?.error || "인스타 상품 등록에 실패했습니다.");
      }

      setInstagramForm({ brand: "", name: "", category: CATEGORY_OPTIONS[0] ?? "", url: "" });
      setInstagramImagePath(null);
      setInstagramImagePreview("");
      setInstagramProductPhotoFile(null);
      setInstagramSizeChartImage(null);
      setInstagramExtractedTable(null);
      setAdminActionError(null);
      onProductMutated();
    } catch (createError: unknown) {
      const message =
        createError instanceof Error ? createError.message : "인스타 상품 등록에 실패했습니다.";
      setAdminActionError(message);
    } finally {
      setIsInstagramLoading(false);
    }
  };

  const handleInstagramPublish = async (id: string) => {
    setIsInstagramLoading(true);
    try {
      const response = await fetch(`/api/admin/products/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ isInstagram: true }),
      });
      const payload = await response.json();
      if (!response.ok || !payload?.ok) {
        throw new Error(payload?.error || "상품 게시에 실패했습니다.");
      }
      setAdminActionError(null);
      onProductMutated();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "상품 게시에 실패했습니다.";
      setAdminActionError(message);
    } finally {
      setIsInstagramLoading(false);
    }
  };

  const handleInstagramProfileUrlSave = async () => {
    setIsInstagramLoading(true);
    try {
      const res = await fetch("/api/site-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ instagramUrl: instagramProfileUrl.trim() }),
      });
      const payload = await res.json();
      if (!res.ok || !payload?.ok)
        throw new Error(payload?.error || "저장에 실패했습니다.");
      setAdminActionError(null);
    } catch (err: unknown) {
      setAdminActionError(
        err instanceof Error ? err.message : "저장에 실패했습니다."
      );
    } finally {
      setIsInstagramLoading(false);
    }
  };

  const handleInstagramUnpublish = async (id: string) => {
    if (!window.confirm("이 상품을 인스타 게시에서 내리겠습니까? 전체 상품 목록으로 이동합니다.")) return;

    setIsInstagramLoading(true);
    try {
      const response = await fetch(`/api/admin/products/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ isInstagram: false }),
      });
      const payload = await response.json();
      if (!response.ok || !payload?.ok) {
        throw new Error(payload?.error || "상품 내림에 실패했습니다.");
      }
      setAdminActionError(null);
      onProductMutated();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "상품 내림에 실패했습니다.";
      setAdminActionError(message);
    } finally {
      setIsInstagramLoading(false);
    }
  };

  const resetInstagramState = () => {
    setInstagramForm({ brand: "", name: "", category: CATEGORY_OPTIONS[0] ?? "", url: "" });
    setInstagramImagePath(null);
    setInstagramImagePreview("");
    setInstagramProductPhotoFile(null);
    setInstagramSizeChartImage(null);
    setInstagramExtractedTable(null);
  };

  return {
    instagramForm,
    setInstagramForm,
    instagramImagePreview,
    instagramSizeChartImage,
    instagramExtractedTable,
    setInstagramExtractedTable,
    isInstagramLoading,
    isInstagramAnalyzing,
    handleInstagramFileUpload,
    handleInstagramCreate,
    instagramProfileUrl,
    setInstagramProfileUrl,
    handleInstagramProfileUrlSave,
    handleInstagramPublish,
    handleInstagramUnpublish,
    resetInstagramState,
  };
}
