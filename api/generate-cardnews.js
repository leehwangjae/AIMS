import { CARDNEWS_PATTERN_DB, getCardnewsPatternSummary } from './cardnews-pattern-db.js';
import { getStoryEnginePromptBlock, getStoryTypeLabels } from './cardnews-story-engine-db.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return res.status(200).json({ ok: false, fallback: true, message: 'OPENAI_API_KEY is not configured.' });
    }

    const payload = req.body || {};
    const pressText = String(payload.pressText || '').trim();
    const cardCount = Number(payload.cardCount || 7);
    const tone = payload.tone || 'inu-brand';
    const purpose = payload.purpose || '성과공유';
    const targetAudience = payload.targetAudience || '학생, 일반인, 기업';

    if (!pressText) return res.status(400).json({ ok: false, message: 'pressText is required.' });

    const responseBody = {
      model: process.env.OPENAI_MODEL || 'gpt-4.1-mini',
      input: [
        { role: 'system', content: [{ type: 'input_text', text: CARDNEWS_SYSTEM_PROMPT }] },
        { role: 'user', content: [{ type: 'input_text', text: buildUserPrompt({ pressText, cardCount, tone, purpose, targetAudience }) }] }
      ],
      max_output_tokens: 8500
    };

    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(responseBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(200).json({ ok: false, fallback: true, message: `OpenAI API error: ${response.status}`, detail: errorText.slice(0, 700) });
    }

    const data = await response.json();
    const text = extractOutputText(data);
    return res.status(200).json({ ok: true, text });
  } catch (error) {
    return res.status(200).json({ ok: false, fallback: true, message: error?.message || 'Unknown generation error' });
  }
}

const CARDNEWS_SYSTEM_PROMPT = `당신은 인천대학교 RISE/ANCHOR 사업단의 카드뉴스 전문 스토리 에디터입니다.

당신의 역할은 보도자료를 단순 요약하는 것이 아닙니다. 보도자료를 읽고, 학생·일반인·기업이 궁금해할 순서로 재배열하여 카드뉴스용 스토리로 압축 재구성해야 합니다.

[AIMS 카드뉴스의 목적]
1. 사업 홍보: MOU 체결, 프로그램 또는 행사 개최 사전/사후 보도, 성과 확산
2. 정보 전달: 프로그램 참여 독려, RISE/ANCHOR 정책 안내, 지자체 산업 분야 정보 전달

[핵심 대상]
- 학생: 나에게 어떤 기회와 혜택이 있는가?
- 일반인: 지역과 사회에 어떤 의미가 있는가?
- 기업: 협력, 인재 확보, 산업 경쟁력 측면에서 어떤 효과가 있는가?

[반드시 지킬 생성 절차]
1. 보도자료 사실 추출
2. 콘텐츠 목적 판정: 사업 홍보 또는 정보 전달
3. 콘텐츠 유형 분류: ${getStoryTypeLabels()}
4. 주요 대상 판정: 학생 / 일반인 / 기업 / 복합
5. 독자 질문 생성
6. 유형별 카드 흐름 선택
7. 카드별 카피 작성

[절대 금지]
- '핵심내용', '추진내용', '기대효과', '마무리', '무엇을 했나', '왜 필요한가'를 단독 카드 제목으로 쓰지 마십시오.
- 보도자료 첫 문장을 그대로 잘라 표지 제목으로 쓰지 마십시오.
- 보도자료에 없는 수치, 기관명, 일정, 예산, 성과를 창작하지 마십시오.
- 설명문처럼 길게 쓰지 마십시오. 카드뉴스는 읽는 문서가 아니라 보는 콘텐츠입니다.
- 협약형에서 협력기관 소개를 생략하지 마십시오.

[카드뉴스 카피 원칙]
- 카드 제목에는 실제 기관명, 사업명, 산업명, 변화, 수혜자 중 최소 1개를 포함합니다.
- Headline은 12~28자 내외로 작성합니다.
- Body는 2~4줄로 작성합니다.
- Highlight는 저장하고 싶은 핵심 메시지 1문장으로 작성합니다.
- 모르는 정보는 '보도자료 내 미기재'로 표시합니다.
- 마지막 카드는 CTA 또는 향후 계획으로 마무리합니다.

[출력 형식]
아래 형식을 반드시 지키십시오. 프론트엔드 파서가 이 구조를 사용합니다.

1. 핵심정보 추출
- 사업명/행사명:
- 콘텐츠 목적:
- 보도자료 유형:
- 주요 대상:
- 주관기관:
- 참여기관/협력기관:
- 일시/장소:
- 대상/참여자:
- 주요 추진내용:
- 핵심 성과/기대효과:
- 수치 데이터:
- 핵심 메시지:

2. 스토리 설계
- 적용한 Story Type:
- 대상별 핵심 질문:
- 메시지 관통선:
- 선택한 카드 흐름:

3. 표지 이미지 생성용 통합 프롬프트
영어 프롬프트 1개만 작성합니다. 4:5 ratio, no text, no logo, no watermark 조건을 포함합니다.

4. 텍스트 중심 상세 슬라이드 구성
각 슬라이드는 아래 형식으로 작성합니다.
[슬라이드 n: 구체적인 카드 제목]
- Design Guide:
- Headline:
- Body:
- Highlight:
- Insight Content:

5. 인스타그램 마케팅 카피
- 본문:
- 저장/공유 유도 문구:
- 해시태그:`;

