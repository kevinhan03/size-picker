(globalThis["TURBOPACK"] || (globalThis["TURBOPACK"] = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/src/components/ProgressiveImage.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "ProgressiveImage",
    ()=>ProgressiveImage
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
;
const ProgressiveImage = ({ src, thumbnailSrc, alt, className, loading = 'lazy', onError })=>{
    _s();
    const [loadedSrc, setLoadedSrc] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])('');
    const displaySrc = loadedSrc === src ? src : !src ? thumbnailSrc || '' : !thumbnailSrc || thumbnailSrc === src ? src : thumbnailSrc;
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "ProgressiveImage.useEffect": ()=>{
            if (!src || !thumbnailSrc || thumbnailSrc === src) {
                return;
            }
            const preloader = new Image();
            preloader.src = src;
            preloader.onload = ({
                "ProgressiveImage.useEffect": ()=>setLoadedSrc(src)
            })["ProgressiveImage.useEffect"];
            preloader.onerror = ({
                "ProgressiveImage.useEffect": ()=>setLoadedSrc(src)
            })["ProgressiveImage.useEffect"];
            return ({
                "ProgressiveImage.useEffect": ()=>{
                    preloader.onload = null;
                    preloader.onerror = null;
                }
            })["ProgressiveImage.useEffect"];
        }
    }["ProgressiveImage.useEffect"], [
        src,
        thumbnailSrc
    ]);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("img", {
        src: displaySrc || src,
        alt: alt,
        className: className,
        loading: loading,
        decoding: "async",
        onError: onError
    }, void 0, false, {
        fileName: "[project]/src/components/ProgressiveImage.tsx",
        lineNumber: 48,
        columnNumber: 5
    }, ("TURBOPACK compile-time value", void 0));
};
_s(ProgressiveImage, "e6BsAf6d1A0gvlCQsjPuIXU19Ew=");
_c = ProgressiveImage;
var _c;
__turbopack_context__.k.register(_c, "ProgressiveImage");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/components/AdminPage.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "AdminPage",
    ()=>AdminPage
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$ruler$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Ruler$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/ruler.js [app-client] (ecmascript) <export default as Ruler>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$upload$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Upload$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/upload.js [app-client] (ecmascript) <export default as Upload>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ProgressiveImage$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/ProgressiveImage.tsx [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
;
;
;
const CATEGORY_OPTIONS = [
    'Outer',
    'Top',
    'Bottom',
    'Shoes',
    'Acc',
    '단종된 상품(빈티지)'
];
const ITEM_LABEL = '항목';
const normalizeCellText = (value)=>String(value ?? '').replace(/\s+/g, ' ').trim();
const AdminPage = ({ isAdminAuthenticated, isAdminCheckingSession, adminPassword, adminAuthError, isAdminAuthSubmitting, productsError, adminActionError, allProducts, editingProductId, adminEditForm, adminImagePreview, adminSizeChartImage, isAdminAnalyzingTable, adminExtractedTable, isAdminActionLoading, brandRules, isBrandRulesLoading, isBrandRulesSaving, isBrandBackfillRunning, brandBackfillResult, onLogout, onLogin, onBrandRulesReload, onBrandRulesSave, onBrandRulesBackfill, onBrandRulesChange, onPasswordChange, onPasswordKeyDown, onFileUpload, onUpdateProduct, onDeleteProduct, onStartEdit, onCancelEdit, onEditFormChange, onExtractedTableChange, onImageLoadError })=>{
    _s();
    const brandRuleTypes = [
        {
            value: 'domain',
            label: 'domain'
        },
        {
            value: 'url',
            label: 'url'
        },
        {
            value: 'brand',
            label: 'brand'
        },
        {
            value: 'brand_contains',
            label: 'brand_contains'
        }
    ];
    const [tableEditingCell, setTableEditingCell] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const commitTableCell = (value)=>{
        if (!tableEditingCell || !adminExtractedTable) return;
        if (tableEditingCell.kind === 'header') {
            const headers = [
                ...adminExtractedTable.headers
            ];
            headers[tableEditingCell.colIdx] = value;
            onExtractedTableChange({
                ...adminExtractedTable,
                headers
            });
        } else {
            const rows = adminExtractedTable.rows.map((row, ri)=>ri === tableEditingCell.rowIdx ? row.map((cell, ci)=>ci === tableEditingCell.colIdx ? value : cell) : row);
            onExtractedTableChange({
                ...adminExtractedTable,
                rows
            });
        }
        setTableEditingCell(null);
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "min-h-screen bg-black text-white font-sans",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("header", {
                className: "sticky top-0 w-full bg-black/90 backdrop-blur-md border-b border-gray-800 z-40",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "max-w-5xl mx-auto px-4 h-16 flex items-center justify-between",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "flex items-center gap-3",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$ruler$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Ruler$3e$__["Ruler"], {
                                    className: "w-5 h-5 text-orange-500"
                                }, void 0, false, {
                                    fileName: "[project]/src/components/AdminPage.tsx",
                                    lineNumber: 166,
                                    columnNumber: 13
                                }, ("TURBOPACK compile-time value", void 0)),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                                    className: "text-lg font-bold text-white",
                                    children: "관리자 상품 관리"
                                }, void 0, false, {
                                    fileName: "[project]/src/components/AdminPage.tsx",
                                    lineNumber: 167,
                                    columnNumber: 13
                                }, ("TURBOPACK compile-time value", void 0))
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/components/AdminPage.tsx",
                            lineNumber: 165,
                            columnNumber: 11
                        }, ("TURBOPACK compile-time value", void 0)),
                        isAdminAuthenticated ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            onClick: onLogout,
                            className: "px-4 py-2 rounded-lg text-sm font-medium text-gray-300 hover:bg-gray-800",
                            children: "로그아웃"
                        }, void 0, false, {
                            fileName: "[project]/src/components/AdminPage.tsx",
                            lineNumber: 170,
                            columnNumber: 13
                        }, ("TURBOPACK compile-time value", void 0)) : null
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/components/AdminPage.tsx",
                    lineNumber: 164,
                    columnNumber: 9
                }, ("TURBOPACK compile-time value", void 0))
            }, void 0, false, {
                fileName: "[project]/src/components/AdminPage.tsx",
                lineNumber: 163,
                columnNumber: 7
            }, ("TURBOPACK compile-time value", void 0)),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("main", {
                className: "max-w-5xl mx-auto px-4 py-8",
                children: [
                    isAdminCheckingSession ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "text-gray-400",
                        children: "관리자 세션 확인 중..."
                    }, void 0, false, {
                        fileName: "[project]/src/components/AdminPage.tsx",
                        lineNumber: 182,
                        columnNumber: 11
                    }, ("TURBOPACK compile-time value", void 0)) : null,
                    !isAdminCheckingSession && !isAdminAuthenticated ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "max-w-md mx-auto bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-4",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                className: "text-xl font-bold text-white",
                                children: "관리자 로그인"
                            }, void 0, false, {
                                fileName: "[project]/src/components/AdminPage.tsx",
                                lineNumber: 187,
                                columnNumber: 13
                            }, ("TURBOPACK compile-time value", void 0)),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                type: "password",
                                className: "w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500",
                                placeholder: "관리자 비밀번호",
                                value: adminPassword,
                                onChange: (e)=>onPasswordChange(e.target.value),
                                onKeyDown: (event)=>onPasswordKeyDown(event.key)
                            }, void 0, false, {
                                fileName: "[project]/src/components/AdminPage.tsx",
                                lineNumber: 188,
                                columnNumber: 13
                            }, ("TURBOPACK compile-time value", void 0)),
                            adminAuthError ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "text-sm text-red-400",
                                children: adminAuthError
                            }, void 0, false, {
                                fileName: "[project]/src/components/AdminPage.tsx",
                                lineNumber: 196,
                                columnNumber: 31
                            }, ("TURBOPACK compile-time value", void 0)) : null,
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                onClick: onLogin,
                                disabled: isAdminAuthSubmitting,
                                className: `w-full px-4 py-3 rounded-xl text-sm font-bold text-black ${isAdminAuthSubmitting ? 'bg-gray-600 text-gray-300 cursor-not-allowed' : 'bg-orange-500 hover:bg-orange-400'}`,
                                children: isAdminAuthSubmitting ? '로그인 중...' : '로그인'
                            }, void 0, false, {
                                fileName: "[project]/src/components/AdminPage.tsx",
                                lineNumber: 197,
                                columnNumber: 13
                            }, ("TURBOPACK compile-time value", void 0))
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/AdminPage.tsx",
                        lineNumber: 186,
                        columnNumber: 11
                    }, ("TURBOPACK compile-time value", void 0)) : null,
                    !isAdminCheckingSession && isAdminAuthenticated ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "space-y-4",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "bg-gray-900 border border-gray-800 rounded-2xl p-5 space-y-4",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                                        className: "text-lg font-bold text-white",
                                                        children: "브랜드 표준화 규칙"
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/components/AdminPage.tsx",
                                                        lineNumber: 212,
                                                        columnNumber: 19
                                                    }, ("TURBOPACK compile-time value", void 0)),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                        className: "text-sm text-gray-400",
                                                        children: "저장하면 새 상품 추출과 기존 상품 수정에 바로 적용됩니다."
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/components/AdminPage.tsx",
                                                        lineNumber: 213,
                                                        columnNumber: 19
                                                    }, ("TURBOPACK compile-time value", void 0))
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/src/components/AdminPage.tsx",
                                                lineNumber: 211,
                                                columnNumber: 17
                                            }, ("TURBOPACK compile-time value", void 0)),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "flex items-center gap-2",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                        onClick: onBrandRulesBackfill,
                                                        disabled: isBrandRulesLoading || isBrandRulesSaving || isBrandBackfillRunning,
                                                        className: `px-4 py-2 rounded-lg text-sm font-medium ${isBrandRulesLoading || isBrandRulesSaving || isBrandBackfillRunning ? 'bg-gray-800 text-gray-500 cursor-not-allowed' : 'text-orange-200 hover:bg-orange-900/30 border border-orange-500/40'}`,
                                                        children: isBrandBackfillRunning ? '일괄 적용 중...' : '기존 상품 일괄 적용'
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/components/AdminPage.tsx",
                                                        lineNumber: 218,
                                                        columnNumber: 19
                                                    }, ("TURBOPACK compile-time value", void 0)),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                        onClick: onBrandRulesReload,
                                                        disabled: isBrandRulesLoading || isBrandRulesSaving || isBrandBackfillRunning,
                                                        className: `px-3 py-2 rounded-lg text-sm font-medium ${isBrandRulesLoading || isBrandRulesSaving || isBrandBackfillRunning ? 'bg-gray-800 text-gray-500 cursor-not-allowed' : 'text-gray-200 hover:bg-gray-800'}`,
                                                        children: "새로고침"
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/components/AdminPage.tsx",
                                                        lineNumber: 225,
                                                        columnNumber: 19
                                                    }, ("TURBOPACK compile-time value", void 0)),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                        onClick: onBrandRulesSave,
                                                        disabled: isBrandRulesLoading || isBrandRulesSaving || isBrandBackfillRunning,
                                                        className: `px-4 py-2 rounded-lg text-sm font-bold text-black ${isBrandRulesLoading || isBrandRulesSaving || isBrandBackfillRunning ? 'bg-gray-700 text-gray-400 cursor-not-allowed' : 'bg-orange-500 hover:bg-orange-400'}`,
                                                        children: isBrandRulesSaving ? '저장 중...' : '규칙 저장'
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/components/AdminPage.tsx",
                                                        lineNumber: 232,
                                                        columnNumber: 19
                                                    }, ("TURBOPACK compile-time value", void 0))
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/src/components/AdminPage.tsx",
                                                lineNumber: 217,
                                                columnNumber: 17
                                            }, ("TURBOPACK compile-time value", void 0))
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/components/AdminPage.tsx",
                                        lineNumber: 210,
                                        columnNumber: 15
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "overflow-x-auto rounded-xl border border-gray-800",
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("table", {
                                            className: "w-full min-w-[760px] text-sm",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("thead", {
                                                    className: "bg-gray-950/60 border-b border-gray-800 text-gray-300",
                                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                                className: "px-3 py-3 text-left",
                                                                children: "매칭 타입"
                                                            }, void 0, false, {
                                                                fileName: "[project]/src/components/AdminPage.tsx",
                                                                lineNumber: 246,
                                                                columnNumber: 23
                                                            }, ("TURBOPACK compile-time value", void 0)),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                                className: "px-3 py-3 text-left",
                                                                children: "매칭 값"
                                                            }, void 0, false, {
                                                                fileName: "[project]/src/components/AdminPage.tsx",
                                                                lineNumber: 247,
                                                                columnNumber: 23
                                                            }, ("TURBOPACK compile-time value", void 0)),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                                className: "px-3 py-3 text-left",
                                                                children: "표준 브랜드명"
                                                            }, void 0, false, {
                                                                fileName: "[project]/src/components/AdminPage.tsx",
                                                                lineNumber: 248,
                                                                columnNumber: 23
                                                            }, ("TURBOPACK compile-time value", void 0)),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                                className: "px-3 py-3 text-left",
                                                                children: "동작"
                                                            }, void 0, false, {
                                                                fileName: "[project]/src/components/AdminPage.tsx",
                                                                lineNumber: 249,
                                                                columnNumber: 23
                                                            }, ("TURBOPACK compile-time value", void 0))
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/src/components/AdminPage.tsx",
                                                        lineNumber: 245,
                                                        columnNumber: 21
                                                    }, ("TURBOPACK compile-time value", void 0))
                                                }, void 0, false, {
                                                    fileName: "[project]/src/components/AdminPage.tsx",
                                                    lineNumber: 244,
                                                    columnNumber: 19
                                                }, ("TURBOPACK compile-time value", void 0)),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("tbody", {
                                                    children: [
                                                        brandRules.map((rule, index)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                                                                className: "border-b border-gray-800",
                                                                children: [
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                                        className: "px-3 py-3",
                                                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                                                                            className: "w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white",
                                                                            value: rule.matchType,
                                                                            onChange: (e)=>onBrandRulesChange((prev)=>prev.map((item, itemIndex)=>itemIndex === index ? {
                                                                                            ...item,
                                                                                            matchType: e.target.value
                                                                                        } : item)),
                                                                            children: brandRuleTypes.map((option)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                                                    value: option.value,
                                                                                    children: option.label
                                                                                }, option.value, false, {
                                                                                    fileName: "[project]/src/components/AdminPage.tsx",
                                                                                    lineNumber: 270,
                                                                                    columnNumber: 31
                                                                                }, ("TURBOPACK compile-time value", void 0)))
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/src/components/AdminPage.tsx",
                                                                            lineNumber: 256,
                                                                            columnNumber: 27
                                                                        }, ("TURBOPACK compile-time value", void 0))
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/src/components/AdminPage.tsx",
                                                                        lineNumber: 255,
                                                                        columnNumber: 25
                                                                    }, ("TURBOPACK compile-time value", void 0)),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                                        className: "px-3 py-3",
                                                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                                            className: "w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white",
                                                                            value: rule.matchValue,
                                                                            onChange: (e)=>onBrandRulesChange((prev)=>prev.map((item, itemIndex)=>itemIndex === index ? {
                                                                                            ...item,
                                                                                            matchValue: e.target.value
                                                                                        } : item)),
                                                                            placeholder: "afterpray.com / after pray / afterpray"
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/src/components/AdminPage.tsx",
                                                                            lineNumber: 277,
                                                                            columnNumber: 27
                                                                        }, ("TURBOPACK compile-time value", void 0))
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/src/components/AdminPage.tsx",
                                                                        lineNumber: 276,
                                                                        columnNumber: 25
                                                                    }, ("TURBOPACK compile-time value", void 0)),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                                        className: "px-3 py-3",
                                                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                                            className: "w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white",
                                                                            value: rule.canonicalBrand,
                                                                            onChange: (e)=>onBrandRulesChange((prev)=>prev.map((item, itemIndex)=>itemIndex === index ? {
                                                                                            ...item,
                                                                                            canonicalBrand: e.target.value
                                                                                        } : item)),
                                                                            placeholder: "애프터프레이(afterpray)"
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/src/components/AdminPage.tsx",
                                                                            lineNumber: 291,
                                                                            columnNumber: 27
                                                                        }, ("TURBOPACK compile-time value", void 0))
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/src/components/AdminPage.tsx",
                                                                        lineNumber: 290,
                                                                        columnNumber: 25
                                                                    }, ("TURBOPACK compile-time value", void 0)),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                                        className: "px-3 py-3",
                                                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                                            onClick: ()=>onBrandRulesChange((prev)=>prev.filter((_, itemIndex)=>itemIndex !== index)),
                                                                            className: "px-3 py-2 rounded-lg text-sm text-red-300 hover:bg-red-900/30",
                                                                            children: "삭제"
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/src/components/AdminPage.tsx",
                                                                            lineNumber: 307,
                                                                            columnNumber: 27
                                                                        }, ("TURBOPACK compile-time value", void 0))
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/src/components/AdminPage.tsx",
                                                                        lineNumber: 306,
                                                                        columnNumber: 25
                                                                    }, ("TURBOPACK compile-time value", void 0))
                                                                ]
                                                            }, `${rule.matchType}-${index}`, true, {
                                                                fileName: "[project]/src/components/AdminPage.tsx",
                                                                lineNumber: 254,
                                                                columnNumber: 23
                                                            }, ("TURBOPACK compile-time value", void 0))),
                                                        brandRules.length === 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                                colSpan: 4,
                                                                className: "px-3 py-6 text-center text-gray-500",
                                                                children: "등록된 브랜드 규칙이 없습니다."
                                                            }, void 0, false, {
                                                                fileName: "[project]/src/components/AdminPage.tsx",
                                                                lineNumber: 320,
                                                                columnNumber: 25
                                                            }, ("TURBOPACK compile-time value", void 0))
                                                        }, void 0, false, {
                                                            fileName: "[project]/src/components/AdminPage.tsx",
                                                            lineNumber: 319,
                                                            columnNumber: 23
                                                        }, ("TURBOPACK compile-time value", void 0)) : null
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/src/components/AdminPage.tsx",
                                                    lineNumber: 252,
                                                    columnNumber: 19
                                                }, ("TURBOPACK compile-time value", void 0))
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/src/components/AdminPage.tsx",
                                            lineNumber: 243,
                                            columnNumber: 17
                                        }, ("TURBOPACK compile-time value", void 0))
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/AdminPage.tsx",
                                        lineNumber: 242,
                                        columnNumber: 15
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "text-xs text-gray-500",
                                                children: "`domain`: 도메인 기준, `brand`: 추출 브랜드명 정확히 일치, `brand_contains`: 부분 일치, `url`: URL 포함 문자열"
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/AdminPage.tsx",
                                                lineNumber: 330,
                                                columnNumber: 17
                                            }, ("TURBOPACK compile-time value", void 0)),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                onClick: ()=>onBrandRulesChange((prev)=>[
                                                            ...prev,
                                                            {
                                                                matchType: 'domain',
                                                                matchValue: '',
                                                                canonicalBrand: ''
                                                            }
                                                        ]),
                                                className: "px-4 py-2 rounded-lg text-sm font-medium text-gray-200 hover:bg-gray-800",
                                                children: "규칙 추가"
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/AdminPage.tsx",
                                                lineNumber: 333,
                                                columnNumber: 17
                                            }, ("TURBOPACK compile-time value", void 0))
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/components/AdminPage.tsx",
                                        lineNumber: 329,
                                        columnNumber: 15
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    brandBackfillResult ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "rounded-xl border border-gray-800 bg-black/30 p-4 space-y-3",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "flex flex-wrap gap-3 text-sm",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        className: "text-green-400",
                                                        children: [
                                                            "업데이트: ",
                                                            brandBackfillResult.updatedCount
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/src/components/AdminPage.tsx",
                                                        lineNumber: 348,
                                                        columnNumber: 21
                                                    }, ("TURBOPACK compile-time value", void 0)),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        className: "text-gray-400",
                                                        children: [
                                                            "유지: ",
                                                            brandBackfillResult.skippedCount
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/src/components/AdminPage.tsx",
                                                        lineNumber: 349,
                                                        columnNumber: 21
                                                    }, ("TURBOPACK compile-time value", void 0)),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        className: "text-red-400",
                                                        children: [
                                                            "실패: ",
                                                            brandBackfillResult.failedCount
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/src/components/AdminPage.tsx",
                                                        lineNumber: 350,
                                                        columnNumber: 21
                                                    }, ("TURBOPACK compile-time value", void 0))
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/src/components/AdminPage.tsx",
                                                lineNumber: 347,
                                                columnNumber: 19
                                            }, ("TURBOPACK compile-time value", void 0)),
                                            brandBackfillResult.changes.length > 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "max-h-64 overflow-auto rounded-lg border border-gray-800",
                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("table", {
                                                    className: "w-full text-xs",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("thead", {
                                                            className: "bg-gray-950/70 text-gray-400",
                                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                                                                children: [
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                                        className: "px-3 py-2 text-left",
                                                                        children: "상품"
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/src/components/AdminPage.tsx",
                                                                        lineNumber: 357,
                                                                        columnNumber: 29
                                                                    }, ("TURBOPACK compile-time value", void 0)),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                                        className: "px-3 py-2 text-left",
                                                                        children: "이전 브랜드"
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/src/components/AdminPage.tsx",
                                                                        lineNumber: 358,
                                                                        columnNumber: 29
                                                                    }, ("TURBOPACK compile-time value", void 0)),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                                        className: "px-3 py-2 text-left",
                                                                        children: "변경 브랜드"
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/src/components/AdminPage.tsx",
                                                                        lineNumber: 359,
                                                                        columnNumber: 29
                                                                    }, ("TURBOPACK compile-time value", void 0)),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                                        className: "px-3 py-2 text-left",
                                                                        children: "상태"
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/src/components/AdminPage.tsx",
                                                                        lineNumber: 360,
                                                                        columnNumber: 29
                                                                    }, ("TURBOPACK compile-time value", void 0))
                                                                ]
                                                            }, void 0, true, {
                                                                fileName: "[project]/src/components/AdminPage.tsx",
                                                                lineNumber: 356,
                                                                columnNumber: 27
                                                            }, ("TURBOPACK compile-time value", void 0))
                                                        }, void 0, false, {
                                                            fileName: "[project]/src/components/AdminPage.tsx",
                                                            lineNumber: 355,
                                                            columnNumber: 25
                                                        }, ("TURBOPACK compile-time value", void 0)),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("tbody", {
                                                            children: brandBackfillResult.changes.slice(0, 50).map((change)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                                                                    className: "border-t border-gray-800",
                                                                    children: [
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                                            className: "px-3 py-2 text-gray-200",
                                                                            children: change.name || change.id
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/src/components/AdminPage.tsx",
                                                                            lineNumber: 366,
                                                                            columnNumber: 31
                                                                        }, ("TURBOPACK compile-time value", void 0)),
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                                            className: "px-3 py-2 text-gray-400",
                                                                            children: change.previousBrand
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/src/components/AdminPage.tsx",
                                                                            lineNumber: 367,
                                                                            columnNumber: 31
                                                                        }, ("TURBOPACK compile-time value", void 0)),
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                                            className: "px-3 py-2 text-white",
                                                                            children: change.canonicalBrand
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/src/components/AdminPage.tsx",
                                                                            lineNumber: 368,
                                                                            columnNumber: 31
                                                                        }, ("TURBOPACK compile-time value", void 0)),
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                                            className: `px-3 py-2 ${change.updated ? 'text-green-400' : 'text-red-400'}`,
                                                                            children: change.updated ? '완료' : change.error || '실패'
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/src/components/AdminPage.tsx",
                                                                            lineNumber: 369,
                                                                            columnNumber: 31
                                                                        }, ("TURBOPACK compile-time value", void 0))
                                                                    ]
                                                                }, change.id, true, {
                                                                    fileName: "[project]/src/components/AdminPage.tsx",
                                                                    lineNumber: 365,
                                                                    columnNumber: 29
                                                                }, ("TURBOPACK compile-time value", void 0)))
                                                        }, void 0, false, {
                                                            fileName: "[project]/src/components/AdminPage.tsx",
                                                            lineNumber: 363,
                                                            columnNumber: 25
                                                        }, ("TURBOPACK compile-time value", void 0))
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/src/components/AdminPage.tsx",
                                                    lineNumber: 354,
                                                    columnNumber: 23
                                                }, ("TURBOPACK compile-time value", void 0))
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/AdminPage.tsx",
                                                lineNumber: 353,
                                                columnNumber: 21
                                            }, ("TURBOPACK compile-time value", void 0)) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "text-xs text-gray-500",
                                                children: "변경된 기존 상품이 없습니다."
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/AdminPage.tsx",
                                                lineNumber: 378,
                                                columnNumber: 21
                                            }, ("TURBOPACK compile-time value", void 0))
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/components/AdminPage.tsx",
                                        lineNumber: 346,
                                        columnNumber: 17
                                    }, ("TURBOPACK compile-time value", void 0)) : null
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/AdminPage.tsx",
                                lineNumber: 209,
                                columnNumber: 13
                            }, ("TURBOPACK compile-time value", void 0)),
                            productsError ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "bg-orange-900/40 border border-orange-500 text-orange-200 px-4 py-3 rounded-xl",
                                children: productsError
                            }, void 0, false, {
                                fileName: "[project]/src/components/AdminPage.tsx",
                                lineNumber: 385,
                                columnNumber: 15
                            }, ("TURBOPACK compile-time value", void 0)) : null,
                            adminActionError ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "bg-red-900/40 border border-red-500 text-red-200 px-4 py-3 rounded-xl",
                                children: adminActionError
                            }, void 0, false, {
                                fileName: "[project]/src/components/AdminPage.tsx",
                                lineNumber: 390,
                                columnNumber: 15
                            }, ("TURBOPACK compile-time value", void 0)) : null,
                            allProducts.length === 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "text-center py-16 text-gray-500",
                                children: "등록된 상품이 없습니다."
                            }, void 0, false, {
                                fileName: "[project]/src/components/AdminPage.tsx",
                                lineNumber: 396,
                                columnNumber: 15
                            }, ("TURBOPACK compile-time value", void 0)) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "space-y-3",
                                children: allProducts.map((product)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "ui-product-card bg-gray-900 border border-gray-800 rounded-2xl p-4",
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "flex flex-col sm:flex-row sm:items-start gap-4",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "w-20 h-20 bg-white rounded-xl p-2 border border-gray-700 flex items-center justify-center overflow-hidden shrink-0",
                                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ProgressiveImage$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ProgressiveImage"], {
                                                        src: product.image,
                                                        thumbnailSrc: product.thumbnailImage,
                                                        alt: product.name,
                                                        className: "max-w-full max-h-full object-contain",
                                                        onError: onImageLoadError
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/components/AdminPage.tsx",
                                                        lineNumber: 403,
                                                        columnNumber: 25
                                                    }, ("TURBOPACK compile-time value", void 0))
                                                }, void 0, false, {
                                                    fileName: "[project]/src/components/AdminPage.tsx",
                                                    lineNumber: 402,
                                                    columnNumber: 23
                                                }, ("TURBOPACK compile-time value", void 0)),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "flex-1 min-w-0",
                                                    children: editingProductId === product.id ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "space-y-3",
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                className: "grid grid-cols-1 sm:grid-cols-2 gap-3",
                                                                children: [
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                                        className: "w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg",
                                                                        value: adminEditForm.brand,
                                                                        onChange: (e)=>onEditFormChange((prev)=>({
                                                                                    ...prev,
                                                                                    brand: e.target.value
                                                                                })),
                                                                        placeholder: "브랜드명"
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/src/components/AdminPage.tsx",
                                                                        lineNumber: 409,
                                                                        columnNumber: 31
                                                                    }, ("TURBOPACK compile-time value", void 0)),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                                        className: "w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg",
                                                                        value: adminEditForm.name,
                                                                        onChange: (e)=>onEditFormChange((prev)=>({
                                                                                    ...prev,
                                                                                    name: e.target.value
                                                                                })),
                                                                        placeholder: "상품명"
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/src/components/AdminPage.tsx",
                                                                        lineNumber: 410,
                                                                        columnNumber: 31
                                                                    }, ("TURBOPACK compile-time value", void 0))
                                                                ]
                                                            }, void 0, true, {
                                                                fileName: "[project]/src/components/AdminPage.tsx",
                                                                lineNumber: 408,
                                                                columnNumber: 29
                                                            }, ("TURBOPACK compile-time value", void 0)),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                className: "grid grid-cols-1 sm:grid-cols-2 gap-3",
                                                                children: [
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                                                                        className: `w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg ${adminEditForm.category ? 'text-white' : 'text-gray-400'}`,
                                                                        value: adminEditForm.category,
                                                                        onChange: (e)=>onEditFormChange((prev)=>({
                                                                                    ...prev,
                                                                                    category: e.target.value
                                                                                })),
                                                                        children: [
                                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                                                value: "",
                                                                                children: "카테고리"
                                                                            }, void 0, false, {
                                                                                fileName: "[project]/src/components/AdminPage.tsx",
                                                                                lineNumber: 418,
                                                                                columnNumber: 33
                                                                            }, ("TURBOPACK compile-time value", void 0)),
                                                                            CATEGORY_OPTIONS.map((category)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                                                    value: category,
                                                                                    children: category
                                                                                }, category, false, {
                                                                                    fileName: "[project]/src/components/AdminPage.tsx",
                                                                                    lineNumber: 420,
                                                                                    columnNumber: 35
                                                                                }, ("TURBOPACK compile-time value", void 0)))
                                                                        ]
                                                                    }, void 0, true, {
                                                                        fileName: "[project]/src/components/AdminPage.tsx",
                                                                        lineNumber: 413,
                                                                        columnNumber: 31
                                                                    }, ("TURBOPACK compile-time value", void 0)),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                                        className: "w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg",
                                                                        value: adminEditForm.url,
                                                                        onChange: (e)=>onEditFormChange((prev)=>({
                                                                                    ...prev,
                                                                                    url: e.target.value
                                                                                })),
                                                                        placeholder: "공식 URL (선택)"
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/src/components/AdminPage.tsx",
                                                                        lineNumber: 423,
                                                                        columnNumber: 31
                                                                    }, ("TURBOPACK compile-time value", void 0))
                                                                ]
                                                            }, void 0, true, {
                                                                fileName: "[project]/src/components/AdminPage.tsx",
                                                                lineNumber: 412,
                                                                columnNumber: 29
                                                            }, ("TURBOPACK compile-time value", void 0)),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                className: "grid grid-cols-1 sm:grid-cols-2 gap-3",
                                                                children: [
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                        className: "space-y-2",
                                                                        children: [
                                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                                                className: "text-xs text-gray-400",
                                                                                children: "상품 이미지 교체"
                                                                            }, void 0, false, {
                                                                                fileName: "[project]/src/components/AdminPage.tsx",
                                                                                lineNumber: 427,
                                                                                columnNumber: 33
                                                                            }, ("TURBOPACK compile-time value", void 0)),
                                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                                                className: "cursor-pointer w-full h-28 bg-gray-800 border-2 border-dashed border-gray-700 rounded-lg flex items-center justify-center overflow-hidden",
                                                                                children: [
                                                                                    adminImagePreview ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("img", {
                                                                                        src: adminImagePreview,
                                                                                        className: "h-full object-contain"
                                                                                    }, void 0, false, {
                                                                                        fileName: "[project]/src/components/AdminPage.tsx",
                                                                                        lineNumber: 429,
                                                                                        columnNumber: 56
                                                                                    }, ("TURBOPACK compile-time value", void 0)) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$upload$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Upload$3e$__["Upload"], {
                                                                                        className: "w-6 h-6 text-gray-500"
                                                                                    }, void 0, false, {
                                                                                        fileName: "[project]/src/components/AdminPage.tsx",
                                                                                        lineNumber: 429,
                                                                                        columnNumber: 124
                                                                                    }, ("TURBOPACK compile-time value", void 0)),
                                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                                                        type: "file",
                                                                                        className: "hidden",
                                                                                        accept: "image/*",
                                                                                        onChange: (e)=>onFileUpload(e, 'product')
                                                                                    }, void 0, false, {
                                                                                        fileName: "[project]/src/components/AdminPage.tsx",
                                                                                        lineNumber: 430,
                                                                                        columnNumber: 35
                                                                                    }, ("TURBOPACK compile-time value", void 0))
                                                                                ]
                                                                            }, void 0, true, {
                                                                                fileName: "[project]/src/components/AdminPage.tsx",
                                                                                lineNumber: 428,
                                                                                columnNumber: 33
                                                                            }, ("TURBOPACK compile-time value", void 0))
                                                                        ]
                                                                    }, void 0, true, {
                                                                        fileName: "[project]/src/components/AdminPage.tsx",
                                                                        lineNumber: 426,
                                                                        columnNumber: 31
                                                                    }, ("TURBOPACK compile-time value", void 0)),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                        className: "space-y-2",
                                                                        children: [
                                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                                                className: "text-xs text-gray-400",
                                                                                children: "사이즈표 이미지 재분석"
                                                                            }, void 0, false, {
                                                                                fileName: "[project]/src/components/AdminPage.tsx",
                                                                                lineNumber: 434,
                                                                                columnNumber: 33
                                                                            }, ("TURBOPACK compile-time value", void 0)),
                                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                                                className: "cursor-pointer w-full h-28 bg-gray-800 border-2 border-dashed border-gray-700 rounded-lg flex items-center justify-center overflow-hidden",
                                                                                children: [
                                                                                    adminSizeChartImage ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("img", {
                                                                                        src: adminSizeChartImage,
                                                                                        className: "h-full object-contain"
                                                                                    }, void 0, false, {
                                                                                        fileName: "[project]/src/components/AdminPage.tsx",
                                                                                        lineNumber: 436,
                                                                                        columnNumber: 58
                                                                                    }, ("TURBOPACK compile-time value", void 0)) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$upload$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Upload$3e$__["Upload"], {
                                                                                        className: "w-6 h-6 text-gray-500"
                                                                                    }, void 0, false, {
                                                                                        fileName: "[project]/src/components/AdminPage.tsx",
                                                                                        lineNumber: 436,
                                                                                        columnNumber: 128
                                                                                    }, ("TURBOPACK compile-time value", void 0)),
                                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                                                        type: "file",
                                                                                        className: "hidden",
                                                                                        accept: "image/*",
                                                                                        onChange: (e)=>onFileUpload(e, 'chart')
                                                                                    }, void 0, false, {
                                                                                        fileName: "[project]/src/components/AdminPage.tsx",
                                                                                        lineNumber: 437,
                                                                                        columnNumber: 35
                                                                                    }, ("TURBOPACK compile-time value", void 0))
                                                                                ]
                                                                            }, void 0, true, {
                                                                                fileName: "[project]/src/components/AdminPage.tsx",
                                                                                lineNumber: 435,
                                                                                columnNumber: 33
                                                                            }, ("TURBOPACK compile-time value", void 0))
                                                                        ]
                                                                    }, void 0, true, {
                                                                        fileName: "[project]/src/components/AdminPage.tsx",
                                                                        lineNumber: 433,
                                                                        columnNumber: 31
                                                                    }, ("TURBOPACK compile-time value", void 0))
                                                                ]
                                                            }, void 0, true, {
                                                                fileName: "[project]/src/components/AdminPage.tsx",
                                                                lineNumber: 425,
                                                                columnNumber: 29
                                                            }, ("TURBOPACK compile-time value", void 0)),
                                                            isAdminAnalyzingTable ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                className: "text-xs text-orange-400",
                                                                children: "사이즈표 재분석 중..."
                                                            }, void 0, false, {
                                                                fileName: "[project]/src/components/AdminPage.tsx",
                                                                lineNumber: 441,
                                                                columnNumber: 54
                                                            }, ("TURBOPACK compile-time value", void 0)) : null,
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                className: "overflow-x-auto rounded-lg border border-gray-700",
                                                                children: adminExtractedTable?.headers?.length ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("table", {
                                                                    className: "w-full text-xs text-left",
                                                                    children: [
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("thead", {
                                                                            className: "border-b border-gray-700",
                                                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                                                                                children: adminExtractedTable.headers.map((header, colIdx)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                                                        onClick: ()=>setTableEditingCell({
                                                                                                kind: 'header',
                                                                                                colIdx
                                                                                            }),
                                                                                        className: `px-3 py-2 font-semibold whitespace-nowrap cursor-pointer hover:bg-gray-800 transition ${normalizeCellText(header) === ITEM_LABEL ? 'text-gray-200' : 'text-green-400'} ${colIdx === 0 ? 'border-r border-gray-700' : ''}`,
                                                                                        children: tableEditingCell?.kind === 'header' && tableEditingCell.colIdx === colIdx ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                                                            autoFocus: true,
                                                                                            defaultValue: header,
                                                                                            onBlur: (e)=>commitTableCell(e.target.value),
                                                                                            onKeyDown: (e)=>{
                                                                                                if (e.key === 'Enter') commitTableCell(e.target.value);
                                                                                                if (e.key === 'Escape') setTableEditingCell(null);
                                                                                            },
                                                                                            onClick: (e)=>e.stopPropagation(),
                                                                                            className: "bg-transparent border-b border-orange-400 outline-none w-full min-w-[40px] text-white"
                                                                                        }, void 0, false, {
                                                                                            fileName: "[project]/src/components/AdminPage.tsx",
                                                                                            lineNumber: 454,
                                                                                            columnNumber: 45
                                                                                        }, ("TURBOPACK compile-time value", void 0)) : header
                                                                                    }, colIdx, false, {
                                                                                        fileName: "[project]/src/components/AdminPage.tsx",
                                                                                        lineNumber: 448,
                                                                                        columnNumber: 41
                                                                                    }, ("TURBOPACK compile-time value", void 0)))
                                                                            }, void 0, false, {
                                                                                fileName: "[project]/src/components/AdminPage.tsx",
                                                                                lineNumber: 446,
                                                                                columnNumber: 37
                                                                            }, ("TURBOPACK compile-time value", void 0))
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/src/components/AdminPage.tsx",
                                                                            lineNumber: 445,
                                                                            columnNumber: 35
                                                                        }, ("TURBOPACK compile-time value", void 0)),
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("tbody", {
                                                                            children: adminExtractedTable.rows.map((row, rowIdx)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                                                                                    className: "border-b border-gray-800",
                                                                                    children: row.map((cell, colIdx)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                                                            onClick: ()=>setTableEditingCell({
                                                                                                    kind: 'row',
                                                                                                    rowIdx,
                                                                                                    colIdx
                                                                                                }),
                                                                                            className: `px-3 py-2 whitespace-nowrap cursor-pointer hover:bg-gray-800 transition ${colIdx === 0 ? 'text-gray-200 border-r border-gray-700' : 'text-gray-400'}`,
                                                                                            children: tableEditingCell?.kind === 'row' && tableEditingCell.rowIdx === rowIdx && tableEditingCell.colIdx === colIdx ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                                                                autoFocus: true,
                                                                                                defaultValue: cell,
                                                                                                onBlur: (e)=>commitTableCell(e.target.value),
                                                                                                onKeyDown: (e)=>{
                                                                                                    if (e.key === 'Enter') commitTableCell(e.target.value);
                                                                                                    if (e.key === 'Escape') setTableEditingCell(null);
                                                                                                },
                                                                                                onClick: (e)=>e.stopPropagation(),
                                                                                                className: "bg-transparent border-b border-orange-400 outline-none w-full min-w-[40px] text-white"
                                                                                            }, void 0, false, {
                                                                                                fileName: "[project]/src/components/AdminPage.tsx",
                                                                                                lineNumber: 480,
                                                                                                columnNumber: 47
                                                                                            }, ("TURBOPACK compile-time value", void 0)) : cell
                                                                                        }, colIdx, false, {
                                                                                            fileName: "[project]/src/components/AdminPage.tsx",
                                                                                            lineNumber: 474,
                                                                                            columnNumber: 43
                                                                                        }, ("TURBOPACK compile-time value", void 0)))
                                                                                }, rowIdx, false, {
                                                                                    fileName: "[project]/src/components/AdminPage.tsx",
                                                                                    lineNumber: 472,
                                                                                    columnNumber: 39
                                                                                }, ("TURBOPACK compile-time value", void 0)))
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/src/components/AdminPage.tsx",
                                                                            lineNumber: 470,
                                                                            columnNumber: 35
                                                                        }, ("TURBOPACK compile-time value", void 0))
                                                                    ]
                                                                }, void 0, true, {
                                                                    fileName: "[project]/src/components/AdminPage.tsx",
                                                                    lineNumber: 444,
                                                                    columnNumber: 33
                                                                }, ("TURBOPACK compile-time value", void 0)) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                    className: "px-3 py-4 text-xs text-gray-500",
                                                                    children: "사이즈표 데이터가 없습니다."
                                                                }, void 0, false, {
                                                                    fileName: "[project]/src/components/AdminPage.tsx",
                                                                    lineNumber: 499,
                                                                    columnNumber: 33
                                                                }, ("TURBOPACK compile-time value", void 0))
                                                            }, void 0, false, {
                                                                fileName: "[project]/src/components/AdminPage.tsx",
                                                                lineNumber: 442,
                                                                columnNumber: 29
                                                            }, ("TURBOPACK compile-time value", void 0)),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                className: "flex items-center gap-2",
                                                                children: [
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                                        onClick: ()=>onUpdateProduct(product.id),
                                                                        disabled: isAdminActionLoading || isAdminAnalyzingTable,
                                                                        className: `px-4 py-2 rounded-lg text-sm font-bold text-black ${isAdminActionLoading || isAdminAnalyzingTable ? 'bg-gray-700 text-gray-400 cursor-not-allowed' : 'bg-orange-500 hover:bg-orange-400'}`,
                                                                        children: "저장"
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/src/components/AdminPage.tsx",
                                                                        lineNumber: 503,
                                                                        columnNumber: 31
                                                                    }, ("TURBOPACK compile-time value", void 0)),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                                        onClick: onCancelEdit,
                                                                        className: "px-4 py-2 rounded-lg text-sm font-medium text-gray-300 hover:bg-gray-800",
                                                                        children: "취소"
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/src/components/AdminPage.tsx",
                                                                        lineNumber: 504,
                                                                        columnNumber: 31
                                                                    }, ("TURBOPACK compile-time value", void 0))
                                                                ]
                                                            }, void 0, true, {
                                                                fileName: "[project]/src/components/AdminPage.tsx",
                                                                lineNumber: 502,
                                                                columnNumber: 29
                                                            }, ("TURBOPACK compile-time value", void 0))
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/src/components/AdminPage.tsx",
                                                        lineNumber: 407,
                                                        columnNumber: 27
                                                    }, ("TURBOPACK compile-time value", void 0)) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3",
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                children: [
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                                        className: "text-xs font-bold text-orange-500 uppercase tracking-wide",
                                                                        children: product.brand
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/src/components/AdminPage.tsx",
                                                                        lineNumber: 510,
                                                                        columnNumber: 31
                                                                    }, ("TURBOPACK compile-time value", void 0)),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                                        className: "text-base font-semibold text-white",
                                                                        children: product.name
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/src/components/AdminPage.tsx",
                                                                        lineNumber: 511,
                                                                        columnNumber: 31
                                                                    }, ("TURBOPACK compile-time value", void 0)),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                                        className: "text-sm text-gray-400 mt-1",
                                                                        children: product.category
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/src/components/AdminPage.tsx",
                                                                        lineNumber: 512,
                                                                        columnNumber: 31
                                                                    }, ("TURBOPACK compile-time value", void 0)),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                                        className: "text-sm text-gray-500 mt-1 break-all",
                                                                        children: product.url && product.url !== '#' ? product.url : 'URL 없음'
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/src/components/AdminPage.tsx",
                                                                        lineNumber: 513,
                                                                        columnNumber: 31
                                                                    }, ("TURBOPACK compile-time value", void 0))
                                                                ]
                                                            }, void 0, true, {
                                                                fileName: "[project]/src/components/AdminPage.tsx",
                                                                lineNumber: 509,
                                                                columnNumber: 29
                                                            }, ("TURBOPACK compile-time value", void 0)),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                className: "flex items-center gap-2",
                                                                children: [
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                                        onClick: ()=>onStartEdit(product),
                                                                        className: "px-3 py-2 rounded-lg text-sm font-medium text-gray-200 hover:bg-gray-800",
                                                                        children: "수정"
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/src/components/AdminPage.tsx",
                                                                        lineNumber: 516,
                                                                        columnNumber: 31
                                                                    }, ("TURBOPACK compile-time value", void 0)),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                                        onClick: ()=>onDeleteProduct(product.id),
                                                                        disabled: isAdminActionLoading,
                                                                        className: `px-3 py-2 rounded-lg text-sm font-medium ${isAdminActionLoading ? 'text-gray-500 bg-gray-800 cursor-not-allowed' : 'text-red-300 hover:bg-red-900/30'}`,
                                                                        children: "삭제"
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/src/components/AdminPage.tsx",
                                                                        lineNumber: 517,
                                                                        columnNumber: 31
                                                                    }, ("TURBOPACK compile-time value", void 0))
                                                                ]
                                                            }, void 0, true, {
                                                                fileName: "[project]/src/components/AdminPage.tsx",
                                                                lineNumber: 515,
                                                                columnNumber: 29
                                                            }, ("TURBOPACK compile-time value", void 0))
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/src/components/AdminPage.tsx",
                                                        lineNumber: 508,
                                                        columnNumber: 27
                                                    }, ("TURBOPACK compile-time value", void 0))
                                                }, void 0, false, {
                                                    fileName: "[project]/src/components/AdminPage.tsx",
                                                    lineNumber: 405,
                                                    columnNumber: 23
                                                }, ("TURBOPACK compile-time value", void 0))
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/src/components/AdminPage.tsx",
                                            lineNumber: 401,
                                            columnNumber: 21
                                        }, ("TURBOPACK compile-time value", void 0))
                                    }, product.id, false, {
                                        fileName: "[project]/src/components/AdminPage.tsx",
                                        lineNumber: 400,
                                        columnNumber: 19
                                    }, ("TURBOPACK compile-time value", void 0)))
                            }, void 0, false, {
                                fileName: "[project]/src/components/AdminPage.tsx",
                                lineNumber: 398,
                                columnNumber: 15
                            }, ("TURBOPACK compile-time value", void 0))
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/AdminPage.tsx",
                        lineNumber: 208,
                        columnNumber: 11
                    }, ("TURBOPACK compile-time value", void 0)) : null
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/AdminPage.tsx",
                lineNumber: 180,
                columnNumber: 7
            }, ("TURBOPACK compile-time value", void 0))
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/AdminPage.tsx",
        lineNumber: 162,
        columnNumber: 5
    }, ("TURBOPACK compile-time value", void 0));
};
_s(AdminPage, "Rr25BxiSnUhG/X7cbB+hfMNfvOg=");
_c = AdminPage;
var _c;
__turbopack_context__.k.register(_c, "AdminPage");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/utils/image.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "cropImageByBoundingBox",
    ()=>cropImageByBoundingBox,
    "dataUrlToFile",
    ()=>dataUrlToFile,
    "getFileExtension",
    ()=>getFileExtension,
    "normalizeCaptureBoundingBox",
    ()=>normalizeCaptureBoundingBox,
    "readFileAsDataUrl",
    ()=>readFileAsDataUrl,
    "resizeImage",
    ()=>resizeImage
]);
const readFileAsDataUrl = (file)=>new Promise((resolve, reject)=>{
        const reader = new FileReader();
        reader.onload = ()=>resolve(String(reader.result || ''));
        reader.onerror = ()=>reject(new Error('Failed to read file'));
        reader.readAsDataURL(file);
    });
