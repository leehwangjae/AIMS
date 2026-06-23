export const AIMS_CARDNEWS_STORY_DB = {
  version: '2.0.0',
  name: 'AIMS CardNews Story Engine DB',
  purpose: 'RISE/ANCHOR 사업 홍보와 정보전달 목적의 보도자료를 카드뉴스 스토리로 압축 재구성하기 위한 전용 DB',
  target_audiences: {
    students: {
      label: '학생',
      core_question: '나에게 어떤 기회와 혜택이 있는가?',
      copy_focus: ['참여 혜택', '실무 경험', '취업·진로 연결', '신청 방법', '마감 일정']
    },
    public: {
      label: '일반인',
      core_question: '이 소식이 지역과 사회에 어떤 의미가 있는가?',
      copy_focus: ['지역 변화', '정책 의미', '대학 역할', '성과 확산', '공공성']
    },
    companies: {
      label: '기업',
      core_question: '기업 입장에서 어떤 협력 기회와 효과가 있는가?',
      copy_focus: ['인재 확보', '산학협력', '기술·교육 연계', '기업 수요 반영', '지역 산업 경쟁력']
    }
  },
  content_purposes: {
    promotion: {
      label: '사업 홍보',
      default_tone: '성과를 알리되 과장하지 않고, 사업의 필요성과 의미를 명확히 전달',
      preferred_cards: ['표지', '배경', '주요내용', '참여기관', '성과/효과', '향후계획', 'CTA']
    },
    information: {
      label: '정보 전달',
      default_tone: '정보를 쉽게 이해하고 저장할 수 있도록 구체적이고 명확하게 안내',
      preferred_cards: ['표지', '핵심요약', '왜 중요한가', '주요정보', '참여/활용방법', '유의사항', 'CTA']
    }
  },
  story_types: [
    {
      id: 'mou_partnership',
      label: 'MOU/협약 체결형',
      purpose: 'promotion',
      detect_keywords: ['MOU', '업무협약', '협약', '체결', '산학협력', '협력', '협회', '기업', '기관', '파트너십'],
      audience_priority: ['companies', 'students', 'public'],
      story_intent: '협약 체결 사실을 알리는 데서 끝내지 않고, 왜 협력하는지와 학생·기업·지역에 생기는 변화를 보여준다.',
      seven_card_flow: [
        { role: 'cover', title: '누가 누구와 손잡았는가', reader_question: '이번 협약의 핵심은 무엇인가?', headline_rule: '{기관A}와 {기관B}가 손잡은 이유' },
        { role: 'background', title: '왜 협약했는가', reader_question: '지금 이 협력이 왜 필요한가?', headline_rule: '{산업분야} 인재, 왜 지금 필요한가' },
        { role: 'partner', title: '협력기관은 어떤 곳인가', reader_question: '협력기관의 전문성은 무엇인가?', headline_rule: '{협력기관}, 어떤 역할을 하나' },
        { role: 'agreement', title: '무엇을 함께 추진하는가', reader_question: '협약의 핵심 내용은 무엇인가?', headline_rule: '이번 협약의 핵심은 {핵심협력내용}' },
        { role: 'student_value', title: '학생에게 생기는 변화', reader_question: '학생은 무엇을 얻는가?', headline_rule: '학생에게 열리는 {기회/경험}' },
        { role: 'industry_value', title: '기업·지역 기대효과', reader_question: '기업과 지역에는 어떤 효과가 있는가?', headline_rule: '{산업분야} 생태계가 얻는 변화' },
        { role: 'future', title: '향후 계획과 CTA', reader_question: '앞으로 무엇을 이어갈 것인가?', headline_rule: '{대학명} RISE, 현장과 함께 갑니다' }
      ],
      copy_rules: [
        '표지는 협약명보다 변화의 의미를 먼저 보여준다.',
        '협력기관 소개 카드를 반드시 포함한다.',
        '협약 내용은 3개 이하의 핵심 항목으로 압축한다.',
        '학생 가치와 기업/지역 가치를 분리한다.',
        '확인되지 않은 수치·일정·예산은 만들지 않는다.'
      ]
    },
    {
      id: 'program_recruitment',
      label: '프로그램 참여 모집형',
      purpose: 'information',
      detect_keywords: ['모집', '신청', '참가자', '참여자', '교육생', '프로그램', '부트캠프', '캠프', '과정', '접수', '마감'],
      audience_priority: ['students', 'companies', 'public'],
      story_intent: '프로그램의 존재를 알리는 것이 아니라, 왜 참여해야 하는지와 신청 행동을 유도한다.',
      seven_card_flow: [
        { role: 'cover', title: '참여해야 하는 이유', reader_question: '이 프로그램이 나에게 왜 필요한가?', headline_rule: '{대상}을 위한 {프로그램명}' },
        { role: 'painpoint', title: '참여 전 문제의식', reader_question: '어떤 고민을 해결해 주는가?', headline_rule: '{진로/역량} 고민, 이렇게 해결합니다' },
        { role: 'program_intro', title: '프로그램 소개', reader_question: '무엇을 배우고 경험하는가?', headline_rule: '{프로그램명}, 무엇을 하나' },
        { role: 'benefit', title: '주요 혜택', reader_question: '참여하면 무엇을 얻는가?', headline_rule: '참여자에게 주어지는 {혜택수}가지 혜택' },
        { role: 'schedule', title: '일정과 운영 방식', reader_question: '언제, 어디서, 어떻게 진행되는가?', headline_rule: '일정부터 운영 방식까지 한눈에' },
        { role: 'application', title: '신청 방법', reader_question: '어떻게 신청하는가?', headline_rule: '신청은 이렇게 하면 됩니다' },
        { role: 'cta', title: '마감/CTA', reader_question: '지금 무엇을 해야 하는가?', headline_rule: '놓치기 전에 신청하세요' }
      ],
      copy_rules: [
        '학생 대상이면 혜택과 신청방법을 전면에 둔다.',
        '모집형은 CTA를 명령형으로 명확하게 작성한다.',
        '일정·장소·신청링크·마감일은 확인된 정보만 사용한다.',
        '본문은 짧고 실용적으로 작성한다.'
      ]
    },
    {
      id: 'event_pre_notice',
      label: '행사 개최 안내형',
      purpose: 'promotion',
      detect_keywords: ['개최', '열린다', '포럼', '세미나', '설명회', '컨퍼런스', '워크숍', '간담회', '행사', '예정'],
      audience_priority: ['students', 'companies', 'public'],
      story_intent: '행사 일정 안내를 넘어, 왜 참석해야 하는 행사인지 설득한다.',
      seven_card_flow: [
        { role: 'cover', title: '행사 핵심 주제', reader_question: '어떤 행사인가?', headline_rule: '{행사명}, {핵심주제}를 말하다' },
        { role: 'why_attend', title: '왜 참석해야 하는가', reader_question: '이 행사가 왜 중요한가?', headline_rule: '지금 {주제}를 봐야 하는 이유' },
        { role: 'overview', title: '행사 개요', reader_question: '언제 어디서 열리는가?', headline_rule: '일정과 장소를 한눈에' },
        { role: 'program', title: '주요 프로그램', reader_question: '무엇이 진행되는가?', headline_rule: '핵심 프로그램은 {핵심프로그램}' },
        { role: 'speakers', title: '참여기관/연사', reader_question: '누가 함께하는가?', headline_rule: '{참여기관/연사}가 함께합니다' },
        { role: 'benefit', title: '참가 혜택/기대효과', reader_question: '참석자는 무엇을 얻는가?', headline_rule: '참석자가 얻는 실질적 인사이트' },
        { role: 'application', title: '참여 안내', reader_question: '어떻게 참여하는가?', headline_rule: '참여 방법을 확인하세요' }
      ],
      copy_rules: [
        '사전 안내형은 일정·장소·대상·신청방법을 빠뜨리지 않는다.',
        '행사명보다 참여 이유를 먼저 설명한다.',
        '연사나 참여기관이 중요하면 별도 카드로 분리한다.'
      ]
    },
    {
      id: 'event_result',
      label: '행사 성과 공유형',
      purpose: 'promotion',
      detect_keywords: ['성료', '개최했다', '마쳤다', '운영 결과', '성과 공유', '참여', '수료', '만족도', '성과', '현장'],
      audience_priority: ['public', 'students', 'companies'],
      story_intent: '행사 개최 사실보다 무엇을 남겼고 어떤 성과가 있었는지를 보여준다.',
      seven_card_flow: [
        { role: 'cover', title: '행사 성과 한 줄 요약', reader_question: '무엇이 성과였는가?', headline_rule: '{행사명}, {성과키워드}를 남기다' },
        { role: 'overview', title: '행사 개요', reader_question: '어떤 행사였는가?', headline_rule: '{행사명}은 어떤 자리였나' },
        { role: 'participation', title: '참여 규모', reader_question: '누가 얼마나 참여했는가?', headline_rule: '{참여자/기관}이 함께한 현장' },
        { role: 'activities', title: '주요 활동', reader_question: '무엇을 진행했는가?', headline_rule: '현장에서 진행된 핵심 프로그램' },
        { role: 'reaction', title: '현장 반응', reader_question: '참여자들은 어떻게 반응했는가?', headline_rule: '참여자들이 남긴 변화의 신호' },
        { role: 'impact', title: '성과와 의미', reader_question: '사업적으로 어떤 의미가 있는가?', headline_rule: '성과는 다음 사업의 기반이 됩니다' },
        { role: 'next_step', title: '후속 계획', reader_question: '다음은 무엇인가?', headline_rule: '{사업명}, 다음 단계로 이어집니다' }
      ],
      copy_rules: [
        '성과 공유형은 참여 규모, 만족도, 수료자, 협력기관 등 수치를 우선 추출한다.',
        '현장 사진이 있다면 사진 중심 카드를 추천한다.',
        '성과는 단순 결과가 아니라 다음 사업과 연결해 설명한다.'
      ]
    },
    {
      id: 'policy_anchor_info',
      label: 'RISE/ANCHOR 정책·제도 안내형',
      purpose: 'information',
      detect_keywords: ['RISE', 'ANCHOR', '앵커', '정책', '교육부', '지자체', '사업 재구조화', '제도', '가이드라인', '추진계획'],
      audience_priority: ['public', 'students', 'companies'],
      story_intent: '정책 내용을 그대로 옮기지 않고, 무엇이 달라지고 누구에게 어떤 영향을 주는지 쉽게 설명한다.',
      seven_card_flow: [
        { role: 'cover', title: '정책 핵심 변화', reader_question: '무슨 정책인가?', headline_rule: '{정책명}, 무엇이 달라지나' },
        { role: 'why_now', title: '왜 중요한가', reader_question: '왜 지금 알아야 하는가?', headline_rule: '지금 {정책명}을 봐야 하는 이유' },
        { role: 'core', title: '핵심 내용', reader_question: '핵심은 무엇인가?', headline_rule: '핵심은 {핵심키워드}입니다' },
        { role: 'change', title: '달라지는 점', reader_question: '기존과 무엇이 달라지는가?', headline_rule: '기존 방식과 달라지는 점' },
        { role: 'university_impact', title: '대학 영향', reader_question: '대학 사업에는 어떤 영향이 있는가?', headline_rule: '대학 사업 운영도 달라집니다' },
        { role: 'audience_impact', title: '학생/기업 영향', reader_question: '학생과 기업에는 어떤 의미인가?', headline_rule: '학생과 기업이 체감할 변화' },
        { role: 'summary', title: '한 장 요약', reader_question: '무엇만 기억하면 되는가?', headline_rule: '{정책명}, 이것만 기억하세요' }
      ],
      copy_rules: [
        '정책형은 쉬운 말로 바꿔 설명한다.',
        '기존 대비 변화가 있으면 Before/After 구조를 사용한다.',
        '지자체·산업·대학·학생 각각의 영향을 분리해 설명한다.'
      ]
    },
    {
      id: 'industry_trend_info',
      label: '산업 트렌드/정보 전달형',
      purpose: 'information',
      detect_keywords: ['산업', '트렌드', '바이오', '반도체', '로봇', '모빌리티', '물류', 'AI', '시장', '전망', '인프라', '기업'],
      audience_priority: ['students', 'companies', 'public'],
      story_intent: '산업 정보를 단순 설명하지 않고, 지역 산업과 대학 인재양성 관점으로 연결한다.',
      seven_card_flow: [
        { role: 'cover', title: '산업 이슈 한 줄 요약', reader_question: '어떤 산업 이슈인가?', headline_rule: '{산업분야}, 지금 왜 주목받나' },
        { role: 'current', title: '현재 상황', reader_question: '현재 산업 상황은 어떤가?', headline_rule: '{산업분야}의 현재 상황' },
        { role: 'issue', title: '핵심 이슈', reader_question: '가장 중요한 쟁점은 무엇인가?', headline_rule: '핵심 이슈는 {핵심이슈}' },
        { role: 'data', title: '데이터/사례', reader_question: '근거가 되는 수치나 사례는 무엇인가?', headline_rule: '숫자로 보는 {산업분야}' },
        { role: 'regional', title: '지역 영향', reader_question: '인천/지역에는 어떤 의미인가?', headline_rule: '인천 산업과 연결되는 지점' },
        { role: 'university_response', title: '대학 대응', reader_question: '인천대는 어떻게 대응할 수 있는가?', headline_rule: '인천대 RISE의 대응 방향' },
        { role: 'insight', title: '시사점', reader_question: '무엇을 기억해야 하는가?', headline_rule: '{산업분야}, 결국 인재가 핵심입니다' }
      ],
      copy_rules: [
        '산업 정보형은 데이터와 시사점을 분리한다.',
        '전문용어는 쉬운 말로 풀어쓴다.',
        '마지막은 인천대 RISE의 대응 방향으로 연결한다.'
      ]
    }
  ],
  generation_rules: {
    forbidden_titles: ['핵심내용', '추진내용', '기대효과', '마무리', '무엇을 했나', '왜 필요한가'],
    mandatory_process: ['유형 분류', '대상 관점 선택', '독자 질문 생성', '카드 흐름 적용', '카드별 카피 생성'],
    headline_rule: '슬라이드 제목과 Headline에는 실제 기관명, 사업명, 산업명, 변화, 수혜자 중 최소 1개를 포함한다.',
    body_rule: 'Body는 2~4줄, 한 문장 45자 내외로 작성한다.',
    highlight_rule: 'Highlight는 저장하고 싶은 핵심 메시지 1문장으로 작성한다.'
  }
};

export function getStoryEnginePromptBlock() {
  return AIMS_CARDNEWS_STORY_DB.story_types.map((type) => {
    const flow = type.seven_card_flow.map((card, index) => `${index + 1}. ${card.title} / 질문: ${card.reader_question} / 제목규칙: ${card.headline_rule}`).join('\n');
    return `## ${type.label} (${type.id})\n- 목적: ${AIMS_CARDNEWS_STORY_DB.content_purposes[type.purpose]?.label || type.purpose}\n- 감지 키워드: ${type.detect_keywords.join(', ')}\n- 스토리 의도: ${type.story_intent}\n- 권장 카드 흐름:\n${flow}\n- 카피 원칙: ${type.copy_rules.join(' / ')}`;
  }).join('\n\n');
}

export function getStoryTypeLabels() {
  return AIMS_CARDNEWS_STORY_DB.story_types.map((type) => `${type.label}(${type.id})`).join(', ');
}