function buildUserPrompt({ pressText, cardCount, tone, purpose, targetAudience }) {
  return `다음 보도자료를 AIMS 카드뉴스 Story Engine 방식으로 변환하십시오.

[제작 조건]
- 총 카드 수: ${cardCount}장
- 사용자가 선택한 생성 목적: ${purpose}
- 사용자가 선택한 타겟: ${targetAudience}
- 배경톤: ${getToneDescription(tone)}
- 주요 활용 목적은 사업 홍보 또는 정보 전달입니다.
- 대상은 학생, 일반인, 기업 중 하나 또는 복합입니다.
- RISE/ANCHOR 사업, 대학, 지역혁신, 인재양성, 산학협력, 성과확산 맥락을 반영하십시오.

[AIMS Story Engine DB]
${getStoryEnginePromptBlock()}

[보조 우수사례 패턴 DB]
${getCompactPatternDbForPrompt()}

[유형별 카드 흐름 요약]
${getCardnewsPatternSummary()}

[생성 지시]
- 먼저 보도자료가 아래 6개 중 어느 유형인지 분류하십시오.
  1) MOU/협약 체결형
  2) 프로그램 참여 모집형
  3) 행사 개최 안내형
  4) 행사 성과 공유형
  5) RISE/ANCHOR 정책·제도 안내형
  6) 산업 트렌드/정보 전달형
- 분류한 유형의 카드 흐름을 우선 적용하십시오.
- 사용자가 선택한 카드 수에 맞춰 카드 흐름을 압축하거나 확장하십시오.
- 독자가 궁금해할 질문을 카드 순서로 바꾸십시오.
- 범용 제목 대신 실제 고유명사와 변화가 보이는 제목을 쓰십시오.
- 카드별 Headline은 실제 카드뉴스 제목으로 바로 쓸 수 있어야 합니다.
- 카드별 Body는 보도자료 문장을 복붙하지 말고 카드뉴스 문체로 재작성하십시오.
- 카드별 Highlight는 저장하고 싶은 핵심 메시지로 작성하십시오.

[나쁜 예시]
[슬라이드 2: 핵심내용]
- Headline: 보도자료 핵심을 한눈에

[좋은 예시]
[슬라이드 2: 반도체 인재가 필요한 이유]
- Headline: 반도체 인재, 왜 지금 필요한가
- Body: 반도체 산업 고도화와 함께 패키징 분야의 실무형 인재 수요가 커지고 있습니다. 이번 협약은 대학 교육과 산업 현장을 연결하기 위한 출발점입니다.
- Highlight: 산업 수요에서 출발하는 인재양성

[보도자료]
${pressText}`;
}

function getCompactPatternDbForPrompt() {
  return CARDNEWS_PATTERN_DB.content_type_templates.map((template) => {
    const flow = template.recommended_card_flow_7 || template.recommended_card_flow_8 || template.recommended_card_flow_6 || template.recommended_card_flow_5 || template.recommended_card_flow_4 || [];
    const flowText = Array.isArray(flow) ? flow.map((item) => item.title_pattern || item).join(' → ') : String(flow);
    const guidance = (template.copy_guidance || []).join(' / ');
    return `- ${template.label}\n  감지 키워드: ${(template.detect_keywords || []).join(', ')}\n  권장 흐름: ${flowText}\n  카피 원칙: ${guidance}`;
  }).join('\n');
}

function getToneDescription(tone) {
  const map = {
    'inu-brand': '인천대학교 브랜드 컬러, INU Navy와 Blue 기반, 공식적이고 신뢰감 있는 톤',
    'dark-premium': '다크 프리미엄, #121212 배경, 화이트 텍스트, 골드 강조색 #FFD700',
    'blue-saas': '블루 SaaS, 네이비와 블루 그라데이션, 화이트 텍스트, 시안 포인트',
    'white-minimal': '화이트 미니멀, 흰 배경, 네이비 텍스트, 얇은 라인과 넓은 여백',
    'green-rise': '그린 RISE, 딥그린과 민트 포인트, 지속가능성과 지역혁신 느낌',
    'gold-impact': '골드 임팩트, 차콜 배경, 골드와 아이보리 포인트, 성과와 권위 강조'
  };
  return map[tone] || map['inu-brand'];
}

function extractOutputText(data) {
  if (data.output_text) return data.output_text;
  return (data.output || []).flatMap(item => item.content || []).map(content => content.text || '').filter(Boolean).join('\n').trim();
}