const getFileExtension = (file)=>{
    const fromName = file.name.split('.').pop()?.toLowerCase();
    if (fromName) return fromName;
    const mimeMap = {
        'image/jpeg': 'jpg',
        'image/jpg': 'jpg',
        'image/png': 'png',
        'image/webp': 'webp',
        'image/gif': 'gif'
    };
    return mimeMap[file.type] || 'bin';
};
const dataUrlToFile = (dataUrl, fallbackName)=>{
    const [meta, base64] = dataUrl.split(',');
    const mimeType = meta.match(/data:(.*?);base64/)?.[1] || 'application/octet-stream';
    const binary = atob(base64 || '');
    const bytes = new Uint8Array(binary.length);
    for(let i = 0; i < binary.length; i += 1)bytes[i] = binary.charCodeAt(i);
    const extension = mimeType.split('/')[1] || 'bin';
    return new File([
        bytes
    ], `${fallbackName}.${extension}`, {
        type: mimeType
    });
};
const resizeImage = (base64Str, maxWidth = 300)=>new Promise((resolve)=>{
        const img = new Image();
        img.src = base64Str;
        img.onload = ()=>{
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;
            if (width > maxWidth) {
                height *= maxWidth / width;
                width = maxWidth;
            }
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.drawImage(img, 0, 0, width, height);
                resolve(canvas.toDataURL('image/png'));
            } else {
                resolve(base64Str);
            }
        };
        img.onerror = ()=>resolve(base64Str);
    });
