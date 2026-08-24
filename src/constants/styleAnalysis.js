export const CORE_TASTE_CATEGORIES = ["Top", "Bottom", "Outer", "DressSkirt", "Shoes"];

export const STYLE_TAG_NAMES = [
  "casual", "minimal", "street", "classic", "vintage", "lovely_romantic",
  "sporty", "workwear_gorpcore", "chic_modern", "glam_sexy",
];

export const COMMON_FACT_FIELD_KEYS = [
  "primary_color", "accent_colors", "color_saturation", "primary_material", "pattern",
  "surface_finish", "surface_character", "surface_treatment",
];

const option = (value, label) => ({ value, label });
const options = (values) => values.map(([value, label]) => option(value, label));
const common = CORE_TASTE_CATEGORIES;
const colors = [["black", "블랙"], ["white", "화이트"], ["gray", "그레이"], ["beige", "베이지"], ["brown", "브라운"], ["navy", "네이비"], ["blue", "블루"], ["green", "그린"], ["red", "레드"], ["pink", "핑크"], ["purple", "퍼플"], ["yellow", "옐로"], ["orange", "오렌지"], ["silver", "실버"], ["gold", "골드"]];
const details = {
  Top: [["graphic_print", "그래픽 프린트"], ["logo_detail", "로고 디테일"], ["contrast_stitching", "배색 스티치"], ["cutout", "컷아웃"], ["drape", "드레이프"], ["pleats", "플리츠"], ["ruffle", "러플"], ["lace", "레이스"], ["ribbon", "리본"], ["embroidery", "자수"], ["patch_pocket", "패치 포켓"]],
  Bottom: [["cargo_pocket", "카고 포켓"], ["patch_pocket", "패치 포켓"], ["pleats", "플리츠"], ["contrast_stitching", "배색 스티치"], ["raw_edge", "로 엣지"], ["distressed_detail", "디스트레스드"], ["side_stripe", "사이드 스트라이프"], ["embroidery", "자수"]],
  Outer: [["cargo_pocket", "카고 포켓"], ["patch_pocket", "패치 포켓"], ["quilting", "퀼팅"], ["contrast_stitching", "배색 스티치"], ["paneling", "절개 디자인"], ["metal_hardware", "메탈 하드웨어"], ["strap_detail", "스트랩 디테일"], ["embroidery", "자수"]],
  DressSkirt: [["pleats", "플리츠"], ["drape", "드레이프"], ["ruffle", "러플"], ["lace", "레이스"], ["ribbon", "리본"], ["cutout", "컷아웃"], ["gathered", "셔링"], ["slit", "슬릿"], ["embroidery", "자수"]],
  Shoes: [["strap_detail", "스트랩 디테일"], ["metal_hardware", "메탈 하드웨어"], ["contrast_panel", "배색 패널"], ["platform", "플랫폼"], ["lug_sole", "러그 솔"], ["logo_detail", "로고 디테일"], ["decorative_bow", "리본 장식"], ["fringe", "프린지"]],
};
const field = (key, label, categories, values, extra = {}) => ({
  key,
  label,
  categories,
  options: options(values),
  multiple: Boolean(extra.multiple),
  max: extra.max ?? 1,
  startLabel: extra.startLabel,
  endLabel: extra.endLabel,
});

