export const CARDNEWS_PATTERN_DB = {
  "version": "1.0.0",
  "source": "user_uploaded_cardnews_zip_2026_06_22",
  "purpose": "AIMS AI 카드뉴스 제작 페이지에서 보도자료 유형 분류, 카드 흐름 설계, 카피 생성, 디자인 선택에 활용하는 우수사례 패턴 DB",
  "global_rules": {
    "do_not_use_generic_slide_titles": [
      "핵심내용",
      "추진내용",
      "기대효과",
      "무엇을 했나",
      "왜 필요한가",
      "마무리"
    ],
    "headline_rules": [
      "고유명사, 기관명, 사업명, 성과 키워드를 반드시 포함한다",
      "표지 제목은 2줄 구성을 기본으로 한다: 후킹 문장 + 구체 사업명",
      "본문은 카드 1장당 2~4줄 이내로 제한한다",
      "보도자료에 없는 숫자는 창작하지 않고 '보도자료 내 확인 필요'로 표시한다",
      "CTA는 기관의 성과확산 톤으로 작성한다"
    ],
    "preferred_tone": "공공기관 신뢰감 + SNS 후킹 + 대학 홍보물의 정제된 문체",
    "copy_formula": {
      "cover": "독자가 궁금해할 질문/선언 + 실제 사업명·협약명",
      "body": "핵심 사실 1개 + 의미 1개 + 대상별 효과 1개",
      "highlight": "저장하고 싶은 한 문장 또는 핵심 키워드"
    }
  },
  "content_type_templates": [
    {
      "id": "mou_partnership",
      "label": "업무협약·산학협력형",
      "detect_keywords": ["업무협약", "MOU", "협약", "체결", "산학협력", "협회", "기업", "기관"],
      "recommended_card_flow_7": [
        {"role": "cover", "title_pattern": "{기관A} × {기관B}\n{협력분야} 협력 본격화"},
        {"role": "why_now", "title_pattern": "{산업분야} 인재, 왜 지금 필요한가"},
        {"role": "partner_intro", "title_pattern": "{협력기관}은 어떤 기관인가"},
        {"role": "agreement_points", "title_pattern": "이번 협약의 핵심은 {핵심키워드}"},
        {"role": "university_role", "title_pattern": "{대학명}은 무엇을 맡나"},
        {"role": "expected_impact", "title_pattern": "학생·기업·지역이 함께 얻는 변화"},
        {"role": "cta", "title_pattern": "{협력분야} 인재양성, 이제 현장과 함께"}
      ],
      "copy_guidance": [
        "협약 보도자료는 '체결했다'가 아니라 '무엇이 달라지는가'를 중심으로 쓴다",
        "협력기관 소개 카드를 반드시 넣어 신뢰도를 만든다",
        "협약 내용은 3개 이하의 명사형 bullet로 압축한다",
        "대학 역할과 지역산업 기대효과를 분리한다"
      ],
      "example_headlines": ["반도체 인재, 대학 혼자 키울 수 있을까", "인천대와 산업계가 손잡은 이유", "현장형 교육, 협약에서 시작됩니다"],
      "cta_patterns": ["지역과 산업을 연결하는 인재양성은 계속됩니다", "대학과 산업계가 함께 만드는 실무형 인재양성", "인천대 RISE가 현장형 교육의 연결고리가 되겠습니다"]
    },
    {
      "id": "policy_news_digest",
      "label": "정책·뉴스 요약형",
      "detect_keywords": ["뉴스", "주간", "정책", "고시", "가이드라인", "지정", "제도"],
      "recommended_card_flow_5": ["표지", "목차", "이슈1", "이슈2", "이슈3"],
      "copy_guidance": ["첫 장은 큰 키워드 중심으로 뉴스레터처럼 구성", "2장은 목차형으로 정보 기대감을 만든다", "세부 카드는 번호, 정책명, 한 줄 요약, 핵심 포인트 박스로 구성"],
      "design_pattern": "정부기관형 네이비/화이트, 상단 노트 바인더, 정보 박스, 번호 인덱스"
    },
    {
      "id": "public_case_award",
      "label": "우수사례·성과선정형",
      "detect_keywords": ["우수사례", "선정", "수상", "성과", "Best", "혁신", "적극행정"],
      "recommended_card_flow_4": ["표지", "사례1", "사례2", "사례3"],
      "copy_guidance": ["사례별 카드는 '문제 → 해결 → 효과'를 한 화면에 압축", "순위/메달/번호를 사용해 시선 흐름을 만든다", "성과명은 굵게, 설명은 2줄 이하로 제한"],
      "design_pattern": "옐로우 표지 + 화이트 사례 카드 + 메달 배지 + 하단 기관 바"
    },
    {
      "id": "institutional_report_news",
      "label": "기관 리포트·소식지형",
      "detect_keywords": ["리포트", "News", "소식", "혁신과", "안내", "대학원"],
      "recommended_card_flow_8": ["표지", "목차", "브랜드/로고", "이슈1", "행사", "공간/인프라", "시스템", "감사/마무리"],
      "copy_guidance": ["표지는 기관명과 뉴스 성격을 크게 표시", "2장은 주요 이슈 목록으로 신뢰감 형성", "사진 기반 카드는 캡션과 요약 정보를 함께 배치", "마지막 장은 감사/문의/기관 메시지로 정리"],
      "design_pattern": "기관 브랜드 컬러, 프레임형 타이틀, 사진+텍스트 카드 혼합"
    },
    {
      "id": "mascot_benefit_reminder",
      "label": "학생혜택·참여유도형",
      "detect_keywords": ["포인트", "마일리지", "신청", "자격증", "봉사", "비교과", "참여"],
      "recommended_card_flow_5": ["문제상황", "사례반복1", "사례반복2", "사례반복3", "신청 CTA"],
      "copy_guidance": ["'했는데... 안 받았다고?' 구조의 반복 후킹 사용", "학생 입장에서 억울한 상황을 먼저 제시", "마지막 장은 행동 명령형 CTA와 QR/링크 영역을 크게 배치"],
      "design_pattern": "강한 방사형 배경, 캐릭터 중심, 노란색/흰색 굵은 자막, CTA 대형화"
    },
    {
      "id": "before_after_policy",
      "label": "제도개선·Before/After형",
      "detect_keywords": ["개선", "완화", "지원", "제도", "규제", "전후", "Before", "After"],
      "recommended_card_flow_6": ["표지", "문제상황", "개선내용", "변화결과", "수치효과", "확산/마무리"],
      "copy_guidance": ["각 카드에 Before와 After를 분리해 정책 효과를 직관화", "회색 말풍선은 문제, 파란 박스는 개선 후 결과로 사용", "수치 변화가 있으면 하단 박스에 크게 표기"],
      "design_pattern": "일러스트 + Before/After 말풍선 + 정책효과 박스"
    },
    {
      "id": "minimal_text_guide",
      "label": "텍스트 중심 가이드형",
      "detect_keywords": ["가이드", "방법", "안내", "팁", "구성", "레이아웃"],
      "recommended_card_flow_4": ["표지", "핵심개념", "상세설명", "CTA"],
      "copy_guidance": ["복잡한 주제를 차분한 문장으로 설명", "강조 문장은 박스 안에 1문장만 넣는다", "배경은 거의 비우고 제목과 여백으로 시선을 만든다"],
      "design_pattern": "오프화이트 배경, 큰 검정 타이틀, 넓은 여백, 작은 CTA"
    },
    {
      "id": "tabbed_layout_guide",
      "label": "탭·문서형 정보정리",
      "detect_keywords": ["목차", "챕터", "구성", "정보형", "리스트", "그래프"],
      "recommended_card_flow_6": ["표지", "챕터1", "이미지강조", "리스트", "카드형정보", "그래프"],
      "copy_guidance": ["목차와 탭 UI로 학습형 콘텐츠처럼 구성", "카드마다 chapter label을 유지", "리스트는 4개 이하, 그래프는 단순 막대형으로 제한"],
      "design_pattern": "문서 탭 UI, 블루 외곽 배경, 흰색 카드, 얇은 라인"
    },
    {
      "id": "photo_editorial",
      "label": "사진 중심 에디토리얼형",
      "detect_keywords": ["현장", "행사", "스케치", "사진", "인터뷰", "참여자"],
      "recommended_card_flow_5": ["표지", "대표사진", "콜라주", "풀이미지", "마무리"],
      "copy_guidance": ["사진이 주인공이고 텍스트는 짧게", "어두운 오버레이 위에 큰 제목을 올린다", "현장감, 분위기, 참여자 메시지를 강조"],
      "design_pattern": "사진 풀블리드, 콜라주, 딥톤 오버레이, 굵은 흰색 제목"
    },
    {
      "id": "quote_interview",
      "label": "인터뷰·인용강조형",
      "detect_keywords": ["소감", "인터뷰", "참여자", "멘토", "학생", "교수", "기업"],
      "recommended_card_flow_6": ["표지", "인물소개", "핵심발언", "경험", "성과", "마무리"],
      "copy_guidance": ["인물 사진과 짧은 인용문을 중심으로 구성", "인용문은 1~2줄로 강하게", "직함/소속은 작게, 메시지는 크게"],
      "design_pattern": "원형 프로필, 따옴표, 인터뷰 캡션, 부드러운 배경"
    }
  ],
  "best_practice_records": [
    {"id":"bp_001","folder":"0717_주간 금융 NEWS, 7월 3주차","type":"policy_news_digest","cards":5,"main_pattern":"표지→목차→정책이슈 3개","copy_pattern":"주간/월간 뉴스형. 번호·정책명·요약 박스 중심","design_keywords":["네이비","화이트","정부기관","정보박스","번호인덱스"]},
    {"id":"bp_002","folder":"KT&G 카드뉴스","type":"institutional_global_story","cards":10,"main_pattern":"표지→문제의식→기관활동→사진증거→지원성과→CTA","copy_pattern":"스토리텔링형. 글로벌 인재육성 필요성을 말하고 연혁·사례 사진으로 신뢰 확보","design_keywords":["파스텔블루","일러스트","사진프레임","친근한 교육톤"]},
    {"id":"bp_003","folder":"flat-design-e-learning-template","type":"education_program_template","cards":1,"main_pattern":"교육 랜딩형 표지/모듈 안내","copy_pattern":"강의 시작일, 모듈, CTA를 한 화면에 요약","design_keywords":["보라","e-learning","모듈 카드","랜딩페이지"]},
    {"id":"bp_004","folder":"yom-kippur-instagram-post","type":"seasonal_message_template","cards":1,"main_pattern":"기념일 메시지형","copy_pattern":"간결한 인사말과 상징 일러스트 중심","design_keywords":["아이보리","블루라인","기념일","심볼"]},
    {"id":"bp_005","folder":"기획재정부","type":"public_case_award","cards":4,"main_pattern":"표지→우수사례 1→우수사례 2→우수사례 3","copy_pattern":"기관 우수사례 제목을 크게, 성과 설명을 2줄로 압축","design_keywords":["옐로우","메달","정부기관","사례카드"]},
    {"id":"bp_006","folder":"대학원 혁신과 안내","type":"institutional_report_news","cards":8,"main_pattern":"표지→목차→브랜드→이슈→행사→공간→AI챗봇→감사","copy_pattern":"기관 소식지형. 목차와 사진 기반 설명 혼합","design_keywords":["INU","네이비","골드프레임","사진","기관리포트"]},
    {"id":"bp_007","folder":"자율비교과안내","type":"mascot_benefit_reminder","cards":5,"main_pattern":"후킹 질문 반복→신청 CTA","copy_pattern":"학생이 놓친 혜택을 '했는데... 안 받았다고?'로 반복 후킹","design_keywords":["방사형배경","마스코트","굵은자막","QR"]},
    {"id":"bp_008","folder":"중소벤처기업부","type":"before_after_policy","cards":13,"main_pattern":"정책사례별 Before/After 반복","copy_pattern":"문제상황과 개선결과를 한 화면에 대비해 정책효과 강조","design_keywords":["일러스트","BeforeAfter","정책효과","파랑박스"]},
    {"id":"bp_009","folder":"캔바 샘플 10","type":"minimal_information_guide","cards":4,"main_pattern":"표지→사진레이아웃→긴글표현→키워드리스트","copy_pattern":"가이드형 콘텐츠를 차분한 제목과 설명문으로 구성","design_keywords":["흑백","미니멀","정보전달","가이드"]},
    {"id":"bp_010","folder":"캔바 샘플 4","type":"minimal_text_guide","cards":3,"main_pattern":"표지→설명→팔로우 CTA","copy_pattern":"텍스트만으로 분위기를 만드는 캐러셀. 강조 박스 1개 사용","design_keywords":["오프화이트","차분함","넓은여백","짧은CTA"]},
    {"id":"bp_011","folder":"캔바 샘플 5","type":"tabbed_layout_guide","cards":4,"main_pattern":"표지→이단구성→이미지+텍스트→숫자리스트","copy_pattern":"심플한 카드뉴스 레이아웃을 탭 문서처럼 설명","design_keywords":["베이지","탭","문서형","노랑강조"]},
    {"id":"bp_012","folder":"캔바 샘플 6","type":"photo_editorial","cards":5,"main_pattern":"표지→단일이미지→콜라주→리스트→풀이미지","copy_pattern":"사진 활용법을 사진 배치 자체로 설명","design_keywords":["사진중심","민트포인트","콜라주","풀블리드"]},
    {"id":"bp_013","folder":"캔바 샘플 7","type":"info_template","cards":6,"main_pattern":"표지→텍스트중심→이미지강조→리스트→카드형정보→그래프","copy_pattern":"정보형 템플릿. 정책·성과·통계 자료에 적합","design_keywords":["블루","화이트카드","리스트","그래프"]},
    {"id":"bp_014","folder":"캔바 샘플 8","type":"green_tabbed_guide","cards":6,"main_pattern":"표지→목차→단일이미지→강조문→BeforeAfter→인용","copy_pattern":"교육/가이드형. 챕터 구조와 인용문으로 신뢰 형성","design_keywords":["연두","블랙헤더","목차","인용"]},
    {"id":"bp_015","folder":"캔바 샘플 9","type":"photo_lifestyle_template","cards":4,"main_pattern":"표지→대표사진→콜라주→풀이미지","copy_pattern":"사진 하나로 시선을 끌고, 콜라주로 맥락을 보강","design_keywords":["라이프스타일","연민트","사진","세련됨"]},
    {"id":"bp_016","folder":"캔바 샘플1","type":"simple_maker_guide","cards":4,"main_pattern":"표지→이유→3요소→CTA","copy_pattern":"짧은 질문형 제목과 3요소 리스트로 학습 내용 정리","design_keywords":["청록","화이트박스","굵은타이틀","3요소"]},
    {"id":"bp_017","folder":"캔바 샘플2","type":"photo_dark_editorial","cards":4,"main_pattern":"사진표지→단일사진→콜라주→풀사진","copy_pattern":"어두운 사진 위 큰 제목, 해시태그형 키워드 사용","design_keywords":["브라운","다크오버레이","사진","큰타이틀"]},
    {"id":"bp_018","folder":"캔바 샘플3","type":"dark_premium_guide","cards":6,"main_pattern":"표지→팁1→리스트형→사진설명→비교형→CTA","copy_pattern":"세련된 다크톤. Tip 번호와 강조색으로 고급 정보성 콘텐츠 구성","design_keywords":["다크","오렌지포인트","Tip","비교카드"]}
  ],
  "aims_generation_policy": {
    "classification_order": ["mou_partnership", "public_case_award", "institutional_report_news", "before_after_policy", "mascot_benefit_reminder", "photo_editorial", "minimal_text_guide"],
    "mou_default_flow": ["표지", "협약 배경", "협력기관 소개", "협약 핵심내용", "인천대 역할", "기대효과", "CTA"],
    "event_default_flow": ["표지", "행사 목적", "운영내용", "현장 스케치", "참여자/기관", "성과", "CTA"],
    "performance_default_flow": ["표지", "사업소개", "핵심성과", "수치성과", "대표사례", "확산효과", "CTA"],
    "copy_quality_checklist": ["카드 제목에 실제 고유명사가 포함되었는가", "표지에 사업/기관/성과가 보이는가", "본문이 2~4줄 안에 들어오는가", "범용 제목만 사용하지 않았는가", "보도자료에 없는 수치를 만들지 않았는가", "마지막 장에 명확한 CTA가 있는가"]
  }
};

export function getCardnewsPatternSummary() {
  return CARDNEWS_PATTERN_DB.content_type_templates.map((template) => {
    const flow = template.recommended_card_flow_7 || template.recommended_card_flow_6 || template.recommended_card_flow_5 || template.recommended_card_flow_4 || template.recommended_card_flow_8 || [];
    return `${template.label}: ${Array.isArray(flow) ? flow.map((item) => item.title_pattern || item).join(' → ') : flow}`;
  }).join('\n');
}
