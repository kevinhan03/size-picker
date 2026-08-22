export const CORE_TASTE_CATEGORIES = ["Top", "Bottom", "Outer", "DressSkirt", "Shoes"];

export const STYLE_TAG_NAMES = [
  "casual", "minimal", "street", "classic", "vintage", "lovely_romantic",
  "sporty", "workwear_gorpcore", "chic_modern", "glam_sexy",
];

const option = (value, label) => ({ value, label });
const options = (values) => values.map(([value, label]) => option(value, label));

export const STYLE_ATTRIBUTE_FIELDS = [
  { key: "primary_color", label: "주 색상", categories: CORE_TASTE_CATEGORIES, options: options([["black", "블랙"], ["white", "화이트"], ["gray", "그레이"], ["beige", "베이지"], ["brown", "브라운"], ["navy", "네이비"], ["blue", "블루"], ["green", "그린"], ["red", "레드"], ["pink", "핑크"], ["purple", "퍼플"], ["yellow", "옐로"], ["orange", "오렌지"], ["silver", "실버"], ["gold", "골드"]]) },
  { key: "accent_colors", label: "보조 색상", categories: CORE_TASTE_CATEGORIES, multiple: true, max: 2, options: options([["black", "블랙"], ["white", "화이트"], ["gray", "그레이"], ["beige", "베이지"], ["brown", "브라운"], ["navy", "네이비"], ["blue", "블루"], ["green", "그린"], ["red", "레드"], ["pink", "핑크"], ["purple", "퍼플"], ["yellow", "옐로"], ["orange", "오렌지"], ["silver", "실버"], ["gold", "골드"]]) },
  { key: "color_saturation", label: "색감 선명도", categories: CORE_TASTE_CATEGORIES, options: options([["muted", "저채도"], ["balanced", "중간 채도"], ["vivid", "고채도"]]) },
  { key: "primary_material", label: "주 소재", categories: CORE_TASTE_CATEGORIES, options: options([["cotton", "코튼"], ["denim", "데님"], ["knit", "니트"], ["wool", "울"], ["leather", "레더"], ["suede", "스웨이드"], ["linen", "린넨"], ["nylon", "나일론"], ["polyester", "폴리에스터"], ["fleece", "플리스"], ["jersey", "저지"], ["satin", "새틴"], ["velvet", "벨벳"], ["mesh", "메시"], ["canvas", "캔버스"], ["rubber", "러버"], ["metal", "메탈"]]) },
  { key: "surface_texture", label: "표면 질감", categories: CORE_TASTE_CATEGORIES, options: options([["clean", "클린"], ["washed", "워싱"], ["faded", "페이디드"], ["distressed", "디스트레스드"], ["glossy", "광택"], ["matte", "매트"], ["textured", "텍스처드"], ["quilted", "퀼팅"], ["brushed", "브러시드"], ["sheer", "시어"]]) },
  { key: "pattern", label: "패턴", categories: CORE_TASTE_CATEGORIES, options: options([["plain", "무지"], ["stripe", "스트라이프"], ["check", "체크"], ["floral", "플로럴"], ["dot", "도트"], ["graphic", "그래픽"], ["logo", "로고"], ["animal", "애니멀"], ["camouflage", "카모플라주"], ["abstract", "추상"]]) },
  { key: "formality", label: "격식", categories: CORE_TASTE_CATEGORIES, options: options([["casual", "캐주얼"], ["smart", "스마트"], ["formal", "포멀"]]) },
  { key: "structure", label: "구조감", categories: CORE_TASTE_CATEGORIES, options: options([["soft", "소프트"], ["balanced", "균형"], ["structured", "구조적"]]) },
  { key: "decoration", label: "장식성", categories: CORE_TASTE_CATEGORIES, options: options([["minimal", "미니멀"], ["moderate", "보통"], ["statement", "강함"]]) },
  { key: "utility", label: "기능성", categories: CORE_TASTE_CATEGORIES, options: options([["none", "없음"], ["light", "약함"], ["strong", "강함"]]) },
  { key: "fit_volume", label: "핏 볼륨", categories: ["Top", "Outer"], options: options([["slim", "슬림"], ["regular", "레귤러"], ["relaxed", "릴랙스드"], ["oversized", "오버사이즈"], ["boxy", "박시"]]) },
  { key: "silhouette", label: "실루엣", categories: ["Bottom"], options: options([["slim", "슬림"], ["straight", "스트레이트"], ["wide", "와이드"], ["tapered", "테이퍼드"], ["bootcut", "부츠컷"], ["flare", "플레어"], ["balloon", "벌룬"]]) },
  { key: "silhouette", label: "실루엣", categories: ["DressSkirt"], options: options([["slim", "슬림"], ["straight", "스트레이트"], ["a_line", "A라인"], ["fit_and_flare", "핏앤플레어"], ["slip", "슬립"], ["voluminous", "볼륨감"]]) },
  { key: "length", label: "기장", categories: ["Top", "Outer"], options: options([["cropped", "크롭"], ["regular", "기본"], ["long", "롱"]]) },
  { key: "length", label: "기장", categories: ["Bottom"], options: options([["short", "숏"], ["cropped", "크롭"], ["full_length", "롱"]]) },
  { key: "length", label: "기장", categories: ["DressSkirt"], options: options([["mini", "미니"], ["midi", "미디"], ["maxi", "맥시"]]) },
  { key: "profile", label: "형태 무드", categories: ["Shoes"], options: options([["sleek", "슬림"], ["classic", "클래식"], ["chunky", "청키"]]) },
  { key: "height", label: "높이감", categories: ["Shoes"], options: options([["low", "로우"], ["mid", "미드"], ["high", "하이"]]) },
  { key: "sole_heel", label: "밑창·굽", categories: ["Shoes"], options: options([["flat", "플랫"], ["low_profile", "로우 프로필"], ["platform", "플랫폼"], ["lugged", "러그드"], ["heeled", "힐"]]) },
  { key: "details", label: "디테일", categories: ["Top"], multiple: true, max: 3, options: options([["graphic_print", "그래픽 프린트"], ["logo_detail", "로고 디테일"], ["contrast_stitching", "배색 스티치"], ["cutout", "컷아웃"], ["drape", "드레이프"], ["pleats", "플리츠"], ["ruffle", "러플"], ["lace", "레이스"], ["ribbon", "리본"], ["embroidery", "자수"], ["patch_pocket", "패치 포켓"]]) },
  { key: "details", label: "디테일", categories: ["Bottom"], multiple: true, max: 3, options: options([["cargo_pocket", "카고 포켓"], ["patch_pocket", "패치 포켓"], ["pleats", "플리츠"], ["contrast_stitching", "배색 스티치"], ["raw_edge", "로 엣지"], ["distressed_detail", "디스트레스드"], ["side_stripe", "사이드 스트라이프"], ["embroidery", "자수"]]) },
  { key: "details", label: "디테일", categories: ["Outer"], multiple: true, max: 3, options: options([["cargo_pocket", "카고 포켓"], ["patch_pocket", "패치 포켓"], ["quilting", "퀼팅"], ["contrast_stitching", "배색 스티치"], ["paneling", "절개 디자인"], ["metal_hardware", "메탈 하드웨어"], ["strap_detail", "스트랩 디테일"], ["embroidery", "자수"]]) },
  { key: "details", label: "디테일", categories: ["DressSkirt"], multiple: true, max: 3, options: options([["pleats", "플리츠"], ["drape", "드레이프"], ["ruffle", "러플"], ["lace", "레이스"], ["ribbon", "리본"], ["cutout", "컷아웃"], ["gathered", "셔링"], ["slit", "슬릿"], ["embroidery", "자수"]]) },
  { key: "details", label: "디테일", categories: ["Shoes"], multiple: true, max: 3, options: options([["strap_detail", "스트랩 디테일"], ["metal_hardware", "메탈 하드웨어"], ["contrast_panel", "배색 패널"], ["platform", "플랫폼"], ["lug_sole", "러그 솔"], ["logo_detail", "로고 디테일"], ["decorative_bow", "리본 장식"], ["fringe", "프린지"]]) },
];

export const fieldsForCategory = (category) => STYLE_ATTRIBUTE_FIELDS.filter((field) => field.categories.includes(category));
export const isCoreTasteCategory = (category) => CORE_TASTE_CATEGORIES.includes(category);