export const STYLE_ATTRIBUTE_FIELDS = [
  field("primary_color", "주 색상", common, colors),
  field("accent_colors", "보조 색상", common, colors, { multiple: true, max: 2 }),
  field("color_saturation", "색감 선명도", common, [["muted", "저채도"], ["balanced", "중간 채도"], ["vivid", "고채도"]]),
  field("primary_material", "주 소재", common, [["cotton", "코튼"], ["denim", "데님"], ["knit", "니트"], ["wool", "울"], ["leather", "레더"], ["suede", "스웨이드"], ["linen", "린넨"], ["nylon", "나일론"], ["polyester", "폴리에스터"], ["fleece", "플리스"], ["jersey", "저지"], ["satin", "새틴"], ["velvet", "벨벳"], ["mesh", "메시"], ["canvas", "캔버스"], ["rubber", "러버"], ["metal", "메탈"]]),
  field("pattern", "패턴", common, [["plain", "무지"], ["stripe", "스트라이프"], ["check", "체크"], ["floral", "플로럴"], ["dot", "도트"], ["graphic", "그래픽"], ["logo", "로고"], ["animal", "애니멀"], ["camouflage", "카모플라주"], ["abstract", "추상"]]),
  field("surface_finish", "표면 광택", common, [["matte", "매트"], ["normal", "일반"], ["glossy", "광택"]]),
  field("surface_character", "표면 조직", common, [["smooth", "스무스"], ["textured", "텍스처드"], ["quilted", "퀼팅"], ["brushed", "브러시드"], ["sheer", "시어"]]),
  field("surface_treatment", "표면 가공", common, [["clean", "클린"], ["washed", "워싱"], ["faded", "페이디드"], ["distressed", "디스트레스드"]]),
  field("fit_volume", "핏", ["Top", "Outer"], [["slim", "슬림"], ["regular", "레귤러"], ["relaxed", "릴랙스드"], ["oversized", "오버사이즈"], ["boxy", "박시"]]),
  field("length", "기장", ["Top", "Outer"], [["cropped", "크롭"], ["regular", "기본"], ["long", "롱"]]),
  field("neckline", "넥라인", ["Top", "DressSkirt"], [["crew", "크루넥"], ["v_neck", "V넥"], ["square", "스퀘어넥"], ["scoop", "스쿱넥"], ["boat", "보트넥"], ["halter", "홀터넥"], ["off_shoulder", "오프숄더"], ["turtleneck", "터틀넥"], ["collarless", "칼라 없음"]]),
  field("sleeve_length", "소매 길이", ["Top", "DressSkirt"], [["sleeveless", "민소매"], ["short", "반소매"], ["elbow", "5부 소매"], ["three_quarter", "7부 소매"], ["long", "긴소매"]]),
  field("collar", "칼라", ["Top"], [["none", "칼라 없음"], ["shirt", "셔츠 칼라"], ["polo", "폴로 칼라"], ["stand", "스탠드 칼라"], ["lapel", "라펠"]]),
  field("closure", "여밈", common, [["none", "없음"], ["pullover", "풀오버"], ["button", "버튼"], ["zipper", "지퍼"], ["snap", "스냅"], ["tie", "끈"], ["wrap", "랩"], ["laces", "끈 묶음"], ["buckle", "버클"], ["velcro", "벨크로"], ["strap", "스트랩"]]),
  field("silhouette", "실루엣", ["Bottom"], [["slim", "슬림"], ["straight", "스트레이트"], ["wide", "와이드"], ["tapered", "테이퍼드"], ["bootcut", "부츠컷"], ["flare", "플레어"], ["balloon", "벌룬"]]),
  field("length", "기장", ["Bottom"], [["short", "숏"], ["cropped", "크롭"], ["full_length", "롱"]]),
  field("rise", "밑위", ["Bottom"], [["low", "로우라이즈"], ["mid", "미드라이즈"], ["high", "하이웨이스트"]]),
  field("pocket_type", "포켓", ["Bottom", "Outer"], [["none", "포켓 없음"], ["side", "사이드 포켓"], ["patch", "패치 포켓"], ["cargo", "카고 포켓"]]),
  field("collar_or_hood", "칼라·후드", ["Outer"], [["collarless", "칼라 없음"], ["shirt", "셔츠 칼라"], ["stand", "스탠드 칼라"], ["hood", "후드"], ["lapel", "라펠"], ["funnel", "퍼널넥"]]),
  field("insulation", "충전감", ["Outer"], [["none", "없음"], ["light", "가벼움"], ["padded", "패딩"], ["down", "다운"]]),
  field("item_type", "상품 유형", ["DressSkirt"], [["dress", "원피스"], ["skirt", "스커트"]]),
  field("silhouette", "실루엣", ["DressSkirt"], [["slim", "슬림"], ["straight", "스트레이트"], ["a_line", "A라인"], ["fit_and_flare", "핏앤플레어"], ["slip", "슬립"], ["voluminous", "볼륨감"]]),
  field("length", "기장", ["DressSkirt"], [["mini", "미니"], ["midi", "미디"], ["maxi", "맥시"]]),
  field("waistline", "허리선", ["DressSkirt"], [["low", "로우"], ["natural", "내추럴"], ["high", "하이"], ["empire", "엠파이어"], ["dropped", "드롭 웨이스트"]]),
  field("shoe_type", "신발 유형", ["Shoes"], [["sneaker", "스니커즈"], ["athletic", "스포츠화"], ["dress_shoe", "구두"], ["loafer", "로퍼"], ["boot", "부츠·워커"], ["sandal", "샌들"], ["slipper", "슬리퍼"], ["flat", "플랫"], ["heel", "힐"]]),
  field("profile", "형태 무드", ["Shoes"], [["sleek", "슬림"], ["classic", "클래식"], ["chunky", "청키"]]),
  field("height", "높이감", ["Shoes"], [["low", "로우"], ["mid", "미드"], ["high", "하이"]]),
  field("toe_shape", "토 형태", ["Shoes"], [["round", "라운드 토"], ["pointed", "포인티드 토"], ["square", "스퀘어 토"], ["almond", "아몬드 토"], ["open", "오픈 토"]]),
  field("sole_heel", "밑창·굽", ["Shoes"], [["flat", "플랫"], ["low_profile", "로우 프로필"], ["platform", "플랫폼"], ["lugged", "러그드"], ["heeled", "힐"]]),
  ...Object.entries(details).map(([category, values]) => field("details", "디테일", [category], values, { multiple: true, max: 3 })),
];

