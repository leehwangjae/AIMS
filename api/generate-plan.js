export default async function handler(request, response) {
  if (request.method !== 'POST') {
    response.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    response.status(501).json({ error: 'OPENAI_API_KEY is not configured' });
    return;
  }

  try {
    const payload = request.body || {};
    const model = process.env.OPENAI_MODEL || 'gpt-4.1-mini';

    const openaiResponse = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        input: [
          {
            role: 'system',
            content: [
              {
                type: 'input_text',
                text: [
                  '너는 인천대학교 RISE사업단의 사업계획서와 내부 결재문서 작성을 지원하는 전문 행정기획 담당자다.',
                  '사용자가 제공한 입력값, KPI, 예산 정보를 바탕으로 실제 내부 기안에 사용할 수 있는 한국어 사업계획안을 작성한다.',
                  '단순 항목 나열을 피하고, 공식 보고서체와 개조식 문체를 적절히 혼합한다.',
                  '허위 사실을 추가하지 말고, 부족한 정보는 일반적 표현으로 보완하되 과도하게 단정하지 않는다.',
                  '출력은 문서 본문만 작성하고 마크다운 표는 사용하지 않는다.'
                ].join('\n')
              }
            ]
          },
          {
            role: 'user',
            content: [
              {
                type: 'input_text',
                text: buildPrompt(payload)
              }
            ]
          }
        ],
        temperature: 0.35,
        max_output_tokens: 2600
      })
    });

    const data = await openaiResponse.json();
    if (!openaiResponse.ok) {
      response.status(openaiResponse.status).json({ error: data?.error?.message || 'OpenAI API error' });
      return;
    }

    const text = extractText(data);
    response.status(200).json({ text });
  } catch (error) {
    response.status(500).json({ error: error?.message || 'Failed to generate draft' });
  }
}

function buildPrompt(payload) {
  const values = payload.values || {};
  const kpi = payload.kpi || {};
  const budget = payload.budget || {};

  return `
다음 정보를 바탕으로 사업계획 기안문을 작성해줘.

작성 형식:
[사업계획 기안 초안]
1. 추진배경
2. 추진목적
3. 운영개요
4. 세부 추진내용
5. 소요예산
6. 기대효과
7. 향후계획

작성 조건:
- 실제 대학 사업단 내부 결재용 문체로 작성
- 각 항목은 2~5문장 또는 개조식으로 충분히 설명
- KPI 반영 논리를 자연스럽게 포함
- 예산 집행 필요성과 산출근거를 설명
- 지역산업 연계성, 인재양성 효과, 성과관리 필요성을 반영
- 입력값이 짧더라도 문맥을 보강해 완성도 있게 작성
- 없는 사실은 만들지 말고, 제공된 정보 안에서만 확장

기본 정보:
- 단위과제: ${values.unitTaskId || '-'}
- 프로그램명: ${values.programName || '-'}
- 운영기간: ${values.startDate || '-'} ~ ${values.endDate || '-'}
- 운영장소: ${values.location || '-'}
- 운영대상: ${values.target || '-'}
- 담당자: ${values.manager || '-'}

사용자 입력:
- 추진배경: ${values.background || '-'}
- 추진목적: ${values.purpose || '-'}
- 주요내용: ${values.contents || '-'}
- 기대효과: ${values.effect || '-'}

KPI 정보:
- 연계 KPI: ${values.linkedKpi || '-'}
- KPI 실적유형: ${values.kpiPerformanceType || '-'}
- KPI 인정기준: ${kpi.guideText || '-'}
- KPI 목표값: ${kpi.targetText || '-'}
- 예상 원자료 실적: ${kpi.expectedRaw || '-'}
- 예상 인정 실적: ${kpi.expectedText || '-'}
- 예상 KPI 기여도: ${kpi.contributionText || '-'}

예산 정보:
- 예산항목: ${budget.name || '-'}
- 예산현황: ${budget.statusText || '-'}
- 사용 예정 금액: ${budget.amountText || '-'}
- 집행 후 예상 잔액: ${budget.afterRemainingText || '-'}
- 산출내역/비고: ${values.budgetMemo || '-'}
`;
}

function extractText(data) {
  if (data.output_text) return data.output_text;
  const chunks = [];
  for (const item of data.output || []) {
    for (const content of item.content || []) {
      if (content.type === 'output_text' && content.text) chunks.push(content.text);
    }
  }
  return chunks.join('\n').trim();
}