const normalizeCaptureBoundingBox = (value)=>{
    if (!value || typeof value !== 'object') return null;
    const box = value;
    const x = Math.max(0, Math.min(1000, Math.round(Number(box.x) || 0)));
    const y = Math.max(0, Math.min(1000, Math.round(Number(box.y) || 0)));
    const width = Math.max(0, Math.min(1000 - x, Math.round(Number(box.width) || 0)));
    const height = Math.max(0, Math.min(1000 - y, Math.round(Number(box.height) || 0)));
    if (width <= 0 || height <= 0) return null;
    return {
        x,
        y,
        width,
        height
    };
};
const cropImageByBoundingBox = (dataUrl, box)=>new Promise((resolve)=>{
        if (!dataUrl || !box) {
            resolve('');
            return;
        }
        const img = new Image();
        img.src = dataUrl;
        img.onload = ()=>{
            const sourceWidth = img.width;
            const sourceHeight = img.height;
            if (!sourceWidth || !sourceHeight) {
                resolve('');
                return;
            }
            const left = Math.max(0, Math.floor(box.x / 1000 * sourceWidth));
            const top = Math.max(0, Math.floor(box.y / 1000 * sourceHeight));
            const cropWidth = Math.max(1, Math.floor(box.width / 1000 * sourceWidth));
            const cropHeight = Math.max(1, Math.floor(box.height / 1000 * sourceHeight));
            const width = Math.min(cropWidth, sourceWidth - left);
            const height = Math.min(cropHeight, sourceHeight - top);
            if (width <= 1 || height <= 1) {
                resolve('');
                return;
            }
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                resolve('');
                return;
            }
            ctx.drawImage(img, left, top, width, height, 0, 0, width, height);
            resolve(canvas.toDataURL('image/png'));
        };
        img.onerror = ()=>resolve('');
    });
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/constants/index.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "CATEGORY_OPTIONS",
    ()=>CATEGORY_OPTIONS,
    "CATEGORY_OPTION_BY_LOWER",
    ()=>CATEGORY_OPTION_BY_LOWER,
    "CLOTHING_SIZE_ROWS_BY_GENDER",
    ()=>CLOTHING_SIZE_ROWS_BY_GENDER,
    "DEFAULT_PRODUCT_PLACEHOLDER",
    ()=>DEFAULT_PRODUCT_PLACEHOLDER,
    "DUPLICATE_PRODUCT_MESSAGE",
    ()=>DUPLICATE_PRODUCT_MESSAGE,
    "EMPTY_FORM_DATA",
    ()=>EMPTY_FORM_DATA,
    "ITEM_LABEL",
    ()=>ITEM_LABEL,
    "MAX_PRODUCT_IMAGE_CANDIDATES",
    ()=>MAX_PRODUCT_IMAGE_CANDIDATES,
    "MEASUREMENT_ALIAS_MAP",
    ()=>MEASUREMENT_ALIAS_MAP,
    "MEASUREMENT_LABEL_HINT_PATTERN",
    ()=>MEASUREMENT_LABEL_HINT_PATTERN,
    "SHOE_SIZE_ROWS_BY_GENDER",
    ()=>SHOE_SIZE_ROWS_BY_GENDER,
    "SIZE_COLUMN_LABEL",
    ()=>SIZE_COLUMN_LABEL,
    "SIZE_REGION_OPTIONS",
    ()=>SIZE_REGION_OPTIONS,
    "STORAGE_BUCKET",
    ()=>STORAGE_BUCKET,
    "STORAGE_PREFIX",
    ()=>STORAGE_PREFIX,
    "SUPABASE_ANON_KEY",
    ()=>SUPABASE_ANON_KEY,
    "SUPABASE_URL",
    ()=>SUPABASE_URL,
    "TOTAL_LENGTH_ALIAS_KEYS",
    ()=>TOTAL_LENGTH_ALIAS_KEYS,
    "TOTAL_LENGTH_LABEL",
    ()=>TOTAL_LENGTH_LABEL
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = /*#__PURE__*/ __turbopack_context__.i("[project]/node_modules/next/dist/build/polyfills/process.js [app-client] (ecmascript)");
const MAX_PRODUCT_IMAGE_CANDIDATES = 24;
const DUPLICATE_PRODUCT_MESSAGE = '이미 등록된 상품입니다';
const NEXT_PUBLIC_SUPABASE_URL = String(("TURBOPACK compile-time value", "https://sforepkezedpjlasqfnn.supabase.co") || '').trim();
const NEXT_PUBLIC_SUPABASE_ANON_KEY = String(("TURBOPACK compile-time value", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNmb3JlcGtlemVkcGpsYXNxZm5uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQzODM2MjIsImV4cCI6MjA4OTk1OTYyMn0.iYTS6AhYEGGuJLGD8zOl1tZXcPEj3lOj0yhvHameOfY") || '').trim();
const VITE_SUPABASE_URL = String(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].env.VITE_SUPABASE_URL || '').trim();
const VITE_SUPABASE_ANON_KEY = String(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].env.VITE_SUPABASE_ANON_KEY || '').trim();
const SUPABASE_URL = NEXT_PUBLIC_SUPABASE_URL || VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = NEXT_PUBLIC_SUPABASE_ANON_KEY || VITE_SUPABASE_ANON_KEY;
const STORAGE_BUCKET = 'product-assets';
const STORAGE_PREFIX = 'submissions/';
const DEFAULT_PRODUCT_PLACEHOLDER = '/images/default-product.svg';
const CATEGORY_OPTIONS = [
    'Outer',
    'Top',
    'Bottom',
    'Shoes',
    'Acc',
    '단종된 상품(빈티지)'
];
const CATEGORY_OPTION_BY_LOWER = {
    outer: 'Outer',
    top: 'Top',
    bottom: 'Bottom',
    shoes: 'Shoes',
    acc: 'Acc',
    '단종된 상품(빈티지)': '단종된 상품(빈티지)'
};
const SIZE_REGION_OPTIONS = [
    {
        key: 'kr',
        label: 'Korea'
    },
    {
        key: 'jp',
        label: 'Japan'
    },
    {
        key: 'us',
        label: 'US'
    },
    {
        key: 'eu',
        label: 'EU'
    },
    {
        key: 'uk',
        label: 'UK'
    }
];
const CLOTHING_SIZE_ROWS_BY_GENDER = {
    men: [
        {
            label: 'XS',
            kr: '85',
            jp: 'XS',
            us: '34',
            eu: '44',
            uk: '34'
        },
        {
            label: 'S',
            kr: '90',
            jp: 'S',
            us: '36-38',
            eu: '46-48',
            uk: '36-38'
        },
        {
            label: 'M',
            kr: '95',
            jp: 'M',
            us: '40',
            eu: '50',
            uk: '40'
        },
        {
            label: 'L',
            kr: '100',
            jp: 'L',
            us: '42',
            eu: '52',
            uk: '42'
        },
        {
            label: 'XL',
            kr: '105',
            jp: 'XL',
            us: '44',
            eu: '54',
            uk: '44'
        },
        {
            label: 'XXL',
            kr: '110',
            jp: 'XXL',
            us: '46',
            eu: '56',
            uk: '46'
        },
        {
            label: '3XL',
            kr: '115',
            jp: '3XL',
            us: '48',
            eu: '58',
            uk: '48'
        }
    ],
    women: [
        {
            label: 'XXS',
            kr: '60',
            jp: 'XXS',
            us: '0',
            eu: '30',
            uk: '2'
        },
        {
            label: 'XS',
            kr: '65',
            jp: 'XS',
            us: '0-2',
            eu: '32-34',
            uk: '4-6'
        },
        {
            label: 'S',
            kr: '70',
            jp: 'S',
            us: '4-6',
            eu: '36-38',
            uk: '8-10'
        },
        {
            label: 'M',
            kr: '75',
            jp: 'M',
            us: '8-10',
            eu: '40-42',
            uk: '12-14'
        },
        {
            label: 'L',
            kr: '80',
            jp: 'L',
            us: '12-14',
            eu: '44-46',
            uk: '16-18'
        },
        {
            label: 'XL',
            kr: '85',
            jp: 'XL',
            us: '16-18',
            eu: '48-50',
            uk: '20-22'
        },
        {
            label: 'XXL',
            kr: '90',
            jp: 'XXL',
            us: '20-22',
            eu: '52-54',
            uk: '24-26'
        }
    ]
};
const SHOE_SIZE_ROWS_BY_GENDER = {
    men: [
        {
            label: '230',
            kr: '230',
            jp: '23.0',
            us: '4',
            eu: '36',
            uk: '3.5'
        },
        {
            label: '235',
            kr: '235',
            jp: '23.5',
            us: '4.5',
            eu: '36.5',
            uk: '4'
        },
        {
            label: '240',
            kr: '240',
            jp: '24.0',
            us: '5.5',
            eu: '38',
            uk: '5'
        },
        {
            label: '245',
            kr: '245',
            jp: '24.5',
            us: '6.5',
            eu: '39',
            uk: '6'
        },
        {
            label: '250',
            kr: '250',
            jp: '25.0',
            us: '7',
            eu: '40',
            uk: '6'
        },
        {
            label: '255',
            kr: '255',
            jp: '25.5',
            us: '7.5',
            eu: '40.5',
            uk: '6.5'
        },
        {
            label: '260',
            kr: '260',
            jp: '26.0',
            us: '8',
            eu: '41',
            uk: '7'
        },
        {
            label: '265',
            kr: '265',
            jp: '26.5',
            us: '8.5',
            eu: '42',
            uk: '7.5'
        },
        {
            label: '270',
            kr: '270',
            jp: '27.0',
            us: '9',
            eu: '42.5',
            uk: '8'
        },
        {
            label: '275',
            kr: '275',
            jp: '27.5',
            us: '9.5',
            eu: '43',
            uk: '8.5'
        },
        {
            label: '280',
            kr: '280',
            jp: '28.0',
            us: '10',
            eu: '44',
            uk: '9'
        },
        {
            label: '285',
            kr: '285',
            jp: '28.5',
            us: '10.5',
            eu: '44.5',
            uk: '9.5'
        },
        {
            label: '290',
            kr: '290',
            jp: '29.0',
            us: '11',
            eu: '45',
            uk: '10'
        }
    ],
    women: [
        {
            label: '220',
            kr: '220',
            jp: '22.0',
            us: '5',
            eu: '35.5',
            uk: '2.5'
        },
        {
            label: '225',
            kr: '225',
            jp: '22.5',
            us: '5.5',
            eu: '36',
            uk: '3'
        },
        {
            label: '230',
            kr: '230',
            jp: '23.0',
            us: '6',
            eu: '36.5',
            uk: '3.5'
        },
        {
            label: '235',
            kr: '235',
            jp: '23.5',
            us: '6.5',
            eu: '37.5',
            uk: '4'
        },
        {
            label: '240',
            kr: '240',
            jp: '24.0',
            us: '7',
            eu: '38',
            uk: '4.5'
        },
        {
            label: '245',
            kr: '245',
            jp: '24.5',
            us: '7.5',
            eu: '38.5',
            uk: '5'
        },
        {
            label: '250',
            kr: '250',
            jp: '25.0',
            us: '8',
            eu: '39',
            uk: '5.5'
        },
        {
            label: '255',
            kr: '255',
            jp: '25.5',
            us: '8.5',
            eu: '40',
            uk: '6'
        },
        {
            label: '260',
            kr: '260',
            jp: '26.0',
            us: '9',
            eu: '40.5',
            uk: '6.5'
        },
        {
            label: '265',
            kr: '265',
            jp: '26.5',
            us: '9.5',
            eu: '41',
            uk: '7'
        },
        {
            label: '270',
            kr: '270',
            jp: '27.0',
            us: '10',
            eu: '42',
            uk: '7.5'
        },
        {
            label: '275',
            kr: '275',
            jp: '27.5',
            us: '10.5',
            eu: '42.5',
            uk: '8'
        },
        {
            label: '280',
            kr: '280',
            jp: '28.0',
            us: '11',
            eu: '43',
            uk: '8.5'
        }
    ]
};
const TOTAL_LENGTH_LABEL = '총장';
const ITEM_LABEL = '항목';
const SIZE_COLUMN_LABEL = '사이즈';
const MEASUREMENT_LABEL_HINT_PATTERN = /(?:총장|기장|어깨|가슴|소매|허리|엉덩|허벅|밑위|밑단|길이|length|shoulder|chest|sleeve|waist|hip|thigh|rise|hem|inseam|pit|bust|body|width)/i;
const TOTAL_LENGTH_ALIAS_KEYS = [
    '총장',
    '전체길이',
    '전체장',
    '기장',
    'totallength',
    'length',
    'total'
];
const MEASUREMENT_ALIAS_MAP = {
    총장: TOTAL_LENGTH_LABEL,
    전체길이: TOTAL_LENGTH_LABEL,
    전체장: TOTAL_LENGTH_LABEL,
    기장: TOTAL_LENGTH_LABEL,
    상의총장: TOTAL_LENGTH_LABEL,
    하의총장: TOTAL_LENGTH_LABEL,
    바지총장: TOTAL_LENGTH_LABEL,
    length: TOTAL_LENGTH_LABEL,
    total: TOTAL_LENGTH_LABEL,
    소매: '소매',
    소매길이: '소매',
    소매기장: '소매',
    화장: '소매',
    sleeve: '소매',
    어깨: '어깨',
    어깨너비: '어깨',
    어깨넓이: '어깨',
    shoulder: '어깨',
    가슴: '가슴',
    가슴단면: '가슴',
    품: '가슴',
    chest: '가슴',
    bust: '가슴',
    허리: '허리',
    허리단면: '허리',
    waist: '허리',
    엉덩이: '엉덩이',
    힙: '엉덩이',
    hip: '엉덩이',
    허벅지: '허벅지',
    허벅지단면: '허벅지',
    thigh: '허벅지',
    밑위: '밑위',
    rise: '밑위',
    밑단: '밑단',
    밑단단면: '밑단',
    hem: '밑단',
    인심: '인심',
    inseam: '인심'
};
const EMPTY_FORM_DATA = {
    brand: '',
    name: '',
    category: '',
    url: '',
    productImage: null,
    sizeChartImage: null,
    extractedTable: null
};
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/lib/supabase.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "assertSupabaseClient",
    ()=>assertSupabaseClient,
    "supabase",
    ()=>supabase
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$supabase$2f$supabase$2d$js$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/@supabase/supabase-js/dist/index.mjs [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$constants$2f$index$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/constants/index.ts [app-client] (ecmascript)");
;
;
const supabase = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$constants$2f$index$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SUPABASE_URL"] && __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$constants$2f$index$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SUPABASE_ANON_KEY"] ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$supabase$2f$supabase$2d$js$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["createClient"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$constants$2f$index$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SUPABASE_URL"], __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$constants$2f$index$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SUPABASE_ANON_KEY"]) : null;
const assertSupabaseClient = ()=>{
    if (!supabase) {
        throw new Error('Supabase public env is missing. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.');
    }
};
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/utils/sizeTable.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "computeSizeRecommendations",
    ()=>computeSizeRecommendations,
    "extractMeasurements",
    ()=>extractMeasurements,
    "findConvertedSize",
    ()=>findConvertedSize,
    "inferMeasurementLabelFromAliasKey",
    ()=>inferMeasurementLabelFromAliasKey,
    "isLikelyMeasurementLabel",
    ()=>isLikelyMeasurementLabel,
    "isLikelyMeasurementLabelLoose",
    ()=>isLikelyMeasurementLabelLoose,
    "isLikelySizeLabel",
    ()=>isLikelySizeLabel,
    "isPrimaryColumnHeader",
    ()=>isPrimaryColumnHeader,
    "isTotalLengthAliasKey",
    ()=>isTotalLengthAliasKey,
    "normalizeAliasKey",
    ()=>normalizeAliasKey,
    "normalizeCellText",
    ()=>normalizeCellText,
    "normalizeMeasurementLabel",
    ()=>normalizeMeasurementLabel,
    "normalizeSizeLabel",
    ()=>normalizeSizeLabel,
    "normalizeSizeLookupValue",
    ()=>normalizeSizeLookupValue,
    "normalizeSizeTable",
    ()=>normalizeSizeTable,
    "scoreMeasurementSimilarity",
    ()=>scoreMeasurementSimilarity,
    "tableOrientationScore",
    ()=>tableOrientationScore,
    "transposeTable",
    ()=>transposeTable
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$constants$2f$index$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/constants/index.ts [app-client] (ecmascript)");
;
const normalizeCellText = (value)=>String(value ?? '').replace(/\s+/g, ' ').trim();
const normalizeAliasKey = (value)=>normalizeCellText(value).toLowerCase().replace(/\(.*?\)|\[.*?\]/g, '').replace(/\s+/g, '').replace(/[^0-9a-z\u3131-\uD79D]/g, '');
const isTotalLengthAliasKey = (aliasKey)=>Boolean(aliasKey) && __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$constants$2f$index$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TOTAL_LENGTH_ALIAS_KEYS"].some((key)=>aliasKey === key || aliasKey.includes(key));
const inferMeasurementLabelFromAliasKey = (aliasKey)=>{
    if (!aliasKey) return '';
    if (aliasKey.includes('shoulder') || aliasKey.includes('어깨')) return '어깨';
    if (aliasKey.includes('chest') || aliasKey.includes('bust') || aliasKey.includes('bodywidth') || aliasKey.includes('pit') || aliasKey.includes('가슴') || aliasKey.includes('품')) return '가슴';
    if (aliasKey.includes('sleeve') || aliasKey.includes('arm') || aliasKey.includes('소매') || aliasKey.includes('화장')) return '소매';
    if (aliasKey.includes('waist') || aliasKey.includes('허리')) return '허리';
    if (aliasKey.includes('hip') || aliasKey.includes('엉덩이') || aliasKey.includes('힙')) return '엉덩이';
    if (aliasKey.includes('thigh') || aliasKey.includes('허벅지')) return '허벅지';
    if (aliasKey.includes('rise') || aliasKey.includes('밑위')) return '밑위';
    if (aliasKey.includes('hem') || aliasKey.includes('밑단')) return '밑단';
    if (aliasKey.includes('inseam') || aliasKey.includes('인심')) return '인심';
    return '';
};
const normalizeMeasurementLabel = (value)=>{
    const raw = normalizeCellText(value);
    if (!raw) return '';
    const aliasKey = normalizeAliasKey(raw);
    if (__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$constants$2f$index$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["MEASUREMENT_ALIAS_MAP"][aliasKey]) return __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$constants$2f$index$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["MEASUREMENT_ALIAS_MAP"][aliasKey];
    const inferred = inferMeasurementLabelFromAliasKey(aliasKey);
    if (inferred) return inferred;
    if (isTotalLengthAliasKey(aliasKey)) return __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$constants$2f$index$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TOTAL_LENGTH_LABEL"];
    return raw;
};
const normalizeSizeLabel = (value)=>normalizeCellText(value).toUpperCase();
const normalizeSizeLookupValue = (value)=>normalizeCellText(value).toUpperCase().replace(/\s+/g, '').replace(/MM$/, '');
const findConvertedSize = (rows, region, size)=>{
    const lookup = normalizeSizeLookupValue(size);
    if (!lookup) return null;
    return rows.find((row)=>normalizeSizeLookupValue(row[region]) === lookup) || null;
};
const isLikelySizeLabel = (value)=>{
    const text = normalizeSizeLabel(value);
    if (!text) return false;
    if (/^(XXS|XS|S|M|L|XL|XXL|XXXL|FREE|ONE ?SIZE)$/i.test(text)) return true;
    if (/^\d{1,3}\s*\(\s*\d{1,3}\s*~\s*\d{1,3}\s*\)$/.test(text)) return true;
    if (/^\d{1,3}\s*\([^)]{1,30}\)$/.test(text)) return true;
    if (/^(EU|US|UK|JP|KR)\s*\d{1,3}(?:\.\d+)?$/.test(text)) return true;
    if (/^(?:W|L)?\d{2,3}(?:\s*\/\s*(?:W|L)?\d{2,3})$/.test(text)) return true;
    if (/^(?:XXS|XS|S|M|L|XL|XXL|XXXL)\s*[-/()]?\s*\d{2,3}$/.test(text)) return true;
    if (/^\d{2,3}\s*[-/()]?\s*(?:XXS|XS|S|M|L|XL|XXL|XXXL)$/.test(text)) return true;
    if (/^-?\d{1,4}(?:\.\d+)?$/.test(text)) {
        const numeric = Number(text);
        return Number.isFinite(numeric) && numeric >= 0 && numeric <= 400;
    }
    return false;
};
const isLikelyMeasurementLabel = (value)=>{
    const normalized = normalizeMeasurementLabel(value);
    return Boolean(normalized) && Object.values(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$constants$2f$index$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["MEASUREMENT_ALIAS_MAP"]).includes(normalized);
};
const isLikelyMeasurementLabelLoose = (value)=>{
    if (isLikelyMeasurementLabel(value)) return true;
    return __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$constants$2f$index$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["MEASUREMENT_LABEL_HINT_PATTERN"].test(normalizeCellText(value));
};
const isPrimaryColumnHeader = (value)=>{
    const normalized = normalizeCellText(value);
    return normalized === __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$constants$2f$index$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ITEM_LABEL"] || normalized === __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$constants$2f$index$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SIZE_COLUMN_LABEL"] || /^size$/i.test(normalized);
};
const makeRectangularRows = (rows, width)=>rows.map((row)=>{
        const normalized = Array.isArray(row) ? row.map((cell)=>normalizeCellText(cell)) : [];
        return [
            ...normalized,
            ...new Array(Math.max(width - normalized.length, 0)).fill('')
        ].slice(0, width);
    });
