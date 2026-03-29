module.exports = [
"[project]/src/constants/index.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
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
const MAX_PRODUCT_IMAGE_CANDIDATES = 24;
const DUPLICATE_PRODUCT_MESSAGE = '이미 등록된 상품입니다';
const NEXT_PUBLIC_SUPABASE_URL = String(("TURBOPACK compile-time value", "https://sforepkezedpjlasqfnn.supabase.co") || '').trim();
const NEXT_PUBLIC_SUPABASE_ANON_KEY = String(("TURBOPACK compile-time value", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNmb3JlcGtlemVkcGpsYXNxZm5uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQzODM2MjIsImV4cCI6MjA4OTk1OTYyMn0.iYTS6AhYEGGuJLGD8zOl1tZXcPEj3lOj0yhvHameOfY") || '').trim();
const VITE_SUPABASE_URL = String(process.env.VITE_SUPABASE_URL || '').trim();
const VITE_SUPABASE_ANON_KEY = String(process.env.VITE_SUPABASE_ANON_KEY || '').trim();
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
}),
"[project]/src/utils/sizeTable.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
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
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$constants$2f$index$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/constants/index.ts [app-ssr] (ecmascript)");
;
const normalizeCellText = (value)=>String(value ?? '').replace(/\s+/g, ' ').trim();
const normalizeAliasKey = (value)=>normalizeCellText(value).toLowerCase().replace(/\(.*?\)|\[.*?\]/g, '').replace(/\s+/g, '').replace(/[^0-9a-z\u3131-\uD79D]/g, '');
const isTotalLengthAliasKey = (aliasKey)=>Boolean(aliasKey) && __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$constants$2f$index$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["TOTAL_LENGTH_ALIAS_KEYS"].some((key)=>aliasKey === key || aliasKey.includes(key));
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
    if (__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$constants$2f$index$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["MEASUREMENT_ALIAS_MAP"][aliasKey]) return __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$constants$2f$index$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["MEASUREMENT_ALIAS_MAP"][aliasKey];
    const inferred = inferMeasurementLabelFromAliasKey(aliasKey);
    if (inferred) return inferred;
    if (isTotalLengthAliasKey(aliasKey)) return __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$constants$2f$index$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["TOTAL_LENGTH_LABEL"];
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
    return Boolean(normalized) && Object.values(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$constants$2f$index$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["MEASUREMENT_ALIAS_MAP"]).includes(normalized);
};
const isLikelyMeasurementLabelLoose = (value)=>{
    if (isLikelyMeasurementLabel(value)) return true;
    return __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$constants$2f$index$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["MEASUREMENT_LABEL_HINT_PATTERN"].test(normalizeCellText(value));
};
const isPrimaryColumnHeader = (value)=>{
    const normalized = normalizeCellText(value);
    return normalized === __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$constants$2f$index$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ITEM_LABEL"] || normalized === __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$constants$2f$index$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["SIZE_COLUMN_LABEL"] || /^size$/i.test(normalized);
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
    const totalLengthIndex = table.headers.findIndex((header, idx)=>idx > 0 && normalizeMeasurementLabel(header) === __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$constants$2f$index$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["TOTAL_LENGTH_LABEL"]);
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
    normalizedHeaders[0] = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$constants$2f$index$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["SIZE_COLUMN_LABEL"];
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
        const weight = label === __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$constants$2f$index$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["TOTAL_LENGTH_LABEL"] ? 2 : 1;
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
}),
"[project]/src/components/AddProductModal.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "AddProductModal",
    ()=>AddProductModal
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$camera$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Camera$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/camera.js [app-ssr] (ecmascript) <export default as Camera>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$globe$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Globe$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/globe.js [app-ssr] (ecmascript) <export default as Globe>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$loader$2d$circle$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Loader2$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/loader-circle.js [app-ssr] (ecmascript) <export default as Loader2>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$plus$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Plus$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/plus.js [app-ssr] (ecmascript) <export default as Plus>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$refresh$2d$cw$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__RefreshCw$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/refresh-cw.js [app-ssr] (ecmascript) <export default as RefreshCw>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$upload$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Upload$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/upload.js [app-ssr] (ecmascript) <export default as Upload>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$x$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__X$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/x.js [app-ssr] (ecmascript) <export default as X>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$constants$2f$index$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/constants/index.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$sizeTable$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/utils/sizeTable.ts [app-ssr] (ecmascript)");
;
;
;
;
function ProductImageSection({ form }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "space-y-2",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                className: "text-sm text-gray-400",
                children: "상품 이미지"
            }, void 0, false, {
                fileName: "[project]/src/components/AddProductModal.tsx",
                lineNumber: 23,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                className: "cursor-pointer w-full h-28 bg-white/[0.06] border-2 border-dashed border-white/15 rounded-xl flex items-center justify-center overflow-hidden hover:bg-white/[0.09] hover:border-white/25 transition backdrop-blur-sm",
                children: [
                    form.formData.productImage ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("img", {
                        src: form.formData.productImage,
                        className: "h-full object-contain",
                        onError: form.handleThumbnailLoadError
                    }, void 0, false, {
                        fileName: "[project]/src/components/AddProductModal.tsx",
                        lineNumber: 25,
                        columnNumber: 39
                    }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$camera$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Camera$3e$__["Camera"], {
                        className: "w-8 h-8 text-gray-500"
                    }, void 0, false, {
                        fileName: "[project]/src/components/AddProductModal.tsx",
                        lineNumber: 25,
                        columnNumber: 156
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                        type: "file",
                        className: "hidden",
                        accept: "image/*",
                        onChange: (e)=>form.handleFileUpload(e, 'product')
                    }, void 0, false, {
                        fileName: "[project]/src/components/AddProductModal.tsx",
                        lineNumber: 26,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/AddProductModal.tsx",
                lineNumber: 24,
                columnNumber: 7
            }, this),
            form.autofilledProductImageCandidates.length > 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "space-y-2",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex items-center justify-between text-[11px] text-gray-400",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                children: [
                                    "후보 ",
                                    form.autofilledProductImageCandidates.length,
                                    "장"
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/AddProductModal.tsx",
                                lineNumber: 31,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                children: "왼쪽 카드가 현재 추천 순위입니다."
                            }, void 0, false, {
                                fileName: "[project]/src/components/AddProductModal.tsx",
                                lineNumber: 32,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/AddProductModal.tsx",
                        lineNumber: 30,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "grid max-h-56 grid-cols-4 gap-2 overflow-y-auto pr-1",
                        children: form.autofilledProductImageCandidates.map((candidateUrl, index)=>{
                            const isActive = candidateUrl === form.autofilledProductImageUrl;
                            return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                type: "button",
                                onClick: ()=>form.handleSelectAutofilledProductImage(candidateUrl),
                                className: `relative h-16 rounded-lg border overflow-hidden ${isActive ? 'border-orange-500 ring-1 ring-orange-500' : 'border-gray-700 hover:border-gray-500'}`,
                                title: candidateUrl,
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("img", {
                                        src: candidateUrl,
                                        className: "w-full h-full object-cover",
                                        onError: form.handleThumbnailLoadError
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/AddProductModal.tsx",
                                        lineNumber: 45,
                                        columnNumber: 19
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: `absolute left-1 top-1 rounded px-1 py-0.5 text-[10px] font-semibold ${index === 0 ? 'bg-orange-500 text-black' : 'bg-black/70 text-white'}`,
                                        children: index === 0 ? '추천' : index + 1
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/AddProductModal.tsx",
                                        lineNumber: 46,
                                        columnNumber: 19
                                    }, this)
                                ]
                            }, candidateUrl, true, {
                                fileName: "[project]/src/components/AddProductModal.tsx",
                                lineNumber: 38,
                                columnNumber: 17
                            }, this);
                        })
                    }, void 0, false, {
                        fileName: "[project]/src/components/AddProductModal.tsx",
                        lineNumber: 34,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/AddProductModal.tsx",
                lineNumber: 29,
                columnNumber: 9
            }, this) : null,
            form.isProcessingImage ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "text-xs text-orange-400",
                children: "이미지 처리 중..."
            }, void 0, false, {
                fileName: "[project]/src/components/AddProductModal.tsx",
                lineNumber: 55,
                columnNumber: 33
            }, this) : null,
            form.productImageNotice ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "text-xs text-amber-300",
                children: form.productImageNotice
            }, void 0, false, {
                fileName: "[project]/src/components/AddProductModal.tsx",
                lineNumber: 56,
                columnNumber: 34
            }, this) : null,
            form.isPreviewOnlyProductImage ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "text-xs text-amber-300",
                children: "현재 이미지는 미리보기 전용이라 저장용 상품 이미지를 직접 올려야 합니다."
            }, void 0, false, {
                fileName: "[project]/src/components/AddProductModal.tsx",
                lineNumber: 58,
                columnNumber: 9
            }, this) : null
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/AddProductModal.tsx",
        lineNumber: 22,
        columnNumber: 5
    }, this);
}
function commitTableCell(form, value) {
    const cell = form.tableEditingCell;
    if (!cell) return;
    form.setFormData((prev)=>{
        if (!prev.extractedTable) return prev;
        if (cell.kind === 'header') {
            const headers = [
                ...prev.extractedTable.headers
            ];
            headers[cell.colIdx] = value;
            return {
                ...prev,
                extractedTable: {
                    ...prev.extractedTable,
                    headers
                }
            };
        }
        const rows = prev.extractedTable.rows.map((row, ri)=>ri === cell.rowIdx ? row.map((c, ci)=>ci === cell.colIdx ? value : c) : row);
        return {
            ...prev,
            extractedTable: {
                ...prev.extractedTable,
                rows
            }
        };
    });
    form.setTableEditingCell(null);
}
function SizeTableSection({ form }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "space-y-2",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                className: "text-sm text-gray-400",
                children: "사이즈표 이미지"
            }, void 0, false, {
                fileName: "[project]/src/components/AddProductModal.tsx",
                lineNumber: 87,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex flex-col sm:flex-row sm:items-center gap-3",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                        className: "cursor-pointer w-full sm:w-2/3 h-28 bg-white/[0.06] border-2 border-dashed border-white/15 rounded-xl flex items-center justify-center shrink-0 overflow-hidden hover:bg-white/[0.09] hover:border-white/25 transition backdrop-blur-sm relative",
                        children: [
                            !form.formData.sizeChartImage ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$upload$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Upload$3e$__["Upload"], {
                                className: "w-8 h-8 text-gray-500"
                            }, void 0, false, {
                                fileName: "[project]/src/components/AddProductModal.tsx",
                                lineNumber: 91,
                                columnNumber: 13
                            }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("img", {
                                src: form.formData.sizeChartImage,
                                className: "h-full object-contain"
                            }, void 0, false, {
                                fileName: "[project]/src/components/AddProductModal.tsx",
                                lineNumber: 93,
                                columnNumber: 13
                            }, this),
                            form.isAnalyzingTable && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "absolute inset-0 bg-black/60 flex items-center justify-center",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    className: "text-xs text-orange-400",
                                    children: "사이즈표 추출 중..."
                                }, void 0, false, {
                                    fileName: "[project]/src/components/AddProductModal.tsx",
                                    lineNumber: 97,
                                    columnNumber: 15
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/src/components/AddProductModal.tsx",
                                lineNumber: 96,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                type: "file",
                                className: "hidden",
                                accept: "image/*",
                                onChange: (e)=>form.handleFileUpload(e, 'chart')
                            }, void 0, false, {
                                fileName: "[project]/src/components/AddProductModal.tsx",
                                lineNumber: 100,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/AddProductModal.tsx",
                        lineNumber: 89,
                        columnNumber: 9
                    }, this),
                    form.addProductMode !== 'capture' ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "text-xs text-gray-400 leading-relaxed",
                        children: [
                            "사이즈표 사진을 올리면",
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("br", {}, void 0, false, {
                                fileName: "[project]/src/components/AddProductModal.tsx",
                                lineNumber: 103,
                                columnNumber: 76
                            }, this),
                            "자동으로 표를 추출합니다."
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/AddProductModal.tsx",
                        lineNumber: 103,
                        columnNumber: 11
                    }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "text-xs text-gray-400 leading-relaxed",
                        children: [
                            "캡쳐본에서 추출한 사이즈표를 확인하세요.",
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("br", {}, void 0, false, {
                                fileName: "[project]/src/components/AddProductModal.tsx",
                                lineNumber: 105,
                                columnNumber: 86
                            }, this),
                            "필요하면 다시 캡쳐해서 재업로드할 수 있습니다."
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/AddProductModal.tsx",
                        lineNumber: 105,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/AddProductModal.tsx",
                lineNumber: 88,
                columnNumber: 7
            }, this),
            !form.formData.extractedTable && form.formData.sizeChartImage && !form.isAnalyzingTable ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "text-xs text-amber-300",
                children: "사이즈표 이미지는 있지만 검증된 표 추출은 아직 완료되지 않았습니다."
            }, void 0, false, {
                fileName: "[project]/src/components/AddProductModal.tsx",
                lineNumber: 109,
                columnNumber: 9
            }, this) : null,
            form.formData.extractedTable && !form.isAnalyzingTable ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "rounded-xl border border-white/10 overflow-hidden",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex items-center justify-between px-3 py-1.5 bg-white/[0.04] border-b border-white/10",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            className: "text-[10px] text-gray-400",
                            children: "추출된 사이즈표 — 셀을 클릭하면 수정할 수 있습니다"
                        }, void 0, false, {
                            fileName: "[project]/src/components/AddProductModal.tsx",
                            lineNumber: 114,
                            columnNumber: 13
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/src/components/AddProductModal.tsx",
                        lineNumber: 113,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "overflow-x-auto",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("table", {
                            className: "w-full text-xs text-left",
                            children: [
                                form.formData.extractedTable.headers.length > 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("thead", {
                                    className: "border-b border-white/10",
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                                        children: form.formData.extractedTable.headers.map((header, colIdx)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                onClick: ()=>form.setTableEditingCell({
                                                        kind: 'header',
                                                        colIdx
                                                    }),
                                                className: `px-2 py-1.5 font-semibold whitespace-nowrap cursor-pointer hover:bg-white/[0.06] transition ${(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$sizeTable$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["normalizeCellText"])(header) === __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$constants$2f$index$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ITEM_LABEL"] ? 'text-gray-200' : 'text-green-400'} ${colIdx === 0 ? 'border-r border-white/10' : ''}`,
                                                children: form.tableEditingCell?.kind === 'header' && form.tableEditingCell.colIdx === colIdx ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                    autoFocus: true,
                                                    defaultValue: header,
                                                    onBlur: (e)=>commitTableCell(form, e.target.value),
                                                    onKeyDown: (e)=>{
                                                        if (e.key === 'Enter') commitTableCell(form, e.target.value);
                                                        if (e.key === 'Escape') form.setTableEditingCell(null);
                                                    },
                                                    onClick: (e)=>e.stopPropagation(),
                                                    className: "bg-transparent border-b border-orange-400 outline-none w-full min-w-[40px] text-white"
                                                }, void 0, false, {
                                                    fileName: "[project]/src/components/AddProductModal.tsx",
                                                    lineNumber: 128,
                                                    columnNumber: 27
                                                }, this) : header
                                            }, colIdx, false, {
                                                fileName: "[project]/src/components/AddProductModal.tsx",
                                                lineNumber: 122,
                                                columnNumber: 23
                                            }, this))
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/AddProductModal.tsx",
                                        lineNumber: 120,
                                        columnNumber: 19
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/src/components/AddProductModal.tsx",
                                    lineNumber: 119,
                                    columnNumber: 17
                                }, this) : null,
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("tbody", {
                                    children: form.formData.extractedTable.rows.map((row, rowIdx)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                                            className: "border-b border-white/[0.06]",
                                            children: row.map((cell, colIdx)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                    onClick: ()=>form.setTableEditingCell({
                                                            kind: 'row',
                                                            rowIdx,
                                                            colIdx
                                                        }),
                                                    className: `px-2 py-1.5 whitespace-nowrap cursor-pointer hover:bg-white/[0.06] transition ${colIdx === 0 ? 'text-gray-300 border-r border-white/10' : 'text-gray-400'}`,
                                                    children: form.tableEditingCell?.kind === 'row' && form.tableEditingCell.rowIdx === rowIdx && form.tableEditingCell.colIdx === colIdx ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                        autoFocus: true,
                                                        defaultValue: cell,
                                                        onBlur: (e)=>commitTableCell(form, e.target.value),
                                                        onKeyDown: (e)=>{
                                                            if (e.key === 'Enter') commitTableCell(form, e.target.value);
                                                            if (e.key === 'Escape') form.setTableEditingCell(null);
                                                        },
                                                        onClick: (e)=>e.stopPropagation(),
                                                        className: "bg-transparent border-b border-orange-400 outline-none w-full min-w-[40px] text-white"
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/components/AddProductModal.tsx",
                                                        lineNumber: 155,
                                                        columnNumber: 27
                                                    }, this) : cell
                                                }, colIdx, false, {
                                                    fileName: "[project]/src/components/AddProductModal.tsx",
                                                    lineNumber: 149,
                                                    columnNumber: 23
                                                }, this))
                                        }, rowIdx, false, {
                                            fileName: "[project]/src/components/AddProductModal.tsx",
                                            lineNumber: 147,
                                            columnNumber: 19
                                        }, this))
                                }, void 0, false, {
                                    fileName: "[project]/src/components/AddProductModal.tsx",
                                    lineNumber: 145,
                                    columnNumber: 15
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/components/AddProductModal.tsx",
                            lineNumber: 117,
                            columnNumber: 13
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/src/components/AddProductModal.tsx",
                        lineNumber: 116,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/AddProductModal.tsx",
                lineNumber: 112,
                columnNumber: 9
            }, this) : null,
            form.addProductMode === 'capture' ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                className: "cursor-pointer w-full h-20 bg-white/[0.06] border border-dashed border-white/15 rounded-xl flex items-center justify-center overflow-hidden hover:border-white/25 hover:bg-white/[0.09] transition backdrop-blur-sm",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex items-center gap-2 text-gray-400",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$camera$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Camera$3e$__["Camera"], {
                                className: "w-4 h-4"
                            }, void 0, false, {
                                fileName: "[project]/src/components/AddProductModal.tsx",
                                lineNumber: 179,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "text-xs",
                                children: "캡쳐본 다시 업로드"
                            }, void 0, false, {
                                fileName: "[project]/src/components/AddProductModal.tsx",
                                lineNumber: 180,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/AddProductModal.tsx",
                        lineNumber: 178,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                        type: "file",
                        className: "hidden",
                        accept: "image/*",
                        onChange: form.handleCaptureUpload
                    }, void 0, false, {
                        fileName: "[project]/src/components/AddProductModal.tsx",
                        lineNumber: 182,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/AddProductModal.tsx",
                lineNumber: 177,
                columnNumber: 9
            }, this) : null,
            form.isAutofillingFromImage ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "text-xs text-[#1ED760]",
                children: "캡쳐 이미지 AI 분석 중..."
            }, void 0, false, {
                fileName: "[project]/src/components/AddProductModal.tsx",
                lineNumber: 185,
                columnNumber: 38
            }, this) : null
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/AddProductModal.tsx",
        lineNumber: 86,
        columnNumber: 5
    }, this);
}
function AddProductForm({ form }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Fragment"], {
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                className: "w-full px-4 py-3 bg-white/[0.07] border border-white/10 rounded-xl text-white placeholder:text-white backdrop-blur-sm focus:outline-none focus:border-orange-500 focus:bg-white/[0.1] transition",
                placeholder: "브랜드명",
                value: form.formData.brand,
                onChange: (e)=>form.setFormData({
                        ...form.formData,
                        brand: e.target.value
                    })
            }, void 0, false, {
                fileName: "[project]/src/components/AddProductModal.tsx",
                lineNumber: 193,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                className: "w-full px-4 py-3 bg-white/[0.07] border border-white/10 rounded-xl text-white placeholder:text-white backdrop-blur-sm focus:outline-none focus:border-orange-500 focus:bg-white/[0.1] transition",
                placeholder: "상품명",
                value: form.formData.name,
                onChange: (e)=>form.setFormData({
                        ...form.formData,
                        name: e.target.value
                    })
            }, void 0, false, {
                fileName: "[project]/src/components/AddProductModal.tsx",
                lineNumber: 194,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                className: `w-full px-4 py-3 bg-white/[0.07] border border-white/10 rounded-xl backdrop-blur-sm focus:outline-none focus:border-orange-500 transition [&>option]:bg-gray-900 [&>option]:text-white ${form.formData.category ? 'text-white' : 'text-gray-400'}`,
                value: form.formData.category,
                onChange: (e)=>form.setFormData({
                        ...form.formData,
                        category: e.target.value
                    }),
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                        value: "",
                        children: "카테고리"
                    }, void 0, false, {
                        fileName: "[project]/src/components/AddProductModal.tsx",
                        lineNumber: 200,
                        columnNumber: 9
                    }, this),
                    __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$constants$2f$index$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["CATEGORY_OPTIONS"].map((category)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                            value: category,
                            children: category
                        }, category, false, {
                            fileName: "[project]/src/components/AddProductModal.tsx",
                            lineNumber: 202,
                            columnNumber: 11
                        }, this))
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/AddProductModal.tsx",
                lineNumber: 195,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "space-y-2",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "relative",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$globe$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Globe$3e$__["Globe"], {
                                className: "absolute left-4 top-3.5 w-4 h-4 text-gray-500"
                            }, void 0, false, {
                                fileName: "[project]/src/components/AddProductModal.tsx",
                                lineNumber: 207,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                className: "w-full pl-10 pr-4 py-3 bg-white/[0.07] border border-white/10 rounded-xl text-white placeholder:text-white backdrop-blur-sm focus:outline-none focus:border-orange-500 focus:bg-white/[0.1] transition",
                                placeholder: "공식 URL (선택)",
                                value: form.formData.url,
                                onChange: (e)=>{
                                    form.setFormData({
                                        ...form.formData,
                                        url: e.target.value
                                    });
                                    form.setAutoFillError(null);
                                }
                            }, void 0, false, {
                                fileName: "[project]/src/components/AddProductModal.tsx",
                                lineNumber: 208,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/AddProductModal.tsx",
                        lineNumber: 206,
                        columnNumber: 9
                    }, this),
                    form.addProductMode === 'url' ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        onClick: ()=>void form.handleAutoFillFromUrl(),
                        disabled: form.isAutofillingFromUrl || !form.formData.url.trim() || form.isSaving,
                        className: `w-full px-4 py-2.5 rounded-xl text-sm font-semibold border transition flex items-center justify-center gap-2 ${form.isAutofillingFromUrl || !form.formData.url.trim() || form.isSaving ? 'border-white/10 text-gray-500 bg-white/[0.04] cursor-not-allowed' : 'border-orange-500/60 text-orange-300 bg-orange-500/10 hover:bg-orange-500/20'}`,
                        children: [
                            form.isAutofillingFromUrl ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$loader$2d$circle$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Loader2$3e$__["Loader2"], {
                                className: "w-4 h-4 animate-spin"
                            }, void 0, false, {
                                fileName: "[project]/src/components/AddProductModal.tsx",
                                lineNumber: 228,
                                columnNumber: 42
                            }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$refresh$2d$cw$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__RefreshCw$3e$__["RefreshCw"], {
                                className: "w-4 h-4"
                            }, void 0, false, {
                                fileName: "[project]/src/components/AddProductModal.tsx",
                                lineNumber: 228,
                                columnNumber: 89
                            }, this),
                            form.isAutofillingFromUrl ? 'URL 분석 중...' : 'URL로 자동 입력'
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/AddProductModal.tsx",
                        lineNumber: 219,
                        columnNumber: 11
                    }, this) : null,
                    form.autoFillError ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "text-xs text-red-400",
                        children: form.autoFillError
                    }, void 0, false, {
                        fileName: "[project]/src/components/AddProductModal.tsx",
                        lineNumber: 232,
                        columnNumber: 31
                    }, this) : null
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/AddProductModal.tsx",
                lineNumber: 205,
                columnNumber: 7
            }, this),
            form.addProductMode === 'url' ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                className: "space-y-2 rounded-2xl border border-[#1ED760]/40 bg-[#121212] p-3",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex items-center justify-between",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                className: "text-sm font-semibold text-[#1ED760]",
                                children: "AI 추출 이미지 미리보기"
                            }, void 0, false, {
                                fileName: "[project]/src/components/AddProductModal.tsx",
                                lineNumber: 237,
                                columnNumber: 13
                            }, this),
                            form.isAutofillingFromUrl ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "text-xs text-[#1ED760]",
                                children: "Gemini 분석 중..."
                            }, void 0, false, {
                                fileName: "[project]/src/components/AddProductModal.tsx",
                                lineNumber: 238,
                                columnNumber: 42
                            }, this) : null
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/AddProductModal.tsx",
                        lineNumber: 236,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "relative w-full h-36 rounded-xl overflow-hidden border border-gray-700 bg-gray-900/70 flex items-center justify-center",
                        children: [
                            !form.aiPreviewImageSrc && !form.isAutofillingFromUrl ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex flex-col items-center gap-2 text-gray-500",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$camera$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Camera$3e$__["Camera"], {
                                        className: "w-6 h-6"
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/AddProductModal.tsx",
                                        lineNumber: 243,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "text-xs",
                                        children: "URL 자동 입력 후 대표 이미지가 표시됩니다."
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/AddProductModal.tsx",
                                        lineNumber: 244,
                                        columnNumber: 17
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/AddProductModal.tsx",
                                lineNumber: 242,
                                columnNumber: 15
                            }, this) : null,
                            form.aiPreviewImageSrc ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("img", {
                                src: form.aiPreviewImageSrc,
                                className: `h-full max-w-full object-contain transition-opacity duration-200 ${form.isAiPreviewLoading ? 'opacity-0' : 'opacity-100'}`,
                                onLoad: form.handleAiPreviewLoad,
                                onError: form.handleAiPreviewError,
                                alt: "AI extracted product preview"
                            }, void 0, false, {
                                fileName: "[project]/src/components/AddProductModal.tsx",
                                lineNumber: 248,
                                columnNumber: 15
                            }, this) : null,
                            form.isAutofillingFromUrl || form.isAiPreviewLoading ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "absolute inset-0 animate-pulse bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800"
                            }, void 0, false, {
                                fileName: "[project]/src/components/AddProductModal.tsx",
                                lineNumber: 257,
                                columnNumber: 15
                            }, this) : null
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/AddProductModal.tsx",
                        lineNumber: 240,
                        columnNumber: 11
                    }, this),
                    form.didFallbackAiPreviewImage ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "text-xs text-amber-300",
                        children: "이미지를 불러오지 못해 기본 이미지로 대체했습니다."
                    }, void 0, false, {
                        fileName: "[project]/src/components/AddProductModal.tsx",
                        lineNumber: 261,
                        columnNumber: 13
                    }, this) : null
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/AddProductModal.tsx",
                lineNumber: 235,
                columnNumber: 9
            }, this) : null,
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(ProductImageSection, {
                form: form
            }, void 0, false, {
                fileName: "[project]/src/components/AddProductModal.tsx",
                lineNumber: 265,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(SizeTableSection, {
                form: form
            }, void 0, false, {
                fileName: "[project]/src/components/AddProductModal.tsx",
                lineNumber: 266,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true);
}
function ModalBody({ form }) {
    if (form.addProductMode === 'menu') {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "space-y-5",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                    type: "button",
                    onClick: ()=>form.setAddProductMode('url'),
                    className: "flex w-full items-center justify-between rounded-2xl border border-white/10 bg-white/[0.06] backdrop-blur-sm px-5 py-5 text-left transition hover:border-orange-500/60 hover:bg-white/[0.1]",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "text-sm font-semibold text-white sm:text-base",
                                children: "공식홈페이지 URL 업로드해서 추가"
                            }, void 0, false, {
                                fileName: "[project]/src/components/AddProductModal.tsx",
                                lineNumber: 281,
                                columnNumber: 13
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/src/components/AddProductModal.tsx",
                            lineNumber: 280,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$globe$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Globe$3e$__["Globe"], {
                            className: "h-5 w-5 text-orange-400"
                        }, void 0, false, {
                            fileName: "[project]/src/components/AddProductModal.tsx",
                            lineNumber: 283,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/components/AddProductModal.tsx",
                    lineNumber: 275,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                    type: "button",
                    onClick: ()=>form.setAddProductMode('manual'),
                    className: "flex w-full items-center justify-between rounded-2xl border border-white/10 bg-white/[0.06] backdrop-blur-sm px-5 py-5 text-left transition hover:border-white/20 hover:bg-white/[0.1]",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "text-sm font-semibold text-white sm:text-base",
                                children: "직접 추가"
                            }, void 0, false, {
                                fileName: "[project]/src/components/AddProductModal.tsx",
                                lineNumber: 291,
                                columnNumber: 13
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/src/components/AddProductModal.tsx",
                            lineNumber: 290,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$plus$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Plus$3e$__["Plus"], {
                            className: "h-5 w-5 text-gray-300"
                        }, void 0, false, {
                            fileName: "[project]/src/components/AddProductModal.tsx",
                            lineNumber: 293,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/components/AddProductModal.tsx",
                    lineNumber: 285,
                    columnNumber: 9
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/src/components/AddProductModal.tsx",
            lineNumber: 274,
            columnNumber: 7
        }, this);
    }
    if (form.addProductMode === 'capture' && !form.isCaptureReviewReady) {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "space-y-3",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                    className: "text-sm text-gray-400",
                    children: "캡쳐 사진 업로드"
                }, void 0, false, {
                    fileName: "[project]/src/components/AddProductModal.tsx",
                    lineNumber: 302,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                    className: "cursor-pointer flex min-h-40 w-full flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-white/15 bg-white/[0.06] backdrop-blur-sm px-5 py-8 text-center transition hover:border-[#00FF00]/60 hover:bg-white/[0.09]",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$camera$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Camera$3e$__["Camera"], {
                            className: "h-10 w-10 text-[#00FF00]"
                        }, void 0, false, {
                            fileName: "[project]/src/components/AddProductModal.tsx",
                            lineNumber: 304,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                    className: "text-sm font-semibold text-white",
                                    children: "캡쳐본을 업로드하면 상품 정보를 추출합니다."
                                }, void 0, false, {
                                    fileName: "[project]/src/components/AddProductModal.tsx",
                                    lineNumber: 306,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                    className: "mt-1 text-xs text-gray-400",
                                    children: "브랜드명, 상품명, 카테고리, URL, 이미지, 사이즈표를 자동 분석합니다."
                                }, void 0, false, {
                                    fileName: "[project]/src/components/AddProductModal.tsx",
                                    lineNumber: 307,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/components/AddProductModal.tsx",
                            lineNumber: 305,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                            type: "file",
                            className: "hidden",
                            accept: "image/*",
                            onChange: form.handleCaptureUpload
                        }, void 0, false, {
                            fileName: "[project]/src/components/AddProductModal.tsx",
                            lineNumber: 309,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/components/AddProductModal.tsx",
                    lineNumber: 303,
                    columnNumber: 9
                }, this),
                form.isAutofillingFromImage ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "text-xs text-[#1ED760]",
                    children: "캡쳐 이미지 AI 분석 중..."
                }, void 0, false, {
                    fileName: "[project]/src/components/AddProductModal.tsx",
                    lineNumber: 311,
                    columnNumber: 40
                }, this) : null,
                form.isAnalyzingTable ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "text-xs text-orange-400",
                    children: "사이즈표 추출 중..."
                }, void 0, false, {
                    fileName: "[project]/src/components/AddProductModal.tsx",
                    lineNumber: 312,
                    columnNumber: 34
                }, this) : null,
                form.autoFillError ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "text-xs text-red-400",
                    children: form.autoFillError
                }, void 0, false, {
                    fileName: "[project]/src/components/AddProductModal.tsx",
                    lineNumber: 313,
                    columnNumber: 31
                }, this) : null
            ]
        }, void 0, true, {
            fileName: "[project]/src/components/AddProductModal.tsx",
            lineNumber: 301,
            columnNumber: 7
        }, this);
    }
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(AddProductForm, {
        form: form
    }, void 0, false, {
        fileName: "[project]/src/components/AddProductModal.tsx",
        lineNumber: 318,
        columnNumber: 10
    }, this);
}
function AddProductModal({ form }) {
    if (!form.isModalOpen) return null;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "fixed inset-0 z-[60] flex items-center justify-center p-4",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "absolute inset-0 bg-black/60 backdrop-blur-sm",
                onClick: form.closeModal
            }, void 0, false, {
                fileName: "[project]/src/components/AddProductModal.tsx",
                lineNumber: 326,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "ui-add-product-modal bg-[linear-gradient(180deg,rgba(255,255,255,0.14),rgba(255,255,255,0.06))] backdrop-blur-2xl rounded-3xl w-full max-w-lg shadow-[0_24px_60px_rgba(0,0,0,0.5)] overflow-hidden relative flex flex-col max-h-[90vh] border border-white/10",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "px-6 py-4 border-b border-white/10 flex items-center justify-between bg-black/20 sticky top-0 z-10 text-white backdrop-blur-sm",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                className: "text-lg font-bold",
                                style: {
                                    color: '#00FF00'
                                },
                                children: "상품 추가"
                            }, void 0, false, {
                                fileName: "[project]/src/components/AddProductModal.tsx",
                                lineNumber: 329,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                onClick: form.closeModal,
                                className: "p-2 hover:bg-white/[0.1] rounded-full transition text-gray-400 hover:text-white",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$x$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__X$3e$__["X"], {
                                    className: "w-5 h-5"
                                }, void 0, false, {
                                    fileName: "[project]/src/components/AddProductModal.tsx",
                                    lineNumber: 330,
                                    columnNumber: 137
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/src/components/AddProductModal.tsx",
                                lineNumber: 330,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/AddProductModal.tsx",
                        lineNumber: 328,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "p-6 overflow-y-auto text-white space-y-4",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(ModalBody, {
                            form: form
                        }, void 0, false, {
                            fileName: "[project]/src/components/AddProductModal.tsx",
                            lineNumber: 333,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/src/components/AddProductModal.tsx",
                        lineNumber: 332,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "p-6 border-t border-white/10 bg-black/20 backdrop-blur-sm flex justify-end gap-3 sticky bottom-0",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                onClick: form.closeModal,
                                className: "px-5 py-2.5 rounded-xl text-sm font-medium text-gray-400 bg-white/[0.06] border border-white/10 hover:bg-white/[0.12] hover:text-white transition",
                                children: "취소"
                            }, void 0, false, {
                                fileName: "[project]/src/components/AddProductModal.tsx",
                                lineNumber: 336,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                onClick: form.handleSubmitProduct,
                                disabled: !form.isFormValid,
                                className: `px-5 py-2.5 rounded-xl text-sm font-bold text-black transition flex items-center gap-2 ${!form.isFormValid ? 'bg-gray-700 cursor-not-allowed text-gray-500' : 'hover:bg-orange-400'}`,
                                style: !form.isFormValid ? {} : {
                                    backgroundColor: '#F97316'
                                },
                                children: [
                                    form.isSaving ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$loader$2d$circle$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Loader2$3e$__["Loader2"], {
                                        className: "w-4 h-4 animate-spin"
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/AddProductModal.tsx",
                                        lineNumber: 338,
                                        columnNumber: 30
                                    }, this) : null,
                                    form.isSaving ? '제출 중...' : '상품 등록하기'
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/AddProductModal.tsx",
                                lineNumber: 337,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/AddProductModal.tsx",
                        lineNumber: 335,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/AddProductModal.tsx",
                lineNumber: 327,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/AddProductModal.tsx",
        lineNumber: 325,
        columnNumber: 5
    }, this);
}
}),
"[project]/src/components/GoogleSignupCompleteModal.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "GoogleSignupCompleteModal",
    ()=>GoogleSignupCompleteModal
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
;
function GoogleSignupCompleteModal({ onStart }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm",
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "bg-[#1a1a1a] border border-white/10 rounded-2xl p-8 shadow-[0_8px_40px_rgba(0,0,0,0.6)] max-w-sm w-full mx-4 text-center",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "text-5xl mb-4",
                    children: "🎉"
                }, void 0, false, {
                    fileName: "[project]/src/components/GoogleSignupCompleteModal.tsx",
                    lineNumber: 9,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                    className: "text-white font-bold text-lg mb-2",
                    children: "회원가입이 완료됐습니다!"
                }, void 0, false, {
                    fileName: "[project]/src/components/GoogleSignupCompleteModal.tsx",
                    lineNumber: 10,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                    className: "text-gray-400 text-sm mb-6",
                    children: "이제 구글 계정으로 로그인할 수 있어요."
                }, void 0, false, {
                    fileName: "[project]/src/components/GoogleSignupCompleteModal.tsx",
                    lineNumber: 11,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                    onClick: onStart,
                    className: "w-full py-3 rounded-xl text-sm font-bold bg-orange-500 hover:bg-orange-400 text-black transition",
                    children: "시작하기"
                }, void 0, false, {
                    fileName: "[project]/src/components/GoogleSignupCompleteModal.tsx",
                    lineNumber: 12,
                    columnNumber: 9
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/src/components/GoogleSignupCompleteModal.tsx",
            lineNumber: 8,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/src/components/GoogleSignupCompleteModal.tsx",
        lineNumber: 7,
        columnNumber: 5
    }, this);
}
}),
"[project]/src/components/CategoryDropdown.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "CategoryDropdown",
    ()=>CategoryDropdown
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevron$2d$down$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__ChevronDown$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/chevron-down.js [app-ssr] (ecmascript) <export default as ChevronDown>");
;
;
;
function CategoryDropdown({ options, value, counts, onChange, totalLabel = 'Total', ariaLabel = '상품 카테고리 필터', className = 'relative w-28 sm:mr-4 sm:w-28' }) {
    const [isOpen, setIsOpen] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    const dropdownRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(null);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        const handleOutside = (event)=>{
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        const handleKeyDown = (event)=>{
            if (event.key === 'Escape') {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleOutside);
        document.addEventListener('keydown', handleKeyDown);
        return ()=>{
            document.removeEventListener('mousedown', handleOutside);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, []);
    const handleSelect = (nextValue)=>{
        onChange(nextValue);
        setIsOpen(false);
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        ref: dropdownRef,
        className: className,
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                type: "button",
                className: `flex h-[1.7rem] w-full items-center justify-between rounded-[20px] border-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.14),rgba(255,255,255,0.05))] pl-3 pr-3 text-left text-[0.7rem] font-medium shadow-[0_16px_36px_rgba(0,0,0,0.18)] backdrop-blur-xl transition-colors sm:h-8 sm:pl-4 sm:pr-4 sm:text-xs ${value ? 'text-white' : 'text-gray-400'}`,
                onClick: ()=>setIsOpen((prev)=>!prev),
                "aria-haspopup": "listbox",
                "aria-expanded": isOpen,
                "aria-label": ariaLabel,
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "truncate",
                        children: value || totalLabel
                    }, void 0, false, {
                        fileName: "[project]/src/components/CategoryDropdown.tsx",
                        lineNumber: 62,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevron$2d$down$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__ChevronDown$3e$__["ChevronDown"], {
                        className: `h-3 w-3 shrink-0 sm:h-4 sm:w-4 ${isOpen ? 'rotate-180' : ''}`
                    }, void 0, false, {
                        fileName: "[project]/src/components/CategoryDropdown.tsx",
                        lineNumber: 63,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/CategoryDropdown.tsx",
                lineNumber: 54,
                columnNumber: 7
            }, this),
            isOpen && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "absolute left-0 top-full z-20 mt-2 w-full overflow-hidden rounded-[14px] border-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.16),rgba(255,255,255,0.06))] shadow-[0_20px_44px_rgba(0,0,0,0.22)] backdrop-blur-2xl",
                role: "listbox",
                "aria-label": ariaLabel,
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        type: "button",
                        className: "flex w-full items-center justify-between px-3 py-2 text-left text-[0.7rem] text-white transition-colors hover:bg-white/[0.08] sm:px-4 sm:py-3 sm:text-xs",
                        onClick: ()=>handleSelect(''),
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                children: totalLabel
                            }, void 0, false, {
                                fileName: "[project]/src/components/CategoryDropdown.tsx",
                                lineNumber: 76,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "text-[9px] text-gray-400 sm:text-[10px]",
                                children: counts[totalLabel] ?? 0
                            }, void 0, false, {
                                fileName: "[project]/src/components/CategoryDropdown.tsx",
                                lineNumber: 77,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/CategoryDropdown.tsx",
                        lineNumber: 71,
                        columnNumber: 11
                    }, this),
                    options.map((option)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            type: "button",
                            className: "flex w-full items-center justify-between px-3 py-2 text-left text-[0.7rem] text-white transition-colors hover:bg-white/[0.08] sm:px-4 sm:py-3 sm:text-xs",
                            onClick: ()=>handleSelect(option),
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    children: option
                                }, void 0, false, {
                                    fileName: "[project]/src/components/CategoryDropdown.tsx",
                                    lineNumber: 86,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    className: "text-[9px] text-gray-400 sm:text-[10px]",
                                    children: counts[option] ?? 0
                                }, void 0, false, {
                                    fileName: "[project]/src/components/CategoryDropdown.tsx",
                                    lineNumber: 87,
                                    columnNumber: 15
                                }, this)
                            ]
                        }, option, true, {
                            fileName: "[project]/src/components/CategoryDropdown.tsx",
                            lineNumber: 80,
                            columnNumber: 13
                        }, this))
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/CategoryDropdown.tsx",
                lineNumber: 66,
                columnNumber: 9
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/CategoryDropdown.tsx",
        lineNumber: 53,
        columnNumber: 5
    }, this);
}
}),
"[project]/src/components/ProgressiveImage.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "ProgressiveImage",
    ()=>ProgressiveImage
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
;
;
const ProgressiveImage = ({ src, thumbnailSrc, alt, className, loading = 'lazy', onError })=>{
    const [loadedSrc, setLoadedSrc] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])('');
    const displaySrc = loadedSrc === src ? src : !src ? thumbnailSrc || '' : !thumbnailSrc || thumbnailSrc === src ? src : thumbnailSrc;
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        if (!src || !thumbnailSrc || thumbnailSrc === src) {
            return;
        }
        const preloader = new Image();
        preloader.src = src;
        preloader.onload = ()=>setLoadedSrc(src);
        preloader.onerror = ()=>setLoadedSrc(src);
        return ()=>{
            preloader.onload = null;
            preloader.onerror = null;
        };
    }, [
        src,
        thumbnailSrc
    ]);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("img", {
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
}),
"[project]/src/components/GridView.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "GridView",
    ()=>GridView
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$layout$2d$grid$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__LayoutGrid$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/layout-grid.js [app-ssr] (ecmascript) <export default as LayoutGrid>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$search$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Search$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/search.js [app-ssr] (ecmascript) <export default as Search>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$CategoryDropdown$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/CategoryDropdown.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ProgressiveImage$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/ProgressiveImage.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$constants$2f$index$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/constants/index.ts [app-ssr] (ecmascript)");
;
;
;
;
;
function GridView({ allProducts, filteredGridProducts, gridCategoryCounts, gridCategoryFilter, setGridCategoryFilter, gridSearchQuery, setGridSearchQuery, onProductClick, onImageError }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "w-full max-w-7xl",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "mb-6 flex flex-col gap-4",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                        className: "flex items-center gap-3 text-2xl sm:text-3xl font-bold text-white",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$layout$2d$grid$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__LayoutGrid$3e$__["LayoutGrid"], {
                                className: "w-7 h-7 text-orange-500"
                            }, void 0, false, {
                                fileName: "[project]/src/components/GridView.tsx",
                                lineNumber: 35,
                                columnNumber: 11
                            }, this),
                            "전체 상품 보기"
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/GridView.tsx",
                        lineNumber: 34,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "h-6 sm:h-8"
                    }, void 0, false, {
                        fileName: "[project]/src/components/GridView.tsx",
                        lineNumber: 38,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "fixed left-1/2 top-[5.6rem] z-30 flex w-[calc(100%-2rem)] max-w-7xl -translate-x-1/2 justify-end sm:top-[8.3rem]",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "flex w-full max-w-[11.5rem] flex-col-reverse items-end justify-end gap-2 sm:ml-auto sm:w-fit sm:max-w-none sm:flex-row sm:items-center sm:gap-3",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$CategoryDropdown$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["CategoryDropdown"], {
                                    options: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$constants$2f$index$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["CATEGORY_OPTIONS"],
                                    value: gridCategoryFilter,
                                    counts: gridCategoryCounts,
                                    onChange: setGridCategoryFilter,
                                    totalLabel: "Total",
                                    ariaLabel: "상품 카테고리 필터",
                                    className: "relative w-[5.6rem] shrink-0 sm:w-28"
                                }, void 0, false, {
                                    fileName: "[project]/src/components/GridView.tsx",
                                    lineNumber: 41,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                    className: "relative block w-[7.2rem] sm:w-40",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$search$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Search$3e$__["Search"], {
                                            className: "pointer-events-none absolute left-3 top-1/2 z-[1] h-3 w-3 -translate-y-1/2 text-gray-400 sm:left-4 sm:h-4 sm:w-4"
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/GridView.tsx",
                                            lineNumber: 51,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                            type: "text",
                                            value: gridSearchQuery,
                                            onChange: (e)=>setGridSearchQuery(e.target.value),
                                            placeholder: "상품 검색",
                                            "aria-label": "전체 상품 검색",
                                            className: "h-[1.7rem] w-full rounded-[20px] border-0 bg-[linear-gradient(180deg,rgba(10,10,10,0.88),rgba(28,28,28,0.72))] pl-8 pr-3 text-[0.7rem] font-medium text-white placeholder:text-gray-400 shadow-[0_16px_36px_rgba(0,0,0,0.28)] backdrop-blur-xl focus:outline-none sm:h-8 sm:pl-10 sm:pr-4 sm:text-xs"
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/GridView.tsx",
                                            lineNumber: 52,
                                            columnNumber: 15
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/components/GridView.tsx",
                                    lineNumber: 50,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/components/GridView.tsx",
                            lineNumber: 40,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/src/components/GridView.tsx",
                        lineNumber: 39,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/GridView.tsx",
                lineNumber: 33,
                columnNumber: 7
            }, this),
            allProducts.length === 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "text-center py-20 text-gray-500",
                children: "등록된 상품이 없습니다."
            }, void 0, false, {
                fileName: "[project]/src/components/GridView.tsx",
                lineNumber: 65,
                columnNumber: 9
            }, this) : filteredGridProducts.length === 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "text-center py-20 text-gray-500",
                children: "검색 조건에 맞는 상품이 없습니다."
            }, void 0, false, {
                fileName: "[project]/src/components/GridView.tsx",
                lineNumber: 67,
                columnNumber: 9
            }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "grid grid-cols-2 gap-6 lg:grid-cols-4",
                children: filteredGridProducts.map((product)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        onClick: ()=>onProductClick(product),
                        className: "ui-product-card group relative flex h-full cursor-pointer flex-col overflow-hidden rounded-[28px] bg-[linear-gradient(180deg,rgba(255,255,255,0.22),rgba(255,255,255,0.08))] shadow-[0_18px_44px_rgba(0,0,0,0.24)] backdrop-blur-2xl transition hover:-translate-y-1 hover:shadow-[0_24px_54px_rgba(0,0,0,0.3)]",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.22),transparent_32%,transparent_68%,rgba(255,255,255,0.1))]"
                            }, void 0, false, {
                                fileName: "[project]/src/components/GridView.tsx",
                                lineNumber: 76,
                                columnNumber: 15
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "relative mx-1.5 mb-0 mt-1.5 flex h-44 items-center justify-center overflow-hidden rounded-[24px] bg-[linear-gradient(180deg,rgba(17,24,39,0.72),rgba(0,0,0,0.46))] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] sm:m-3 sm:h-48 sm:rounded-[22px] sm:p-4",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.12),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(249,115,22,0.12),transparent_28%)]"
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/GridView.tsx",
                                        lineNumber: 78,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ProgressiveImage$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ProgressiveImage"], {
                                        src: product.image,
                                        thumbnailSrc: product.thumbnailImage,
                                        alt: product.name,
                                        className: "relative z-[1] max-h-full max-w-full rounded-[10px] object-contain",
                                        onError: onImageError
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/GridView.tsx",
                                        lineNumber: 79,
                                        columnNumber: 17
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/GridView.tsx",
                                lineNumber: 77,
                                columnNumber: 15
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex flex-1 flex-col justify-center bg-black/10 px-4 pb-4 pt-3 text-center sm:px-5 sm:pb-5 sm:pt-4",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "mb-2 w-full pl-[5%] text-left text-xs font-bold uppercase tracking-wide text-orange-500",
                                        children: product.brand
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/GridView.tsx",
                                        lineNumber: 88,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                        className: "mb-1 w-full pl-[5%] text-left text-[0.95rem] font-bold leading-tight text-white sm:text-lg",
                                        children: product.name
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/GridView.tsx",
                                        lineNumber: 89,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "pt-2 text-sm text-gray-300",
                                        children: product.category
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/GridView.tsx",
                                        lineNumber: 90,
                                        columnNumber: 17
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/GridView.tsx",
                                lineNumber: 87,
                                columnNumber: 15
                            }, this)
                        ]
                    }, product.id, true, {
                        fileName: "[project]/src/components/GridView.tsx",
                        lineNumber: 71,
                        columnNumber: 13
                    }, this))
            }, void 0, false, {
                fileName: "[project]/src/components/GridView.tsx",
                lineNumber: 69,
                columnNumber: 9
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/GridView.tsx",
        lineNumber: 32,
        columnNumber: 5
    }, this);
}
}),
"[project]/src/components/NeedsUsernameModal.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "NeedsUsernameModal",
    ()=>NeedsUsernameModal
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
;
function NeedsUsernameModal({ pendingUsername, onUsernameChange, onSubmit, usernameError, isSubmitting }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm",
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "bg-[#1a1a1a] border border-white/10 rounded-2xl p-8 shadow-[0_8px_40px_rgba(0,0,0,0.6)] max-w-sm w-full mx-4",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                    className: "text-white font-bold text-lg mb-1",
                    children: "닉네임을 설정해주세요"
                }, void 0, false, {
                    fileName: "[project]/src/components/NeedsUsernameModal.tsx",
                    lineNumber: 19,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                    className: "text-gray-500 text-sm mb-6",
                    children: "구글 회원가입 마지막 단계입니다."
                }, void 0, false, {
                    fileName: "[project]/src/components/NeedsUsernameModal.tsx",
                    lineNumber: 20,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                    type: "text",
                    value: pendingUsername,
                    onChange: (e)=>onUsernameChange(e.target.value),
                    onKeyDown: (e)=>{
                        if (e.key === 'Enter') onSubmit();
                    },
                    placeholder: "사용할 이름을 입력하세요",
                    className: "w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl text-white placeholder-gray-500 placeholder:text-sm focus:outline-none focus:border-orange-500 transition mb-3",
                    autoFocus: true
                }, void 0, false, {
                    fileName: "[project]/src/components/NeedsUsernameModal.tsx",
                    lineNumber: 21,
                    columnNumber: 9
                }, this),
                usernameError && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                    className: "text-sm text-red-400 bg-red-900/20 border border-red-500/30 rounded-lg px-3 py-2 mb-3",
                    children: usernameError
                }, void 0, false, {
                    fileName: "[project]/src/components/NeedsUsernameModal.tsx",
                    lineNumber: 31,
                    columnNumber: 11
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                    disabled: isSubmitting,
                    onClick: onSubmit,
                    className: `w-full py-3 rounded-xl text-sm font-bold transition ${isSubmitting ? 'bg-gray-700 text-gray-400 cursor-not-allowed' : 'bg-orange-500 hover:bg-orange-400 text-black'}`,
                    children: isSubmitting ? '저장 중...' : '완료'
                }, void 0, false, {
                    fileName: "[project]/src/components/NeedsUsernameModal.tsx",
                    lineNumber: 35,
                    columnNumber: 9
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/src/components/NeedsUsernameModal.tsx",
            lineNumber: 18,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/src/components/NeedsUsernameModal.tsx",
        lineNumber: 17,
        columnNumber: 5
    }, this);
}
}),
"[project]/src/components/LoginPage.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "LoginPage",
    ()=>LoginPage
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$log$2d$in$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__LogIn$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/log-in.js [app-ssr] (ecmascript) <export default as LogIn>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$user$2d$plus$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__UserPlus$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/user-plus.js [app-ssr] (ecmascript) <export default as UserPlus>");
;
;
;
const GoogleIcon = ()=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
        width: "18",
        height: "18",
        viewBox: "0 0 18 18",
        xmlns: "http://www.w3.org/2000/svg",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                d: "M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z",
                fill: "#4285F4"
            }, void 0, false, {
                fileName: "[project]/src/components/LoginPage.tsx",
                lineNumber: 16,
                columnNumber: 5
            }, ("TURBOPACK compile-time value", void 0)),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                d: "M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z",
                fill: "#34A853"
            }, void 0, false, {
                fileName: "[project]/src/components/LoginPage.tsx",
                lineNumber: 17,
                columnNumber: 5
            }, ("TURBOPACK compile-time value", void 0)),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                d: "M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z",
                fill: "#FBBC05"
            }, void 0, false, {
                fileName: "[project]/src/components/LoginPage.tsx",
                lineNumber: 18,
                columnNumber: 5
            }, ("TURBOPACK compile-time value", void 0)),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                d: "M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z",
                fill: "#EA4335"
            }, void 0, false, {
                fileName: "[project]/src/components/LoginPage.tsx",
                lineNumber: 19,
                columnNumber: 5
            }, ("TURBOPACK compile-time value", void 0))
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/LoginPage.tsx",
        lineNumber: 15,
        columnNumber: 3
    }, ("TURBOPACK compile-time value", void 0));
