import type { Metadata } from "next";
import {
  LegalDocument,
  LegalNotice,
  LegalSection,
  LegalTable,
  PRIVACY_CONTACT_EMAIL,
} from "../../src/components/legal/LegalDocument";

export const metadata: Metadata = {
  title: "개인정보 처리방침 | DIGBOX",
  description: "DIGBOX가 개인정보와 Google 로그인 데이터를 수집, 이용, 보관, 공유하는 방법을 안내합니다.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <LegalDocument
      title="개인정보 처리방침"
      description="DIGBOX는 이용자의 개인정보를 서비스 제공에 필요한 범위에서 처리합니다. 이 방침은 실제 서비스의 회원가입, 저장·공유, 코디 제안, 취향 분석, 이미지 분석 및 통계 기능을 기준으로 작성되었습니다."
    >
      <LegalNotice>
        <strong className="text-white">핵심 안내:</strong> Google 로그인 정보는 계정 생성과 로그인에만 사용하며 판매하거나 광고
        목적으로 제공하지 않습니다. 이용자가 상품 분석을 요청한 경우에만 해당 이미지와 상품 정보가 Google Gemini API로 전송될
        수 있습니다.
      </LegalNotice>

      <LegalSection id="purpose" title="1. 개인정보의 처리 목적">
        <p>DIGBOX는 다음 목적을 위해 개인정보를 처리합니다.</p>
        <ul className="list-disc space-y-2 pl-5 marker:text-orange-400">
          <li>회원가입, 로그인, 이메일 인증, 계정 보안 및 이용자 식별</li>
          <li>프로필, DIGBOX 저장 목록, Closet, 내 사이즈, 취향 프로필 등 개인화 기능 제공</li>
          <li>상품 등록·검색·공유, 코디 요청과 제안 등 커뮤니티 기능 운영</li>
          <li>상품 이미지와 사이즈표 분석, 상품 정보 추출 등 이용자가 요청한 AI 보조 기능 제공</li>
          <li>오류 대응, 부정 이용 방지, 서비스 품질·성능 분석 및 기능 개선</li>
          <li>문의와 개인정보 관련 요청 처리, 법적 의무 이행 및 분쟁 대응</li>
        </ul>
      </LegalSection>

      <LegalSection id="items" title="2. 처리하는 개인정보의 항목과 수집 방법">
        <LegalTable
          headers={["구분", "처리 항목", "수집 방법·목적"]}
          rows={[
            [
              "이메일 회원가입",
              "이메일 주소, 이용자명, 암호화된 인증정보, 계정 식별자, 가입·인증 시각",
              "회원가입 및 로그인 과정에서 수집합니다. 비밀번호 원문은 DIGBOX가 열람하지 않으며 Supabase Auth가 암호화된 인증정보로 관리합니다.",
            ],
            [
              "Google 로그인",
              "Google 계정 고유 식별자, 이메일 주소, Google이 제공하는 기본 프로필 정보(이름·프로필 이미지 등)",
              "이용자가 Google 로그인을 선택할 때 Google과 Supabase Auth를 통해 수집하며 계정 생성, 로그인, 계정 보안에 사용합니다.",
            ],
            [
              "프로필·커뮤니티",
              "이용자명, 소개글, 코디 요청 내용, 코디 제안 설명, 선택한 상품, 게시·수정 시각",
              "이용자가 직접 입력합니다. 이용자명, 소개글, 코디 요청·제안은 다른 회원에게 공개될 수 있습니다.",
            ],
            [
              "저장·개인화 기능",
              "저장하거나 옷장에 넣은 상품, 선택 사이즈와 사이즈표 스냅샷, 핏 메모, 내 사이즈 정보, 취향 질문 답변과 생성된 취향 프로필",
              "이용자의 기능 사용 과정에서 생성·저장됩니다.",
            ],
            [
              "상품 등록·AI 분석",
              "상품 URL, 브랜드·상품명·카테고리, 상품 이미지, 사이즈표 이미지와 추출 결과",
              "이용자가 상품 등록 또는 이미지 분석을 요청할 때 수집합니다. 저장을 완료한 상품 정보와 이미지는 서비스의 공용 상품 데이터로 노출될 수 있습니다.",
            ],
            [
              "자동 생성 정보",
              "IP 주소, 접속 일시, 페이지·기능 이용 기록, 리퍼러, 브라우저·운영체제·기기 유형, 화면 크기, 대략적 지역, 오류·성능 정보, 쿠키 또는 익명 식별자",
              "서비스 이용 과정에서 보안, 장애 대응, 통계 및 개선 목적으로 자동 생성될 수 있습니다.",
            ],
            [
              "기기 내 임시 정보",
              "비회원 저장 상품 ID, 로그인 후 이동 경로, 온보딩 확인 여부, 일부 선택 설정",
              "브라우저의 로컬 스토리지·세션 스토리지·쿠키에 저장됩니다. 비회원 저장 목록은 마지막 저장일로부터 최대 30일 동안 기기에 보관됩니다.",
            ],
          ]}
        />
        <p>
          DIGBOX는 주민등록번호, 건강정보 등 민감정보나 고유식별정보의 입력을 요구하지 않습니다. 상품 이미지, 소개글, 코디 요청 등
          자유 입력란에 본인 또는 타인의 민감정보를 포함하지 마세요.
        </p>
      </LegalSection>

      <LegalSection id="google-data" title="3. Google 사용자 데이터의 이용">
        <p>
          DIGBOX가 Google 로그인으로 접근하는 정보는 로그인에 필요한 최소 범위인 계정 식별자, 이메일 주소 및 기본 프로필
          정보입니다. 이를 계정 생성·연결, 로그인 상태 유지, 보안 확인 및 고객지원에만 사용합니다.
        </p>
        <ul className="list-disc space-y-2 pl-5 marker:text-orange-400">
          <li>Google 사용자 데이터를 판매하지 않습니다.</li>
          <li>맞춤 광고 또는 광고 프로파일링에 사용하지 않습니다.</li>
          <li>서비스 제공에 필요한 인증 처리업체를 제외하고 제3자에게 제공하지 않습니다.</li>
          <li>회원 탈퇴 또는 삭제 요청 시 서비스 계정과 연결된 Google 로그인 데이터를 삭제합니다.</li>
          <li>Google API Services User Data Policy 및 적용되는 Limited Use 요건을 준수합니다.</li>
        </ul>
        <p>
          Google 계정 자체의 권한 연결은{" "}
          <a
            href="https://myaccount.google.com/connections"
            target="_blank"
            rel="noreferrer"
            className="font-bold text-orange-300 underline decoration-orange-400/40 underline-offset-4"
          >
            Google 계정의 서드 파티 연결
          </a>
          에서 별도로 해제할 수 있습니다. 연결 해제만으로 DIGBOX 계정이 자동 삭제되지는 않으므로, 서비스 데이터까지 삭제하려면
          DIGBOX의 회원 탈퇴 기능을 이용해야 합니다.
        </p>
      </LegalSection>

      <LegalSection id="retention" title="4. 보유·이용 기간">
        <LegalTable
          headers={["정보", "보유 기간"]}
          rows={[
            ["회원 계정·프로필·저장·개인화 정보", "회원 탈퇴 시까지. 탈퇴 요청이 완료되면 운영 데이터에서 삭제하거나 식별할 수 없게 처리합니다."],
            ["코디 요청·제안 등 회원 작성 커뮤니티 정보", "회원이 직접 삭제하거나 회원 탈퇴 시까지. 관계형 데이터는 계정 삭제와 함께 삭제됩니다."],
            ["공용 상품 정보", "서비스 상품 데이터 운영 기간 동안 보관될 수 있습니다. 회원 탈퇴 시 등록자 이용자명 등 계정과의 연결 정보는 제거합니다."],
            ["비회원 DIGBOX 임시 저장 목록", "마지막 저장일로부터 최대 30일 또는 이용자가 브라우저 데이터를 삭제할 때까지 기기에만 보관"],
            ["OAuth 진행용 쿠키", "최대 10분"],
            ["서비스 접속·보안 로그", "수집 목적 달성 시까지. 관계 법령상 보존 의무가 있는 경우 해당 기간까지"],
            ["PostHog 제품 분석 이벤트", "서비스 개선 목적 달성 또는 이용자의 삭제 요청 시까지. 삭제는 공급자의 비동기 처리 절차에 따라 완료됩니다."],
            ["Vercel Web Analytics", "익명·집계 형태로 서비스 플랜의 보고 기간 동안 보관될 수 있으며, 일일 방문자 식별용 해시는 24시간 후 폐기됩니다."],
          ]}
        />
        <p>
          법령에 따라 보존해야 하거나 분쟁·권리침해 대응을 위해 필요한 경우에는 해당 정보만 분리하여 필요한 기간 동안 보관할 수
          있습니다. 현재 DIGBOX는 유료 결제 기능을 제공하지 않으므로 결제정보를 수집하지 않습니다.
        </p>
      </LegalSection>

      <LegalSection id="third-parties" title="5. 제3자 제공">
        <p>
          DIGBOX는 이용자의 개인정보를 판매하지 않으며, 원칙적으로 제3자에게 제공하지 않습니다. 다만 이용자가 공개 기능을 사용한
          경우 공개 범위 내에서 다른 이용자가 내용을 볼 수 있고, 이용자가 별도로 동의한 경우 또는 법령에 근거한 적법한 요청이 있는
          경우에는 필요한 범위에서 제공할 수 있습니다.
        </p>
        <p>아래의 처리위탁과 국외 이전은 서비스 운영을 위한 처리이며, 광고 목적의 제3자 판매가 아닙니다.</p>
      </LegalSection>

      <LegalSection id="processors" title="6. 개인정보 처리업무의 위탁">
        <LegalTable
          headers={["수탁자", "위탁 업무", "처리 정보·위치"]}
          rows={[
            [
              "Supabase, Inc.",
              "회원 인증, 데이터베이스, 파일 저장, 인증 이메일 발송",
              "계정 및 서비스 이용 데이터. DIGBOX 프로젝트의 주 저장 리전은 대한민국 서울(ap-northeast-2)입니다.",
            ],
            [
              "Vercel Inc.",
              "웹 애플리케이션 호스팅, 전송, 보안·장애 로그, Web Analytics 및 Speed Insights",
              "접속·성능·익명 통계 정보. 애플리케이션 실행 리전은 대한민국 서울(icn1)이며 전송·보안 기능은 글로벌 네트워크를 이용할 수 있습니다.",
            ],
            [
              "PostHog, Inc.",
              "페이지 조회와 기능 이용에 대한 제품 분석",
              "익명 또는 가명 식별자, 페이지·이벤트, 브라우저·기기·IP 및 대략적 지역 정보. 미국 클라우드에서 처리됩니다.",
            ],
            [
              "Google LLC",
              "Google 로그인 및 이용자가 요청한 Gemini 기반 상품 이미지·사이즈표 분석",
              "Google 로그인 데이터 또는 분석 요청 이미지·상품 정보. 각 기능을 이용할 때 필요한 정보만 처리됩니다.",
            ],
          ]}
        />
        <p>수탁자가 변경되거나 위탁 업무가 달라지는 경우 이 처리방침을 통해 공개합니다.</p>
      </LegalSection>

      <LegalSection id="overseas" title="7. 개인정보의 국외 이전">
        <p>
          DIGBOX는 서비스 계약의 체결·이행에 필요한 범위에서 아래와 같이 국외 처리위탁을 이용합니다. 이용자는 해당 기능을 이용하지
          않거나 회원 탈퇴를 통해 이전을 거부할 수 있으나, Google 로그인·AI 분석·제품 분석 등 해당 기능의 제공이 제한될 수 있습니다.
        </p>
        <LegalTable
          headers={["이전받는 자·국가", "이전 항목·목적", "시기·방법", "보유 기간"]}
          rows={[
            [
              "PostHog, Inc. / 미국",
              "페이지·기능 이용 이벤트, 기기·브라우저, IP 및 대략적 지역 / 제품 분석과 서비스 개선",
              "사이트 이용 시 암호화된 네트워크로 전송",
              "분석 목적 달성 또는 삭제 요청 시까지",
            ],
            [
              "Google LLC / 미국 등 Google이 운영하는 국가",
              "Google 계정 식별자·이메일·기본 프로필 / Google 로그인",
              "이용자가 Google 로그인을 선택할 때 암호화 전송",
              "회원 탈퇴 또는 연결 해제 시까지. Google 측 처리는 해당 정책에 따름",
            ],
            [
              "Google LLC / 미국 등 Google이 운영하는 국가",
              "이용자가 제출한 상품·사이즈표 이미지와 관련 상품 정보 / Gemini API 분석",
              "이용자가 분석을 요청할 때 암호화 전송",
              "DIGBOX는 분석 응답 후 별도 학습 데이터로 사용하지 않음. Google의 보관·제품 개선 이용 여부는 적용되는 Gemini API 서비스 조건과 프로젝트 설정에 따름",
            ],
            [
              "Vercel Inc. / 미국 및 글로벌 네트워크 거점",
              "접속 로그, 요청 정보, 익명 웹 분석·성능 정보 / 호스팅, 보안, 통계",
              "사이트 접속·이용 시 암호화 전송",
              "서비스 제공과 보안·통계 목적 달성 또는 공급자 계약 종료 시까지",
            ],
          ]}
        />
        <p>
          DIGBOX는 Gemini 입력을 자체 AI 모델 학습에 사용하지 않습니다. 다만 Google의 무료 또는 유료 Gemini API 중 어떤 조건이
          적용되는지에 따라 Google의 데이터 보관·제품 개선 정책이 달라질 수 있으므로, 이미지에는 개인정보나 민감정보를 포함하지
          마세요.
        </p>
      </LegalSection>

      <LegalSection id="cookies" title="8. 쿠키, 로컬 스토리지 및 행태정보">
        <p>
          로그인 상태 유지, OAuth 진행, 비회원 임시 저장, 이용 편의 및 제품 분석을 위해 쿠키와 브라우저 저장소가 사용될 수 있습니다.
          PostHog는 페이지 조회와 클릭·기능 이용 이벤트를 수집하고 익명 또는 가명 식별자를 브라우저에 저장할 수 있습니다. Vercel Web
          Analytics는 제3자 쿠키 없이 일일 해시를 이용한 익명 통계를 제공합니다.
        </p>
        <p>
          이용자는 브라우저 설정에서 쿠키와 사이트 데이터를 삭제·차단할 수 있습니다. 다만 로그인 유지, 임시 저장 등 일부 기능이
          정상적으로 작동하지 않을 수 있습니다. 분석정보 삭제나 수집 관련 요청은 아래 이메일로 접수할 수 있습니다.
        </p>
      </LegalSection>

      <LegalSection id="ai" title="9. AI 기능에 관한 안내">
        <p>
          상품 이미지·사이즈표 분석은 이용자가 직접 요청하는 보조 기능입니다. 입력 이미지와 상품 정보는 분석을 위해 Google Gemini
          API로 전송될 수 있고, 결과에는 오류가 있을 수 있으므로 이용자가 저장 전에 확인해야 합니다. 이 기능은 이용자의 권리·의무에
          중대한 영향을 미치는 자동화된 결정을 하지 않습니다.
        </p>
      </LegalSection>

      <LegalSection id="rights" title="10. 이용자의 권리와 행사 방법">
        <p>
          이용자는 자신의 개인정보에 대해 열람, 정정, 삭제, 처리정지 및 동의 철회를 요청할 수 있습니다. 프로필과 일부 작성 내용은
          서비스 화면에서 직접 수정·삭제할 수 있고, 계정과 연결 데이터를 삭제하려면 마이페이지의 회원 탈퇴를 이용할 수 있습니다.
        </p>
        <p>
          직접 처리가 어렵거나 분석정보까지 포함한 별도 요청이 필요한 경우{" "}
          <a href={`mailto:${PRIVACY_CONTACT_EMAIL}`} className="font-bold text-orange-300 underline underline-offset-4">
            {PRIVACY_CONTACT_EMAIL}
          </a>
          로 문의해 주세요. 본인 확인 후 지체 없이 처리하며, 법령상 제한 사유가 있으면 그 사유를 안내합니다.
        </p>
        <p>
          만 14세 미만 아동을 대상으로 한 서비스가 아닙니다. 만 14세 미만인 경우 법정대리인의 적법한 동의 없이 가입하거나 개인정보를
          제공해서는 안 됩니다. 아동의 정보가 동의 없이 수집된 사실을 알게 되면 위 연락처로 알려주세요.
        </p>
      </LegalSection>

      <LegalSection id="destruction" title="11. 개인정보의 파기">
        <p>
          보유 기간이 끝나거나 처리 목적이 달성되면 해당 정보를 지체 없이 파기합니다. 전자 파일은 복구하기 어려운 방법으로 삭제하고,
          종이 문서는 사용하지 않습니다. 운영 백업에 남은 정보는 정상 서비스에서 분리되며 공급자의 백업 순환 주기에 따라 덮어쓰기
          또는 삭제됩니다.
        </p>
      </LegalSection>

      <LegalSection id="security" title="12. 안전성 확보 조치">
        <p>
          DIGBOX는 접근 권한 제한, 인증과 행 수준 접근통제, 전송구간 암호화(HTTPS), 비밀번호의 인증사업자 위탁 관리, 서버 전용 비밀키
          분리, 로그 점검 등 개인정보 보호에 필요한 기술적·관리적 조치를 적용합니다.
        </p>
      </LegalSection>

      <LegalSection id="contact" title="13. 개인정보 보호책임자 및 구제 방법">
        <p>
          개인정보 보호책임자: DIGBOX 운영자
          <br />
          이메일:{" "}
          <a href={`mailto:${PRIVACY_CONTACT_EMAIL}`} className="font-bold text-orange-300 underline underline-offset-4">
            {PRIVACY_CONTACT_EMAIL}
          </a>
        </p>
        <p>개인정보 침해에 대한 상담이나 구제가 필요한 경우 아래 기관에 문의할 수 있습니다.</p>
        <ul className="list-disc space-y-2 pl-5 marker:text-orange-400">
          <li>
            개인정보침해 신고센터: 국번 없이 118,{" "}
            <a href="https://privacy.kisa.or.kr" target="_blank" rel="noreferrer" className="text-orange-300 underline">
              privacy.kisa.or.kr
            </a>
          </li>
          <li>
            개인정보 분쟁조정위원회: 1833-6972,{" "}
            <a href="https://www.kopico.go.kr" target="_blank" rel="noreferrer" className="text-orange-300 underline">
              kopico.go.kr
            </a>
          </li>
          <li>
            경찰청 사이버범죄 신고시스템: 182,{" "}
            <a href="https://ecrm.police.go.kr" target="_blank" rel="noreferrer" className="text-orange-300 underline">
              ecrm.police.go.kr
            </a>
          </li>
        </ul>
      </LegalSection>

      <LegalSection id="changes" title="14. 처리방침의 변경">
        <p>
          이 처리방침은 2026년 7월 24일부터 적용됩니다. 내용이 변경되면 적용일과 주요 변경사항을 서비스에 공지합니다. 이용자의 권리에
          중대한 영향을 미치는 변경은 적용 전에 알기 쉬운 방법으로 별도 안내합니다.
        </p>
      </LegalSection>
    </LegalDocument>
  );
}
