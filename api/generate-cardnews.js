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
    const cardCount = Number(payload.cardCount || 8);
    const tone = payload.tone || 'dark-premium';

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
          {
            role: 'system',
            content: [{ type: 'input_text', text: CARDNEWS_SYSTEM_PROMPT }]
          },
          {
            role: 'user',
            content: [{ type: 'input_text', text: buildUserPrompt({ pressText, cardCount, tone }) }]
          }
        ],
        temperature: 0.55,
        max_output_tokens: 5000
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(200).json({ ok: false, fallback: true, message: `OpenAI API error: ${response.status}`, detail: errorText.slice(0, 500) });
    }

    const data = await response.json();
    const text = extractOutputText(data);
    return res.status(200).json({ ok: true, text });
  } catch (error) {
    return res.status(200).json({ ok: false, fallback: true, message: error?.message || 'Unknown generation error' });
  }
}

const CARDNEWS_SYSTEM_PROMPT = `당신은 세계적인 SNS 브랜드의 수석 비주얼 디렉터이자, 사람들의 시선을 단숨에 사로잡는 천재 카피라이터입니다.

목표:
사용자가 제공한 보도자료를 분석하여, 1장의 강력한 표지 이미지 생성용 통합 프롬프트와 5장~8장 분량의 텍스트 중심 상세 슬라이드 구성안을 도출합니다. 상세 슬라이드는 화려한 그래픽보다 텍스트의 배치, 크기, 색상 대비를 통해 메시지를 명확히 전달하고 저장을 부르는 유익한 정보를 제공하는 데 초점을 둡니다.

톤앤매너:
고급스러운 감성, 정확하고 논리적인 톤, 명쾌하고 매너있는 문체. 독자가 공감할 수 있는 일상적 비유를 적절히 활용합니다.

출력 규칙:
반드시 한국어로 작성합니다. 특별히 영어 이름이나 약자가 필요한 경우가 아니면 한글과 영어를 병기하지 않습니다. 아래 구조를 반드시 지킵니다.

1. 기획 분석
- 목적
- 타겟
- 메시지 관통선

2. 표지용 타이틀 제안
- 후보 1
- 후보 2
- 최종안

3. 표지 이미지 생성용 통합 프롬프트
- 영어 프롬프트 1개
- 이미지 비율 4:5 명시
- 텍스트 여백, 배경 묘사, 캐릭터/소품, 텍스트 배치, 폰트 스타일, 색상 포함

4. 텍스트 중심 상세 슬라이드 구성
각 슬라이드는 아래 형식으로 작성합니다.
[슬라이드 n: 제목]
- Design Guide:
- Headline:
- Body:
- Highlight:
- Insight Content:

5. 인스타그램 마케팅 카피
- 본문
- 저장/공유 유도 문구
- 해시태그`;

function buildUserPrompt({ pressText, cardCount, tone }) {
  return `다음 보도자료를 기반으로 카드뉴스를 제작하십시오.

[카드뉴스 조건]
- 총 슬라이드 수: ${cardCount}장
- 표지 1장 + 상세 슬라이드 ${Math.max(cardCount - 1, 5)}장
- 배경톤: ${getToneDescription(tone)}
- 상세 슬라이드 기본: 다크 배경(#121212 계열), 고대비 화이트 & 옐로우/골드 텍스트
- RISE 사업, 대학, 지역혁신, 인재양성, 성과확산 맥락을 반영
- 보도자료의 사실관계를 왜곡하지 말 것
- 없는 수치나 기관명을 창작하지 말 것

[보도자료]
${pressText}`;
}

function getToneDescription(tone) {
  const map = {
    'dark-premium': '다크 프리미엄, #121212 배경, 화이트 텍스트, 골드 강조색 #FFD700',
    'blue-saas': '블루 SaaS, 네이비와 블루 그라데이션, 화이트 텍스트, 시안 포인트',
    'white-minimal': '화이트 미니멀, 흰 배경, 네이비 텍스트, 얇은 라인과 넓은 여백',
    'green-rise': '그린 RISE, 딥그린과 민트 포인트, 지속가능성과 지역혁신 느낌',
    'gold-impact': '골드 임팩트, 차콜 배경, 골드와 아이보리 포인트, 성과와 권위 강조'
  };
  return map[tone] || map['dark-premium'];
}

function extractOutputText(data) {
  if (data.output_text) return data.output_text;
  return (data.output || []).flatMap(item => item.content || []).map(content => content.text || '').filter(Boolean).join('\n').trim();
}