export const STYLE_AXIS_FIELDS = [
  field("formality", "차려입은 정도", common, [["1", "편한 옷"], ["2", "캐주얼"], ["3", "단정한 일상복"], ["4", "차려입은 옷"], ["5", "격식 있는 옷"]], { startLabel: "편한 옷", endLabel: "격식 있는 옷" }),
  field("structure", "각 잡힌 정도", common, [["1", "부드럽고 흐르는 옷"], ["2", "부드러운 편"], ["3", "보통"], ["4", "각 잡힌 편"], ["5", "아주 각 잡힌 옷"]], { startLabel: "부드럽고 흐르는 옷", endLabel: "아주 각 잡힌 옷" }),
  field("visual_mass", "두께·볼륨감", common, [["1", "얇고 슬림함"], ["2", "가벼운 편"], ["3", "보통"], ["4", "도톰하고 볼륨 있음"], ["5", "두껍고 청키함"]], { startLabel: "얇고 슬림함", endLabel: "두껍고 청키함" }),
  field("expression_intensity", "꾸밈 정도", common, [["1", "심플·무지"], ["2", "작은 포인트"], ["3", "포인트 조금"], ["4", "꾸밈이 많은 편"], ["5", "그래픽·장식이 많음"]], { startLabel: "심플·무지", endLabel: "그래픽·장식이 많음" }),
  field("functional_technicality", "활동성", common, [["1", "일상 패션용"], ["2", "기능이 조금 있음"], ["3", "일상·기능 반반"], ["4", "기능성 중심"], ["5", "운동·아웃도어용"]], { startLabel: "일상 패션용", endLabel: "운동·아웃도어용" }),
];

export const fieldsForCategory = (category) => STYLE_ATTRIBUTE_FIELDS.filter((field) => field.categories.includes(category));
export const isCoreTasteCategory = (category) => CORE_TASTE_CATEGORIES.includes(category);