const LoginPage = ({ supabase, onSuccess, googleAuthError, onClearGoogleAuthError })=>{
    const [tab, setTab] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])('login');
    const [email, setEmail] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])('');
    const [username, setUsername] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])('');
    const [password, setPassword] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])('');
    const [passwordConfirm, setPasswordConfirm] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])('');
    const [error, setError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    const [info, setInfo] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    const [isSubmitting, setIsSubmitting] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    const [signupEmail, setSignupEmail] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    const handleGoogleLogin = async ()=>{
        setError(null);
        localStorage.setItem('google_oauth_intent', tab);
        const { error: authError } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: window.location.origin
            }
        });
        if (authError) {
            localStorage.removeItem('google_oauth_intent');
            setError(authError.message);
        }
    };
    const reset = ()=>{
        setEmail('');
        setUsername('');
        setPassword('');
        setPasswordConfirm('');
        setError(null);
        setInfo(null);
    };
    const switchTab = (next)=>{
        setTab(next);
        reset();
        onClearGoogleAuthError?.();
    };
    const handleSubmit = async ()=>{
        const trimmedEmail = email.trim();
        const trimmedPassword = password;
        if (!trimmedEmail) {
            setError('이메일을 입력하세요.');
            return;
        }
        if (tab === 'signup' && !username.trim()) {
            setError('계정이름을 입력하세요.');
            return;
        }
        if (!trimmedPassword) {
            setError('비밀번호를 입력하세요.');
            return;
        }
        if (tab === 'signup' && password !== passwordConfirm) {
            setError('비밀번호가 일치하지 않습니다.');
            return;
        }
        setIsSubmitting(true);
        setError(null);
        setInfo(null);
        try {
            if (tab === 'login') {
                const { error: authError } = await supabase.auth.signInWithPassword({
                    email: trimmedEmail,
                    password: trimmedPassword
                });
                if (authError) throw authError;
                onSuccess();
            } else {
                const trimmedUsername = username.trim();
                // username 중복 체크
                const { data: existing } = await supabase.from('users').select('username').eq('username', trimmedUsername).maybeSingle();
                if (existing) {
                    setError('이미 사용중인 이름입니다. 다른 이름을 사용해 주세요.');
                    return;
                }
                const { error: authError } = await supabase.auth.signUp({
                    email: trimmedEmail,
                    password: trimmedPassword,
                    options: {
                        data: {
                            username: trimmedUsername
                        }
                    }
                });
                if (authError) throw authError;
                setSignupEmail(trimmedEmail);
                reset();
                setTab('login');
            }
        } catch (err) {
            const message = err instanceof Error ? err.message : '오류가 발생했습니다.';
            setError(message);
        } finally{
            setIsSubmitting(false);
        }
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Fragment"], {
        children: [
            signupEmail && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "bg-[#1a1a1a] border border-white/10 rounded-2xl p-8 shadow-[0_8px_40px_rgba(0,0,0,0.6)] max-w-sm w-full mx-4 text-center",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "text-4xl mb-4",
                            children: "✉️"
                        }, void 0, false, {
                            fileName: "[project]/src/components/LoginPage.tsx",
                            lineNumber: 117,
                            columnNumber: 13
                        }, ("TURBOPACK compile-time value", void 0)),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                            className: "text-white font-bold text-lg mb-2",
                            children: "이메일 인증이 필요해요"
                        }, void 0, false, {
                            fileName: "[project]/src/components/LoginPage.tsx",
                            lineNumber: 118,
                            columnNumber: 13
                        }, ("TURBOPACK compile-time value", void 0)),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            className: "text-gray-400 text-sm mb-1",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    className: "text-orange-400 font-semibold",
                                    children: signupEmail
                                }, void 0, false, {
                                    fileName: "[project]/src/components/LoginPage.tsx",
                                    lineNumber: 120,
                                    columnNumber: 15
                                }, ("TURBOPACK compile-time value", void 0)),
                                " 으로"
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/components/LoginPage.tsx",
                            lineNumber: 119,
                            columnNumber: 13
                        }, ("TURBOPACK compile-time value", void 0)),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            className: "text-gray-300 text-sm mb-6",
                            children: [
                                "인증 메일을 보냈어요.",
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("br", {}, void 0, false, {
                                    fileName: "[project]/src/components/LoginPage.tsx",
                                    lineNumber: 123,
                                    columnNumber: 27
                                }, ("TURBOPACK compile-time value", void 0)),
                                "메일함에서 ",
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    className: "text-orange-400 font-semibold",
                                    children: "인증 버튼"
                                }, void 0, false, {
                                    fileName: "[project]/src/components/LoginPage.tsx",
                                    lineNumber: 124,
                                    columnNumber: 21
                                }, ("TURBOPACK compile-time value", void 0)),
                                "을 눌러주세요."
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/components/LoginPage.tsx",
                            lineNumber: 122,
                            columnNumber: 13
                        }, ("TURBOPACK compile-time value", void 0)),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            onClick: ()=>setSignupEmail(null),
                            className: "w-full py-3 rounded-xl text-sm font-bold bg-orange-500 hover:bg-orange-400 text-black transition",
                            children: "확인"
                        }, void 0, false, {
                            fileName: "[project]/src/components/LoginPage.tsx",
                            lineNumber: 126,
                            columnNumber: 13
                        }, ("TURBOPACK compile-time value", void 0))
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/components/LoginPage.tsx",
                    lineNumber: 116,
                    columnNumber: 11
                }, ("TURBOPACK compile-time value", void 0))
            }, void 0, false, {
                fileName: "[project]/src/components/LoginPage.tsx",
                lineNumber: 115,
                columnNumber: 9
            }, ("TURBOPACK compile-time value", void 0)),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "w-full max-w-md mx-auto mt-16 px-4",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))] border border-white/10 rounded-2xl p-8 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.4)]",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "flex rounded-xl overflow-hidden border border-white/10 mb-8",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    onClick: ()=>switchTab('login'),
                                    className: `flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-bold transition ${tab === 'login' ? 'bg-orange-500 text-black' : 'text-gray-400 hover:text-gray-200'}`,
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$log$2d$in$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__LogIn$3e$__["LogIn"], {
                                            className: "w-4 h-4"
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/LoginPage.tsx",
                                            lineNumber: 147,
                                            columnNumber: 13
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        "로그인"
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/components/LoginPage.tsx",
                                    lineNumber: 139,
                                    columnNumber: 11
                                }, ("TURBOPACK compile-time value", void 0)),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    onClick: ()=>switchTab('signup'),
                                    className: `flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-bold transition ${tab === 'signup' ? 'bg-orange-500 text-black' : 'text-gray-400 hover:text-gray-200'}`,
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$user$2d$plus$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__UserPlus$3e$__["UserPlus"], {
                                            className: "w-4 h-4"
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/LoginPage.tsx",
                                            lineNumber: 158,
                                            columnNumber: 13
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        "회원가입"
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/components/LoginPage.tsx",
                                    lineNumber: 150,
                                    columnNumber: 11
                                }, ("TURBOPACK compile-time value", void 0))
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/components/LoginPage.tsx",
                            lineNumber: 138,
                            columnNumber: 9
                        }, ("TURBOPACK compile-time value", void 0)),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "space-y-4",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                            className: "block text-xs text-gray-400 mb-1.5",
                                            children: "Email"
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/LoginPage.tsx",
                                            lineNumber: 165,
                                            columnNumber: 13
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                            type: "email",
                                            value: email,
                                            onChange: (e)=>setEmail(e.target.value),
                                            onKeyDown: (e)=>{
                                                if (e.key === 'Enter') void handleSubmit();
                                            },
                                            placeholder: "example@email.com",
                                            className: "w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl text-white placeholder-gray-500 placeholder:text-sm focus:outline-none focus:border-orange-500 transition"
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/LoginPage.tsx",
                                            lineNumber: 166,
                                            columnNumber: 13
                                        }, ("TURBOPACK compile-time value", void 0))
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/components/LoginPage.tsx",
                                    lineNumber: 164,
                                    columnNumber: 11
                                }, ("TURBOPACK compile-time value", void 0)),
                                tab === 'signup' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                            className: "block text-xs text-gray-400 mb-1.5",
                                            children: "Username"
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/LoginPage.tsx",
                                            lineNumber: 178,
                                            columnNumber: 15
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                            type: "text",
                                            value: username,
                                            onChange: (e)=>setUsername(e.target.value),
                                            onKeyDown: (e)=>{
                                                if (e.key === 'Enter') void handleSubmit();
                                            },
                                            placeholder: "사용할 이름을 입력하세요",
                                            className: "w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl text-white placeholder-gray-500 placeholder:text-sm focus:outline-none focus:border-orange-500 transition"
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/LoginPage.tsx",
                                            lineNumber: 179,
                                            columnNumber: 15
                                        }, ("TURBOPACK compile-time value", void 0))
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/components/LoginPage.tsx",
                                    lineNumber: 177,
                                    columnNumber: 13
                                }, ("TURBOPACK compile-time value", void 0)),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                            className: "block text-xs text-gray-400 mb-1.5",
                                            children: "Password"
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/LoginPage.tsx",
                                            lineNumber: 191,
                                            columnNumber: 13
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                            type: "password",
                                            value: password,
                                            onChange: (e)=>setPassword(e.target.value),
                                            onKeyDown: (e)=>{
                                                if (e.key === 'Enter') void handleSubmit();
                                            },
                                            placeholder: tab === 'signup' ? '8자 이상 입력하세요' : '비밀번호 입력',
                                            className: "w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl text-white placeholder-gray-500 placeholder:text-sm focus:outline-none focus:border-orange-500 transition"
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/LoginPage.tsx",
                                            lineNumber: 192,
                                            columnNumber: 13
                                        }, ("TURBOPACK compile-time value", void 0))
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/components/LoginPage.tsx",
                                    lineNumber: 190,
                                    columnNumber: 11
                                }, ("TURBOPACK compile-time value", void 0)),
                                tab === 'signup' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                            className: "block text-xs text-gray-400 mb-1.5",
                                            children: "Confirm Password"
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/LoginPage.tsx",
                                            lineNumber: 204,
                                            columnNumber: 15
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                            type: "password",
                                            value: passwordConfirm,
                                            onChange: (e)=>setPasswordConfirm(e.target.value),
                                            onKeyDown: (e)=>{
                                                if (e.key === 'Enter') void handleSubmit();
                                            },
                                            placeholder: "비밀번호를 다시 입력하세요",
                                            className: "w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl text-white placeholder-gray-500 placeholder:text-sm focus:outline-none focus:border-orange-500 transition"
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/LoginPage.tsx",
                                            lineNumber: 205,
                                            columnNumber: 15
                                        }, ("TURBOPACK compile-time value", void 0))
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/components/LoginPage.tsx",
                                    lineNumber: 203,
                                    columnNumber: 13
                                }, ("TURBOPACK compile-time value", void 0)),
                                error && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                    className: "text-sm text-red-400 bg-red-900/20 border border-red-500/30 rounded-lg px-3 py-2",
                                    children: error
                                }, void 0, false, {
                                    fileName: "[project]/src/components/LoginPage.tsx",
                                    lineNumber: 217,
                                    columnNumber: 13
                                }, ("TURBOPACK compile-time value", void 0)),
                                info && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                    className: "text-sm text-green-400 bg-green-900/20 border border-green-500/30 rounded-lg px-3 py-2",
                                    children: info
                                }, void 0, false, {
                                    fileName: "[project]/src/components/LoginPage.tsx",
                                    lineNumber: 222,
                                    columnNumber: 13
                                }, ("TURBOPACK compile-time value", void 0)),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    onClick: ()=>void handleSubmit(),
                                    disabled: isSubmitting,
                                    className: `w-full py-3 rounded-xl text-sm font-bold transition ${isSubmitting ? 'bg-gray-700 text-gray-400 cursor-not-allowed' : 'bg-orange-500 hover:bg-orange-400 text-black'}`,
                                    children: isSubmitting ? tab === 'login' ? '로그인 중...' : '가입 중...' : tab === 'login' ? '로그인' : '회원가입'
                                }, void 0, false, {
                                    fileName: "[project]/src/components/LoginPage.tsx",
                                    lineNumber: 227,
                                    columnNumber: 11
                                }, ("TURBOPACK compile-time value", void 0)),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "relative my-2",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "absolute inset-0 flex items-center",
                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "w-full border-t border-white/10"
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/LoginPage.tsx",
                                                lineNumber: 243,
                                                columnNumber: 15
                                            }, ("TURBOPACK compile-time value", void 0))
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/LoginPage.tsx",
                                            lineNumber: 242,
                                            columnNumber: 13
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "relative flex justify-center",
                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "bg-[#1a1a1a] px-3 text-xs text-gray-500",
                                                children: "또는"
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/LoginPage.tsx",
                                                lineNumber: 246,
                                                columnNumber: 15
                                            }, ("TURBOPACK compile-time value", void 0))
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/LoginPage.tsx",
                                            lineNumber: 245,
                                            columnNumber: 13
                                        }, ("TURBOPACK compile-time value", void 0))
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/components/LoginPage.tsx",
                                    lineNumber: 241,
                                    columnNumber: 11
                                }, ("TURBOPACK compile-time value", void 0)),
                                googleAuthError && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                    className: "text-sm text-red-400 bg-red-900/20 border border-red-500/30 rounded-lg px-3 py-2",
                                    children: googleAuthError
                                }, void 0, false, {
                                    fileName: "[project]/src/components/LoginPage.tsx",
                                    lineNumber: 251,
                                    columnNumber: 13
                                }, ("TURBOPACK compile-time value", void 0)),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    onClick: ()=>void handleGoogleLogin(),
                                    type: "button",
                                    className: "w-full py-3 rounded-xl text-sm font-bold transition flex items-center justify-center gap-2 bg-white hover:bg-gray-100 text-gray-900",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(GoogleIcon, {}, void 0, false, {
                                            fileName: "[project]/src/components/LoginPage.tsx",
                                            lineNumber: 261,
                                            columnNumber: 13
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        tab === 'login' ? 'Google로 로그인' : 'Google로 회원가입'
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/components/LoginPage.tsx",
                                    lineNumber: 256,
                                    columnNumber: 11
                                }, ("TURBOPACK compile-time value", void 0))
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/components/LoginPage.tsx",
                            lineNumber: 163,
                            columnNumber: 9
                        }, ("TURBOPACK compile-time value", void 0))
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/components/LoginPage.tsx",
                    lineNumber: 136,
                    columnNumber: 7
                }, ("TURBOPACK compile-time value", void 0))
            }, void 0, false, {
                fileName: "[project]/src/components/LoginPage.tsx",
                lineNumber: 135,
                columnNumber: 5
            }, ("TURBOPACK compile-time value", void 0))
        ]
    }, void 0, true);
};
}),
"[project]/src/components/ProductDetailModal.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "ProductDetailModal",
    ()=>ProductDetailModal
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$external$2d$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__ExternalLink$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/external-link.js [app-ssr] (ecmascript) <export default as ExternalLink>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$x$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__X$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/x.js [app-ssr] (ecmascript) <export default as X>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ProgressiveImage$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/ProgressiveImage.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$constants$2f$index$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/constants/index.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$sizeTable$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/utils/sizeTable.ts [app-ssr] (ecmascript)");
;
;
;
;
;
function ProductDetailModal({ product, activeRowIndex, onClose, onRowClick, recommendations, onRecommendationClick, onZoomImage, onImageError, modalRef, recommendationsRef, smoothScrollTo }) {
    const handleRowClick = (rowIndex)=>{
        onRowClick(rowIndex);
        setTimeout(()=>{
            const modal = modalRef.current;
            const target = recommendationsRef.current;
            if (!modal || !target) return;
            const targetY = target.offsetTop - modal.offsetTop - 16;
            smoothScrollTo(modal, targetY);
        }, 50);
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "fixed inset-0 z-[65] flex items-center justify-center p-4",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "absolute inset-0 bg-black/70 backdrop-blur-sm",
                onClick: onClose
            }, void 0, false, {
                fileName: "[project]/src/components/ProductDetailModal.tsx",
                lineNumber: 48,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                ref: modalRef,
                className: "ui-product-detail-modal relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl bg-[linear-gradient(180deg,rgba(255,255,255,0.22),rgba(255,255,255,0.08))] shadow-[0_24px_60px_rgba(0,0,0,0.38)] backdrop-blur-2xl md:h-[80.4vh] md:max-h-none md:w-[91%] md:max-w-[58.24rem]",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.2),transparent_32%,transparent_68%,rgba(255,255,255,0.08))]"
                    }, void 0, false, {
                        fileName: "[project]/src/components/ProductDetailModal.tsx",
                        lineNumber: 53,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "sticky top-0 z-10 flex items-center justify-between bg-[linear-gradient(180deg,rgba(255,255,255,0.035)_0%,rgba(255,255,255,0.02)_38%,rgba(255,255,255,0.03)_100%)] px-6 py-4 text-white",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                className: "text-lg sm:text-xl font-bold text-white",
                                children: "상품 상세"
                            }, void 0, false, {
                                fileName: "[project]/src/components/ProductDetailModal.tsx",
                                lineNumber: 55,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                onClick: onClose,
                                className: "rounded-full p-2 text-gray-300 transition hover:bg-white/[0.08] hover:text-white",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$x$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__X$3e$__["X"], {
                                    className: "w-5 h-5"
                                }, void 0, false, {
                                    fileName: "[project]/src/components/ProductDetailModal.tsx",
                                    lineNumber: 57,
                                    columnNumber: 13
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/src/components/ProductDetailModal.tsx",
                                lineNumber: 56,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/ProductDetailModal.tsx",
                        lineNumber: 54,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "relative z-[1] bg-[linear-gradient(180deg,rgba(255,255,255,0.035)_0%,rgba(255,255,255,0.02)_38%,rgba(255,255,255,0.03)_100%)] p-6 md:p-8",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex flex-col md:flex-row gap-6 md:items-center",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        type: "button",
                                        onClick: onZoomImage,
                                        className: "relative isolate flex h-[10.5rem] w-[10.5rem] cursor-zoom-in items-center justify-center overflow-visible rounded-[24px] bg-[linear-gradient(180deg,rgba(30,38,54,0.42),rgba(8,11,18,0.18))] p-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] md:h-[16.848rem] md:w-[16.848rem]",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "pointer-events-none absolute inset-[-10%] rounded-[32px] bg-[radial-gradient(circle,rgba(255,255,255,0.14)_0%,rgba(255,255,255,0.06)_36%,rgba(255,255,255,0.02)_52%,transparent_74%)] opacity-80 blur-xl"
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/ProductDetailModal.tsx",
                                                lineNumber: 68,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "pointer-events-none absolute inset-0 rounded-[24px] bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.015)_40%,transparent_100%)]"
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/ProductDetailModal.tsx",
                                                lineNumber: 69,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ProgressiveImage$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ProgressiveImage"], {
                                                src: product.image,
                                                thumbnailSrc: product.thumbnailImage,
                                                alt: product.name,
                                                className: "relative z-[1] max-w-full max-h-full object-contain",
                                                loading: "eager",
                                                onError: onImageError
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/ProductDetailModal.tsx",
                                                lineNumber: 70,
                                                columnNumber: 15
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/components/ProductDetailModal.tsx",
                                        lineNumber: 63,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "flex-1",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "flex items-center gap-2 text-sm font-bold text-orange-500 mb-2",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        className: "px-2 py-0.5 bg-orange-500/10 rounded-md uppercase",
                                                        children: product.brand
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/components/ProductDetailModal.tsx",
                                                        lineNumber: 81,
                                                        columnNumber: 17
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        className: "text-gray-500",
                                                        children: product.category
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/components/ProductDetailModal.tsx",
                                                        lineNumber: 82,
                                                        columnNumber: 17
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/src/components/ProductDetailModal.tsx",
                                                lineNumber: 80,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h4", {
                                                className: "text-2xl font-bold text-white mb-2",
                                                children: product.name
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/ProductDetailModal.tsx",
                                                lineNumber: 84,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                                href: product.url,
                                                target: "_blank",
                                                rel: "noopener noreferrer",
                                                className: "inline-flex items-center text-sm text-gray-300 transition-colors hover:text-orange-400",
                                                children: [
                                                    "공식 홈페이지 ",
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$external$2d$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__ExternalLink$3e$__["ExternalLink"], {
                                                        className: "w-3 h-3 ml-1"
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/components/ProductDetailModal.tsx",
                                                        lineNumber: 91,
                                                        columnNumber: 25
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/src/components/ProductDetailModal.tsx",
                                                lineNumber: 85,
                                                columnNumber: 15
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/components/ProductDetailModal.tsx",
                                        lineNumber: 79,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/ProductDetailModal.tsx",
                                lineNumber: 62,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "relative mt-8 overflow-x-auto rounded-[22px] bg-[linear-gradient(180deg,rgba(255,255,255,0.03)_0%,rgba(255,255,255,0.022)_28%,rgba(255,255,255,0.018)_100%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.025)]",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "pointer-events-none absolute inset-x-0 top-0 h-14 bg-[linear-gradient(180deg,rgba(255,255,255,0.045),rgba(255,255,255,0.018)_55%,transparent)]"
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/ProductDetailModal.tsx",
                                        lineNumber: 97,
                                        columnNumber: 13
                                    }, this),
                                    product.sizeTable?.headers?.length ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("table", {
                                        className: "relative z-[1] min-w-full w-max text-center text-[11px] sm:text-sm",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("thead", {
                                                className: "text-[11px] sm:text-sm",
                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                                                    children: product.sizeTable.headers.map((header, index)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                            className: `bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.018))] whitespace-nowrap px-2 py-2.5 text-xs font-bold uppercase sm:px-4 sm:py-3 sm:text-sm ${index === 0 ? 'border-r border-white/[0.04]' : ''}`,
                                                            style: {
                                                                color: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$sizeTable$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["isPrimaryColumnHeader"])(header) ? '#E5E7EB' : '#00FF00'
                                                            },
                                                            children: String(header)
                                                        }, index, false, {
                                                            fileName: "[project]/src/components/ProductDetailModal.tsx",
                                                            lineNumber: 103,
                                                            columnNumber: 23
                                                        }, this))
                                                }, void 0, false, {
                                                    fileName: "[project]/src/components/ProductDetailModal.tsx",
                                                    lineNumber: 101,
                                                    columnNumber: 19
                                                }, this)
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/ProductDetailModal.tsx",
                                                lineNumber: 100,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("tbody", {
                                                children: product.sizeTable.rows.map((row, rowIndex)=>{
                                                    const isActiveRow = activeRowIndex === rowIndex;
                                                    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                                                        onClick: ()=>handleRowClick(rowIndex),
                                                        className: "group cursor-pointer transition-transform duration-200 active:scale-95",
                                                        children: row.map((cell, cellIndex)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                                className: `whitespace-nowrap px-2 py-2.5 text-[11px] font-medium transition-all duration-200 sm:px-4 sm:py-3 sm:text-sm ${cellIndex === 0 ? 'border-r border-white/[0.04] text-xs font-bold sm:text-sm' : ''} ${isActiveRow ? 'bg-white text-black first:rounded-l-lg last:rounded-r-lg' : 'bg-transparent text-gray-200 group-hover:bg-white/[0.92] group-hover:text-black group-hover:first:rounded-l-lg group-hover:last:rounded-r-lg'}`,
                                                                children: String(cell)
                                                            }, cellIndex, false, {
                                                                fileName: "[project]/src/components/ProductDetailModal.tsx",
                                                                lineNumber: 123,
                                                                columnNumber: 27
                                                            }, this))
                                                    }, rowIndex, false, {
                                                        fileName: "[project]/src/components/ProductDetailModal.tsx",
                                                        lineNumber: 117,
                                                        columnNumber: 23
                                                    }, this);
                                                })
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/ProductDetailModal.tsx",
                                                lineNumber: 113,
                                                columnNumber: 17
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/components/ProductDetailModal.tsx",
                                        lineNumber: 99,
                                        columnNumber: 15
                                    }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "px-6 py-8 text-center text-gray-300",
                                        children: "표시할 사이즈표 데이터가 없습니다."
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/ProductDetailModal.tsx",
                                        lineNumber: 140,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/ProductDetailModal.tsx",
                                lineNumber: 96,
                                columnNumber: 11
                            }, this),
                            recommendations.length > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                ref: recommendationsRef,
                                className: "mt-6",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h5", {
                                        className: "mb-3 text-xs font-bold uppercase tracking-widest text-gray-400",
                                        children: "유사한 핏의 상품"
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/ProductDetailModal.tsx",
                                        lineNumber: 146,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "flex flex-col gap-2",
                                        children: recommendations.map(({ product: recProduct, rowIndex })=>{
                                            const matchedRow = recProduct.sizeTable.rows[rowIndex];
                                            const sizeLabel = matchedRow[0] || '';
                                            const measurements = recProduct.sizeTable.headers.slice(1).map((h, i)=>({
                                                    label: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$sizeTable$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["normalizeMeasurementLabel"])(h) || h,
                                                    value: matchedRow[i + 1] || ''
                                                })).filter(({ value })=>value !== '');
                                            return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                type: "button",
                                                onClick: ()=>onRecommendationClick(recProduct),
                                                className: "flex items-start gap-3 rounded-2xl bg-white/[0.05] px-4 py-3 text-left transition hover:bg-white/[0.1] active:scale-[0.98]",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("img", {
                                                        src: recProduct.thumbnailImage || recProduct.image || __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$constants$2f$index$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["DEFAULT_PRODUCT_PLACEHOLDER"],
                                                        alt: recProduct.name,
                                                        className: "mt-0.5 h-12 w-12 flex-shrink-0 rounded-xl bg-white/[0.06] object-contain"
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/components/ProductDetailModal.tsx",
                                                        lineNumber: 164,
                                                        columnNumber: 23
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "min-w-0 flex-1",
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                                className: "truncate text-xs font-bold uppercase text-orange-400",
                                                                children: recProduct.brand
                                                            }, void 0, false, {
                                                                fileName: "[project]/src/components/ProductDetailModal.tsx",
                                                                lineNumber: 170,
                                                                columnNumber: 25
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                                className: "truncate text-sm font-medium text-white",
                                                                children: recProduct.name
                                                            }, void 0, false, {
                                                                fileName: "[project]/src/components/ProductDetailModal.tsx",
                                                                lineNumber: 171,
                                                                columnNumber: 25
                                                            }, this),
                                                            measurements.length > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                className: "mt-1.5 flex flex-wrap gap-1",
                                                                children: measurements.map(({ label, value })=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                        className: "rounded-md bg-white/[0.08] px-1.5 py-0.5 text-[10px] text-gray-300",
                                                                        children: [
                                                                            label,
                                                                            " ",
                                                                            value
                                                                        ]
                                                                    }, label, true, {
                                                                        fileName: "[project]/src/components/ProductDetailModal.tsx",
                                                                        lineNumber: 175,
                                                                        columnNumber: 31
                                                                    }, this))
                                                            }, void 0, false, {
                                                                fileName: "[project]/src/components/ProductDetailModal.tsx",
                                                                lineNumber: 173,
                                                                columnNumber: 27
                                                            }, this)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/src/components/ProductDetailModal.tsx",
                                                        lineNumber: 169,
                                                        columnNumber: 23
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "flex-shrink-0 text-right",
                                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                            className: "text-sm font-bold text-white",
                                                            children: sizeLabel
                                                        }, void 0, false, {
                                                            fileName: "[project]/src/components/ProductDetailModal.tsx",
                                                            lineNumber: 183,
                                                            columnNumber: 25
                                                        }, this)
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/components/ProductDetailModal.tsx",
                                                        lineNumber: 182,
                                                        columnNumber: 23
                                                    }, this)
                                                ]
                                            }, recProduct.id, true, {
                                                fileName: "[project]/src/components/ProductDetailModal.tsx",
                                                lineNumber: 158,
                                                columnNumber: 21
                                            }, this);
                                        })
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/ProductDetailModal.tsx",
                                        lineNumber: 149,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/ProductDetailModal.tsx",
                                lineNumber: 145,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/ProductDetailModal.tsx",
                        lineNumber: 61,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/ProductDetailModal.tsx",
                lineNumber: 49,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/ProductDetailModal.tsx",
        lineNumber: 47,
        columnNumber: 5
    }, this);
}
}),
"[project]/src/components/SizeConverterView.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "SizeConverterView",
    ()=>SizeConverterView
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$globe$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Globe$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/globe.js [app-ssr] (ecmascript) <export default as Globe>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$constants$2f$index$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/constants/index.ts [app-ssr] (ecmascript)");
;
;
;
function SizeConverterView({ sizeCategory, setSizeCategory, sizeGender, setSizeGender, sizeRegion, setSizeRegion, sizeValue, setSizeValue, sizeRows, sizeOptions, convertedSize, activeConverterRowIndex, setActiveConverterRowIndex }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "w-full max-w-[72rem]",
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "overflow-hidden rounded-[24px] border border-gray-800 bg-gray-950 shadow-2xl",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "border-b border-gray-800 bg-[radial-gradient(circle_at_top_left,_rgba(249,115,22,0.24),_transparent_35%),linear-gradient(135deg,_rgba(17,24,39,0.96),_rgba(2,6,23,0.98))] px-3.5 py-4 sm:px-5 sm:py-6 md:px-6",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "inline-flex items-center gap-1.5 rounded-full border border-orange-500/30 bg-orange-500/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-orange-300 sm:text-xs",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$globe$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Globe$3e$__["Globe"], {
                                    className: "h-3.5 w-3.5 sm:h-4 sm:w-4"
                                }, void 0, false, {
                                    fileName: "[project]/src/components/SizeConverterView.tsx",
                                    lineNumber: 41,
                                    columnNumber: 13
                                }, this),
                                "Global Size Converter"
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/components/SizeConverterView.tsx",
                            lineNumber: 40,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                            className: "mt-3 text-[1.45rem] font-black tracking-tight text-white sm:text-[1.75rem] md:text-[2rem]",
                            children: "해외사이즈 변환기"
                        }, void 0, false, {
                            fileName: "[project]/src/components/SizeConverterView.tsx",
                            lineNumber: 44,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            className: "mt-2 max-w-2xl text-[11px] leading-5 text-gray-300 sm:text-xs sm:leading-5 md:text-sm",
                            children: "의류와 신발 카테고리 기준으로 한국, 일본, US, EU, UK 사이즈를 한 번에 비교할 수 있습니다."
                        }, void 0, false, {
                            fileName: "[project]/src/components/SizeConverterView.tsx",
                            lineNumber: 45,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/components/SizeConverterView.tsx",
                    lineNumber: 39,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "grid gap-3 px-3 py-3 sm:gap-4 sm:px-5 sm:py-5 md:grid-cols-[240px,minmax(0,1fr)] md:px-6 md:py-6",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                            className: "rounded-[22px] border border-gray-800 bg-black/30 p-3.5 sm:p-4",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                    className: "text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-500 sm:text-xs",
                                    children: "Category"
                                }, void 0, false, {
                                    fileName: "[project]/src/components/SizeConverterView.tsx",
                                    lineNumber: 52,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "mt-3 grid grid-cols-2 gap-2",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                            type: "button",
                                            onClick: ()=>setSizeCategory('clothing'),
                                            className: `rounded-xl border px-3 py-2.5 text-xs font-semibold transition sm:px-4 sm:py-3 sm:text-sm ${sizeCategory === 'clothing' ? 'border-orange-500 bg-orange-500 text-black' : 'border-gray-800 bg-gray-900 text-gray-200 hover:border-orange-500 hover:text-orange-400'}`,
                                            children: "의류"
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/SizeConverterView.tsx",
                                            lineNumber: 54,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                            type: "button",
                                            onClick: ()=>setSizeCategory('shoes'),
                                            className: `rounded-xl border px-3 py-2.5 text-xs font-semibold transition sm:px-4 sm:py-3 sm:text-sm ${sizeCategory === 'shoes' ? 'border-orange-500 bg-orange-500 text-black' : 'border-gray-800 bg-gray-900 text-gray-200 hover:border-orange-500 hover:text-orange-400'}`,
                                            children: "신발"
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/SizeConverterView.tsx",
                                            lineNumber: 65,
                                            columnNumber: 15
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/components/SizeConverterView.tsx",
                                    lineNumber: 53,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                    className: "mt-4 block text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-500 sm:mt-5 sm:text-xs",
                                    children: "Gender"
                                }, void 0, false, {
                                    fileName: "[project]/src/components/SizeConverterView.tsx",
                                    lineNumber: 78,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "mt-2.5 grid grid-cols-2 gap-2",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                            type: "button",
                                            onClick: ()=>setSizeGender('men'),
                                            className: `rounded-xl border px-3 py-2.5 text-xs font-semibold transition sm:px-4 sm:py-3 sm:text-sm ${sizeGender === 'men' ? 'border-orange-500 bg-orange-500 text-black' : 'border-gray-800 bg-gray-900 text-gray-200 hover:border-orange-500 hover:text-orange-400'}`,
                                            children: "남성"
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/SizeConverterView.tsx",
                                            lineNumber: 82,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                            type: "button",
                                            onClick: ()=>setSizeGender('women'),
                                            className: `rounded-xl border px-3 py-2.5 text-xs font-semibold transition sm:px-4 sm:py-3 sm:text-sm ${sizeGender === 'women' ? 'border-orange-500 bg-orange-500 text-black' : 'border-gray-800 bg-gray-900 text-gray-200 hover:border-orange-500 hover:text-orange-400'}`,
                                            children: "여성"
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/SizeConverterView.tsx",
                                            lineNumber: 93,
                                            columnNumber: 15
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/components/SizeConverterView.tsx",
                                    lineNumber: 81,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                    className: "mt-4 block text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-500 sm:mt-5 sm:text-xs",
                                    children: "Input Region"
                                }, void 0, false, {
                                    fileName: "[project]/src/components/SizeConverterView.tsx",
                                    lineNumber: 106,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                                    value: sizeRegion,
                                    onChange: (event)=>setSizeRegion(event.target.value),
                                    className: "mt-2.5 w-full rounded-xl border border-gray-800 bg-gray-900 px-3 py-2.5 text-xs text-white outline-none transition focus:border-orange-500 sm:px-4 sm:py-3 sm:text-sm",
                                    children: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$constants$2f$index$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["SIZE_REGION_OPTIONS"].map((option)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                            value: option.key,
                                            children: option.label
                                        }, option.key, false, {
                                            fileName: "[project]/src/components/SizeConverterView.tsx",
                                            lineNumber: 115,
                                            columnNumber: 17
                                        }, this))
                                }, void 0, false, {
                                    fileName: "[project]/src/components/SizeConverterView.tsx",
                                    lineNumber: 109,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                    className: "mt-4 block text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-500 sm:mt-5 sm:text-xs",
                                    children: "Size"
                                }, void 0, false, {
                                    fileName: "[project]/src/components/SizeConverterView.tsx",
                                    lineNumber: 121,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                                    value: sizeValue,
                                    onChange: (event)=>setSizeValue(event.target.value),
                                    className: "mt-2.5 w-full rounded-xl border border-gray-800 bg-gray-900 px-3 py-2.5 text-xs text-white outline-none transition focus:border-orange-500 sm:px-4 sm:py-3 sm:text-sm",
                                    children: sizeOptions.map((option)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                            value: option,
                                            children: option
                                        }, option, false, {
                                            fileName: "[project]/src/components/SizeConverterView.tsx",
                                            lineNumber: 130,
                                            columnNumber: 17
                                        }, this))
                                }, void 0, false, {
                                    fileName: "[project]/src/components/SizeConverterView.tsx",
                                    lineNumber: 124,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/components/SizeConverterView.tsx",
                            lineNumber: 51,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                            className: "rounded-[22px] border border-gray-800 bg-gray-900/60 p-3.5 sm:p-4 md:p-5",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "flex flex-col gap-2.5 border-b border-gray-800 pb-4 md:flex-row md:items-end md:justify-between",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                    className: "text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-500 sm:text-xs",
                                                    children: "Selected"
                                                }, void 0, false, {
                                                    fileName: "[project]/src/components/SizeConverterView.tsx",
                                                    lineNumber: 140,
                                                    columnNumber: 17
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                                    className: "mt-1.5 text-base font-bold text-white sm:text-xl",
                                                    children: [
                                                        sizeGender === 'men' ? '남성' : '여성',
                                                        " ",
                                                        sizeCategory === 'clothing' ? '의류' : '신발',
                                                        " ",
                                                        sizeRegion.toUpperCase(),
                                                        " ",
                                                        sizeValue
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/src/components/SizeConverterView.tsx",
                                                    lineNumber: 141,
                                                    columnNumber: 17
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/src/components/SizeConverterView.tsx",
                                            lineNumber: 139,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                            className: "text-[11px] leading-5 text-gray-400 sm:text-xs",
                                            children: "선택한 사이즈를 5개 국가 기준으로 동시에 보여줍니다."
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/SizeConverterView.tsx",
                                            lineNumber: 145,
                                            columnNumber: 15
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/components/SizeConverterView.tsx",
                                    lineNumber: 138,
                                    columnNumber: 13
                                }, this),
                                convertedSize ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "mt-4 grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-3 xl:grid-cols-5",
                                    children: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$constants$2f$index$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["SIZE_REGION_OPTIONS"].map((option)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "rounded-xl border border-gray-800 bg-black/40 p-2.5 sm:p-3",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                    className: "text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-500 sm:text-xs",
                                                    children: option.label
                                                }, void 0, false, {
                                                    fileName: "[project]/src/components/SizeConverterView.tsx",
                                                    lineNumber: 152,
                                                    columnNumber: 21
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                    className: "mt-1.5 text-lg font-black text-white sm:mt-2 sm:text-2xl",
                                                    children: convertedSize[option.key]
                                                }, void 0, false, {
                                                    fileName: "[project]/src/components/SizeConverterView.tsx",
                                                    lineNumber: 155,
                                                    columnNumber: 21
                                                }, this)
                                            ]
                                        }, option.key, true, {
                                            fileName: "[project]/src/components/SizeConverterView.tsx",
                                            lineNumber: 151,
                                            columnNumber: 19
                                        }, this))
                                }, void 0, false, {
                                    fileName: "[project]/src/components/SizeConverterView.tsx",
                                    lineNumber: 149,
                                    columnNumber: 15
                                }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "mt-4 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-4 text-xs text-red-200 sm:text-sm",
                                    children: "선택한 조건에 맞는 사이즈를 찾지 못했습니다."
                                }, void 0, false, {
                                    fileName: "[project]/src/components/SizeConverterView.tsx",
                                    lineNumber: 160,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "mt-5 overflow-x-auto rounded-xl border border-gray-800",
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("table", {
                                        className: "min-w-full w-max text-left text-[10px] text-gray-200 sm:text-xs",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("thead", {
                                                className: "bg-gray-950 text-[9px] uppercase tracking-[0.14em] text-gray-500 sm:text-[11px] sm:tracking-[0.16em]",
                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                            className: "border-r border-gray-800 px-2 py-2.5 whitespace-nowrap sm:px-3 sm:py-3",
                                                            children: "Size"
                                                        }, void 0, false, {
                                                            fileName: "[project]/src/components/SizeConverterView.tsx",
                                                            lineNumber: 169,
                                                            columnNumber: 21
                                                        }, this),
                                                        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$constants$2f$index$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["SIZE_REGION_OPTIONS"].map((option)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                                className: "px-2 py-2.5 whitespace-nowrap sm:px-3 sm:py-3",
                                                                children: option.key.toUpperCase()
                                                            }, option.key, false, {
                                                                fileName: "[project]/src/components/SizeConverterView.tsx",
                                                                lineNumber: 171,
                                                                columnNumber: 23
                                                            }, this))
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/src/components/SizeConverterView.tsx",
                                                    lineNumber: 168,
                                                    columnNumber: 19
                                                }, this)
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/SizeConverterView.tsx",
                                                lineNumber: 167,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("tbody", {
                                                children: sizeRows.map((row, rowIndex)=>{
                                                    const isActive = activeConverterRowIndex === rowIndex;
                                                    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                                                        onClick: ()=>setActiveConverterRowIndex(rowIndex),
                                                        className: "group cursor-pointer border-t border-gray-800 transition-transform duration-200 active:scale-95",
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                                className: `border-r border-gray-800 px-2 py-2.5 whitespace-nowrap font-semibold transition-all duration-200 sm:px-3 sm:py-3 ${isActive ? 'bg-gray-100 text-black' : 'bg-transparent text-white group-hover:bg-gray-100 group-hover:text-black'}`,
                                                                children: row.label
                                                            }, void 0, false, {
                                                                fileName: "[project]/src/components/SizeConverterView.tsx",
                                                                lineNumber: 186,
                                                                columnNumber: 25
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                                className: `px-2 py-2.5 whitespace-nowrap transition-all duration-200 sm:px-3 sm:py-3 ${isActive ? 'bg-gray-100 text-black' : 'bg-transparent text-gray-200 group-hover:bg-gray-100 group-hover:text-black'}`,
                                                                children: row.kr
                                                            }, void 0, false, {
                                                                fileName: "[project]/src/components/SizeConverterView.tsx",
                                                                lineNumber: 195,
                                                                columnNumber: 25
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                                className: `px-2 py-2.5 whitespace-nowrap transition-all duration-200 sm:px-3 sm:py-3 ${isActive ? 'bg-gray-100 text-black' : 'bg-transparent text-gray-200 group-hover:bg-gray-100 group-hover:text-black'}`,
                                                                children: row.jp
                                                            }, void 0, false, {
                                                                fileName: "[project]/src/components/SizeConverterView.tsx",
                                                                lineNumber: 204,
                                                                columnNumber: 25
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                                className: `px-2 py-2.5 whitespace-nowrap transition-all duration-200 sm:px-3 sm:py-3 ${isActive ? 'bg-gray-100 text-black' : 'bg-transparent text-gray-200 group-hover:bg-gray-100 group-hover:text-black'}`,
                                                                children: row.us
                                                            }, void 0, false, {
                                                                fileName: "[project]/src/components/SizeConverterView.tsx",
                                                                lineNumber: 213,
                                                                columnNumber: 25
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                                className: `px-2 py-2.5 whitespace-nowrap transition-all duration-200 sm:px-3 sm:py-3 ${isActive ? 'bg-gray-100 text-black' : 'bg-transparent text-gray-200 group-hover:bg-gray-100 group-hover:text-black'}`,
                                                                children: row.eu
                                                            }, void 0, false, {
                                                                fileName: "[project]/src/components/SizeConverterView.tsx",
                                                                lineNumber: 222,
                                                                columnNumber: 25
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                                className: `px-2 py-2.5 whitespace-nowrap transition-all duration-200 sm:px-3 sm:py-3 ${isActive ? 'bg-gray-100 text-black' : 'bg-transparent text-gray-200 group-hover:bg-gray-100 group-hover:text-black'}`,
                                                                children: row.uk
                                                            }, void 0, false, {
                                                                fileName: "[project]/src/components/SizeConverterView.tsx",
                                                                lineNumber: 231,
                                                                columnNumber: 25
                                                            }, this)
                                                        ]
                                                    }, row.label, true, {
                                                        fileName: "[project]/src/components/SizeConverterView.tsx",
                                                        lineNumber: 181,
                                                        columnNumber: 23
                                                    }, this);
                                                })
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/SizeConverterView.tsx",
                                                lineNumber: 177,
                                                columnNumber: 17
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/components/SizeConverterView.tsx",
                                        lineNumber: 166,
                                        columnNumber: 15
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/src/components/SizeConverterView.tsx",
                                    lineNumber: 165,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/components/SizeConverterView.tsx",
                            lineNumber: 137,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/components/SizeConverterView.tsx",
                    lineNumber: 50,
                    columnNumber: 9
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/src/components/SizeConverterView.tsx",
            lineNumber: 38,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/src/components/SizeConverterView.tsx",
        lineNumber: 37,
        columnNumber: 5
    }, this);
}
}),
"[project]/src/lib/supabase.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "assertSupabaseClient",
    ()=>assertSupabaseClient,
    "supabase",
    ()=>supabase
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$supabase$2f$supabase$2d$js$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/@supabase/supabase-js/dist/index.mjs [app-ssr] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$constants$2f$index$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/constants/index.ts [app-ssr] (ecmascript)");
;
;
const supabase = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$constants$2f$index$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["SUPABASE_URL"] && __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$constants$2f$index$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["SUPABASE_ANON_KEY"] ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$supabase$2f$supabase$2d$js$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__["createClient"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$constants$2f$index$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["SUPABASE_URL"], __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$constants$2f$index$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["SUPABASE_ANON_KEY"]) : null;
const assertSupabaseClient = ()=>{
    if (!supabase) {
        throw new Error('Supabase public env is missing. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.');
    }
};
}),
"[project]/src/hooks/useAuth.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "useAuth",
    ()=>useAuth
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/supabase.ts [app-ssr] (ecmascript)");
;
;
function useAuth({ onNavigateToLogin }) {
    const [authUser, setAuthUser] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    const [dbUsername, setDbUsername] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    const [needsUsername, setNeedsUsername] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    const [pendingUsername, setPendingUsername] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])('');
    const [usernameError, setUsernameError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    const [isSubmittingUsername, setIsSubmittingUsername] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    const [googleAuthError, setGoogleAuthError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    const [googleSignupComplete, setGoogleSignupComplete] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    const checkAndSetUser = async (user)=>{
        setAuthUser(user);
        if (!user || !__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["supabase"]) {
            setDbUsername(null);
            return;
        }
        const { data } = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["supabase"].from('users').select('id, username').eq('id', user.id).maybeSingle();
        if (!data) {
            const intent = localStorage.getItem('google_oauth_intent');
            localStorage.removeItem('google_oauth_intent');
            if (intent === 'login') {
                void __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["supabase"].auth.signOut();
                setAuthUser(null);
                setGoogleAuthError('가입되지 않은 구글 계정입니다. 회원가입 탭에서 구글로 가입해 주세요.');
                onNavigateToLogin();
            } else {
                setNeedsUsername(true);
            }
        } else {
            setDbUsername(data.username);
        }
    };
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        if (!__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["supabase"]) return;
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["supabase"].auth.getSession().then(({ data })=>{
            void checkAndSetUser(data.session?.user ?? null);
        });
        const { data: listener } = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["supabase"].auth.onAuthStateChange((_event, session)=>{
            void checkAndSetUser(session?.user ?? null);
        });
        return ()=>listener.subscription.unsubscribe();
    }, []);
    const submitUsername = async (onSuccess)=>{
        const trimmed = pendingUsername.trim();
        if (!trimmed) {
            setUsernameError('이름을 입력하세요.');
            return;
        }
        setIsSubmittingUsername(true);
        setUsernameError(null);
        const { data: { user: currentUser } } = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["supabase"].auth.getUser();
        if (!currentUser) {
            await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["supabase"].auth.signOut();
            setNeedsUsername(false);
            setUsernameError(null);
            setIsSubmittingUsername(false);
            onNavigateToLogin();
            return;
        }
        const { data: existing } = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["supabase"].from('users').select('username').eq('username', trimmed).maybeSingle();
        if (existing) {
            setUsernameError('이미 사용중인 이름입니다.');
            setIsSubmittingUsername(false);
            return;
        }
        const { error: insertError } = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["supabase"].from('users').insert({
            id: currentUser.id,
            username: trimmed
        });
        if (insertError) {
            console.error('users insert error:', insertError);
            setUsernameError('오류가 발생했습니다. 다시 시도해주세요.');
            setIsSubmittingUsername(false);
            return;
        }
        setNeedsUsername(false);
        setDbUsername(trimmed);
        setPendingUsername('');
        setGoogleSignupComplete(true);
        onSuccess();
    };
    return {
        authUser,
        dbUsername,
        needsUsername,
        pendingUsername,
        setPendingUsername,
        usernameError,
        isSubmittingUsername,
        googleAuthError,
        setGoogleAuthError,
        googleSignupComplete,
        setGoogleSignupComplete,
        submitUsername
    };
}
}),
"[project]/src/utils/image.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
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
}),
"[project]/src/utils/product.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
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
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$constants$2f$index$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/constants/index.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/supabase.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$sizeTable$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/utils/sizeTable.ts [app-ssr] (ecmascript)");
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
    return __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$constants$2f$index$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["CATEGORY_OPTION_BY_LOWER"][normalized] || '';
};
const isOptionalMetadataCategory = (category)=>category === 'Shoes' || category === 'Acc' || category === '단종된 상품(빈티지)';
const isDuplicateProductErrorMessage = (message)=>{
    const normalized = String(message || '').toLowerCase();
    return normalized.includes('products_unique_key') || normalized.includes('duplicate key value') || normalized.includes('unique constraint') || normalized.includes('이미 등록된 상품');
};
const toPublicUrl = (path, options)=>{
    if (!path) return '';
    if (isExternalHttpUrl(path)) return path;
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["assertSupabaseClient"])();
    const result = options ? __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["supabase"].storage.from(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$constants$2f$index$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["STORAGE_BUCKET"]).getPublicUrl(path, {
        transform: {
            width: options.width,
            height: options.height,
            quality: options.quality
        }
    }) : __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["supabase"].storage.from(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$constants$2f$index$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["STORAGE_BUCKET"]).getPublicUrl(path);
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
        sizeTable: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$sizeTable$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["normalizeSizeTable"])(row.size_table),
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
}),
"[project]/src/api/index.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
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
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$constants$2f$index$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/constants/index.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/supabase.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$image$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/utils/image.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$sizeTable$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/utils/sizeTable.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$product$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/utils/product.ts [app-ssr] (ecmascript)");
;
;
;
;
;
const searchProducts = async (query)=>{
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["assertSupabaseClient"])();
    const keyword = query.trim();
    let request = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["supabase"].from('products').select('id,brand,name,category,url,size_table,created_at,image_path').order('created_at', {
        ascending: false
    });
    if (keyword) request = request.or(`brand.ilike.%${keyword}%,name.ilike.%${keyword}%`);
    const { data, error } = await request;
    if (error) throw new Error(error.message);
    const rows = Array.isArray(data) ? data : [];
    return rows.map((row)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$product$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["normalizeProduct"])(row)).filter((product)=>product !== null);
};
const uploadSubmissionImage = async (file)=>{
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["assertSupabaseClient"])();
    const extension = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$image$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getFileExtension"])(file);
    const path = `${__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$constants$2f$index$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["STORAGE_PREFIX"]}${crypto.randomUUID()}.${extension}`;
    const { data, error } = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["supabase"].storage.from(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$constants$2f$index$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["STORAGE_BUCKET"]).upload(path, file, {
        upsert: false,
        contentType: file.type || undefined
    });
    if (error || !data?.path) {
        console.error('[uploadSubmissionImage] upload failed', {
            errorMessage: error?.message,
            error,
            path,
            bucket: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$constants$2f$index$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["STORAGE_BUCKET"],
            startsWithSubmissions: path.startsWith(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$constants$2f$index$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["STORAGE_PREFIX"])
        });
        throw new Error(error?.message || 'Image upload failed');
    }
    return data.path;
};
const submitProduct = async (form)=>{
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["assertSupabaseClient"])();
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
    const { error } = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["supabase"].from('products').insert(payload);
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
    const normalized = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$sizeTable$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["normalizeSizeTable"])(payload.data);
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
}),
"[project]/src/hooks/useProductForm.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "useProductForm",
    ()=>useProductForm
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$constants$2f$index$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/constants/index.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$image$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/utils/image.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$sizeTable$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/utils/sizeTable.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$product$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/utils/product.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$api$2f$index$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/api/index.ts [app-ssr] (ecmascript)");
;
;
;
;
;
;
function useProductForm({ productUrlSet, onSubmitSuccess }) {
    const [isModalOpen, setIsModalOpen] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    const [addProductMode, setAddProductMode] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])('menu');
    const [showDuplicateProductModal, setShowDuplicateProductModal] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    const [formData, setFormData] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$constants$2f$index$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["EMPTY_FORM_DATA"]);
    const [productPhotoFile, setProductPhotoFile] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    const [autofilledProductImageUrl, setAutofilledProductImageUrl] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    const [autofilledProductImageCandidates, setAutofilledProductImageCandidates] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])([]);
    const [isProcessingImage, setIsProcessingImage] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    const [isAnalyzingTable, setIsAnalyzingTable] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    const [isSaving, setIsSaving] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    const [isAutofillingFromUrl, setIsAutofillingFromUrl] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    const [isAutofillingFromImage, setIsAutofillingFromImage] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    const [autoFillError, setAutoFillError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    const [productImageNotice, setProductImageNotice] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    const [aiPreviewImageSrc, setAiPreviewImageSrc] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    const [isAiPreviewLoading, setIsAiPreviewLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    const [didFallbackAiPreviewImage, setDidFallbackAiPreviewImage] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    const [tableEditingCell, setTableEditingCell] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        const nextSrc = String(autofilledProductImageUrl || '').trim();
        if (!nextSrc) {
            setAiPreviewImageSrc(null);
            setIsAiPreviewLoading(false);
            setDidFallbackAiPreviewImage(false);
            return;
        }
        setAiPreviewImageSrc(nextSrc);
        setIsAiPreviewLoading(true);
        setDidFallbackAiPreviewImage(false);
    }, [
        autofilledProductImageUrl
    ]);
    const resetState = ()=>{
        setFormData(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$constants$2f$index$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["EMPTY_FORM_DATA"]);
        setProductPhotoFile(null);
        setAutofilledProductImageUrl(null);
        setAutofilledProductImageCandidates([]);
        setAutoFillError(null);
        setProductImageNotice(null);
        setAiPreviewImageSrc(null);
        setIsAiPreviewLoading(false);
        setDidFallbackAiPreviewImage(false);
        setIsProcessingImage(false);
        setIsAnalyzingTable(false);
        setIsAutofillingFromUrl(false);
        setIsAutofillingFromImage(false);
        setIsSaving(false);
        setShowDuplicateProductModal(false);
        setAddProductMode('menu');
    };
    const openModal = ()=>{
        resetState();
        setIsModalOpen(true);
    };
    const closeModal = ()=>{
        resetState();
        setIsModalOpen(false);
    };
    const handleFileUpload = (event, type)=>{
        const file = event.target.files?.[0];
        if (!file) return;
        if (type === 'product') {
            void (async ()=>{
                const dataUrl = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$image$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["readFileAsDataUrl"])(file);
                setAutofilledProductImageUrl(null);
                setAutofilledProductImageCandidates([]);
                setProductImageNotice(null);
                const base64 = dataUrl.split(',')[1] || '';
                setFormData((prev)=>({
                        ...prev,
                        productImage: dataUrl
                    }));
                setProductPhotoFile(file);
                setIsProcessingImage(true);
                try {
                    const processedBase64 = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$api$2f$index$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["removeBackgroundWithGemini"])(base64);
                    const processedDataUrl = `data:image/png;base64,${processedBase64}`;
                    setFormData((prev)=>({
                            ...prev,
                            productImage: processedDataUrl
                        }));
                    setProductPhotoFile((0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$image$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["dataUrlToFile"])(processedDataUrl, `product-${crypto.randomUUID()}`));
                } catch (bgError) {
                    console.error('[handleFileUpload] remove bg failed, using original image', bgError);
                    setProductPhotoFile(file);
                } finally{
                    setIsProcessingImage(false);
                }
            })();
            return;
        }
        void (async ()=>{
            const dataUrl = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$image$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["readFileAsDataUrl"])(file);
            const optimizedDataUrl = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$image$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["resizeImage"])(dataUrl, 1600);
            const optimizedBase64 = optimizedDataUrl.split(',')[1] || '';
            setFormData((prev)=>({
                    ...prev,
                    sizeChartImage: optimizedDataUrl,
                    extractedTable: null
                }));
            setTableEditingCell(null);
            setIsAnalyzingTable(true);
            try {
                const tableData = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$api$2f$index$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["extractSizeTableFromImage"])(optimizedBase64, 'image/png');
                setFormData((prev)=>({
                        ...prev,
                        extractedTable: tableData
                    }));
            } catch (extractError) {
                const message = extractError instanceof Error ? extractError.message : 'Size table extraction failed.';
                alert(`${message} (check /api/size-table server logs)`);
            } finally{
                setIsAnalyzingTable(false);
            }
        })();
    };
    const handleSelectAutofilledProductImage = (imageUrl)=>{
        const nextUrl = String(imageUrl || '').trim();
        if (!nextUrl) return;
        setAutofilledProductImageUrl(nextUrl);
        setProductImageNotice(null);
        setProductPhotoFile(null);
        setFormData((prev)=>({
                ...prev,
                productImage: nextUrl
            }));
        setAutoFillError(null);
    };
    const handleAutoFillFromUrl = async ()=>{
        const targetUrl = formData.url.trim();
        if (!targetUrl) {
            setAutoFillError('상품 URL을 입력해 주세요.');
            return;
        }
        setIsAutofillingFromUrl(true);
        setIsAiPreviewLoading(true);
        setAutoFillError(null);
        setProductImageNotice(null);
        setAutofilledProductImageCandidates([]);
        try {
            const extracted = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$api$2f$index$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["fetchProductMetadataFromUrl"])(targetUrl);
            const normalizedExtractedUrl = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$product$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["normalizeComparableProductUrl"])(extracted.url || targetUrl);
            if (normalizedExtractedUrl && productUrlSet.has(normalizedExtractedUrl)) {
                setAutoFillError(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$constants$2f$index$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["DUPLICATE_PRODUCT_MESSAGE"]);
                setAutofilledProductImageUrl(null);
                setProductPhotoFile(null);
                setFormData((prev)=>({
                        ...prev,
                        url: extracted.url || prev.url
                    }));
                return;
            }
            const candidateUrls = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$product$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["uniqHttpUrls"])([
                extracted.image_path || '',
                ...Array.isArray(extracted.productImageCandidates) ? extracted.productImageCandidates : [],
                extracted.productImage?.sourceUrl || ''
            ]).slice(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$constants$2f$index$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["MAX_PRODUCT_IMAGE_CANDIDATES"]);
            const selectedCandidateUrl = candidateUrls[0] || '';
            setProductPhotoFile(null);
            if (selectedCandidateUrl) {
                setAutofilledProductImageUrl(selectedCandidateUrl);
                setProductImageNotice(null);
            } else {
                setAutofilledProductImageUrl(null);
                setProductImageNotice('Official product image was not found from the page. Upload the brand image manually.');
            }
            setAutofilledProductImageCandidates(candidateUrls);
            setFormData((prev)=>({
                    ...prev,
                    brand: extracted.brand || prev.brand,
                    name: extracted.name || prev.name,
                    category: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$product$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["normalizeCategoryOption"])(extracted.category || '') || prev.category,
                    url: extracted.url || prev.url,
                    productImage: selectedCandidateUrl || prev.productImage
                }));
            if (!extracted.brand && !extracted.name && !selectedCandidateUrl) {
                setAutoFillError('자동 입력 데이터를 찾지 못했습니다. 다른 상품 URL을 시도해 주세요.');
            }
        } catch (error) {
            const message = error instanceof Error ? error.message : 'URL 분석 중 오류가 발생했습니다.';
            setAutoFillError(message);
        } finally{
            setIsAutofillingFromUrl(false);
        }
    };
    const handleCaptureUpload = (event)=>{
        const file = event.target.files?.[0];
        if (!file) return;
        void (async ()=>{
            const dataUrl = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$image$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["readFileAsDataUrl"])(file);
            const optimizedDataUrl = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$image$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["resizeImage"])(dataUrl, 1600);
            const optimizedBase64 = optimizedDataUrl.split(',')[1] || '';
            const effectiveMimeType = file.type || 'image/png';
            setIsAutofillingFromImage(true);
            setAutoFillError(null);
            setProductImageNotice(null);
            setIsAnalyzingTable(true);
            setFormData((prev)=>({
                    ...prev,
                    sizeChartImage: optimizedDataUrl
                }));
            try {
                const extracted = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$api$2f$index$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["fetchProductMetadataFromImage"])(optimizedBase64, effectiveMimeType);
                const productImageBox = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$image$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["normalizeCaptureBoundingBox"])(extracted.product_image_bbox ?? null);
                const sizeChartBox = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$image$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["normalizeCaptureBoundingBox"])(extracted.size_chart_bbox ?? null);
                const candidateUrls = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$product$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["uniqHttpUrls"])([
                    extracted.image_path || '',
                    ...Array.isArray(extracted.productImageCandidates) ? extracted.productImageCandidates : [],
                    extracted.productImage?.sourceUrl || ''
                ]).slice(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$constants$2f$index$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["MAX_PRODUCT_IMAGE_CANDIDATES"]);
                const selectedCandidateUrl = candidateUrls[0] || '';
                let normalizedTable = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$sizeTable$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["normalizeSizeTable"])(extracted.sizeTable ?? null);
                const croppedProductImage = !selectedCandidateUrl && productImageBox ? await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$image$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["cropImageByBoundingBox"])(optimizedDataUrl, productImageBox) : '';
                if (!normalizedTable && sizeChartBox) {
                    const croppedSizeChartImage = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$image$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["cropImageByBoundingBox"])(optimizedDataUrl, sizeChartBox);
                    if (croppedSizeChartImage) {
                        const croppedBase64 = croppedSizeChartImage.split(',')[1] || '';
                        if (croppedBase64) {
                            normalizedTable = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$api$2f$index$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["extractSizeTableFromImage"])(croppedBase64, 'image/png');
                        }
                    }
                }
                setAutofilledProductImageCandidates(candidateUrls);
                setProductPhotoFile(null);
                setAutofilledProductImageUrl(selectedCandidateUrl || null);
                setProductImageNotice(selectedCandidateUrl ? null : croppedProductImage ? 'Only a screenshot crop was found. Upload the brand product image manually before saving.' : 'Official product image was not found from the screenshot. Upload the brand image manually.');
                setFormData((prev)=>({
                        ...prev,
                        brand: extracted.brand || prev.brand,
                        name: extracted.name || prev.name,
                        category: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$product$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["normalizeCategoryOption"])(extracted.category || '') || prev.category,
                        url: extracted.url || prev.url,
                        productImage: selectedCandidateUrl || croppedProductImage || prev.productImage,
                        extractedTable: normalizedTable || prev.extractedTable,
                        sizeChartImage: optimizedDataUrl
                    }));
                if (!extracted.brand && !extracted.name && !selectedCandidateUrl && !croppedProductImage && !normalizedTable) {
                    setAutoFillError('캡쳐 이미지에서 자동 입력 데이터를 찾지 못했습니다.');
                }
            } catch (error) {
                const message = error instanceof Error ? error.message : 'Image analysis failed.';
                setAutoFillError(message);
            } finally{
                setIsAnalyzingTable(false);
                setIsAutofillingFromImage(false);
            }
        })();
    };
    const handleAiPreviewLoad = ()=>{
        setIsAiPreviewLoading(false);
    };
    const handleAiPreviewError = (event)=>{
        const image = event.currentTarget;
        const currentSrc = String(image.getAttribute('src') || '').trim();
        if (currentSrc.endsWith(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$constants$2f$index$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["DEFAULT_PRODUCT_PLACEHOLDER"])) {
            setIsAiPreviewLoading(false);
            return;
        }
        setDidFallbackAiPreviewImage(true);
        setIsAiPreviewLoading(false);
        setAiPreviewImageSrc(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$constants$2f$index$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["DEFAULT_PRODUCT_PLACEHOLDER"]);
    };
    const handleThumbnailLoadError = (event)=>{
        const image = event.currentTarget;
        const currentSrc = String(image.getAttribute('src') || '').trim();
        if (currentSrc.endsWith(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$constants$2f$index$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["DEFAULT_PRODUCT_PLACEHOLDER"])) return;
        image.src = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$constants$2f$index$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["DEFAULT_PRODUCT_PLACEHOLDER"];
    };
    const handleSubmitProduct = async ()=>{
        const hasProductImageCheck = Boolean(productPhotoFile) || Boolean(autofilledProductImageUrl);
        const hasCategory = Boolean(formData.category.trim());
        const hasValidatedSizeTable = Boolean(formData.extractedTable);
        const isSizeTableOptionalCategory = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$product$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["isOptionalMetadataCategory"])(formData.category);
        if (!hasProductImageCheck) {
            alert('상품 사진은 필수입니다.');
            return;
        }
        if (!hasCategory) {
            alert('카테고리는 필수입니다.');
            return;
        }
        if (!isSizeTableOptionalCategory && !hasValidatedSizeTable) {
            alert('검증된 사이즈표가 필요합니다. 더 선명한 사이즈표 이미지를 업로드해 주세요.');
            return;
        }
        setIsSaving(true);
        try {
            await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$api$2f$index$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["submitProduct"])({
                brand: formData.brand,
                name: formData.name,
                category: formData.category || null,
                url: formData.url || null,
                sizeTable: formData.extractedTable,
                productPhoto: productPhotoFile,
                productImageUrl: autofilledProductImageUrl
            });
            closeModal();
            onSubmitSuccess();
        } catch (submitError) {
            const message = submitError instanceof Error ? submitError.message : 'Submission failed.';
            console.error('[handleSubmitProduct] submit failed', submitError);
            if ((0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$product$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["isDuplicateProductErrorMessage"])(message)) {
                setShowDuplicateProductModal(true);
                return;
            }
            alert(`제출 실패: ${message}`);
        } finally{
            setIsSaving(false);
        }
    };
    const hasSizeData = Boolean(formData.extractedTable);
    const hasProductImage = Boolean(productPhotoFile) || Boolean(autofilledProductImageUrl);
    const isSizeTableOptionalCategory = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$product$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["isOptionalMetadataCategory"])(formData.category);
    const isPreviewOnlyProductImage = Boolean(formData.productImage) && !productPhotoFile && !autofilledProductImageUrl;
    const isFormValid = Boolean(formData.brand.trim()) && Boolean(formData.name.trim()) && Boolean(formData.category.trim()) && hasProductImage && (hasSizeData || isSizeTableOptionalCategory) && !isAutofillingFromUrl && !isAutofillingFromImage && !isProcessingImage && !isAnalyzingTable && !isSaving;
    const isCaptureReviewReady = Boolean(formData.brand.trim()) || Boolean(formData.name.trim()) || Boolean(formData.category.trim()) || Boolean(formData.url.trim()) || Boolean(formData.productImage) || Boolean(formData.extractedTable);
    return {
        isModalOpen,
        openModal,
        closeModal,
        addProductMode,
        setAddProductMode,
        showDuplicateProductModal,
        setShowDuplicateProductModal,
        formData,
        setFormData,
        productPhotoFile,
        autofilledProductImageUrl,
        setAutofilledProductImageUrl,
        autofilledProductImageCandidates,
        isProcessingImage,
        isAnalyzingTable,
        isSaving,
        isAutofillingFromUrl,
        isAutofillingFromImage,
        autoFillError,
        setAutoFillError,
        productImageNotice,
        aiPreviewImageSrc,
        isAiPreviewLoading,
        didFallbackAiPreviewImage,
        tableEditingCell,
        setTableEditingCell,
        hasSizeData,
        hasProductImage,
        isSizeTableOptionalCategory,
        isPreviewOnlyProductImage,
        isFormValid,
        isCaptureReviewReady,
        handleFileUpload,
        handleSelectAutofilledProductImage,
        handleAutoFillFromUrl,
        handleCaptureUpload,
        handleAiPreviewLoad,
        handleAiPreviewError,
        handleThumbnailLoadError,
        handleSubmitProduct
    };
}
}),
"[project]/src/hooks/useProducts.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "useProducts",
    ()=>useProducts
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$api$2f$index$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/api/index.ts [app-ssr] (ecmascript)");
;
;
function useProducts() {
    const [productsError, setProductsError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    const [products, setProducts] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])([]);
    const [retryTrigger, setRetryTrigger] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(0);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        let isActive = true;
        const load = async ()=>{
            try {
                const loaded = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$api$2f$index$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["searchProducts"])("");
                if (!isActive) return;
                setProducts(loaded);
                setProductsError(null);
            } catch (loadError) {
                if (!isActive) return;
                const message = loadError instanceof Error ? loadError.message : "상품 데이터를 불러오는 중 오류가 발생했습니다.";
                setProductsError(message);
            }
        };
        void load();
        return ()=>{
            isActive = false;
        };
    }, [
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
}),
"[project]/src/App.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>App
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$arrow$2d$right$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__ArrowRight$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/arrow-right.js [app-ssr] (ecmascript) <export default as ArrowRight>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$check$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Check$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/check.js [app-ssr] (ecmascript) <export default as Check>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$globe$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Globe$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/globe.js [app-ssr] (ecmascript) <export default as Globe>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$layout$2d$grid$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__LayoutGrid$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/layout-grid.js [app-ssr] (ecmascript) <export default as LayoutGrid>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$log$2d$in$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__LogIn$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/log-in.js [app-ssr] (ecmascript) <export default as LogIn>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$plus$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Plus$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/plus.js [app-ssr] (ecmascript) <export default as Plus>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$refresh$2d$cw$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__RefreshCw$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/refresh-cw.js [app-ssr] (ecmascript) <export default as RefreshCw>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$search$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Search$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/search.js [app-ssr] (ecmascript) <export default as Search>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$shield$2d$alert$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__ShieldAlert$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/shield-alert.js [app-ssr] (ecmascript) <export default as ShieldAlert>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$x$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__X$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/x.js [app-ssr] (ecmascript) <export default as X>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$AddProductModal$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/AddProductModal.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$GoogleSignupCompleteModal$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/GoogleSignupCompleteModal.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$GridView$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/GridView.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$NeedsUsernameModal$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/NeedsUsernameModal.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$LoginPage$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/LoginPage.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ProgressiveImage$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/ProgressiveImage.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ProductDetailModal$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/ProductDetailModal.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$SizeConverterView$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/SizeConverterView.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$useAuth$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/hooks/useAuth.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$useProductForm$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/hooks/useProductForm.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$constants$2f$index$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/constants/index.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/supabase.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$sizeTable$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/utils/sizeTable.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$product$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/utils/product.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$useProducts$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/hooks/useProducts.ts [app-ssr] (ecmascript)");
;
;
;
;
;
;
;
;
;
;
;
;
;
;
;
;
;
;
function App() {
    const { productsError, products, setProductsError, setRetryTrigger } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$useProducts$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useProducts"])();
    const [gridCategoryFilter, setGridCategoryFilter] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])('');
    const [gridSearchQuery, setGridSearchQuery] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])('');
    const [query, setQuery] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])('');
    const [suggestions, setSuggestions] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])([]);
    const [isLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    const [result, setResult] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    const [error, setError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    const [showSuggestions, setShowSuggestions] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    const [showSuccessModal, setShowSuccessModal] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    const [viewMode, setViewMode] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])('search');
    const [sizeCategory, setSizeCategory] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])('clothing');
    const [sizeGender, setSizeGender] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])('men');
    const [sizeRegion, setSizeRegion] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])('us');
    const [sizeValue, setSizeValue] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])('S');
    const [selectedGridProduct, setSelectedGridProduct] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    const [activeResultRowIndex, setActiveResultRowIndex] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    const [activeConverterRowIndex, setActiveConverterRowIndex] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    const [activeGridDetailRowIndex, setActiveGridDetailRowIndex] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    const [isDetailImageZoomed, setIsDetailImageZoomed] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    const searchContainerRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(null);
    const isSelectionRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(false);
    const gridDetailRecommendationsRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(null);
    const gridDetailModalRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(null);
    const searchResultModalRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(null);
    const searchResultRecommendationsRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(null);
    const smoothScrollTo = (container, targetY, duration = 520)=>{
        const start = container.scrollTop;
        const distance = targetY - start;
        if (Math.abs(distance) < 2) return;
        const startTime = performance.now();
        const easeInOutCubic = (t)=>t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
        const step = (now)=>{
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            container.scrollTop = start + distance * easeInOutCubic(progress);
            if (progress < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
    };
    const allProducts = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useMemo"])(()=>[
            ...products
        ], [
        products
    ]);
    const sizeRecommendations = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useMemo"])(()=>{
        if (activeGridDetailRowIndex === null || !selectedGridProduct) return [];
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$sizeTable$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["computeSizeRecommendations"])(selectedGridProduct, activeGridDetailRowIndex, allProducts);
    }, [
        selectedGridProduct,
        activeGridDetailRowIndex,
        allProducts
    ]);
    const searchResultRecommendations = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useMemo"])(()=>{
        if (activeResultRowIndex === null || !result) return [];
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$sizeTable$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["computeSizeRecommendations"])(result, activeResultRowIndex, allProducts);
    }, [
        result,
        activeResultRowIndex,
        allProducts
    ]);
    const gridCategoryCounts = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useMemo"])(()=>{
        const counts = {
            Total: allProducts.length
        };
        for (const category of __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$constants$2f$index$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["CATEGORY_OPTIONS"]){
            counts[category] = 0;
        }
        for (const product of allProducts){
            if (product.category in counts) {
                counts[product.category] += 1;
            }
        }
        return counts;
    }, [
        allProducts
    ]);
    const filteredGridProducts = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useMemo"])(()=>{
        const normalizedGridSearchQuery = gridSearchQuery.trim().toLowerCase();
        return allProducts.filter((product)=>{
            if (gridCategoryFilter && product.category !== gridCategoryFilter) {
                return false;
            }
            if (!normalizedGridSearchQuery) {
                return true;
            }
            const searchableText = [
                product.brand,
                product.name,
                product.category,
                product.url
            ].join(' ').toLowerCase();
            return searchableText.includes(normalizedGridSearchQuery);
        });
    }, [
        allProducts,
        gridCategoryFilter,
        gridSearchQuery
    ]);
    const sizeRows = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useMemo"])(()=>{
        if (sizeCategory === 'shoes') return __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$constants$2f$index$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["SHOE_SIZE_ROWS_BY_GENDER"][sizeGender];
        return __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$constants$2f$index$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["CLOTHING_SIZE_ROWS_BY_GENDER"][sizeGender];
    }, [
        sizeCategory,
        sizeGender
    ]);
    const sizeOptions = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useMemo"])(()=>sizeRows.map((row)=>row[sizeRegion]).filter(Boolean), [
        sizeRegion,
        sizeRows
    ]);
    const convertedSize = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useMemo"])(()=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$sizeTable$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["findConvertedSize"])(sizeRows, sizeRegion, sizeValue), [
        sizeRegion,
        sizeRows,
        sizeValue
    ]);
    const zoomedDetailProduct = selectedGridProduct ?? result;
    const productUrlSet = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useMemo"])(()=>new Set(allProducts.map((product)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$product$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["normalizeComparableProductUrl"])(product.url)).filter(Boolean)), [
        allProducts
    ]);
    const shouldHideSearchHero = viewMode === 'search' && Boolean(result) && !isLoading;
    const form = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$useProductForm$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useProductForm"])({
        productUrlSet,
        onSubmitSuccess: ()=>{
            setShowSuccessModal(true);
            setTimeout(()=>setShowSuccessModal(false), 1000);
            setRetryTrigger((prev)=>prev + 1);
            setProductsError(null);
        }
    });
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        if (isSelectionRef.current) {
            isSelectionRef.current = false;
            return;
        }
        if (!query) {
            setSuggestions([]);
            setShowSuggestions(false);
            return;
        }
        const filtered = allProducts.filter((item)=>`${item.brand} ${item.name}`.toLowerCase().includes(query.toLowerCase()));
        setSuggestions(filtered);
        setShowSuggestions(true);
    }, [
        allProducts,
        query
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        setActiveResultRowIndex(null);
    }, [
        result?.id
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        setActiveGridDetailRowIndex(null);
    }, [
        selectedGridProduct?.id
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        if (!convertedSize) {
            setActiveConverterRowIndex(null);
            return;
        }
        const nextIndex = sizeRows.findIndex((row)=>row.label === convertedSize.label);
        setActiveConverterRowIndex(nextIndex >= 0 ? nextIndex : null);
    }, [
        convertedSize,
        sizeRows
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        setIsDetailImageZoomed(false);
    }, [
        selectedGridProduct?.id,
        result?.id
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        if (!selectedGridProduct) return;
        const isVisible = filteredGridProducts.some((product)=>product.id === selectedGridProduct.id);
        if (!isVisible) {
            setSelectedGridProduct(null);
        }
    }, [
        filteredGridProducts,
        selectedGridProduct
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        if (sizeOptions.length === 0) {
            setSizeValue('');
            return;
        }
        const hasCurrentValue = sizeOptions.some((option)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$sizeTable$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["normalizeSizeLookupValue"])(option) === (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$sizeTable$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["normalizeSizeLookupValue"])(sizeValue));
        if (!hasCurrentValue) {
            setSizeValue(sizeOptions[0]);
        }
    }, [
        sizeCategory,
        sizeOptions,
        sizeRegion,
        sizeValue
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        const handleOutside = (event)=>{
            if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener('mousedown', handleOutside);
        return ()=>document.removeEventListener('mousedown', handleOutside);
    }, []);
    const handleSearch = (searchItem = null)=>{
        const term = searchItem ? searchItem.name : query;
        if (!term) return;
        setViewMode('search');
        setResult(null);
        setError(null);
        setShowSuggestions(false);
        const keyword = term.toLowerCase();
        const found = searchItem || allProducts.find((item)=>`${item.brand} ${item.name}`.toLowerCase().includes(keyword)) || (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$product$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["generateFallbackResult"])(term);
        setResult(found);
        setQuery('');
        setProductsError(null);
    };
    const handleKeyDown = (event)=>{
        if (event.key === 'Enter') void handleSearch();
    };
    const navigateToView = (nextView)=>{
        setViewMode(nextView);
        setResult(null);
        setQuery('');
        setError(null);
        setShowSuggestions(false);
        setSelectedGridProduct(null);
    };
    const auth = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$useAuth$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useAuth"])({
        onNavigateToLogin: ()=>navigateToView('login')
    });
    const handleImageLoadError = (event)=>{
        event.currentTarget.onerror = null;
        event.currentTarget.style.display = 'none';
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "min-h-screen bg-black text-white font-sans selection:bg-orange-500 selection:text-white",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("header", {
                className: "fixed top-0 w-full bg-black/90 backdrop-blur-md border-b border-gray-800 z-50",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "max-w-6xl mx-auto px-4 h-16 flex items-center justify-between",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "flex items-center gap-2",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "flex items-center gap-2 cursor-pointer",
                                    onClick: ()=>navigateToView('search'),
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "w-10 h-10 flex items-center justify-center",
                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("img", {
                                                src: "/favicon-simple.svg",
                                                alt: "DIGDA logo",
                                                className: "w-7 h-7 object-contain"
                                            }, void 0, false, {
                                                fileName: "[project]/src/App.tsx",
                                                lineNumber: 293,
                                                columnNumber: 17
                                            }, this)
                                        }, void 0, false, {
                                            fileName: "[project]/src/App.tsx",
                                            lineNumber: 292,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            className: "font-bold text-xl tracking-tight text-orange-500",
                                            children: "DIGDA"
                                        }, void 0, false, {
                                            fileName: "[project]/src/App.tsx",
                                            lineNumber: 295,
                                            columnNumber: 15
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/App.tsx",
                                    lineNumber: 291,
                                    columnNumber: 13
                                }, this),
                                auth.authUser && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    className: "text-gray-500 text-xs font-medium cursor-pointer hover:text-gray-300 transition",
                                    onClick: ()=>navigateToView('mypage'),
                                    children: [
                                        "| ",
                                        String(auth.dbUsername ?? auth.authUser.email?.split('@')[0] ?? '')
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/App.tsx",
                                    lineNumber: 298,
                                    columnNumber: 15
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/App.tsx",
                            lineNumber: 290,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "flex items-center gap-4",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    onClick: ()=>navigateToView('converter'),
                                    className: `p-1.5 rounded-lg transition border backdrop-blur-xl shadow-[0_4px_16px_rgba(0,0,0,0.2)] ${viewMode === 'converter' ? 'bg-orange-500 text-black border-orange-500' : 'bg-[linear-gradient(180deg,rgba(255,255,255,0.18),rgba(255,255,255,0.07))] border-white/20 text-gray-200 hover:border-orange-500/60 hover:text-orange-400'}`,
                                    title: "해외사이즈 변환기",
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$globe$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Globe$3e$__["Globe"], {
                                        className: "w-4 h-4"
                                    }, void 0, false, {
                                        fileName: "[project]/src/App.tsx",
                                        lineNumber: 316,
                                        columnNumber: 15
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/src/App.tsx",
                                    lineNumber: 307,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    onClick: ()=>navigateToView('grid'),
                                    className: "p-1.5 text-gray-300 bg-[linear-gradient(180deg,rgba(255,255,255,0.18),rgba(255,255,255,0.07))] backdrop-blur-xl border border-white/20 hover:text-orange-400 hover:border-orange-500/60 transition rounded-lg shadow-[0_4px_16px_rgba(0,0,0,0.2)]",
                                    title: "전체 목록 보기",
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$layout$2d$grid$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__LayoutGrid$3e$__["LayoutGrid"], {
                                        className: "w-4 h-4"
                                    }, void 0, false, {
                                        fileName: "[project]/src/App.tsx",
                                        lineNumber: 323,
                                        columnNumber: 15
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/src/App.tsx",
                                    lineNumber: 318,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    onClick: form.openModal,
                                    className: "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition backdrop-blur-xl border border-[#00FF00]/40 bg-[linear-gradient(180deg,rgba(0,255,0,0.22),rgba(0,255,0,0.09))] text-[#00FF00] hover:border-[#00FF00]/70 hover:bg-[linear-gradient(180deg,rgba(0,255,0,0.32),rgba(0,255,0,0.15))] shadow-[0_4px_16px_rgba(0,255,0,0.15)]",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$plus$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Plus$3e$__["Plus"], {
                                            className: "w-3.5 h-3.5"
                                        }, void 0, false, {
                                            fileName: "[project]/src/App.tsx",
                                            lineNumber: 329,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            className: "hidden sm:inline",
                                            children: "상품 추가"
                                        }, void 0, false, {
                                            fileName: "[project]/src/App.tsx",
                                            lineNumber: 330,
                                            columnNumber: 15
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/App.tsx",
                                    lineNumber: 325,
                                    columnNumber: 13
                                }, this),
                                !auth.authUser && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    onClick: ()=>navigateToView('login'),
                                    className: `flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition backdrop-blur-xl border shadow-[0_4px_16px_rgba(0,0,0,0.2)] ${viewMode === 'login' ? 'bg-orange-500 text-black border-orange-500' : 'border-white/20 bg-[linear-gradient(180deg,rgba(255,255,255,0.18),rgba(255,255,255,0.07))] text-gray-200 hover:border-orange-500/60 hover:text-orange-400'}`,
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$log$2d$in$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__LogIn$3e$__["LogIn"], {
                                            className: "w-4 h-4"
                                        }, void 0, false, {
                                            fileName: "[project]/src/App.tsx",
                                            lineNumber: 341,
                                            columnNumber: 17
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            className: "hidden sm:inline",
                                            children: "로그인"
                                        }, void 0, false, {
                                            fileName: "[project]/src/App.tsx",
                                            lineNumber: 342,
                                            columnNumber: 17
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/App.tsx",
                                    lineNumber: 333,
                                    columnNumber: 15
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/App.tsx",
                            lineNumber: 306,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/App.tsx",
                    lineNumber: 289,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/src/App.tsx",
                lineNumber: 288,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("main", {
                className: `${viewMode === 'converter' ? 'pt-20 sm:pt-24' : 'pt-[var(--app-main-pt)]'} pb-[var(--app-main-pb)] px-[var(--app-main-px)] flex flex-col items-center min-h-screen`,
                children: [
                    productsError && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "w-full max-w-4xl mb-6 bg-orange-900/50 border border-orange-500 text-orange-200 px-6 py-4 rounded-xl flex flex-col md:flex-row items-center gap-4",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex items-center gap-2 flex-1",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$shield$2d$alert$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__ShieldAlert$3e$__["ShieldAlert"], {
                                        className: "w-6 h-6 flex-shrink-0"
                                    }, void 0, false, {
                                        fileName: "[project]/src/App.tsx",
                                        lineNumber: 353,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "font-medium text-sm md:text-base",
                                        children: productsError
                                    }, void 0, false, {
                                        fileName: "[project]/src/App.tsx",
                                        lineNumber: 354,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/App.tsx",
                                lineNumber: 352,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                onClick: ()=>setRetryTrigger((prev)=>prev + 1),
                                className: "flex items-center gap-2 px-4 py-2 bg-orange-800 hover:bg-orange-700 rounded-lg text-sm font-bold transition whitespace-nowrap",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$refresh$2d$cw$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__RefreshCw$3e$__["RefreshCw"], {
                                        className: "w-4 h-4"
                                    }, void 0, false, {
                                        fileName: "[project]/src/App.tsx",
                                        lineNumber: 357,
                                        columnNumber: 15
                                    }, this),
                                    " 데이터 다시 불러오기"
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/App.tsx",
                                lineNumber: 356,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/App.tsx",
                        lineNumber: 351,
                        columnNumber: 11
                    }, this),
                    viewMode === 'login' && __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["supabase"] && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$LoginPage$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["LoginPage"], {
                        supabase: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["supabase"],
                        onSuccess: ()=>navigateToView('search'),
                        googleAuthError: auth.googleAuthError,
                        onClearGoogleAuthError: ()=>auth.setGoogleAuthError(null)
                    }, void 0, false, {
                        fileName: "[project]/src/App.tsx",
                        lineNumber: 363,
                        columnNumber: 11
                    }, this),
                    auth.needsUsername && __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["supabase"] && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$NeedsUsernameModal$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["NeedsUsernameModal"], {
                        pendingUsername: auth.pendingUsername,
                        onUsernameChange: auth.setPendingUsername,
                        onSubmit: ()=>void auth.submitUsername(()=>{}),
                        usernameError: auth.usernameError,
                        isSubmitting: auth.isSubmittingUsername
                    }, void 0, false, {
                        fileName: "[project]/src/App.tsx",
                        lineNumber: 372,
                        columnNumber: 11
                    }, this),
                    auth.googleSignupComplete && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$GoogleSignupCompleteModal$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["GoogleSignupCompleteModal"], {
                        onStart: ()=>{
                            auth.setGoogleSignupComplete(false);
                            navigateToView('search');
                        }
                    }, void 0, false, {
                        fileName: "[project]/src/App.tsx",
                        lineNumber: 382,
                        columnNumber: 11
                    }, this),
                    viewMode === 'mypage' && auth.authUser && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "w-full max-w-md mx-auto mt-16 px-4",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))] border border-white/10 rounded-2xl p-8 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.4)]",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                    className: "text-white font-bold text-lg mb-1",
                                    children: "마이페이지"
                                }, void 0, false, {
                                    fileName: "[project]/src/App.tsx",
                                    lineNumber: 390,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                    className: "text-gray-500 text-sm mb-8",
                                    children: String(auth.dbUsername ?? auth.authUser.email?.split('@')[0] ?? '')
                                }, void 0, false, {
                                    fileName: "[project]/src/App.tsx",
                                    lineNumber: 391,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    onClick: ()=>{
                                        void __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["supabase"]?.auth.signOut();
                                        navigateToView('search');
                                    },
                                    className: "w-full py-3 rounded-xl text-sm font-bold transition border border-red-500/40 bg-[linear-gradient(180deg,rgba(239,68,68,0.15),rgba(239,68,68,0.05))] text-red-400 hover:bg-[linear-gradient(180deg,rgba(239,68,68,0.25),rgba(239,68,68,0.1))] hover:border-red-500/70",
                                    children: "로그아웃"
                                }, void 0, false, {
                                    fileName: "[project]/src/App.tsx",
                                    lineNumber: 394,
                                    columnNumber: 15
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/App.tsx",
                            lineNumber: 389,
                            columnNumber: 13
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/src/App.tsx",
                        lineNumber: 388,
                        columnNumber: 11
                    }, this),
                    viewMode === 'search' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: `w-full max-w-2xl text-center overflow-hidden transition-all duration-500 ease-out ${shouldHideSearchHero ? 'max-h-0 mb-0 opacity-0 -translate-y-4 pointer-events-none' : 'max-h-96 mb-5 opacity-100 translate-y-0'}`,
                        "aria-hidden": shouldHideSearchHero,
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                                className: "mt-[var(--hero-title-mt)] mb-[var(--hero-title-mb)] text-[length:var(--hero-title-size)] font-extrabold leading-tight tracking-tight",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "block text-white",
                                        children: "모든 옷의 사이즈표"
                                    }, void 0, false, {
                                        fileName: "[project]/src/App.tsx",
                                        lineNumber: 414,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "block text-orange-500",
                                        children: "한 번에 검색하세요"
                                    }, void 0, false, {
                                        fileName: "[project]/src/App.tsx",
                                        lineNumber: 415,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/App.tsx",
                                lineNumber: 413,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "mt-8 text-[length:var(--hero-subtitle-size)] text-white",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "block",
                                        children: "공식 홈페이지와 사용자들이 공유한 데이터를 통해"
                                    }, void 0, false, {
                                        fileName: "[project]/src/App.tsx",
                                        lineNumber: 418,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "block",
                                        children: "가장 정확한 사이즈 정보를 제공합니다."
                                    }, void 0, false, {
                                        fileName: "[project]/src/App.tsx",
                                        lineNumber: 419,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/App.tsx",
                                lineNumber: 417,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/App.tsx",
                        lineNumber: 405,
                        columnNumber: 11
                    }, this),
                    viewMode === 'search' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Fragment"], {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: `w-full max-w-2xl relative transition-all duration-500 ${result || isLoading ? 'mt-0' : 'mt-4'}`,
                                ref: searchContainerRef,
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "relative group",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "pointer-events-none absolute inset-0 rounded-2xl bg-[linear-gradient(135deg,rgba(255,255,255,0.18),transparent_30%,transparent_72%,rgba(255,255,255,0.08))]"
                                            }, void 0, false, {
                                                fileName: "[project]/src/App.tsx",
                                                lineNumber: 428,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none",
                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$search$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Search$3e$__["Search"], {
                                                    className: `w-6 h-6 transition-colors ${showSuggestions ? 'text-orange-500' : 'text-gray-500'}`
                                                }, void 0, false, {
                                                    fileName: "[project]/src/App.tsx",
                                                    lineNumber: 430,
                                                    columnNumber: 19
                                                }, this)
                                            }, void 0, false, {
                                                fileName: "[project]/src/App.tsx",
                                                lineNumber: 429,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                type: "text",
                                                className: "w-full pl-14 pr-14 py-[var(--search-input-py)] bg-gray-900 border-2 border-gray-800 rounded-2xl shadow-xl text-[length:var(--search-input-font-size)] text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all",
                                                placeholder: "브랜드명 혹은 상품명",
                                                value: query,
                                                onChange: (e)=>setQuery(e.target.value),
                                                onKeyDown: handleKeyDown,
                                                onFocus: ()=>{
                                                    if (query) setShowSuggestions(true);
                                                }
                                            }, void 0, false, {
                                                fileName: "[project]/src/App.tsx",
                                                lineNumber: 432,
                                                columnNumber: 17
                                            }, this),
                                            query && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                onClick: ()=>{
                                                    setQuery('');
                                                    setSuggestions([]);
                                                },
                                                className: "absolute inset-y-0 right-14 pr-2 flex items-center text-gray-400 hover:text-white",
                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$x$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__X$3e$__["X"], {
                                                    className: "w-5 h-5"
                                                }, void 0, false, {
                                                    fileName: "[project]/src/App.tsx",
                                                    lineNumber: 433,
                                                    columnNumber: 183
                                                }, this)
                                            }, void 0, false, {
                                                fileName: "[project]/src/App.tsx",
                                                lineNumber: 433,
                                                columnNumber: 27
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                onClick: ()=>{
                                                    void handleSearch();
                                                },
                                                className: "absolute inset-y-2 right-2 rounded-xl bg-orange-500 px-3 text-black hover:bg-orange-400 transition-colors shadow-lg",
                                                style: {
                                                    boxShadow: 'var(--ui-depth-shadow)'
                                                },
                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$arrow$2d$right$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__ArrowRight$3e$__["ArrowRight"], {
                                                    className: "w-5 h-5"
                                                }, void 0, false, {
                                                    fileName: "[project]/src/App.tsx",
                                                    lineNumber: 434,
                                                    columnNumber: 242
                                                }, this)
                                            }, void 0, false, {
                                                fileName: "[project]/src/App.tsx",
                                                lineNumber: 434,
                                                columnNumber: 17
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/App.tsx",
                                        lineNumber: 427,
                                        columnNumber: 15
                                    }, this),
                                    showSuggestions && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "absolute top-full left-0 right-0 mt-2 z-20 max-h-96 overflow-y-auto overflow-hidden rounded-2xl border border-white/15 bg-[linear-gradient(180deg,rgba(255,255,255,0.16),rgba(255,255,255,0.06))] shadow-[0_20px_48px_rgba(0,0,0,0.24)] backdrop-blur-2xl",
                                        children: suggestions.length > 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("ul", {
                                            children: suggestions.map((item)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                                    onClick: ()=>{
                                                        isSelectionRef.current = true;
                                                        setQuery(item.name);
                                                        void handleSearch(item);
                                                    },
                                                    className: "flex items-center gap-4 px-5 py-4 cursor-pointer border-b border-white/10 transition-colors hover:bg-white/[0.08] last:border-0",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                            className: "w-10 h-10 rounded-md flex-shrink-0 overflow-hidden bg-white/10",
                                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ProgressiveImage$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ProgressiveImage"], {
                                                                src: item.image,
                                                                thumbnailSrc: item.thumbnailImage,
                                                                alt: item.name,
                                                                className: "w-full h-full object-cover",
                                                                onError: handleImageLoadError
                                                            }, void 0, false, {
                                                                fileName: "[project]/src/App.tsx",
                                                                lineNumber: 443,
                                                                columnNumber: 107
                                                            }, this)
                                                        }, void 0, false, {
                                                            fileName: "[project]/src/App.tsx",
                                                            lineNumber: 443,
                                                            columnNumber: 27
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                            children: [
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                    className: "font-medium text-white",
                                                                    children: item.name
                                                                }, void 0, false, {
                                                                    fileName: "[project]/src/App.tsx",
                                                                    lineNumber: 444,
                                                                    columnNumber: 32
                                                                }, this),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                    className: "text-sm text-gray-400",
                                                                    children: [
                                                                        item.brand,
                                                                        " · ",
                                                                        item.category
                                                                    ]
                                                                }, void 0, true, {
                                                                    fileName: "[project]/src/App.tsx",
                                                                    lineNumber: 444,
                                                                    columnNumber: 89
                                                                }, this)
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/src/App.tsx",
                                                            lineNumber: 444,
                                                            columnNumber: 27
                                                        }, this)
                                                    ]
                                                }, item.id, true, {
                                                    fileName: "[project]/src/App.tsx",
                                                    lineNumber: 442,
                                                    columnNumber: 25
                                                }, this))
                                        }, void 0, false, {
                                            fileName: "[project]/src/App.tsx",
                                            lineNumber: 440,
                                            columnNumber: 21
                                        }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "p-4 text-center text-gray-500 text-sm",
                                            children: "검색어와 일치하는 추천 상품이 없습니다."
                                        }, void 0, false, {
                                            fileName: "[project]/src/App.tsx",
                                            lineNumber: 448,
                                            columnNumber: 23
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/src/App.tsx",
                                        lineNumber: 438,
                                        columnNumber: 17
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/App.tsx",
                                lineNumber: 426,
                                columnNumber: 13
                            }, this),
                            isLoading && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "mt-10 text-gray-300",
                                children: "검색 중..."
                            }, void 0, false, {
                                fileName: "[project]/src/App.tsx",
                                lineNumber: 453,
                                columnNumber: 27
                            }, this),
                            error && !isLoading && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "mt-6 text-red-300",
                                children: error
                            }, void 0, false, {
                                fileName: "[project]/src/App.tsx",
                                lineNumber: 454,
                                columnNumber: 37
                            }, this)
                        ]
                    }, void 0, true),
                    viewMode === 'converter' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$SizeConverterView$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["SizeConverterView"], {
                        sizeCategory: sizeCategory,
                        setSizeCategory: setSizeCategory,
                        sizeGender: sizeGender,
                        setSizeGender: setSizeGender,
                        sizeRegion: sizeRegion,
                        setSizeRegion: setSizeRegion,
                        sizeValue: sizeValue,
                        setSizeValue: setSizeValue,
                        sizeRows: sizeRows,
                        sizeOptions: sizeOptions,
                        convertedSize: convertedSize,
                        activeConverterRowIndex: activeConverterRowIndex,
                        setActiveConverterRowIndex: setActiveConverterRowIndex
                    }, void 0, false, {
                        fileName: "[project]/src/App.tsx",
                        lineNumber: 460,
                        columnNumber: 11
                    }, this),
                    viewMode === 'grid' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$GridView$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["GridView"], {
                        allProducts: allProducts,
                        filteredGridProducts: filteredGridProducts,
                        gridCategoryCounts: gridCategoryCounts,
                        gridCategoryFilter: gridCategoryFilter,
                        setGridCategoryFilter: setGridCategoryFilter,
                        gridSearchQuery: gridSearchQuery,
                        setGridSearchQuery: setGridSearchQuery,
                        onProductClick: setSelectedGridProduct,
                        onImageError: handleImageLoadError
                    }, void 0, false, {
                        fileName: "[project]/src/App.tsx",
                        lineNumber: 477,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/App.tsx",
                lineNumber: 349,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$AddProductModal$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["AddProductModal"], {
                form: form
            }, void 0, false, {
                fileName: "[project]/src/App.tsx",
                lineNumber: 490,
                columnNumber: 7
            }, this),
            showSuccessModal && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "fixed inset-0 z-[70] flex items-center justify-center p-4 pointer-events-none",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "w-36 h-36 bg-black/85 backdrop-blur-md border border-green-400/80 rounded-2xl flex flex-col items-center justify-center gap-2 shadow-[0_0_30px_rgba(34,197,94,0.25)]",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$check$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Check$3e$__["Check"], {
                                className: "w-6 h-6 text-green-400"
                            }, void 0, false, {
                                fileName: "[project]/src/App.tsx",
                                lineNumber: 496,
                                columnNumber: 15
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/src/App.tsx",
                            lineNumber: 495,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                            className: "text-sm font-bold tracking-wide text-green-400",
                            children: "COMPLETE"
                        }, void 0, false, {
                            fileName: "[project]/src/App.tsx",
                            lineNumber: 498,
                            columnNumber: 13
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/App.tsx",
                    lineNumber: 494,
                    columnNumber: 11
                }, this)
            }, void 0, false, {
                fileName: "[project]/src/App.tsx",
                lineNumber: 493,
                columnNumber: 9
            }, this),
            form.showDuplicateProductModal && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "fixed inset-0 z-[72] flex items-center justify-center p-4",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "absolute inset-0 bg-black/70 backdrop-blur-sm",
                        onClick: ()=>form.setShowDuplicateProductModal(false)
                    }, void 0, false, {
                        fileName: "[project]/src/App.tsx",
                        lineNumber: 505,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "relative w-full max-w-sm rounded-3xl border border-red-500/40 bg-gray-950 px-6 py-7 text-center shadow-2xl",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-red-500/15 text-red-400",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$shield$2d$alert$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__ShieldAlert$3e$__["ShieldAlert"], {
                                    className: "h-6 w-6"
                                }, void 0, false, {
                                    fileName: "[project]/src/App.tsx",
                                    lineNumber: 511,
                                    columnNumber: 15
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/src/App.tsx",
                                lineNumber: 510,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                className: "mt-4 text-lg font-bold text-white",
                                children: "이미 등록된 상품입니다"
                            }, void 0, false, {
                                fileName: "[project]/src/App.tsx",
                                lineNumber: 513,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                type: "button",
                                onClick: ()=>form.setShowDuplicateProductModal(false),
                                className: "mt-5 inline-flex items-center justify-center rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-bold text-black hover:bg-orange-400 transition",
                                children: "확인"
                            }, void 0, false, {
                                fileName: "[project]/src/App.tsx",
                                lineNumber: 514,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/App.tsx",
                        lineNumber: 509,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/App.tsx",
                lineNumber: 504,
                columnNumber: 9
            }, this),
            viewMode === 'grid' && selectedGridProduct && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ProductDetailModal$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ProductDetailModal"], {
                product: selectedGridProduct,
                activeRowIndex: activeGridDetailRowIndex,
                onClose: ()=>setSelectedGridProduct(null),
                onRowClick: (rowIndex)=>setActiveGridDetailRowIndex(rowIndex),
                recommendations: sizeRecommendations,
                onRecommendationClick: (product)=>{
                    setSelectedGridProduct(product);
                    setActiveGridDetailRowIndex(null);
                },
                onZoomImage: ()=>setIsDetailImageZoomed(true),
                onImageError: handleImageLoadError,
                modalRef: gridDetailModalRef,
                recommendationsRef: gridDetailRecommendationsRef,
                smoothScrollTo: smoothScrollTo
            }, void 0, false, {
                fileName: "[project]/src/App.tsx",
                lineNumber: 526,
                columnNumber: 9
            }, this),
            result && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ProductDetailModal$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ProductDetailModal"], {
                product: result,
                activeRowIndex: activeResultRowIndex,
                onClose: ()=>setResult(null),
                onRowClick: (rowIndex)=>setActiveResultRowIndex(rowIndex),
                recommendations: searchResultRecommendations,
                onRecommendationClick: (product)=>{
                    setResult(product);
                    setActiveResultRowIndex(null);
                },
                onZoomImage: ()=>setIsDetailImageZoomed(true),
                onImageError: handleImageLoadError,
                modalRef: searchResultModalRef,
                recommendationsRef: searchResultRecommendationsRef,
                smoothScrollTo: smoothScrollTo
            }, void 0, false, {
                fileName: "[project]/src/App.tsx",
                lineNumber: 542,
                columnNumber: 9
            }, this),
            isDetailImageZoomed && zoomedDetailProduct && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "fixed inset-0 z-[75] bg-black/90 backdrop-blur-sm p-4 flex items-center justify-center cursor-pointer",
                onClick: ()=>setIsDetailImageZoomed(false),
                onTouchStart: ()=>setIsDetailImageZoomed(false),
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "h-[63vh] w-full max-w-6xl flex items-center justify-center",
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("img", {
                        src: zoomedDetailProduct.image,
                        alt: zoomedDetailProduct.name,
                        className: "max-w-full max-h-full object-contain cursor-pointer",
                        style: {
                            borderRadius: '20px'
                        }
                    }, void 0, false, {
                        fileName: "[project]/src/App.tsx",
                        lineNumber: 565,
                        columnNumber: 13
                    }, this)
                }, void 0, false, {
                    fileName: "[project]/src/App.tsx",
                    lineNumber: 564,
                    columnNumber: 11
                }, this)
            }, void 0, false, {
                fileName: "[project]/src/App.tsx",
                lineNumber: 559,
                columnNumber: 9
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/App.tsx",
        lineNumber: 287,
        columnNumber: 5
    }, this);
}
}),
"[project]/app/page.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>Page
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$App$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/App.tsx [app-ssr] (ecmascript)");
"use client";
;
;
function Page() {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$App$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {}, void 0, false, {
        fileName: "[project]/app/page.tsx",
        lineNumber: 6,
        columnNumber: 10
    }, this);
}
}),
];

//# sourceMappingURL=_0p_5k5-._.js.map