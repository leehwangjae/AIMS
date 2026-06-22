import { CARDNEWS_PATTERN_DB, getCardnewsPatternSummary } from './cardnews-pattern-db.js';

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
    const targetAudience = payload.targetAudience || '재학생, 교직원, 지역기업, 지자체 관계자';

    if (!pressText) return res.status(400).json({ ok: false, message: 'pressText is required.' });

    const responseBody = {
      model: process.env.OPENAI_MODEL || 'gpt-4.1-mini',
      input: [
        { role: 'system', content: [{ type: 'input_text', text: CARDNEWS_SYSTEM_PROMPT }] },
        { role: 'user', content: [{ type: 'input_text', text: buildUserPrompt({ pressText, cardCount, tone, purpose, targetAudience }) }] }
      ],
      max_output_tokens: 7500
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

const CARDNEWS_SYSTEM_PROMPT = `당신은 대학·공공기관 RISE 사업 홍보를 전문으로 하는 SNS 비주얼 디렉터이자 카드뉴스 전문 카피라이터입니다.

당신의 임무는 보도자료를 단순 요약하는 것이 아니라, 첨부된 우수 카드뉴스 패턴 DB를 참고하여 실제 카드뉴스로 바로 제작 가능한 수준의 '카드별 카피'와 '정보 구조'를 만드는 것입니다.

[우수사례 DB 핵심 원칙]
- 정책·뉴스 요약형: 표지 → 목차 → 이슈별 카드. 번호, 정책명, 핵심 포인트 박스를 사용합니다.
- 업무협약·산학협력형: 표지 → 협약 배경 → 협력기관 소개 → 협약 핵심내용 → 대학 역할 → 기대효과 → CTA.
- 기관 리포트형: 표지 → 목차 → 주요 이슈 → 사진 기반 성과 → 마무리.
- Before/After형: 문제상황과 개선결과를 한 카드 안에서 대비합니다.
- 학생혜택형: '했는데... 안 받았다고?'처럼 사용자의 상황을 건드리는 반복 후킹을 씁니다.
- 정보형/가이드형: 목차, 챕터, 리스트, 그래프, 카드형 정보 구조를 사용합니다.
- 사진 중심형: 사진이 주인공이며 텍스트는 짧고 굵게 씁니다.

[절대 금지]
- 보도자료 첫 문장을 잘라 붙여 제목으로 쓰지 마십시오.
- '핵심내용', '추진내용', '기대효과', '무엇을 했나', '왜 필요한가', '마무리' 같은 범용 제목을 단독 슬라이드 제목으로 쓰지 마십시오.
- '왜 주목해야 할까요?', '변화는 현장에서 시작됩니다', '단순한 행사가 아닙니다' 같은 범용 문구를 남발하지 마십시오.
- 보도자료에 없는 수치, 기관, 일정, 예산, 성과를 창작하지 마십시오.
- 한 장에 너무 긴 문장을 넣지 마십시오.

[반드시 수행할 분석]
1. 보도자료에서 핵심 사실을 먼저 추출합니다.
- 사업명/행사명
- 주관기관
- 참여기관/협력기관
- 일시/장소
- 대상/참여자
- 주요 추진내용
- 핵심 성과 또는 기대효과
- 인용문/메시지
- 수치 데이터

2. 보도자료 유형을 자동 분류합니다.
- 업무협약·산학협력형
- 행사·교육프로그램형
- 성과공유형
- 정책·뉴스 요약형
- 기관 리포트형
- 연구성과형
- 학생혜택·참여유도형

3. 유형에 맞는 카드 흐름을 설계합니다.
- 업무협약형은 반드시 협력기관 소개와 협약 핵심내용 카드를 포함합니다.
- 성과형은 핵심성과와 수치성과를 분리합니다.
- 행사형은 현장 스케치와 참여자/기관 카드를 포함합니다.
- 정책형은 Before/After 또는 이슈별 번호 구조를 우선 사용합니다.

[카피 작성 원칙]
- 카드뉴스 제목은 짧고 강해야 합니다.
- Headline은 12~26자 내외의 한국어 중심 문장으로 작성합니다.
- Body는 2~4줄 분량으로 작성합니다.
- Highlight는 카드의 핵심 키워드 또는 반전 메시지를 1문장으로 작성합니다.
- 카드 제목에는 실제 고유명사, 기관명, 사업명, 협약명, 성과 키워드를 적극 반영합니다.
- 대학·공공기관 자료답게 과장 광고처럼 보이지 않도록 정확하고 신뢰감 있게 씁니다.
- 그래도 읽고 싶게 만드는 후킹 문장을 사용합니다.

[출력 형식]
아래 형식을 반드시 지키십시오. 프론트엔드 파서가 이 구조를 사용합니다.

1. 핵심정보 추출
- 사업명/행사명:
- 보도자료 유형:
- 주관기관:
- 참여기관/협력기관:
- 일시/장소:
- 대상/참여자:
- 주요 추진내용:
- 핵심 성과/기대효과:
- 수치 데이터:
- 핵심 메시지:

2. 기획 분석
- 목적:
- 타겟:
- 메시지 관통선:
- 적용한 우수사례 유형:
- 추천 카드 흐름:

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
  return `다음 보도자료를 기반으로 실제 카드뉴스 제작용 카피를 생성하십시오.

[제작 조건]
- 총 카드 수: ${cardCount}장
- 생성 목적: ${purpose}
- 타겟: ${targetAudience}
- 배경톤: ${getToneDescription(tone)}
- RISE 사업, 대학, 지역혁신, 인재양성, 산학협력, 성과확산 맥락을 반영하십시오.
- 보도자료의 사실관계를 왜곡하지 마십시오.
- 보도자료에 없는 수치나 기관명을 만들지 마십시오.
- 정보가 부족한 항목은 '보도자료 내 미기재'라고 표시하십시오.

[우수 카드뉴스 패턴 DB]
${getCompactPatternDbForPrompt()}

[유형별 카드 흐름 요약]
${getCardnewsPatternSummary()}

[생성 지시]
- 먼저 보도자료 유형을 분류하십시오.
- 분류된 유형에 맞는 우수사례 카드 흐름을 적용하십시오.
- '핵심내용', '추진내용', '기대효과' 같은 범용 제목 대신 실제 기관명·사업명·협약명·성과가 드러나는 제목을 쓰십시오.
- 업무협약형이면 협력기관 소개 카드를 반드시 포함하십시오.
- 카드별 Headline은 실제 카드뉴스 제목으로 바로 쓸 수 있어야 합니다.
- 카드별 Body는 단순 설명이 아니라 독자가 이해하기 쉬운 요약문이어야 합니다.
- 카드별 Highlight는 저장하고 싶은 핵심 메시지여야 합니다.

[좋은 출력 예시]
[슬라이드 1: 반도체 인재양성 협력]
- Headline: 인천대와 KPCA가 손잡은 이유
- Body: 인천대학교가 한국PCB&반도체패키징산업협회와 협력해 반도체 패키징 분야 인재양성 기반을 넓힙니다. 교육과 산업 현장을 연결하는 것이 이번 협약의 핵심입니다.
- Highlight: 대학과 산업계가 함께 만드는 실무형 인재양성

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
