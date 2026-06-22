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

    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || 'gpt-4.1-mini',
        input: [
          { role: 'system', content: [{ type: 'input_text', text: CARDNEWS_SYSTEM_PROMPT }] },
          { role: 'user', content: [{ type: 'input_text', text: buildUserPrompt({ pressText, cardCount, tone, purpose, targetAudience }) }] }
        ],
        temperature: 0.35,
        max_output_tokens: 6500
      })
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

당신의 임무는 보도자료를 단순 요약하는 것이 아니라, 실제 카드뉴스로 바로 제작 가능한 수준의 '카드별 카피'와 '정보 구조'를 만드는 것입니다.

절대 금지:
- 보도자료 첫 문장을 잘라 붙여 제목으로 쓰지 마십시오.
- '왜 주목해야 할까요?', '변화는 현장에서 시작됩니다', '단순한 행사가 아닙니다' 같은 범용 문구를 남발하지 마십시오.
- 보도자료에 없는 수치, 기관, 일정, 예산, 성과를 창작하지 마십시오.
- 슬라이드 제목을 '무엇을 했나', '성과', '의미'처럼 추상적으로만 쓰지 마십시오.
- 한 장에 너무 긴 문장을 넣지 마십시오.

반드시 수행할 분석:
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

2. 위 핵심 사실을 바탕으로 카드뉴스 메시지 관통선을 설정합니다.
- 이 카드뉴스를 보고 독자가 무엇을 기억해야 하는가?
- 왜 지금 중요한가?
- 인천대학교/RISE사업 관점에서 어떤 의미가 있는가?

3. 카드별 역할을 명확히 나눕니다.
- 1장: 표지. 보도자료의 핵심을 한 문장으로 압축한 강한 제목.
- 2장: 배경/문제의식. 왜 이 사업이 필요한지.
- 3장: 추진내용. 무엇을 했는지.
- 4장: 협력/운영구조. 누구와 어떻게 했는지.
- 5장: 핵심 성과. 숫자와 구체적 결과 중심.
- 6장: 기대효과. 학생·기업·지역 관점의 변화.
- 7장 이상: 확산, 향후계획, CTA 등 카드 수에 맞춰 확장.

카피 작성 원칙:
- 카드뉴스 제목은 짧고 강해야 합니다.
- Headline은 12~26자 내외의 한국어 중심 문장으로 작성합니다.
- Body는 2~4줄 분량으로 작성합니다.
- Highlight는 카드의 핵심 키워드 또는 반전 메시지를 1문장으로 작성합니다.
- 대학·공공기관 자료답게 과장 광고처럼 보이지 않도록 정확하고 신뢰감 있게 씁니다.
- 그래도 읽고 싶게 만드는 후킹 문장을 사용합니다.
- 특별히 약어가 필요한 경우를 제외하고 한글과 영어를 병기하지 않습니다.

출력 형식:
아래 형식을 반드시 지키십시오. 프론트엔드 파서가 이 구조를 사용합니다.

1. 핵심정보 추출
- 사업명/행사명:
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
- 카드별 Headline은 실제 카드뉴스 제목으로 바로 쓸 수 있어야 합니다.
- 카드별 Body는 단순 설명이 아니라 독자가 이해하기 쉬운 요약문이어야 합니다.
- 카드별 Highlight는 저장하고 싶은 핵심 메시지여야 합니다.

[좋은 출력 예시]
[슬라이드 1: 반도체 인재양성 협력]
- Headline: 인천대가 반도체 인재를 키우는 방법
- Body: 인천대학교가 산업계와 손잡고 반도체 실무인재 양성에 나섭니다. 교육과 현장을 연결해 학생들의 실전 역량을 높이는 것이 핵심입니다.
- Highlight: 대학과 산업계가 함께 만드는 실무형 인재양성

[보도자료]
${pressText}`;
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
