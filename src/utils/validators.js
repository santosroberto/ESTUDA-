export const validators = {
  required(value) {
    if (value === undefined || value === null) return 'Campo obrigatório'
    if (typeof value === 'string' && value.trim() === '') return 'Campo obrigatório'
    return null
  },

  minLength(min) {
    return function (value) {
      if (value && value.length < min) return `Mínimo de ${min} caracteres`
      return null
    }
  },

  maxLength(max) {
    return function (value) {
      if (value && value.length > max) return `Máximo de ${max} caracteres`
      return null
    }
  },

  isNumber(value) {
    if (value !== '' && isNaN(Number(value))) return 'Deve ser um número'
    return null
  },

  min(minValue) {
    return function (value) {
      if (Number(value) < minValue) return `Valor mínimo é ${minValue}`
      return null
    }
  },

  max(maxValue) {
    return function (value) {
      if (Number(value) > maxValue) return `Valor máximo é ${maxValue}`
      return null
    }
  }
}

export function validate(fields, values) {
  const errors = {}

  for (const [field, rules] of Object.entries(fields)) {
    const value = values[field]
    for (const rule of rules) {
      const error = rule(value)
      if (error) {
        errors[field] = error
        break
      }
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors
  }
}