const transposeTable = (table)=>{
    const width = Math.max(table.headers.length, ...table.rows.map((row)=>row.length), 0);
    const fullHeaders = [
        ...table.headers,
        ...new Array(Math.max(width - table.headers.length, 0)).fill('')
    ];
    const fullRows = makeRectangularRows(table.rows, width);
    const matrix = [
        fullHeaders,
        ...fullRows
    ];
    if (!matrix.length || !width) return {
        headers: [],
        rows: []
    };
    const transposed = Array.from({
        length: width
    }, (_, colIdx)=>matrix.map((row)=>normalizeCellText(row[colIdx])));
    return {
        headers: transposed[0] || [],
        rows: transposed.slice(1)
    };
};
const tableOrientationScore = (table)=>{
    const columnHeaders = table.headers.slice(1);
    const rowHeaders = table.rows.map((row)=>row[0] || '');
    const sizeInRows = rowHeaders.filter((v)=>isLikelySizeLabel(v)).length;
    const sizeInColumns = columnHeaders.filter((v)=>isLikelySizeLabel(v)).length;
    const measurementInColumns = columnHeaders.filter((v)=>isLikelyMeasurementLabelLoose(v)).length;
    const measurementInRows = rowHeaders.filter((v)=>isLikelyMeasurementLabelLoose(v)).length;
    const numericColumnHeaders = columnHeaders.filter((value)=>/^-?\d+(?:\.\d+)?(?:\s*(?:cm|mm|in|inch))?$/i.test(normalizeCellText(value))).length;
    return sizeInRows * 4 + measurementInColumns * 4 - sizeInColumns * 4 - measurementInRows * 3 - numericColumnHeaders * 2;
};
const prioritizeTotalLengthColumn = (table)=>{
    const totalLengthIndex = table.headers.findIndex((header, idx)=>idx > 0 && normalizeMeasurementLabel(header) === __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$constants$2f$index$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TOTAL_LENGTH_LABEL"]);
    if (totalLengthIndex <= 1) return table;
    const nextHeaders = [
        ...table.headers
    ];
    const [totalLengthHeader] = nextHeaders.splice(totalLengthIndex, 1);
    nextHeaders.splice(1, 0, totalLengthHeader);
    const nextRows = table.rows.map((row)=>{
        const nextRow = [
            ...row
        ];
        const [totalLengthValue] = nextRow.splice(totalLengthIndex, 1);
        nextRow.splice(1, 0, totalLengthValue ?? '');
        return nextRow;
    });
    return {
        headers: nextHeaders,
        rows: nextRows
    };
};
const normalizeSizeTable = (value)=>{
    if (!value) return null;
    let parsed = value;
    if (typeof parsed === 'string') {
        try {
            parsed = JSON.parse(parsed);
        } catch  {
            return null;
        }
    }
    if (!parsed || typeof parsed !== 'object') return null;
    const record = parsed;
    const headers = Array.isArray(record.headers) ? record.headers.map((v)=>normalizeCellText(v)) : [];
    const rows = Array.isArray(record.rows) ? record.rows.map((row)=>Array.isArray(row) ? row.map((cell)=>normalizeCellText(cell)) : []) : [];
    if (headers.length === 0 && rows.length === 0) return null;
    const asIs = {
        headers: [
            ...headers
        ],
        rows: rows.map((row)=>[
                ...row
            ])
    };
    const transposed = transposeTable(asIs);
    const selected = tableOrientationScore(transposed) > tableOrientationScore(asIs) ? transposed : asIs;
    const width = Math.max(selected.headers.length, ...selected.rows.map((row)=>row.length), 0);
    if (!width) return null;
    const normalizedHeaders = [
        ...selected.headers,
        ...new Array(width - selected.headers.length).fill('')
    ].slice(0, width);
    normalizedHeaders[0] = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$constants$2f$index$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SIZE_COLUMN_LABEL"];
    for(let idx = 1; idx < normalizedHeaders.length; idx += 1){
        normalizedHeaders[idx] = normalizeMeasurementLabel(normalizedHeaders[idx]);
    }
    const normalizedRows = makeRectangularRows(selected.rows, width).map((row)=>{
        const nextRow = [
            ...row
        ];
        nextRow[0] = normalizeSizeLabel(nextRow[0]);
        return nextRow;
    });
    return prioritizeTotalLengthColumn({
        headers: normalizedHeaders,
        rows: normalizedRows
    });
};
const parseFirstNumber = (value)=>{
    const match = value.match(/-?\d+(?:\.\d+)?/);
    if (!match) return null;
    const n = parseFloat(match[0]);
    return isFinite(n) ? n : null;
};
const extractMeasurements = (headers, row)=>{
    const map = new Map();
    for(let i = 1; i < headers.length; i++){
        const label = normalizeMeasurementLabel(headers[i]);
        if (!label) continue;
        const val = parseFirstNumber(row[i] ?? '');
        if (val !== null) map.set(label, val);
    }
    return map;
};
const scoreMeasurementSimilarity = (a, b)=>{
    let totalWeight = 0;
    let weightedDiff = 0;
    a.forEach((aVal, label)=>{
        const bVal = b.get(label);
        if (bVal === undefined) return;
        const weight = label === __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$constants$2f$index$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TOTAL_LENGTH_LABEL"] ? 2 : 1;
        weightedDiff += weight * Math.abs(aVal - bVal);
        totalWeight += weight;
    });
    return totalWeight === 0 ? Infinity : weightedDiff / totalWeight;
};
const computeSizeRecommendations = (source, selectedRowIndex, candidates, maxResults = 3)=>{
    if (!source.sizeTable) return [];
    const sourceRow = source.sizeTable.rows[selectedRowIndex];
    if (!sourceRow) return [];
    const sourceMeasurements = extractMeasurements(source.sizeTable.headers, sourceRow);
    if (sourceMeasurements.size === 0) return [];
    const results = [];
    for (const product of candidates){
        if (product.id === source.id) continue;
        if (product.category !== source.category) continue;
        if (!product.sizeTable?.rows?.length) continue;
        const hasOverlap = [
            ...sourceMeasurements.keys()
        ].some((k)=>product.sizeTable.headers.slice(1).map(normalizeMeasurementLabel).includes(k));
        if (!hasOverlap) continue;
        let bestRowIndex = 0;
        let bestScore = Infinity;
        for(let i = 0; i < product.sizeTable.rows.length; i++){
            const m = extractMeasurements(product.sizeTable.headers, product.sizeTable.rows[i]);
            const score = scoreMeasurementSimilarity(sourceMeasurements, m);
            if (score < bestScore) {
                bestScore = score;
                bestRowIndex = i;
            }
        }
        if (bestScore < Infinity) results.push({
            product,
            rowIndex: bestRowIndex,
            score: bestScore
        });
    }
    return results.sort((a, b)=>a.score - b.score).slice(0, maxResults);
};
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/utils/product.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "generateFallbackResult",
    ()=>generateFallbackResult,
    "isDuplicateProductErrorMessage",
    ()=>isDuplicateProductErrorMessage,
    "isExternalHttpUrl",
    ()=>isExternalHttpUrl,
    "isOptionalMetadataCategory",
    ()=>isOptionalMetadataCategory,
    "normalizeCategoryOption",
    ()=>normalizeCategoryOption,
    "normalizeComparableProductUrl",
    ()=>normalizeComparableProductUrl,
    "normalizeProduct",
    ()=>normalizeProduct,
    "toPublicUrl",
    ()=>toPublicUrl,
    "uniqHttpUrls",
    ()=>uniqHttpUrls
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$constants$2f$index$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/constants/index.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/supabase.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$sizeTable$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/utils/sizeTable.ts [app-client] (ecmascript)");
;
;
;
const isExternalHttpUrl = (value)=>/^https?:\/\//i.test(String(value || '').trim());
const uniqHttpUrls = (values)=>{
    const seen = new Set();
    const output = [];
    for (const value of values){
        const normalized = String(value || '').trim();
        if (!/^https?:\/\//i.test(normalized)) continue;
        if (seen.has(normalized)) continue;
        seen.add(normalized);
        output.push(normalized);
    }
    return output;
};
const normalizeComparableProductUrl = (value)=>{
    const raw = String(value || '').trim();
    if (!raw || raw === '#') return '';
    try {
        const parsed = new URL(raw);
        const hostname = parsed.hostname.replace(/^www\./i, '').toLowerCase();
        const pathname = parsed.pathname.replace(/\/+$/, '') || '/';
        const search = parsed.search || '';
        return `${parsed.protocol.toLowerCase()}//${hostname}${pathname}${search}`;
    } catch  {
        return raw.toLowerCase();
    }
};
const normalizeCategoryOption = (value)=>{
    const normalized = String(value || '').trim().toLowerCase();
    return __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$constants$2f$index$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["CATEGORY_OPTION_BY_LOWER"][normalized] || '';
};
const isOptionalMetadataCategory = (category)=>category === 'Shoes' || category === 'Acc' || category === '단종된 상품(빈티지)';
const isDuplicateProductErrorMessage = (message)=>{
    const normalized = String(message || '').toLowerCase();
    return normalized.includes('products_unique_key') || normalized.includes('duplicate key value') || normalized.includes('unique constraint') || normalized.includes('이미 등록된 상품');
};
const toPublicUrl = (path, options)=>{
    if (!path) return '';
    if (isExternalHttpUrl(path)) return path;
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["assertSupabaseClient"])();
    const result = options ? __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["supabase"].storage.from(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$constants$2f$index$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["STORAGE_BUCKET"]).getPublicUrl(path, {
        transform: {
            width: options.width,
            height: options.height,
            quality: options.quality
        }
    }) : __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["supabase"].storage.from(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$constants$2f$index$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["STORAGE_BUCKET"]).getPublicUrl(path);
    return result.data.publicUrl;
};
const normalizeProduct = (row)=>{
    const id = String(row.id ?? '').trim();
    const brand = String(row.brand ?? '').trim();
    const name = String(row.name ?? '').trim();
    if (!id || !brand || !name) return null;
    const imagePath = row.image_path ?? null;
    return {
        id,
        brand,
        name,
        category: String(row.category ?? 'Uncategorized'),
        url: String(row.url ?? '#'),
        image: toPublicUrl(imagePath),
        thumbnailImage: toPublicUrl(imagePath, {
            width: 320,
            height: 320,
            quality: 65
        }),
        imagePath,
        sizeTable: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$sizeTable$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["normalizeSizeTable"])(row.size_table),
        createdAt: row.created_at ? String(row.created_at) : undefined
    };
};
const generateFallbackResult = (term)=>({
        id: Date.now().toString(),
        brand: term.split(' ')[0].toUpperCase() || 'BRAND',
        name: term,
        category: 'Unknown',
        url: `https://www.google.com/search?q=${encodeURIComponent(term)}`,
        image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=500&q=80',
        thumbnailImage: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=240&q=60',
        sizeTable: {
            headers: [
                '정보 없음'
            ],
            rows: [
                [
                    '데이터베이스에 없는 상품입니다.'
                ]
            ]
        }
    });
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/api/index.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "backfillBrandRules",
    ()=>backfillBrandRules,
    "extractSizeTableFromImage",
    ()=>extractSizeTableFromImage,
    "fetchBrandRules",
    ()=>fetchBrandRules,
    "fetchProductMetadataFromImage",
    ()=>fetchProductMetadataFromImage,
    "fetchProductMetadataFromUrl",
    ()=>fetchProductMetadataFromUrl,
    "removeBackgroundWithGemini",
    ()=>removeBackgroundWithGemini,
    "saveBrandRules",
    ()=>saveBrandRules,
    "searchProducts",
    ()=>searchProducts,
    "submitProduct",
    ()=>submitProduct,
    "uploadSubmissionImage",
    ()=>uploadSubmissionImage
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$constants$2f$index$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/constants/index.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/supabase.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$image$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/utils/image.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$sizeTable$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/utils/sizeTable.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$product$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/utils/product.ts [app-client] (ecmascript)");
;
;
;
;
;
const searchProducts = async (query)=>{
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["assertSupabaseClient"])();
    const keyword = query.trim();
    let request = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["supabase"].from('products').select('id,brand,name,category,url,size_table,created_at,image_path').order('created_at', {
        ascending: false
    });
    if (keyword) request = request.or(`brand.ilike.%${keyword}%,name.ilike.%${keyword}%`);
    const { data, error } = await request;
    if (error) throw new Error(error.message);
    const rows = Array.isArray(data) ? data : [];
    return rows.map((row)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$product$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["normalizeProduct"])(row)).filter((product)=>product !== null);
};
const uploadSubmissionImage = async (file)=>{
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["assertSupabaseClient"])();
    const extension = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$image$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getFileExtension"])(file);
    const path = `${__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$constants$2f$index$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["STORAGE_PREFIX"]}${crypto.randomUUID()}.${extension}`;
    const { data, error } = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["supabase"].storage.from(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$constants$2f$index$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["STORAGE_BUCKET"]).upload(path, file, {
        upsert: false,
        contentType: file.type || undefined
    });
    if (error || !data?.path) {
        console.error('[uploadSubmissionImage] upload failed', {
            errorMessage: error?.message,
            error,
            path,
            bucket: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$constants$2f$index$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["STORAGE_BUCKET"],
            startsWithSubmissions: path.startsWith(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$constants$2f$index$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["STORAGE_PREFIX"])
        });
        throw new Error(error?.message || 'Image upload failed');
    }
    return data.path;
};
const submitProduct = async (form)=>{
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["assertSupabaseClient"])();
    const category = String(form.category || '').trim();
    if (!category) {
        throw new Error('카테고리는 필수입니다.');
    }
    let imagePath = '';
    if (form.productPhoto) {
        imagePath = await uploadSubmissionImage(form.productPhoto);
    } else {
        imagePath = String(form.productImageUrl || '').trim();
    }
    if (!imagePath) {
        throw new Error('상품 사진은 필수입니다.');
    }
    const payload = {
        brand: form.brand,
        name: form.name,
        category,
        url: form.url || null,
        image_path: imagePath,
        size_table: form.sizeTable ?? null
    };
    const { error } = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["supabase"].from('products').insert(payload);
    if (error) {
        console.error('[submitProduct] insert failed', error.message, error);
        throw new Error(error.message);
    }
};
const parseApiJson = async (response, endpoint)=>{
    const rawText = await response.text();
    const contentType = String(response.headers.get('content-type') || '').toLowerCase();
    if (!contentType.includes('application/json')) {
        const preview = rawText.slice(0, 120).replace(/\s+/g, ' ').trim();
        throw new Error(`${endpoint} returned non-JSON response (${response.status}). ${preview}`);
    }
    try {
        return JSON.parse(rawText);
    } catch  {
        const preview = rawText.slice(0, 120).replace(/\s+/g, ' ').trim();
        throw new Error(`${endpoint} returned invalid JSON (${response.status}). ${preview}`);
    }
};
const fetchProductMetadataFromUrl = async (url)=>{
    const response = await fetch('/api/product-metadata', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            url
        })
    });
    const payload = await parseApiJson(response, '/api/product-metadata');
    if (!response.ok || !payload?.ok || !payload?.data) {
        throw new Error(payload?.error || 'Failed to extract metadata from URL');
    }
    return payload.data;
};
const fetchProductMetadataFromImage = async (base64Image, mimeType = 'image/png')=>{
    const response = await fetch('/api/product-metadata-from-image', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            imageBase64: base64Image,
            mimeType
        })
    });
    const payload = await parseApiJson(response, '/api/product-metadata-from-image');
    if (!response.ok || !payload?.ok || !payload?.data) {
        throw new Error(payload?.error || 'Failed to extract metadata from image');
    }
    return payload.data;
};
const extractSizeTableFromImage = async (base64Image, mimeType = 'image/png')=>{
    const response = await fetch('/api/size-table', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            imageBase64: base64Image,
            mimeType
        })
    });
    const payload = await parseApiJson(response, '/api/size-table');
    if (!response.ok || !payload?.ok || !payload?.data) {
        throw new Error(payload?.error ?? 'Failed to extract size table');
    }
    const normalized = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$sizeTable$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["normalizeSizeTable"])(payload.data);
    if (!normalized) {
        throw new Error('Failed to normalize extracted size table');
    }
    return normalized;
};
const removeBackgroundWithGemini = async (base64Image)=>{
    const response = await fetch('/api/remove-bg', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            imageBase64: base64Image,
            mimeType: 'image/png'
        })
    });
    const payload = await parseApiJson(response, '/api/remove-bg');
    if (!response.ok || !payload?.ok || !payload?.data?.imageBase64) return base64Image;
    return String(payload.data.imageBase64);
};
const fetchBrandRules = async ()=>{
    const response = await fetch('/api/admin/brand-rules', {
        method: 'GET',
        credentials: 'include'
    });
    const payload = await parseApiJson(response, '/api/admin/brand-rules');
    if (!response.ok || !payload?.ok || !Array.isArray(payload?.data?.rules)) {
        throw new Error(payload?.error || 'Failed to fetch brand rules');
    }
    return payload.data.rules;
};
const saveBrandRules = async (rules)=>{
    const response = await fetch('/api/admin/brand-rules', {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
            rules
        })
    });
    const payload = await parseApiJson(response, '/api/admin/brand-rules');
    if (!response.ok || !payload?.ok || !Array.isArray(payload?.data?.rules)) {
        throw new Error(payload?.error || 'Failed to save brand rules');
    }
    return payload.data.rules;
};
const backfillBrandRules = async ()=>{
    const response = await fetch('/api/admin/brand-rules/backfill', {
        method: 'POST',
        credentials: 'include'
    });
    const payload = await parseApiJson(response, '/api/admin/brand-rules/backfill');
    if (!response.ok || !payload?.ok || !payload?.data) {
        throw new Error(payload?.error || 'Failed to backfill brand rules');
    }
    return payload.data;
};
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/hooks/useAdminAuth.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "useAdminAuth",
    ()=>useAdminAuth
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$image$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/utils/image.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$api$2f$index$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/api/index.ts [app-client] (ecmascript)");
var _s = __turbopack_context__.k.signature();
;
;
;
function useAdminAuth({ isAdminPage, onProductMutated, onProductDeleted }) {
    _s();
    const [isAdminCheckingSession, setIsAdminCheckingSession] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [isAdminAuthenticated, setIsAdminAuthenticated] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [adminPassword, setAdminPassword] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])('');
    const [adminAuthError, setAdminAuthError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [isAdminAuthSubmitting, setIsAdminAuthSubmitting] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [editingProductId, setEditingProductId] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [adminEditForm, setAdminEditForm] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])({
        brand: '',
        name: '',
        category: '',
        url: ''
    });
    const [adminImagePath, setAdminImagePath] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [adminImagePreview, setAdminImagePreview] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])('');
    const [adminProductPhotoFile, setAdminProductPhotoFile] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [adminSizeChartImage, setAdminSizeChartImage] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [adminExtractedTable, setAdminExtractedTable] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [isAdminAnalyzingTable, setIsAdminAnalyzingTable] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [adminActionError, setAdminActionError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [isAdminActionLoading, setIsAdminActionLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [brandRules, setBrandRules] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [isBrandRulesLoading, setIsBrandRulesLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [isBrandRulesSaving, setIsBrandRulesSaving] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [isBrandBackfillRunning, setIsBrandBackfillRunning] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [brandBackfillResult, setBrandBackfillResult] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const loadBrandRules = async ()=>{
        setIsBrandRulesLoading(true);
        try {
            const rules = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$api$2f$index$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["fetchBrandRules"])();
            setBrandRules(rules);
        } catch (error) {
            const message = error instanceof Error ? error.message : '브랜드 규칙을 불러오지 못했습니다.';
            setAdminActionError(message);
        } finally{
            setIsBrandRulesLoading(false);
        }
    };
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "useAdminAuth.useEffect": ()=>{
            if (!isAdminPage) return;
            let isActive = true;
            setIsAdminCheckingSession(true);
            void ({
                "useAdminAuth.useEffect": async ()=>{
                    try {
                        const response = await fetch('/api/admin/session', {
                            credentials: 'include'
                        });
                        const payload = await response.json();
                        if (!response.ok || !payload?.ok) {
                            throw new Error(payload?.error || '관리자 세션 확인 실패');
                        }
                        if (!isActive) return;
                        setIsAdminAuthenticated(Boolean(payload?.data?.authenticated));
                        setAdminAuthError(null);
                        if (Boolean(payload?.data?.authenticated)) {
                            await loadBrandRules();
                        }
                    } catch (sessionError) {
                        if (!isActive) return;
                        const message = sessionError instanceof Error ? sessionError.message : '관리자 세션 확인 실패';
                        setAdminAuthError(message);
                        setIsAdminAuthenticated(false);
                    } finally{
                        if (isActive) setIsAdminCheckingSession(false);
                    }
                }
            })["useAdminAuth.useEffect"]();
            return ({
                "useAdminAuth.useEffect": ()=>{
                    isActive = false;
                }
            })["useAdminAuth.useEffect"];
        }
    }["useAdminAuth.useEffect"], [
        isAdminPage
    ]);
    const handleAdminLogin = async ()=>{
        if (!adminPassword.trim()) {
            setAdminAuthError('관리자 비밀번호를 입력하세요.');
            return;
        }
        setIsAdminAuthSubmitting(true);
        try {
            const response = await fetch('/api/admin/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({
                    password: adminPassword
                })
            });
            const payload = await response.json();
            if (!response.ok || !payload?.ok) {
                throw new Error(payload?.error || '관리자 로그인 실패');
            }
            setIsAdminAuthenticated(true);
            setAdminPassword('');
            setAdminAuthError(null);
            await loadBrandRules();
        } catch (loginError) {
            const message = loginError instanceof Error ? loginError.message : '관리자 로그인 실패';
            setAdminAuthError(message);
            setIsAdminAuthenticated(false);
        } finally{
            setIsAdminAuthSubmitting(false);
        }
    };
    const handleAdminLogout = async ()=>{
        try {
            await fetch('/api/admin/logout', {
                method: 'POST',
                credentials: 'include'
            });
        } finally{
            setIsAdminAuthenticated(false);
            setEditingProductId(null);
            setAdminPassword('');
            setBrandRules([]);
        }
    };
    const startProductEdit = (product)=>{
        setEditingProductId(product.id);
        setAdminEditForm({
            brand: product.brand,
            name: product.name,
            category: product.category === 'Uncategorized' ? '' : product.category,
            url: product.url === '#' ? '' : product.url
        });
        setAdminImagePath(product.imagePath ?? null);
        setAdminImagePreview(product.image);
        setAdminProductPhotoFile(null);
        setAdminSizeChartImage(null);
        setAdminExtractedTable(product.sizeTable ?? null);
        setAdminActionError(null);
    };
    const handleAdminFileUpload = (event, type)=>{
        const file = event.target.files?.[0];
        if (!file) return;
        if (type === 'product') {
            void (async ()=>{
                const dataUrl = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$image$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["readFileAsDataUrl"])(file);
                setAdminProductPhotoFile(file);
                setAdminImagePreview(dataUrl);
            })();
            return;
        }
        void (async ()=>{
            const dataUrl = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$image$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["readFileAsDataUrl"])(file);
            const optimizedDataUrl = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$image$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["resizeImage"])(dataUrl, 1600);
            const optimizedBase64 = optimizedDataUrl.split(',')[1] || '';
            setAdminSizeChartImage(optimizedDataUrl);
            setIsAdminAnalyzingTable(true);
            try {
                const tableData = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$api$2f$index$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["extractSizeTableFromImage"])(optimizedBase64, 'image/png');
                setAdminExtractedTable(tableData);
            } catch (extractError) {
                const message = extractError instanceof Error ? extractError.message : 'Size table extraction failed.';
                setAdminActionError(`사이즈표 재분석 실패: ${message}`);
            } finally{
                setIsAdminAnalyzingTable(false);
            }
        })();
    };
    const handleAdminUpdateProduct = async (id)=>{
        if (!adminEditForm.brand.trim() || !adminEditForm.name.trim()) {
            setAdminActionError('브랜드명과 상품명은 비워둘 수 없습니다.');
            return;
        }
        setIsAdminActionLoading(true);
        try {
            let nextImagePath = adminImagePath;
            if (adminProductPhotoFile) {
                nextImagePath = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$api$2f$index$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["uploadSubmissionImage"])(adminProductPhotoFile);
                setAdminImagePath(nextImagePath);
            }
            const response = await fetch(`/api/admin/products/${id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({
                    brand: adminEditForm.brand.trim(),
                    name: adminEditForm.name.trim(),
                    category: adminEditForm.category || null,
                    url: adminEditForm.url || null,
                    imagePath: nextImagePath,
                    sizeTable: adminExtractedTable
                })
            });
            const payload = await response.json();
            if (!response.ok || !payload?.ok) {
                throw new Error(payload?.error || '상품 수정 실패');
            }
            setEditingProductId(null);
            setAdminProductPhotoFile(null);
            setAdminSizeChartImage(null);
            onProductMutated();
            setAdminActionError(null);
        } catch (updateError) {
            const message = updateError instanceof Error ? updateError.message : '상품 수정 실패';
            setAdminActionError(message);
        } finally{
            setIsAdminActionLoading(false);
        }
    };
    const handleAdminDeleteProduct = async (id)=>{
        if (!window.confirm('이 상품을 삭제하시겠습니까?')) return;
        setIsAdminActionLoading(true);
        try {
            const response = await fetch(`/api/admin/products/${id}`, {
                method: 'DELETE',
                credentials: 'include'
            });
            const payload = await response.json();
            if (!response.ok || !payload?.ok) {
                throw new Error(payload?.error || '상품 삭제 실패');
            }
            onProductDeleted(id);
            onProductMutated();
            setAdminActionError(null);
        } catch (deleteError) {
            const message = deleteError instanceof Error ? deleteError.message : '상품 삭제 실패';
            setAdminActionError(message);
        } finally{
            setIsAdminActionLoading(false);
        }
    };
    const cancelEdit = ()=>{
        setEditingProductId(null);
        setAdminActionError(null);
        setAdminProductPhotoFile(null);
        setAdminSizeChartImage(null);
    };
    const handleBrandRulesSave = async ()=>{
        const normalizedRules = brandRules.map((rule)=>({
                matchType: rule.matchType,
                matchValue: rule.matchValue.trim(),
                canonicalBrand: rule.canonicalBrand.trim()
            }));
        if (normalizedRules.some((rule)=>!rule.matchType || !rule.matchValue || !rule.canonicalBrand)) {
            setAdminActionError('브랜드 규칙의 모든 행에 매칭 타입, 매칭 값, 표준 브랜드명을 입력하세요.');
            return;
        }
        setIsBrandRulesSaving(true);
        try {
            const saved = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$api$2f$index$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["saveBrandRules"])(normalizedRules);
            setBrandRules(saved);
            setAdminActionError(null);
        } catch (error) {
            const message = error instanceof Error ? error.message : '브랜드 규칙 저장에 실패했습니다.';
            setAdminActionError(message);
        } finally{
            setIsBrandRulesSaving(false);
        }
    };
    const handleBrandRulesBackfill = async ()=>{
        setIsBrandBackfillRunning(true);
        try {
            const result = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$api$2f$index$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["backfillBrandRules"])();
            setBrandBackfillResult(result);
            setAdminActionError(null);
            onProductMutated();
        } catch (error) {
            const message = error instanceof Error ? error.message : '기존 상품 브랜드 일괄 적용에 실패했습니다.';
            setAdminActionError(message);
        } finally{
            setIsBrandBackfillRunning(false);
        }
    };
    return {
        isAdminCheckingSession,
        isAdminAuthenticated,
        adminPassword,
        setAdminPassword,
        adminAuthError,
        isAdminAuthSubmitting,
        editingProductId,
        setEditingProductId,
        adminEditForm,
        setAdminEditForm,
        adminImagePreview,
        adminSizeChartImage,
        isAdminAnalyzingTable,
        adminExtractedTable,
        setAdminExtractedTable,
        adminActionError,
        setAdminActionError,
        isAdminActionLoading,
        brandRules,
        setBrandRules,
        isBrandRulesLoading,
        isBrandRulesSaving,
        isBrandBackfillRunning,
        brandBackfillResult,
        loadBrandRules,
        handleAdminLogin,
        handleAdminLogout,
        startProductEdit,
        cancelEdit,
        handleAdminFileUpload,
        handleAdminUpdateProduct,
        handleAdminDeleteProduct,
        handleBrandRulesSave,
        handleBrandRulesBackfill
    };
}
_s(useAdminAuth, "5qAEjTrTDfYyNWlchJdpZQ2qwC0=");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/hooks/useProducts.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "useProducts",
    ()=>useProducts
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$api$2f$index$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/api/index.ts [app-client] (ecmascript)");
var _s = __turbopack_context__.k.signature();
;
;
function useProducts() {
    _s();
    const [productsError, setProductsError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [products, setProducts] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [retryTrigger, setRetryTrigger] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(0);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "useProducts.useEffect": ()=>{
            let isActive = true;
            const load = {
                "useProducts.useEffect.load": async ()=>{
                    try {
                        const loaded = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$api$2f$index$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["searchProducts"])("");
                        if (!isActive) return;
                        setProducts(loaded);
                        setProductsError(null);
                    } catch (loadError) {
                        if (!isActive) return;
                        const message = loadError instanceof Error ? loadError.message : "상품 데이터를 불러오는 중 오류가 발생했습니다.";
                        setProductsError(message);
                    }
                }
            }["useProducts.useEffect.load"];
            void load();
            return ({
                "useProducts.useEffect": ()=>{
                    isActive = false;
                }
            })["useProducts.useEffect"];
        }
    }["useProducts.useEffect"], [
        retryTrigger
    ]);
    return {
        products,
        productsError,
        setProducts,
        setProductsError,
        setRetryTrigger
    };
}
_s(useProducts, "4X9tWZ4P0ESTkWvvvMQ7DTSy1b0=");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/app/admin/page.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>AdminRoutePage
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$AdminPage$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/AdminPage.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$useAdminAuth$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/hooks/useAdminAuth.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$useProducts$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/hooks/useProducts.ts [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
;
;
function AdminRoutePage() {
    _s();
    const { productsError, products, setRetryTrigger } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$useProducts$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useProducts"])();
    const admin = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$useAdminAuth$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAdminAuth"])({
        isAdminPage: true,
        onProductMutated: {
            "AdminRoutePage.useAdminAuth[admin]": ()=>setRetryTrigger({
                    "AdminRoutePage.useAdminAuth[admin]": (prev)=>prev + 1
                }["AdminRoutePage.useAdminAuth[admin]"])
        }["AdminRoutePage.useAdminAuth[admin]"],
        onProductDeleted: {
            "AdminRoutePage.useAdminAuth[admin]": ()=>{}
        }["AdminRoutePage.useAdminAuth[admin]"]
    });
    const handleImageLoadError = (event)=>{
        event.currentTarget.onerror = null;
        event.currentTarget.style.display = "none";
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$AdminPage$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["AdminPage"], {
        isAdminAuthenticated: admin.isAdminAuthenticated,
        isAdminCheckingSession: admin.isAdminCheckingSession,
        adminPassword: admin.adminPassword,
        adminAuthError: admin.adminAuthError,
        isAdminAuthSubmitting: admin.isAdminAuthSubmitting,
        productsError: productsError,
        adminActionError: admin.adminActionError,
        allProducts: products,
        editingProductId: admin.editingProductId,
        adminEditForm: admin.adminEditForm,
        adminImagePreview: admin.adminImagePreview,
        adminSizeChartImage: admin.adminSizeChartImage,
        isAdminAnalyzingTable: admin.isAdminAnalyzingTable,
        adminExtractedTable: admin.adminExtractedTable,
        isAdminActionLoading: admin.isAdminActionLoading,
        brandRules: admin.brandRules,
        isBrandRulesLoading: admin.isBrandRulesLoading,
        isBrandRulesSaving: admin.isBrandRulesSaving,
        isBrandBackfillRunning: admin.isBrandBackfillRunning,
        brandBackfillResult: admin.brandBackfillResult,
        onLogout: ()=>void admin.handleAdminLogout(),
        onLogin: ()=>void admin.handleAdminLogin(),
        onBrandRulesReload: ()=>void admin.loadBrandRules(),
        onBrandRulesSave: ()=>void admin.handleBrandRulesSave(),
        onBrandRulesBackfill: ()=>void admin.handleBrandRulesBackfill(),
        onBrandRulesChange: admin.setBrandRules,
        onPasswordChange: admin.setAdminPassword,
        onPasswordKeyDown: (key)=>{
            if (key === "Enter") void admin.handleAdminLogin();
        },
        onFileUpload: admin.handleAdminFileUpload,
        onUpdateProduct: (id)=>void admin.handleAdminUpdateProduct(id),
        onDeleteProduct: (id)=>void admin.handleAdminDeleteProduct(id),
        onStartEdit: admin.startProductEdit,
        onCancelEdit: admin.cancelEdit,
        onEditFormChange: admin.setAdminEditForm,
        onExtractedTableChange: admin.setAdminExtractedTable,
        onImageLoadError: handleImageLoadError
    }, void 0, false, {
        fileName: "[project]/app/admin/page.tsx",
        lineNumber: 22,
        columnNumber: 5
    }, this);
}
_s(AdminRoutePage, "fa+svNb8A7vh42yXp2BuNW2Uz2g=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$useProducts$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useProducts"],
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$useAdminAuth$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAdminAuth"]
    ];
});
_c = AdminRoutePage;
var _c;
__turbopack_context__.k.register(_c, "AdminRoutePage");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
]);

//# sourceMappingURL=_06f-iox._.js.map