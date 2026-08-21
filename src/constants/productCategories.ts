export const PRODUCT_CATEGORIES = [
  { code: "Top", label: "상의", subcategories: ["긴소매 티셔츠", "맨투맨·스웨트", "셔츠·블라우스", "후드 티셔츠", "반소매 티셔츠", "피케·카라 티셔츠", "니트·스웨터", "민소매 티셔츠", "기타 상의"] },
  { code: "Outer", label: "아우터", subcategories: ["후드 집업", "블루종·MA-1", "레더·라이더스 재킷", "수트·블레이저 재킷", "가디건", "코트·트렌치", "경량 패딩·패딩 베스트", "사파리·헌팅 재킷", "트러커 재킷", "스타디움 재킷", "나일론·코치 재킷", "트레이닝 재킷", "아노락 재킷", "플리스·뽀글이", "기타 아우터"] },
  { code: "Bottom", label: "하의", subcategories: ["데님 팬츠", "트레이닝·조거 팬츠", "코튼 팬츠", "수트 팬츠·슬랙스", "숏 팬츠", "레깅스", "점프수트·오버올", "기타 하의"] },
  { code: "DressSkirt", label: "원피스/스커트", subcategories: ["미니원피스", "미디원피스", "맥시원피스", "미니스커트", "미디스커트", "롱스커트"] },
  { code: "Shoes", label: "신발", subcategories: ["스니커즈", "스포츠화", "구두", "부츠·워커", "샌들·슬리퍼", "패딩·퍼 신발"] },
  { code: "Bag", label: "가방", subcategories: ["메신저·크로스 백", "숄더백", "백팩", "토트백", "에코백", "보스턴·더플백", "웨이스트 백", "파우치 백", "브리프 케이스", "캐리어", "가방 소품", "지갑·머니클립", "클러치 백"] },
  { code: "JewelryWatch", label: "주얼리/시계", subcategories: ["팔찌", "반지", "목걸이", "귀걸이", "시계", "기타 주얼리"] },
  { code: "FashionAccessory", label: "패션잡화", subcategories: ["모자", "벨트", "선글라스·안경", "스카프·머플러", "장갑", "헤어 액세서리", "향수", "기타 소품"] },
] as const;

export type ProductCategoryCode = (typeof PRODUCT_CATEGORIES)[number]["code"];
export type ProductSubcategory = (typeof PRODUCT_CATEGORIES)[number]["subcategories"][number];
export const CATEGORY_OPTIONS = PRODUCT_CATEGORIES.map((category) => category.code) as ProductCategoryCode[];
export const ACCESSORY_CATEGORY_OPTIONS = ["Bag", "JewelryWatch", "FashionAccessory"] as const;
export const CATEGORY_LABELS = Object.fromEntries(PRODUCT_CATEGORIES.map((category) => [category.code, category.label])) as Record<ProductCategoryCode, string>;
export const CATEGORY_OPTION_BY_LOWER: Record<string, ProductCategoryCode> = {
  outer: "Outer", top: "Top", bottom: "Bottom", shoes: "Shoes", acc: "FashionAccessory", bag: "Bag",
  jewelrywatch: "JewelryWatch", jewelry: "JewelryWatch", fashionaccessory: "FashionAccessory",
  dressskirt: "DressSkirt", dress: "DressSkirt", skirt: "DressSkirt",
};

export const isProductCategory = (value: unknown): value is ProductCategoryCode =>
  CATEGORY_OPTIONS.includes(String(value) as ProductCategoryCode);
export const isAccessoryCategory = (value: unknown): boolean =>
  String(value) === "Acc" || ACCESSORY_CATEGORY_OPTIONS.includes(String(value) as (typeof ACCESSORY_CATEGORY_OPTIONS)[number]);
export const getSubcategories = (category: string): readonly string[] =>
  PRODUCT_CATEGORIES.find((item) => item.code === category)?.subcategories ?? [];
export const isValidSubcategory = (category: string, subcategory: unknown): boolean =>
  typeof subcategory === "string" && getSubcategories(category).includes(subcategory);
export const getCategoryLabel = (category: string) => CATEGORY_LABELS[category as ProductCategoryCode] ?? category;

