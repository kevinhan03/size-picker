alter table public.products drop constraint if exists products_category_sub_category_check;

alter table public.products add constraint products_category_sub_category_check check (
  (category is null and sub_category is null) or
  (category in ('Top','Outer','Bottom','DressSkirt','Shoes','Bag','JewelryWatch','FashionAccessory') and (
    sub_category is null or
    (category = 'Top' and sub_category in ('긴소매 티셔츠','맨투맨·스웨트','셔츠·블라우스','후드 티셔츠','반소매 티셔츠','피케·카라 티셔츠','니트·스웨터','민소매 티셔츠','기타 상의')) or
    (category = 'Outer' and sub_category in ('집업','블루종·MA-1','레더·라이더스 재킷','수트·블레이저 재킷','가디건','코트·트렌치','경량 패딩·패딩 베스트','사파리·헌팅 재킷','트러커 재킷','스타디움 재킷','나일론·코치 재킷','트레이닝 재킷','아노락 재킷','플리스·뽀글이','기타 아우터')) or
    (category = 'Bottom' and sub_category in ('데님 팬츠','트레이닝·조거 팬츠','코튼 팬츠','수트 팬츠·슬랙스','숏 팬츠','레깅스','점프수트·오버올','기타 하의')) or
    (category = 'DressSkirt' and sub_category in ('미니원피스','미디원피스','맥시원피스','미니스커트','미디스커트','롱스커트')) or
    (category = 'Shoes' and sub_category in ('스니커즈','스포츠화','구두','부츠·워커','샌들·슬리퍼','러버슈즈','패딩·퍼 신발')) or
    (category = 'Bag' and sub_category in ('메신저·크로스 백','숄더백','백팩','토트백','에코백','보스턴·더플백','웨이스트 백','파우치 백','브리프 케이스','캐리어','가방 소품','지갑·머니클립','클러치 백')) or
    (category = 'JewelryWatch' and sub_category in ('팔찌','반지','목걸이','귀걸이','시계','기타 주얼리')) or
    (category = 'FashionAccessory' and sub_category in ('모자','벨트','선글라스·안경','스카프·머플러','장갑','헤어 액세서리','향수','기타 소품'))
  ))
);
