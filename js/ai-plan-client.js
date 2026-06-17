export async function generatePlanDraftWithAi(payload) {
  const response = await fetch('/api/generate-plan', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data?.error || 'AI 생성 요청에 실패했습니다.');
  }

  if (!data?.text) {
    throw new Error('AI 생성 결과가 비어 있습니다.');
  }

  return data.text;
}