const rules: Array<[ProductCategoryCode, string, RegExp]> = [
  ["Bag", "백팩", /백팩|backpack/i], ["Bag", "토트백", /토트.?백|tote/i], ["Bag", "숄더백", /숄더.?백|shoulder/i], ["Bag", "메신저·크로스 백", /크로스.?백|메신저|cross.?body|messenger/i], ["Bag", "에코백", /에코.?백|eco.?bag/i], ["Bag", "보스턴·더플백", /보스턴|더플|duffel/i], ["Bag", "웨이스트 백", /웨이스트|힙색|벨트.?백/i], ["Bag", "파우치 백", /파우치|pouch/i], ["Bag", "브리프 케이스", /브리프.?케이스|briefcase/i], ["Bag", "캐리어", /캐리어|suitcase/i], ["Bag", "지갑·머니클립", /지갑|머니.?클립|wallet/i], ["Bag", "클러치 백", /클러치|clutch/i],
  ["JewelryWatch", "시계", /시계|watch/i], ["JewelryWatch", "팔찌", /팔찌|bracelet/i], ["JewelryWatch", "반지", /반지|ring/i], ["JewelryWatch", "목걸이", /목걸이|necklace/i], ["JewelryWatch", "귀걸이", /귀걸이|earring/i],
  ["FashionAccessory", "모자", /모자|캡|비니|hat|cap|beanie/i], ["FashionAccessory", "벨트", /벨트|belt/i], ["FashionAccessory", "선글라스·안경", /선글라스|안경|glasses/i], ["FashionAccessory", "스카프·머플러", /스카프|머플러|scarf|muffler/i], ["FashionAccessory", "장갑", /장갑|glove/i], ["FashionAccessory", "향수", /향수|perfume/i],
  ["Shoes", "스니커즈", /스니커즈|sneaker/i], ["Shoes", "스포츠화", /러닝|운동화|running|sport/i], ["Shoes", "구두", /구두|로퍼|힐|loafer|heel/i], ["Shoes", "부츠·워커", /부츠|워커|boot/i], ["Shoes", "샌들·슬리퍼", /샌들|슬리퍼|sandal|slipper/i],
  ["Top", "후드 티셔츠", /후드/i], ["Top", "맨투맨·스웨트", /맨투맨|스웨트|sweatshirt/i], ["Top", "셔츠·블라우스", /셔츠|블라우스|shirt|blouse/i], ["Top", "피케·카라 티셔츠", /피케|카라|pique|polo/i], ["Top", "니트·스웨터", /니트|스웨터|knit|sweater/i], ["Top", "민소매 티셔츠", /민소매|슬리브리스|나시/i], ["Top", "반소매 티셔츠", /반소매|반팔|short sleeve/i], ["Top", "긴소매 티셔츠", /긴소매|긴팔|long sleeve/i],
  ["Outer", "코트·트렌치", /코트|트렌치|coat|trench/i], ["Outer", "가디건", /가디건|cardigan/i], ["Outer", "후드 집업", /후드.?집업/i], ["Outer", "레더·라이더스 재킷", /레더|라이더|leather/i], ["Outer", "수트·블레이저 재킷", /블레이저|수트|blazer/i], ["Outer", "경량 패딩·패딩 베스트", /패딩|다운|베스트/i], ["Outer", "플리스·뽀글이", /플리스|뽀글|fleece/i], ["Outer", "트러커 재킷", /트러커/i], ["Outer", "스타디움 재킷", /스타디움|바시티/i], ["Outer", "나일론·코치 재킷", /나일론|코치.?재킷/i], ["Outer", "트레이닝 재킷", /트레이닝.?재킷/i], ["Outer", "아노락 재킷", /아노락/i], ["Outer", "블루종·MA-1", /블루종|ma-?1/i],
  ["Bottom", "데님 팬츠", /데님|청바지|jeans/i], ["Bottom", "트레이닝·조거 팬츠", /트레이닝|조거|jogger/i], ["Bottom", "수트 팬츠·슬랙스", /슬랙스|수트.?팬츠/i], ["Bottom", "숏 팬츠", /숏.?팬츠|반바지|쇼츠|shorts/i], ["Bottom", "레깅스", /레깅스|legging/i], ["Bottom", "점프수트·오버올", /점프수트|오버올|overalls/i], ["Bottom", "코튼 팬츠", /코튼|치노|면바지/i],
  ["DressSkirt", "미니원피스", /미니.?원피스/i], ["DressSkirt", "미디원피스", /미디.?원피스/i], ["DressSkirt", "맥시원피스", /맥시.?원피스|롱.?원피스/i], ["DressSkirt", "미니스커트", /미니.?스커트/i], ["DressSkirt", "미디스커트", /미디.?스커트/i], ["DressSkirt", "롱스커트", /롱.?스커트|맥시.?스커트/i],
];
export const suggestProductCategory = (text: string, preferredCategory = "") => {
  const found = rules.find(([category, , pattern]) => (!preferredCategory || category === preferredCategory) && pattern.test(text));
  return found ? { category: found[0], subCategory: found[1] } : isProductCategory(preferredCategory) ? { category: preferredCategory, subCategory: "" } : { category: "" as const, subCategory: "" };
};
