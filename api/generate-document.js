export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return res.status(200).json({
        ok: false,
        fallback: true,
        message: 'OPENAI_API_KEY is not configured.'
      });
    }

    const payload = req.body || {};
    const prompt = buildPrompt(payload);

    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || 'gpt-4.1-mini',
        input: [
          {
            role: 'system',
            content: [
              {
                type: 'input_text',
                text: '당신은 인천대학교 RISE사업단의 사업기획·성과관리 전문 실무자입니다. 대학 사업계획서, 결과보고서, 회의자료, 평가 대응자료를 공문서체와 보고서체로 작성합니다. 입력값을 단순 나열하지 말고, 추진배경-목적-내용-예산-성과관리-기대효과가 논리적으로 이어지도록 작성하십시오. 불확실한 내용은 단정하지 말고 입력값 범위 내에서 작성하십시오.'
              }
            ]
          },
          {
            role: 'user',
            content: [{ type: 'input_text', text: prompt }]
          }
        ],
        temperature: 0.35,
        max_output_tokens: 4000
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(200).json({
        ok: false,
        fallback: true,
        message: `OpenAI API error: ${response.status}`,
        detail: errorText.slice(0, 500)
      });
    }

    const data = await response.json();
    const text = extractOutputText(data);

    return res.status(200).json({
      ok: true,
      fallback: false,
      text
    });
  } catch (error) {
    return res.status(200).json({
      ok: false,
      fallback: true,
      message: error?.message || 'Unknown generation error'
    });
  }
}

function buildPrompt(payload) {
  const values = payload.values || {};
  const context = payload.context || {};

  return `다음 정보를 바탕으로 실제 제출 가능한 문서 초안을 작성하십시오.

[작성 조건]
- 문서유형: ${values.documentType || '사업계획서'}
- 작성스타일: ${values.writingStyle || '내부 결재형'}
- 분량: ${values.volume || '표준'}
- 문체: 대학 행정 보고서체, 개조식과 서술식 혼합
- 금지: 입력값 단순 나열, 과도한 미사여구, 근거 없는 수치 창작

[사업 기본정보]
- 단위과제: ${values.unitTaskId || '-'}
- 프로그램명: ${values.programName || '-'}
- 운영기간: ${values.startDate || '-'} ~ ${values.endDate || '-'}
- 운영장소: ${values.location || '-'}
- 운영대상: ${values.target || '-'}
- 담당자: ${values.manager || '-'}

[사용자 입력]
- 추진배경: ${values.background || '-'}
- 추진목적: ${values.purpose || '-'}
- 주요내용: ${values.contents || '-'}
- 기대효과: ${values.effect || '-'}

[KPI 연계]
- 연계 KPI: ${values.linkedKpi || '-'}
- KPI 실적유형: ${values.kpiPerformanceType || '-'}
- KPI 인정기준: ${context.kpiGuide || '-'}
- KPI 목표값: ${context.kpiTarget || '-'}${context.kpiUnit || ''}
- 예상 원자료 실적: ${values.expectedRawValue || '0'}
- 예상 인정 실적: ${context.expectedText || '-'}
- 예상 KPI 기여도: ${context.contributionText || '-'}

[예산 정보]
- 예산항목: ${context.budgetName || '-'}
- 예산현황: ${context.budgetStatusText || '-'}
- 사용 예정 금액: ${Number(values.budgetAmount || 0).toLocaleString()}원
- 집행 후 예상 잔액: ${context.afterRemainingText || '-'}
- 산출내역/비고: ${values.budgetMemo || '-'}

[작성 목차]
문서유형에 맞게 아래 목차를 조정하되, 사업계획서일 경우 다음 구조를 기본으로 하십시오.
1. 추진배경 및 필요성
2. 추진목적
3. 운영개요
4. 세부 추진내용
5. 예산 활용계획
6. KPI 및 성과관리 방안
7. 기대효과
8. 향후 추진계획

결과보고서일 경우 운영결과, 주요성과, 예산집행 결과, 개선사항을 포함하십시오.
회의자료일 경우 회의개요, 논의안건, 주요 검토사항, 협조요청사항을 포함하십시오.
심사 Q&A일 경우 예상질문과 답변을 구분하여 작성하십시오.`;
}

function extractOutputText(data) {
  if (data.output_text) return data.output_text;
  const output = data.output || [];
  return output
    .flatMap(item => item.content || [])
    .map(content => content.text || '')
    .filter(Boolean)
    .join('\n')
    .trim();
}
