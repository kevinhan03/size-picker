"use client";
/* eslint-disable @next/next/no-img-element -- Local previews and signed images. */
import { Fragment, useEffect, useRef, useState } from "react";
import { createPortal, flushSync } from "react-dom";
import type { PointerEvent as ReactPointerEvent } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Crop,
  ImagePlus,
  Images,
  LoaderCircle,
  Plus,
  Trash2,
  X,
  ZoomIn,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { SocialDialog } from "./SocialDialog";
import { ConfirmDialog } from "./ConfirmDialog";
import { socialError, useSocialMessages } from "./messages";
import { changed, socialFetch, useSocialResource } from "./client";
import { preparePhoto, renderPhotoEdit, uploadPhoto } from "./image-upload";
import { useProductFormContext } from "../../contexts/ProductFormContext";
import type { Product } from "../../types";
import type { PostDetail, PostProductTag } from "../../types/social";

type DraftPhoto = {
  key: string;
  id?: string;
  replacementUploadId?: string;
  url: string;
  blob?: Blob;
  width: number | null;
  height: number | null;
  edit: { aspect: "original" | "square" | "portrait" | "landscape"; zoom: number; offsetX: number; offsetY: number };
  previewUrl?: string;
  previewSignature?: string;
  previewBlob?: Blob;
  tags: PostProductTag[];
};
export function PostComposer({
  post,
  onClose,
  onPublished,
}: {
  post?: PostDetail;
  onClose: () => void;
  onPublished?: (id: string) => void;
}) {
  const c = useSocialMessages();
  const router = useRouter();
  const productForm = useProductFormContext();
  const [step, setStep] = useState(post ? 3 : 0);
  const [photos, setPhotos] = useState<DraftPhoto[]>(
    () =>
      post?.images.map((i) => ({
        key: i.id,
        id: i.id,
        url: i.url,
        width: i.width,
        height: i.height,
        edit: { aspect: "original", zoom: 1, offsetX: 0, offsetY: 0 },
        tags: i.tags,
      })) || []
  );
  const [active, setActive] = useState(0);
  const [isCropping, setIsCropping] = useState(false);
  const [caption, setCaption] = useState(post?.caption || "");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [preparing, setPreparing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [point, setPoint] = useState<{ x: number; y: number } | null>(null);
  const [moving, setMoving] = useState<string | null>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [showPhotoManager, setShowPhotoManager] = useState(false);
  const [dragOverPhoto, setDragOverPhoto] = useState<string | null>(null);
  const [draggingPhoto, setDraggingPhoto] = useState<string | null>(null);
  const [pressingPhoto, setPressingPhoto] = useState<string | null>(null);
  const [thumbnailOverlay, setThumbnailOverlay] = useState<{
    host: HTMLDialogElement;
    key: string;
    url: string;
    left: number;
    top: number;
    width: number;
    height: number;
  } | null>(null);
  const [showAspectOptions, setShowAspectOptions] = useState(false);
  const [showZoomControl, setShowZoomControl] = useState(false);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [dirty, setDirty] = useState(false);
  const [confirmExit, setConfirmExit] = useState<"close" | "register" | "discard-photos" | null>(
    null
  );
  const input = useRef<HTMLInputElement>(null);
  const replaceKey = useRef<string | null>(null);
  const postId = useRef(post?.id || crypto.randomUUID());
  const urls = useRef<string[]>([]);
  const uploads = useRef(new Set<string>());
  const published = useRef(false);
  const lock = useRef(false);
  const tagDrag = useRef<{ id: string; pointerId: number; grabOffsetX: number; grabOffsetY: number } | null>(null);
  const photoDrag = useRef<{ pointerId: number; startX: number; startY: number; offsetX: number; offsetY: number; moved: boolean } | null>(null);
  const photoFrame = useRef<number | null>(null);
  const pendingPhotoPosition = useRef<{ key: string; x: number; y: number } | null>(null);
  const thumbnailRefs = useRef(new Map<string, HTMLButtonElement>());
  const photosRef = useRef(photos);
  const activeKeyRef = useRef(photos[0]?.key ?? null);
  const thumbnailDrag = useRef<{
    key: string;
    pointerId: number;
    grabOffsetX: number;
    grabOffsetY: number;
    startX: number;
    startY: number;
    originX: number;
    originY: number;
    moved: boolean;
    order: string[];
    slots: DOMRect[];
    destination: number;
  } | null>(null);
  const suppressThumbnailClick = useRef(false);
  const thumbnailOverlayRef = useRef<HTMLDivElement>(null);
  const thumbnailMotionFrame = useRef<number | null>(null);
  const thumbnailSprings = useRef(new Map<string, { x: number; y: number; vx: number; vy: number; tx: number; ty: number }>());
  const thumbnailSpringFrame = useRef<number | null>(null);
  const pendingThumbnailMotion = useRef<{ key: string; clientX: number; clientY: number } | null>(null);
  const filePickerCancelling = useRef(false);
  const closet = useSocialResource<{ products: Product[] }>("/api/closet");
  const photo = photos[active];
  useEffect(
    () => () => {
      urls.current.forEach(URL.revokeObjectURL);
      if (!published.current)
        uploads.current.forEach((id) => {
          void socialFetch("/api/outfit-explorer/uploads", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id }),
            keepalive: true,
          }).catch(() => {});
        });
    },
    []
  );
  useEffect(
    () => () => {
      if (thumbnailMotionFrame.current !== null)
        cancelAnimationFrame(thumbnailMotionFrame.current);
      if (thumbnailSpringFrame.current !== null)
        cancelAnimationFrame(thumbnailSpringFrame.current);
    },
    []
  );
  useEffect(() => {
    photosRef.current = photos;
    activeKeyRef.current = photos[active]?.key ?? null;
  }, [photos, active]);
  useEffect(() => {
    const element = input.current;
    const clearFilePickerCancel = () => {
      window.setTimeout(() => {
        filePickerCancelling.current = false;
      }, 0);
    };
    element?.addEventListener("cancel", clearFilePickerCancel);
    return () => element?.removeEventListener("cancel", clearFilePickerCancel);
  }, []);
  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => {
      if (dirty || busy) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty, busy]);
  useEffect(
    () => () => {
      if (photoFrame.current !== null) cancelAnimationFrame(photoFrame.current);
    },
    []
  );
  function close() {
    if (busy || preparing) return;
    if (dirty) setConfirmExit("close");
    else onClose();
  }
  function discardSelectedPhotos() {
    urls.current.forEach(URL.revokeObjectURL);
    urls.current = [];
    setPhotos([]);
    setActive(0);
    setPoint(null);
    setMoving(null);
    setShowAspectOptions(false);
    setShowZoomControl(false);
    setDirty(false);
    setStep(0);
  }
  function goBack() {
    if (busy || preparing) return;
    if (step === 1 && photos.length) {
      setConfirmExit("discard-photos");
      return;
    }
    setStep((current) => Math.max(0, current - 1));
  }
  function openFilePicker(replacement: string | null = null) {
    replaceKey.current = replacement;
    filePickerCancelling.current = true;
    if (input.current) {
      input.current.multiple = !replacement;
      input.current.click();
    }
  }
  function updatePhoto(key: string, fn: (p: DraftPhoto) => DraftPhoto) {
    setPhotos((items) => items.map((p) => (p.key === key ? fn(p) : p)));
    setDirty(true);
  }
  function editAspectRatio(photo: DraftPhoto) {
    if (photo.edit.aspect === "square") return 1;
    if (photo.edit.aspect === "portrait") return 4 / 5;
    if (photo.edit.aspect === "landscape") return 16 / 9;
    return photo.width && photo.height ? photo.width / photo.height : 4 / 5;
  }
  function editImageGeometry(photo: DraftPhoto) {
    const canvasRatio = editAspectRatio(photo);
    const imageRatio = photo.width && photo.height ? photo.width / photo.height : canvasRatio;
    const baseWidth = imageRatio > canvasRatio ? imageRatio / canvasRatio : 1;
    const baseHeight = imageRatio > canvasRatio ? 1 : canvasRatio / imageRatio;
    const renderedWidth = baseWidth * photo.edit.zoom;
    const renderedHeight = baseHeight * photo.edit.zoom;
    return {
      baseWidth,
      baseHeight,
      maxX: Math.max(0, (renderedWidth - 1) / 2),
      maxY: Math.max(0, (renderedHeight - 1) / 2),
    };
  }
  function outputEdit(photo: DraftPhoto) {
    const { aspect, zoom, offsetX, offsetY } = photo.edit;
    return {
      aspect: aspect === "square" ? 1 : aspect === "portrait" ? 4 / 5 : aspect === "landscape" ? 16 / 9 : null,
      zoom,
      offsetX,
      offsetY,
    };
  }
  function previewSignature(photo: DraftPhoto) {
    const { aspect, zoom, offsetX, offsetY } = photo.edit;
    return `${aspect}:${zoom}:${offsetX}:${offsetY}`;
  }
  function hasVisualEdits(photo: DraftPhoto) {
    const { aspect, zoom, offsetX, offsetY } = photo.edit;
    return aspect !== "original" || zoom !== 1 || offsetX !== 0 || offsetY !== 0;
  }
  async function continueToCompose() {
    const sourcePhotos = photos;
    setPreparing(true);
    setError("");
    try {
      const prepared = await Promise.all(
        sourcePhotos.map(async (item) => {
          const signature = previewSignature(item);
          if (!hasVisualEdits(item))
            return { ...item, previewUrl: undefined, previewSignature: undefined, previewBlob: undefined };
          if (item.previewUrl && item.previewBlob && item.previewSignature === signature) return item;
          const resolvedSource =
            item.blob ?? (await (await fetch(item.url)).blob());
          const previewBlob = await renderPhotoEdit(resolvedSource, outputEdit(item));
          const previewUrl = URL.createObjectURL(previewBlob);
          urls.current.push(previewUrl);
          return {
            ...item,
            blob: resolvedSource,
            previewUrl,
            previewSignature: signature,
            previewBlob,
          };
        })
      );
      sourcePhotos.forEach((item, index) => {
        if (item.previewUrl && item.previewUrl !== prepared[index].previewUrl) {
          URL.revokeObjectURL(item.previewUrl);
          urls.current = urls.current.filter((url) => url !== item.previewUrl);
        }
      });
      setPhotos(prepared);
      setStep(2);
      setPoint(null);
      setMoving(null);
    } catch (e) {
      setError(socialError(e, c));
    } finally {
      setPreparing(false);
    }
  }
  async function choose(files: FileList | null) {
    if (!files?.length) return;
    const replacement = replaceKey.current;
    replaceKey.current = null;
    if ((replacement ? photos.length : photos.length + files.length) > 10) {
      setError(c.imageError);
      return;
    }
    setPreparing(true);
    setError("");
    try {
      const additions: DraftPhoto[] = [];
      for (const file of Array.from(files).slice(0, replacement ? 1 : 10)) {
        const blob = await preparePhoto(file);
        const url = URL.createObjectURL(blob);
        const bitmap = await createImageBitmap(blob);
        const { width, height } = bitmap;
        bitmap.close();
        urls.current.push(url);
        additions.push({
          key: crypto.randomUUID(),
          url,
          blob,
          width,
          height,
          edit: { aspect: "original", zoom: 1, offsetX: 0, offsetY: 0 },
          tags: [],
        });
      }
      if (replacement)
        setPhotos((items) =>
          items.map((p) => (p.key === replacement ? additions[0] : p))
        );
      else {
        setPhotos((items) => [...items, ...additions]);
        setActive(photos.length);
      }
      setDirty(true);
      setStep(1);
      setPoint(null);
      setMoving(null);
    } catch (e) {
      setError(socialError(e, c));
    } finally {
      setPreparing(false);
      if (input.current) input.current.value = "";
    }
  }
  function reorder(offset: number) {
    reorderAt(active, offset);
  }
  function reorderAt(index: number, offset: number) {
    const next = index + offset;
    if (next < 0 || next >= photos.length) return;
    setPhotos((items) => {
      const copy = [...items];
      [copy[index], copy[next]] = [copy[next], copy[index]];
      return copy;
    });
    setActive(next);
    setDirty(true);
    setPoint(null);
  }
  function remove() {
    removeAt(active);
  }
  function removeAt(index: number) {
    const nextActive =
      active > index ? active - 1 : active === index ? Math.max(0, index - 1) : active;
    setPhotos((items) => items.filter((_, itemIndex) => itemIndex !== index));
    setActive(nextActive);
    setDirty(true);
    setPoint(null);
    if (photos.length === 1) setStep(0);
  }
  function tagPositionFromEvent(event: ReactPointerEvent<HTMLElement>, grabOffsetX = 0, grabOffsetY = 0) {
    const rect = event.currentTarget.parentElement?.getBoundingClientRect();
    if (!rect) return null;
    return {
      x: Math.min(1, Math.max(0, (event.clientX - rect.left - grabOffsetX) / rect.width)),
      y: Math.min(1, Math.max(0, (event.clientY - rect.top - grabOffsetY) / rect.height)),
    };
  }
  function startTagDrag(event: ReactPointerEvent<HTMLSpanElement>, id: string) {
    if (step !== 2 || busy || preparing) return;
    event.preventDefault();
    event.stopPropagation();
    const rect = event.currentTarget.parentElement?.getBoundingClientRect();
    const tag = photo?.tags.find((item) => item.id === id);
    if (!rect || !tag) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    tagDrag.current = {
      id,
      pointerId: event.pointerId,
      grabOffsetX: event.clientX - (rect.left + tag.x * rect.width),
      grabOffsetY: event.clientY - (rect.top + tag.y * rect.height),
    };
    setMoving(id);
  }
  function dragTag(event: ReactPointerEvent<HTMLSpanElement>) {
    const drag = tagDrag.current;
    const position = tagPositionFromEvent(event, drag?.grabOffsetX, drag?.grabOffsetY);
    if (!drag || drag.pointerId !== event.pointerId || !position || !photo) return;
    event.preventDefault();
    updatePhoto(photo.key, (p) => ({
      ...p,
      tags: p.tags.map((tag) =>
        tag.id === drag.id ? { ...tag, ...position } : tag
      ),
    }));
  }
  function finishTagDrag(event: ReactPointerEvent<HTMLSpanElement>) {
    if (tagDrag.current?.pointerId !== event.pointerId) return;
    tagDrag.current = null;
    setMoving(null);
  }
  function startPhotoDrag(event: ReactPointerEvent<HTMLDivElement>) {
    if (!photo || busy || preparing || event.button !== 0) return;
    const { maxX, maxY } = editImageGeometry(photo);
    if (!maxX && !maxY) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    photoDrag.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      offsetX: photo.edit.offsetX,
      offsetY: photo.edit.offsetY,
      moved: false,
    };
  }
  function dragPhoto(event: ReactPointerEvent<HTMLDivElement>) {
    const drag = photoDrag.current;
    if (!drag || drag.pointerId !== event.pointerId || !photo) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const { maxX, maxY } = editImageGeometry(photo);
    if ((!maxX && !maxY) || !rect.width || !rect.height) return;
    const deltaX = event.clientX - drag.startX;
    const deltaY = event.clientY - drag.startY;
    if (!drag.moved && Math.hypot(deltaX, deltaY) < 4) return;
    if (!drag.moved) setIsCropping(true);
    drag.moved = true;
    pendingPhotoPosition.current = {
      key: photo.key,
      x: maxX ? Math.min(1, Math.max(-1, drag.offsetX + deltaX / rect.width / maxX)) : 0,
      y: maxY ? Math.min(1, Math.max(-1, drag.offsetY + deltaY / rect.height / maxY)) : 0,
    };
    if (photoFrame.current !== null) return;
    photoFrame.current = requestAnimationFrame(() => {
      const position = pendingPhotoPosition.current;
      photoFrame.current = null;
      if (!position) return;
      updatePhoto(position.key, (p) => ({
        ...p,
        edit: { ...p.edit, offsetX: position.x, offsetY: position.y },
      }));
    });
  }
  function finishPhotoDrag(event: ReactPointerEvent<HTMLDivElement>) {
    if (photoDrag.current?.pointerId !== event.pointerId) return;
    photoDrag.current = null;
    setIsCropping(false);
  }
  function closestThumbnailKey(clientX: number, clientY: number) {
    const drag = thumbnailDrag.current;
    if (!drag) return null;
    return drag.slots.reduce<{ key: string; distance: number } | null>((nearest, rect, index) => {
      const key = drag.order[index];
      const distance = Math.hypot(clientX - (rect.left + rect.width / 2), clientY - (rect.top + rect.height / 2));
      return !nearest || distance < nearest.distance ? { key, distance } : nearest;
    }, null)?.key || null;
  }
  function settleDraggedThumbnail() {
    if (thumbnailMotionFrame.current !== null) {
      cancelAnimationFrame(thumbnailMotionFrame.current);
      thumbnailMotionFrame.current = null;
    }
    pendingThumbnailMotion.current = null;
    setThumbnailOverlay(null);
  }
  function animateThumbnailReflow() {
    if (thumbnailSpringFrame.current !== null) return;
    let last = performance.now();
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const tick = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.032);
      last = now;
      let running = false;
      thumbnailSprings.current.forEach((s, key) => {
        // Critically damped spring: retarget without resetting position or velocity.
        for (let n = 0; n < 4; n++) {
          s.vx += (400 * (s.tx - s.x) - 40 * s.vx) * dt / 4;
          s.vy += (400 * (s.ty - s.y) - 40 * s.vy) * dt / 4;
          s.x += s.vx * dt / 4;
          s.y += s.vy * dt / 4;
        }
        const settled = reduced || Math.hypot(s.x - s.tx, s.y - s.ty) < 0.1 && Math.hypot(s.vx, s.vy) < 1;
        if (settled) { s.x = s.tx; s.y = s.ty; s.vx = 0; s.vy = 0; }
        else running = true;
        const element = thumbnailRefs.current.get(key)?.parentElement;
        if (element) element.style.transform = `translate3d(${s.x}px, ${s.y}px, 0)`;
      });
      thumbnailSpringFrame.current = running ? requestAnimationFrame(tick) : null;
    };
    thumbnailSpringFrame.current = requestAnimationFrame(tick);
  }
  function reorderThumbnail(fromKey: string, targetKey: string) {
    const drag = thumbnailDrag.current;
    if (!drag) return;
    const destination = drag.order.indexOf(targetKey);
    if (destination < 0 || destination === drag.destination) return;
    drag.destination = destination;
    const preview = drag.order.filter((key) => key !== fromKey);
    preview.splice(destination, 0, fromKey);
    preview.forEach((key, index) => {
      if (key === fromKey) return;
      const original = drag.slots[drag.order.indexOf(key)];
      const target = drag.slots[index];
      const spring = thumbnailSprings.current.get(key)!;
      spring.tx = target.left - original.left;
      spring.ty = target.top - original.top;
    });
    animateThumbnailReflow();
  }
  function startThumbnailDrag(event: ReactPointerEvent<HTMLButtonElement>, key: string) {
    if (busy || preparing || event.button !== 0) return;
    const rect = event.currentTarget.getBoundingClientRect();
    suppressThumbnailClick.current = false;
    const order = photosRef.current.map((photo) => photo.key);
    const slots = order.map((itemKey) => {
      const element = thumbnailRefs.current.get(itemKey)!;
      const visual = element.getBoundingClientRect();
      const spring = thumbnailSprings.current.get(itemKey);
      return new DOMRect(visual.left - (spring?.x || 0), visual.top - (spring?.y || 0), visual.width, visual.height);
    });
    order.forEach((itemKey) => {
      if (!thumbnailSprings.current.has(itemKey)) thumbnailSprings.current.set(itemKey, { x: 0, y: 0, vx: 0, vy: 0, tx: 0, ty: 0 });
    });
    event.currentTarget.setPointerCapture(event.pointerId);
    setPressingPhoto(key);
    thumbnailDrag.current = {
      key,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: rect.left,
      originY: rect.top,
      grabOffsetX: event.clientX - rect.left,
      grabOffsetY: event.clientY - rect.top,
      moved: false,
      order,
      slots,
      destination: order.indexOf(key),
    };
  }
  function dragThumbnail(event: ReactPointerEvent<HTMLButtonElement>) {
    const drag = thumbnailDrag.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    if (!drag.moved && Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY) < 6) return;
    if (!drag.moved) {
      const host = event.currentTarget.closest("dialog");
      if (!host) return;
      drag.moved = true;
      event.preventDefault();
      setDraggingPhoto(drag.key);
      const draggedPhoto = photosRef.current.find((photo) => photo.key === drag.key);
      if (draggedPhoto) {
        setThumbnailOverlay({
          host,
          key: drag.key,
          url: draggedPhoto.url,
          left: drag.originX,
          top: drag.originY,
          width: thumbnailRefs.current.get(drag.key)?.getBoundingClientRect().width || 0,
          height: thumbnailRefs.current.get(drag.key)?.getBoundingClientRect().height || 0,
        });
      }
    }
    pendingThumbnailMotion.current = {
      key: drag.key,
      clientX: event.clientX,
      clientY: event.clientY,
    };
    if (thumbnailMotionFrame.current === null) {
      thumbnailMotionFrame.current = requestAnimationFrame(() => {
        const motion = pendingThumbnailMotion.current;
        thumbnailMotionFrame.current = null;
        if (!motion) return;
        const activeDrag = thumbnailDrag.current;
        if (!activeDrag) return;
        const overlay = thumbnailOverlayRef.current;
        if (!overlay) return;
        overlay.style.transform = `translate3d(${motion.clientX - activeDrag.grabOffsetX - activeDrag.originX}px, ${motion.clientY - activeDrag.grabOffsetY - activeDrag.originY}px, 0) scale(1.04)`;
      });
    }
    const source = drag.slots[drag.order.indexOf(drag.key)];
    const centerX = event.clientX - drag.grabOffsetX + source.width / 2;
    const centerY = event.clientY - drag.grabOffsetY + source.height / 2;
    const targetKey = closestThumbnailKey(centerX, centerY);
    if (!targetKey) return;
    const target = drag.slots[drag.order.indexOf(targetKey)];
    const current = drag.slots[drag.destination];
    // A small dead band prevents oscillation at the boundary between two slots.
    if (Math.hypot(centerX - target.left - target.width / 2, centerY - target.top - target.height / 2) + 8 >=
        Math.hypot(centerX - current.left - current.width / 2, centerY - current.top - current.height / 2)) return;
    setDragOverPhoto(targetKey);
    reorderThumbnail(drag.key, targetKey);
  }
  function finishThumbnailDrag(event: ReactPointerEvent<HTMLButtonElement>) {
    const drag = thumbnailDrag.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    if (drag.moved) {
      suppressThumbnailClick.current = true;
      const next = [...photosRef.current];
      const from = next.findIndex((p) => p.key === drag.key);
      const destination = event.type === "pointercancel" ? from : drag.destination;
      const [moved] = next.splice(from, 1);
      next.splice(destination, 0, moved);
      const motion = pendingThumbnailMotion.current;
      // Commit once on release. Preserve every card's current visual position
      // across the DOM move, then let the existing springs settle into the slots.
      next.forEach((p, index) => {
        const original = drag.slots[drag.order.indexOf(p.key)];
        const slot = drag.slots[index];
        const s = thumbnailSprings.current.get(p.key)!;
        s.x += original.left - slot.left;
        s.y += original.top - slot.top;
        if (p.key === drag.key && motion) {
          s.x = motion.clientX - drag.grabOffsetX - slot.left;
          s.y = motion.clientY - drag.grabOffsetY - slot.top;
        }
        s.tx = 0; s.ty = 0;
      });
      flushSync(() => {
        setPhotos(next);
        setActive(Math.max(0, next.findIndex((p) => p.key === activeKeyRef.current)));
        setDraggingPhoto(null);
        setThumbnailOverlay(null);
      });
      photosRef.current = next;
      thumbnailSprings.current.forEach((s, key) => {
        const element = thumbnailRefs.current.get(key)?.parentElement;
        if (element) element.style.transform = `translate3d(${s.x}px, ${s.y}px, 0)`;
      });
      setDirty(true);
      animateThumbnailReflow();
    }
    thumbnailDrag.current = null;
    setDraggingPhoto(null);
    setPressingPhoto(null);
    setDragOverPhoto(null);
    settleDraggedThumbnail();
  }
  function selectProduct(product: Product) {
    if (!point || !photo) return;
    updatePhoto(photo.key, (p) => ({
      ...p,
      tags: [
        ...p.tags,
        {
          id: `new-${crypto.randomUUID()}`,
          productId: String(product.id),
          x: point.x,
          y: point.y,
          product: {
            name: product.name,
            brand: product.brand,
            image: product.thumbnailImage || product.image || null,
          },
        },
      ],
    }));
    setPoint(null);
  }
  async function submit() {
    if (lock.current || !photos.length) return;
    lock.current = true;
    setBusy(true);
    setError("");
    setProgress(0);
    try {
      const prepared = [...photos];
      for (let i = 0; i < prepared.length; i++) {
        const p = prepared[i];
        const replacement =
          !!p.id &&
          !!p.previewBlob &&
          p.previewSignature === previewSignature(p);
        if (!p.id || replacement) {
          const editedBlob =
            p.previewBlob && p.previewSignature === previewSignature(p)
              ? p.previewBlob
              : await renderPhotoEdit(p.blob!, outputEdit(p));
          const upload = await uploadPhoto(editedBlob, (v) =>
            setProgress(Math.round(((i + v / 100) / prepared.length) * 100))
          );
          uploads.current.add(upload.id);
          prepared[i] = {
            ...p,
            id: p.id || upload.id,
            ...(p.id ? { replacementUploadId: upload.id } : {}),
          };
          setPhotos((items) =>
            items.map((item) => (item.key === p.key ? prepared[i] : item))
          );
        }
        setProgress(Math.round(((i + 1) / prepared.length) * 100));
      }
      const payload = {
        id: postId.current,
        caption,
        updatedAt: post?.updatedAt,
        images: prepared.map((p) => ({
          id: p.id,
          ...(p.replacementUploadId
            ? { replacementUploadId: p.replacementUploadId }
            : {}),
          tags: p.tags.map((t) => ({
            productId: t.productId,
            x: t.x,
            y: t.y,
            ...(!t.id.startsWith("new-") ? { existingTagId: t.id } : {}),
          })),
        })),
      };
      const result = await socialFetch<{ id: string }>(
        post ? `/api/outfit-explorer/${post.id}` : "/api/outfit-explorer",
        {
          method: post ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      published.current = true;
      changed();
      if (onPublished) onPublished(result.id);
      else router.push(`/outfit-explorer/${result.id}`);
      onClose();
    } catch (e) {
      setError(socialError(e, c));
    } finally {
      setBusy(false);
      lock.current = false;
    }
  }
  const products = closet.data?.products || [];
  const filtered = products.filter(
    (p) =>
      (!category || p.category === category) &&
      `${p.name} ${p.brand}`.toLowerCase().includes(search.toLowerCase())
  );
  const composerTitle =
    step === 0 ? (post ? c.editPost : c.newPost) : step === 1 ? c.editPhoto : step === 2 ? c.tags : c.compose;
  const isFinalStep = step === 3;
  const headerActionLabel = isFinalStep ? (post ? c.saveChanges : c.publish) : c.next;
  return (
    <SocialDialog
      wide
      title={composerTitle}
      onClose={close}
      onEscape={() => {
        if (!filePickerCancelling.current) return false;
        filePickerCancelling.current = false;
        return true;
      }}
      headerStart={
        step > 0 ? (
          <button
            type="button"
            className="social-composer-header-back"
            aria-label={c.back}
            title={c.back}
            disabled={busy || preparing}
            onClick={goBack}
          >
            <ArrowLeft size={20} />
          </button>
        ) : undefined
      }
      headerEnd={
        step > 0 ? (
          <button
            type="button"
            className={`social-composer-header-next${isFinalStep ? " is-final" : ""}`}
            aria-label={headerActionLabel}
            title={headerActionLabel}
            disabled={busy || preparing || !photos.length}
            onClick={() => {
              if (isFinalStep) void submit();
              else if (step === 1) void continueToCompose();
              else setStep((current) => current + 1);
            }}
          >
            {busy ? <LoaderCircle size={16} className="animate-spin" /> : null}
            <span>{headerActionLabel}</span>
            {!isFinalStep && <ArrowRight size={17} aria-hidden="true" />}
          </button>
        ) : undefined
      }
    >
      <fieldset disabled={busy || preparing} style={{ minWidth: 0 }}>
        <div className="social-compose-body">
          <input
            ref={input}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            hidden
            onChange={(e) => {
              filePickerCancelling.current = false;
              void choose(e.target.files);
            }}
          />
          {step === 0 ? (
            <div
              className={`social-upload-zone${isDraggingOver ? " is-dragging" : ""}`}
              onDragEnter={(event) => {
                event.preventDefault();
                setIsDraggingOver(true);
              }}
              onDragOver={(event) => event.preventDefault()}
              onDragLeave={(event) => {
                if (event.currentTarget === event.target) setIsDraggingOver(false);
              }}
              onDrop={(event) => {
                event.preventDefault();
                setIsDraggingOver(false);
                void choose(event.dataTransfer.files);
              }}
            >
              <ImagePlus size={36} strokeWidth={1} />
              <h3>{c.dropPhotos}</h3>
              <p className="social-muted">{c.photoHelp}</p>
              <button
                className="social-button social-primary"
                onClick={() => openFilePicker()}
              >
                <Plus size={16} />
                {c.selectPhotos}
              </button>
            </div>
          ) : (
            photo && (
              step === 1 ? (
                <div className="social-edit-layout">
                  <div className="social-edit-workspace">
                    <div
                      className="social-edit-crop-frame"
                      style={{
                        aspectRatio: String(editAspectRatio(photo)),
                        width: `min(var(--social-edit-crop-max-width), calc(100cqh * ${editAspectRatio(photo)}))`,
                      }}
                    >
                      <div
                        className={`social-edit-image${isCropping ? " is-cropping" : ""}`}
                        style={{
                          cursor: !editImageGeometry(photo).maxX && !editImageGeometry(photo).maxY ? "default" : undefined,
                        }}
                      onPointerDown={startPhotoDrag}
                      onPointerMove={dragPhoto}
                      onPointerUp={finishPhotoDrag}
                      onPointerCancel={finishPhotoDrag}
                      onLostPointerCapture={finishPhotoDrag}
                    >
                      <img
                        src={photo.url}
                        alt={`${c.photo} ${active + 1}`}
                        draggable={false}
                        onLoad={(event) => {
                          if (photo.width && photo.height) return;
                          updatePhoto(photo.key, (current) => ({
                            ...current,
                            width: event.currentTarget.naturalWidth,
                            height: event.currentTarget.naturalHeight,
                          }));
                        }}
                        style={{
                          width: `${editImageGeometry(photo).baseWidth * 100}%`,
                          height: `${editImageGeometry(photo).baseHeight * 100}%`,
                          left: `${50 + photo.edit.offsetX * editImageGeometry(photo).maxX * 100}%`,
                          top: `${50 + photo.edit.offsetY * editImageGeometry(photo).maxY * 100}%`,
                          transform: `translate(-50%, -50%) scale(${photo.edit.zoom})`,
                        }}
                      />
                      </div>
                      {photos.length > 1 && (
                        <>
                          <button
                            type="button"
                            className="social-edit-photo-nav social-edit-photo-nav-prev"
                            aria-label={c.previousPhoto}
                            disabled={active === 0}
                            onClick={() => setActive((index) => Math.max(0, index - 1))}
                          >
                            <ArrowLeft size={14} />
                          </button>
                          <button
                            type="button"
                            className="social-edit-photo-nav social-edit-photo-nav-next"
                            aria-label={c.nextPhoto}
                            disabled={active === photos.length - 1}
                            onClick={() => setActive((index) => Math.min(photos.length - 1, index + 1))}
                          >
                            <ArrowRight size={14} />
                          </button>
                        </>
                      )}
                    </div>
                    {photos.length > 1 && (
                      <>
                        <div className="social-edit-photo-dots" aria-label={`${active + 1} / ${photos.length}`}>
                          {photos.map((item, index) => (
                            <button
                              key={item.key}
                              aria-label={`${c.photo} ${index + 1}`}
                              aria-current={active === index ? "true" : undefined}
                              onClick={() => setActive(index)}
                            />
                          ))}
                        </div>
                      </>
                    )}
                    <div className="social-edit-controls" aria-label={c.editPhoto}>
                      <div className="social-edit-control-wrap">
                        {showAspectOptions && (
                          <div className="social-aspect-options" role="group" aria-label={c.aspectRatio}>
                            {([
                              ["original", c.original],
                              ["square", "1:1"],
                              ["portrait", "4:5"],
                              ["landscape", "16:9"],
                            ] as const).map(([aspect, label]) => (
                              <button
                                key={aspect}
                                className={photo.edit.aspect === aspect ? "is-active" : ""}
                                aria-pressed={photo.edit.aspect === aspect}
                                onClick={() => updatePhoto(photo.key, (p) => ({ ...p, edit: { ...p.edit, aspect, zoom: 1, offsetX: 0, offsetY: 0 } }))}
                              >
                                {label}
                              </button>
                            ))}
                          </div>
                        )}
                        <button className="social-edit-control-button" aria-label={c.aspectRatio} aria-expanded={showAspectOptions} onClick={() => { setShowAspectOptions((value) => !value); setShowZoomControl(false); }}><Crop size={18} /></button>
                      </div>
                      <div className="social-edit-control-wrap">
                        {showZoomControl && (
                          <div className="social-zoom-controls" role="group" aria-label={c.zoom}>
                            <input
                              type="range"
                              min="1"
                              max="3"
                              step="0.01"
                              value={photo.edit.zoom}
                              aria-label={c.zoom}
                              onChange={(event) => updatePhoto(photo.key, (p) => ({ ...p, edit: { ...p.edit, zoom: Number(event.target.value) } }))}
                            />
                          </div>
                        )}
                        <button className="social-edit-control-button" aria-label={c.zoom} aria-expanded={showZoomControl} onClick={() => { setShowZoomControl((value) => !value); setShowAspectOptions(false); }}><ZoomIn size={18} /></button>
                      </div>
                    </div>
                  </div>
                  <aside className="social-edit-sidebar" aria-label={c.managePhotos}>
                    <p className="social-muted">{c.reorderHelp}</p>
                    <div className="social-edit-thumbnails">
                      {photos.map((p, i) => (
                        <div className={`social-thumbnail-item${dragOverPhoto === p.key ? " is-drop-target" : ""}${draggingPhoto === p.key ? " is-dragging" : ""}${pressingPhoto === p.key ? " is-pressing" : ""}`} key={p.key}>
                          <button
                            className={active === i ? "is-active" : ""}
                            aria-pressed={active === i}
                            aria-label={`${c.photo} ${i + 1}`}
                            ref={(element) => {
                              if (element) thumbnailRefs.current.set(p.key, element);
                              else thumbnailRefs.current.delete(p.key);
                            }}
                            onPointerDown={(event) => startThumbnailDrag(event, p.key)}
                            onPointerMove={dragThumbnail}
                            onPointerUp={finishThumbnailDrag}
                            onPointerCancel={finishThumbnailDrag}
                            onClick={() => {
                              if (suppressThumbnailClick.current) {
                                suppressThumbnailClick.current = false;
                                return;
                              }
                              setActive(i);
                            }}
                          >
                            <img src={p.url} alt="" draggable={false} />
                          </button>
                          <button
                            className="social-thumbnail-delete"
                            aria-label={c.remove}
                            onPointerDown={(event) => event.stopPropagation()}
                            onClick={() => removeAt(i)}
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        className="social-thumbnail-add"
                        aria-label={c.addPhotos}
                        disabled={photos.length >= 10}
                        onClick={() => openFilePicker()}
                      >
                        <Plus size={32} strokeWidth={1.75} />
                      </button>
                    </div>
                    {thumbnailOverlay
                      ? createPortal(
                          <div
                            ref={thumbnailOverlayRef}
                            className="social-thumbnail-drag-overlay"
                            aria-hidden="true"
                            style={{
                              left: thumbnailOverlay.left,
                              top: thumbnailOverlay.top,
                              width: thumbnailOverlay.width,
                              height: thumbnailOverlay.height,
                            }}
                          >
                            <img src={thumbnailOverlay.url} alt="" />
                          </div>,
                          // Keep the preview in the modal's top layer; a body
                          // portal is painted behind showModal(), regardless of z-index.
                          thumbnailOverlay.host
                        )
                      : null}
                  </aside>
                </div>
              ) : (
              <div className="social-compose-layout">
                <div>
                  <div className="social-compose-photo-stage">
                    <div
                    className="social-editor-image"
                    >
                      <img src={photo.previewUrl ?? photo.url} alt={`${c.photo} ${active + 1}`} />
                    {photo.tags.map((tag) => (
                      <Fragment key={tag.id}>
                      <span
                        className={`social-tag-pin${step === 2 ? " is-editable" : ""}${moving === tag.id ? " is-moving" : ""}`}
                        style={{
                          left: `${tag.x * 100}%`,
                          top: `${tag.y * 100}%`,
                        }}
                        role={step === 2 ? "button" : undefined}
                        tabIndex={step === 2 ? 0 : undefined}
                        aria-label={`${c.moveTag}: ${tag.product.name}`}
                        onPointerDown={(event) => startTagDrag(event, tag.id)}
                        onPointerMove={dragTag}
                        onPointerUp={finishTagDrag}
                        onPointerCancel={finishTagDrag}
                        onClick={(event) => event.stopPropagation()}
                      >
                      </span>
                      <span
                        aria-hidden="true"
                        className={`social-tag-preview${step === 2 ? " is-editable" : ""}${moving === tag.id ? " is-moving" : ""}`}
                        style={{
                          left: `${tag.x * 100}%`,
                          top: `${tag.y * 100}%`,
                        }}
                        onPointerDown={(event) => startTagDrag(event, tag.id)}
                        onPointerMove={dragTag}
                        onPointerUp={finishTagDrag}
                        onPointerCancel={finishTagDrag}
                      >
                        <img src={tag.product.image || "/images/default-product.svg"} alt="" />
                        <span>
                          <strong>{tag.product.brand}</strong>
                          <small>{tag.product.name}</small>
                        </span>
                      </span>
                      </Fragment>
                    ))}
                    {step === 1 && <button
                      type="button"
                      className="social-photo-manager-toggle"
                      aria-label={c.managePhotos}
                      aria-expanded={showPhotoManager}
                      onClick={(event) => {
                        event.stopPropagation();
                        setShowPhotoManager((value) => !value);
                      }}
                    >
                      <Images size={17} />
                    </button>}
                    </div>
                    {photos.length > 1 && (
                      <nav className="social-compose-photo-navigation" aria-label={c.photo}>
                        <button
                          type="button"
                          className="social-edit-photo-nav social-compose-photo-nav-prev"
                          aria-label={c.previousPhoto}
                          disabled={active === 0}
                          onClick={() => {
                            setActive((index) => Math.max(0, index - 1));
                            setPoint(null);
                            setMoving(null);
                          }}
                        >
                          <ArrowLeft size={17} />
                        </button>
                        <button
                          type="button"
                          className="social-edit-photo-nav social-compose-photo-nav-next"
                          aria-label={c.nextPhoto}
                          disabled={active === photos.length - 1}
                          onClick={() => {
                            setActive((index) => Math.min(photos.length - 1, index + 1));
                            setPoint(null);
                            setMoving(null);
                          }}
                        >
                          <ArrowRight size={17} />
                        </button>
                      </nav>
                    )}
                  </div>
                  {step === 1 && showPhotoManager && (
                    <section className="social-photo-manager" aria-label={c.managePhotos}>
                      <div className="social-photo-manager-header">
                        <strong>{c.managePhotos}</strong>
                        <button
                          className="social-button"
                          disabled={photos.length >= 10}
                          onClick={() => {
                            replaceKey.current = null;
                            if (input.current) {
                              input.current.multiple = true;
                              input.current.click();
                            }
                          }}
                        >
                          <Plus size={16} />
                          {c.addPhotos}
                        </button>
                      </div>
                      <div className="social-thumbnails">
                        {photos.map((p, i) => (
                          <div className="social-thumbnail-item" key={p.key}>
                            <button
                              aria-pressed={active === i}
                              aria-label={`${c.photo} ${i + 1}`}
                              onClick={() => {
                                setActive(i);
                                setPoint(null);
                                setMoving(null);
                              }}
                            >
                              <img src={p.url} alt="" />
                            </button>
                            <div className="social-thumbnail-actions">
                              <button className="social-icon" aria-label={c.moveLeft} disabled={i === 0} onClick={() => reorderAt(i, -1)}><ArrowLeft size={14} /></button>
                              <button className="social-icon" aria-label={c.moveRight} disabled={i === photos.length - 1} onClick={() => reorderAt(i, 1)}><ArrowRight size={14} /></button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>
                  )}
                  {step === 1 && (
                    <div className="social-editor-tools">
                      <button
                        className="social-icon"
                        aria-label={c.moveLeft}
                        disabled={active === 0}
                        onClick={() => reorder(-1)}
                      >
                        <ArrowLeft size={16} />
                      </button>
                      <button
                        className="social-icon"
                        aria-label={c.moveRight}
                        disabled={active === photos.length - 1}
                        onClick={() => reorder(1)}
                      >
                        <ArrowRight size={16} />
                      </button>
                      <button
                        className="social-button"
                        onClick={() => {
                          openFilePicker(photo.key)
                        }}
                      >
                        {c.replace}
                      </button>
                      <button
                        className="social-icon"
                        aria-label={c.remove}
                        onClick={remove}
                      >
                        <Trash2 size={16} />
                      </button>
                      <button
                        className="social-button"
                        disabled={photos.length >= 10}
                        onClick={() => {
                          openFilePicker()
                        }}
                      >
                        <Plus size={16} />
                        {c.addPhotos}
                      </button>
                    </div>
                  )}
                </div>
                <div>
                  <>
                    {step === 3 && (
                      <>
                    <textarea
                      id="social-caption"
                      className="social-input social-textarea"
                      value={caption}
                      maxLength={2200}
                      placeholder={c.captionHint}
                      aria-label={c.caption}
                      onChange={(e) => {
                        setCaption(e.target.value);
                        setDirty(true);
                      }}
                    />
                    <p className="social-muted" style={{ textAlign: "right" }}>
                      {caption.length} / 2,200
                    </p>
                      </>
                    )}
                    {step === 2 && (
                      <>
                    <button
                      type="button"
                      className="social-button social-tag-add-button"
                      disabled={photo.tags.length >= 10}
                      onClick={() => {
                        setPoint({ x: .5, y: .5 });
                        setMoving(null);
                      }}
                    >
                      옷 태그 추가
                    </button>
                    <div className="social-tag-list">
                        {photo.tags.map((tag, i) => (
                          <div className="social-tag-row" key={tag.id}>
                            <span className="social-tag-product-summary">
                              <img src={tag.product.image || "/images/default-product.svg"} alt="" />
                              <span>{tag.product.brand} {tag.product.name}</span>
                            </span>
                            <button
                              className="social-icon"
                              aria-label={c.removeTag}
                              onClick={() =>
                                updatePhoto(photo.key, (p) => ({
                                  ...p,
                                  tags: p.tags.filter((t) => t.id !== tag.id),
                                }))
                              }
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        ))}
                    </div>
                    {point && (
                        <section aria-label={c.closet}>
                          <div className="social-toolbar">
                            <strong>{c.closet}</strong>
                            <button
                              className="social-button"
                              onClick={() => setPoint(null)}
                            >
                              {c.cancel}
                            </button>
                          </div>
                          <input
                            className="social-input"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder={c.search}
                            aria-label={c.search}
                          />
                          <select
                            className="social-input"
                            style={{ marginTop: 8 }}
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            aria-label={c.closet}
                          >
                            <option value="">{c.all}</option>
                            {[...new Set(products.map((p) => p.category))].map(
                              (cat) => (
                                <option key={cat}>{cat}</option>
                              )
                            )}
                          </select>
                          {closet.loading ? (
                            <p className="social-muted">{c.loading}</p>
                          ) : closet.error ? (
                            <div className="social-error">
                              {socialError(closet.error, c)}
                              <button onClick={() => void closet.reload()}>
                                {c.retry}
                              </button>
                            </div>
                          ) : products.length === 0 ? (
                            <p className="social-muted">
                              {c.noItems}
                              <button
                                className="social-button"
                                onClick={() => {
                                  if (dirty) setConfirmExit("register");
                                  else {
                                    onClose();
                                    productForm.openModal();
                                  }
                                }}
                              >
                                {c.register}
                              </button>
                            </p>
                          ) : (
                            <div className="social-picker-list social-tag-product-picker">
                              {filtered.map((p) => (
                                <button
                                  key={p.id}
                                  className="social-picker-product"
                                  onClick={() => selectProduct(p)}
                                >
                                  <img
                                    src={
                                      p.thumbnailImage ||
                                      p.image ||
                                      "/images/default-product.svg"
                                    }
                                    alt=""
                                  />
                                  <span>{p.brand}</span>
                                  <span>{p.name}</span>
                                </button>
                              ))}
                              {!filtered.length && <p>{c.noResults}</p>}
                            </div>
                          )}
                        </section>
                    )}
                      </>
                    )}
                  </>
                </div>
              </div>
              )
            )
          )}
          {error && (
            <div className="social-error" role="alert">
              {error}
            </div>
          )}
          {(busy || preparing) && (
            <div role="status">
              <p className="social-muted">
                {preparing ? c.loading : `${c.uploading} ${progress}%`}
              </p>
              <progress
                className="social-progress"
                value={progress}
                max={100}
              />
            </div>
          )}
        </div>
      </fieldset>
      {confirmExit && (
        <ConfirmDialog
          message={c.leave}
          onCancel={() => setConfirmExit(null)}
          onConfirm={() => {
            const intent = confirmExit;
            setConfirmExit(null);
            if (intent === "discard-photos") {
              discardSelectedPhotos();
              return;
            }
            onClose();
            if (intent === "register") productForm.openModal();
          }}
        />
      )}
    </SocialDialog>
  );
}
