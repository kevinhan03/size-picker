# UI consistency backlog

## 저장·담기 용어 통일

상태: 완료.

- 저장 버튼은 로그인 상태와 관계없이 `저장`으로 표시한다. 저장된 상태는 `저장됨`으로 표시한다.
- 비회원 상품은 임시로 저장된다는 설명을 별도 안내에 표시한다.
- 상품 등록 흐름에서 같은 컬렉션을 `저장 목록`으로 부른다. 저장 행동의 성공·실패 메시지도 같은 용어를 쓴다.
- 한국어와 영어의 버튼, 접근성 레이블, 안내 문구를 함께 정리했다.

관련 코드: `src/i18n/messages.ts`의 `product.guestSave`와 `product.save`, `src/components/ProductDetailModal.tsx`의 저장 버튼.
