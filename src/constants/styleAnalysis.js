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
  description: extra.description,
  anchors: extra.anchors,
  caution: extra.caution,
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
  field("formality", "얼마나 차려입은 느낌인가요?", common, [["1", "매우 편한 옷 느낌"], ["2", "편한 옷 느낌"], ["3", "조금 편한 옷 느낌"], ["4", "어느 쪽도 아님"], ["5", "조금 차려입은 느낌"], ["6", "차려입은 느낌"], ["7", "매우 차려입은 느낌"]], { startLabel: "편한 옷 느낌", endLabel: "차려입은 느낌", description: "상품 전체가 편한 옷에 가까운지, 차려입은 옷에 가까운지 고르세요.", anchors: { 1: "휴식·데일리·캐주얼 상황이 가장 자연스럽습니다.", 4: "캐주얼과 포멀 어느 쪽도 지배적이지 않습니다.", 7: "정장·드레스업·공식적인 상황을 강하게 연상시킵니다." }, caution: "카테고리만으로 점수를 정하지 말고 상품 전체 디자인 인상을 봅니다." }),
  field("refinement", "디자인이 얼마나 깔끔하게 다듬어졌나요?", common, [["1", "매우 거친 느낌"], ["2", "거친 느낌"], ["3", "조금 거친 느낌"], ["4", "어느 쪽도 아님"], ["5", "조금 깔끔한 느낌"], ["6", "깔끔한 느낌"], ["7", "매우 깔끔한 느낌"]], { startLabel: "거친 느낌", endLabel: "깔끔하고 정돈된 느낌", description: "전체 디자인이 거칠어 보이는지, 깔끔하게 다듬어진 느낌인지 고르세요.", anchors: { 1: "거침·해체감·불균형이 전체 인상을 지배합니다.", 4: "러프함과 정제됨 어느 쪽도 두드러지지 않습니다.", 7: "매우 polished하고 세련되며 통제된 인상을 줍니다." }, caution: "표면의 매끄러움·워싱 여부나 무지 여부만으로 판단하지 않습니다." }),
  field("technicality", "패션보다 기능이 더 느껴지나요?", common, [["1", "패션 중심"], ["2", "기능 느낌이 약함"], ["3", "조금 기능적"], ["4", "비슷함"], ["5", "조금 기능 중심"], ["6", "기능 중심"], ["7", "매우 기능 중심"]], { startLabel: "패션 중심", endLabel: "기능 중심", description: "예쁘게 보이기보다 기능을 위해 만든 느낌이 강한지 고르세요.", anchors: { 1: "미적 표현이나 일반 착용이 중심입니다.", 4: "패션성과 기능성이 비슷한 비중으로 느껴집니다.", 7: "장비·퍼포먼스 제품에 가까운 기능 중심 설계가 핵심입니다." }, caution: "포켓 수나 나일론 소재 하나만으로 높게 주지 않습니다." }),
  field("historical_orientation", "어느 쪽 시대 느낌에 더 가까운가요?", common, [["1", "매우 요즘 느낌"], ["2", "요즘 느낌"], ["3", "조금 요즘 느낌"], ["4", "특정 시대 느낌 없음"], ["5", "조금 옛날 느낌"], ["6", "옛날·헤리티지 느낌"], ["7", "강한 옛날 느낌"]], { startLabel: "요즘 느낌", endLabel: "옛날·헤리티지 느낌", description: "요즘 디자인처럼 보이는지, 옛날이나 헤리티지 느낌이 나는지 고르세요.", anchors: { 1: "현재적 또는 미래지향적 디자인 언어가 강합니다.", 4: "특정 시대가 명확하게 떠오르지 않습니다.", 7: "특정 역사적 복식이나 시대가 즉각적으로 연상됩니다." }, caution: "낡아 보임·워싱·갈색·가죽 같은 단일 사실값만으로 판단하지 않습니다." }),
  field("visual_boldness", "상품 하나만 봤을 때 얼마나 눈에 띄나요?", common, [["1", "매우 조용한 디자인"], ["2", "조용한 디자인"], ["3", "조금 눈에 띔"], ["4", "보통"], ["5", "눈에 띄는 편"], ["6", "매우 눈에 띔"], ["7", "강하게 눈에 띔"]], { startLabel: "조용한 디자인", endLabel: "눈에 띄는 디자인", description: "상품 하나만 놓았을 때 사람의 시선을 얼마나 끄는지 고르세요.", anchors: { 1: "주변에 자연스럽게 녹아들며 시선을 거의 요구하지 않습니다.", 4: "보통 수준의 시각적 존재감입니다.", 7: "즉각적인 시각적 주목을 요구하는 강한 focal point입니다." }, caution: "화려함과 같은 개념이 아니며 색 하나만으로 결정하지 않습니다." }),
  field("affective_softness", "전체 분위기는 어떤가요?", common, [["1", "매우 강하고 차가움"], ["2", "강하고 차가움"], ["3", "조금 강한 느낌"], ["4", "어느 쪽도 아님"], ["5", "조금 부드러움"], ["6", "부드럽고 포근함"], ["7", "매우 부드럽고 포근함"]], { startLabel: "강하고 차가운 느낌", endLabel: "부드럽고 포근한 느낌", description: "전체 분위기가 강하고 차가운지, 부드럽고 포근한지 고르세요.", anchors: { 1: "긴장감·공격성·차가움·단단함이 강합니다.", 4: "강함과 부드러움 어느 쪽도 두드러지지 않습니다.", 7: "연약함·온화함·로맨틱한 정서가 전체 인상을 지배합니다." }, caution: "소재의 실제 촉감을 평가하지 않으며 니트·가죽만으로 판단하지 않습니다." }),
  field("unconventionality", "같은 종류의 옷과 비교해 얼마나 독특한가요?", common, [["1", "매우 익숙한 디자인"], ["2", "익숙한 디자인"], ["3", "조금 독특함"], ["4", "보통"], ["5", "독특한 편"], ["6", "매우 독특함"], ["7", "아주 실험적인 디자인"]], { startLabel: "익숙한 디자인", endLabel: "독특한 디자인", description: "같은 종류의 일반 상품과 비교해 디자인이 얼마나 독특한지 고르세요.", anchors: { 1: "해당 상품군의 일반적인 형태와 구성을 거의 그대로 따릅니다.", 4: "전형성과 실험성이 비슷한 수준으로 혼합되어 있습니다.", 7: "상품군 자체의 형태나 구조를 새롭게 재해석한 수준입니다." }, caution: "항상 동일 카테고리 안의 일반 제품과 비교합니다." }),
  field("sensuality", "몸선을 얼마나 의식한 디자인인가요?", common, [["1", "몸선 강조가 거의 없음"], ["2", "몸선 강조가 약함"], ["3", "조금 몸선을 의식함"], ["4", "어느 쪽도 아님"], ["5", "몸선이 조금 드러남"], ["6", "몸선을 강조함"], ["7", "몸선 강조가 핵심"]], { startLabel: "몸선 강조가 거의 없음", endLabel: "몸선을 강조한 느낌", description: "몸선을 얼마나 의식하고 강조한 디자인인지 고르세요.", anchors: { 1: "몸을 강조하려는 인상이 거의 없습니다.", 4: "신체 강조와 비강조 어느 쪽도 지배적이지 않습니다.", 7: "신체 강조가 상품의 주요 디자인 언어입니다." }, caution: "짧은 기장·슬림핏·높은 굽 같은 단일 사실값만으로 결정하지 않습니다." }),
];

export const fieldsForCategory = (category) => STYLE_ATTRIBUTE_FIELDS.filter((field) => field.categories.includes(category));
export const isCoreTasteCategory = (category) => CORE_TASTE_CATEGORIES.includes(category);
