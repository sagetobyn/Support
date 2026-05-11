const truthyValues = new Set(['1', 'true', 'yes', 'on'])

function isTruthy(value: string | undefined) {
  return Boolean(value && truthyValues.has(value.toLowerCase()))
}

export function isLoginBypassEnabledForTesting() {
  return (
    isTruthy(process.env.BYPASS_LOGIN_FOR_TESTING) ||
    isTruthy(process.env.NEXT_PUBLIC_BYPASS_LOGIN_FOR_TESTING)
  )
}

export function isPublicLoginBypassEnabledForTesting() {
  return isTruthy(process.env.NEXT_PUBLIC_BYPASS_LOGIN_FOR_TESTING)
}
