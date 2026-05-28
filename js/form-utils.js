export function validateRequired(values = {}, requiredFields = []) {
  const errors = {};

  requiredFields.forEach(field => {
    const value = values[field];

    if (value === undefined || value === null || value === '') {
      errors[field] = '필수 입력 항목입니다.';
    }
  });

  return {
    valid: Object.keys(errors).length === 0,
    errors
  };
}

export function validateNumber(value, { min = null, max = null } = {}) {
  const numericValue = Number(value);

  if (Number.isNaN(numericValue)) {
    return {
      valid: false,
      message: '숫자 형식이 아닙니다.'
    };
  }

  if (min !== null && numericValue < min) {
    return {
      valid: false,
      message: `${min} 이상이어야 합니다.`
    };
  }

  if (max !== null && numericValue > max) {
    return {
      valid: false,
      message: `${max} 이하여야 합니다.`
    };
  }

  return {
    valid: true,
    message: ''
  };
}

export function validateDateRange(startDate, endDate) {
  if (!startDate || !endDate) {
    return {
      valid: false,
      message: '시작일과 종료일이 필요합니다.'
    };
  }

  if (new Date(startDate) > new Date(endDate)) {
    return {
      valid: false,
      message: '종료일은 시작일 이후여야 합니다.'
    };
  }

  return {
    valid: true,
    message: ''
  };
}
