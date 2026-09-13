export type AuthTokens = {
  accessToken: string
  idToken: string
  refreshToken: string
  expiresAt: number
}

const storageKey = 'clock.auth.tokens'
const verifierKey = 'clock.auth.verifier'
const stateKey = 'clock.auth.state'
const domain = import.meta.env.VITE_COGNITO_DOMAIN
const clientId = import.meta.env.VITE_COGNITO_UI_CLIENT_ID
const region = import.meta.env.VITE_COGNITO_REGION

export const authConfigured = Boolean(domain && clientId)

const redirectUri = () => window.location.origin
const encode = (value: Uint8Array) => btoa(String.fromCharCode(...value)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
const randomValue = () => encode(crypto.getRandomValues(new Uint8Array(32)))

export const loadTokens = (): AuthTokens | null => {
  try { return JSON.parse(localStorage.getItem(storageKey) ?? 'null') } catch { return null }
}

const saveTokens = (response: Record<string, unknown>, refreshToken?: string): AuthTokens => {
  const tokens = {
    accessToken: String(response.access_token),
    idToken: String(response.id_token ?? ''),
    refreshToken: String(response.refresh_token ?? refreshToken ?? ''),
    expiresAt: Date.now() + Number(response.expires_in) * 1000,
  }
  localStorage.setItem(storageKey, JSON.stringify(tokens))
  return tokens
}

const requestTokens = async (body: URLSearchParams, refreshToken?: string) => {
  const response = await fetch(`https://${domain}/oauth2/token`, { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body })
  if (!response.ok) throw new Error('Sign-in session could not be renewed.')
  return saveTokens(await response.json(), refreshToken)
}

export const startSignIn = async () => {
  const verifier = randomValue()
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier))
  const state = randomValue()
  sessionStorage.setItem(verifierKey, verifier)
  sessionStorage.setItem(stateKey, state)
  const query = new URLSearchParams({ response_type: 'code', client_id: clientId, redirect_uri: redirectUri(), scope: 'openid email profile clock-api/read clock-api/write', state, code_challenge: encode(new Uint8Array(digest)), code_challenge_method: 'S256' })
  window.location.assign(`https://${domain}/oauth2/authorize?${query}`)
}

export const completeSignIn = async (): Promise<AuthTokens | null> => {
  const query = new URLSearchParams(window.location.search)
  const code = query.get('code')
  if (!code) return null
  const verifier = sessionStorage.getItem(verifierKey)
  if (!verifier || query.get('state') !== sessionStorage.getItem(stateKey)) throw new Error('Sign-in response could not be verified.')
  const tokens = await requestTokens(new URLSearchParams({ grant_type: 'authorization_code', client_id: clientId, code, redirect_uri: redirectUri(), code_verifier: verifier }))
  sessionStorage.removeItem(verifierKey)
  sessionStorage.removeItem(stateKey)
  window.history.replaceState({}, document.title, window.location.pathname)
  return tokens
}

export const refreshTokens = async (tokens: AuthTokens) => {
  const response = await fetch(`https://cognito-idp.${region}.amazonaws.com/`, { method: 'POST', headers: { 'content-type': 'application/x-amz-json-1.1', 'x-amz-target': 'AWSCognitoIdentityProviderService.InitiateAuth' }, body: JSON.stringify({ AuthFlow: 'REFRESH_TOKEN_AUTH', ClientId: clientId, AuthParameters: { REFRESH_TOKEN: tokens.refreshToken } }) })
  if (!response.ok) throw new Error('Sign-in session could not be renewed.')
  const result = await response.json()
  return saveTokens({ access_token: result.AuthenticationResult.AccessToken, id_token: result.AuthenticationResult.IdToken, expires_in: result.AuthenticationResult.ExpiresIn }, tokens.refreshToken)
}

export const signInWithPassword = async (email: string, password: string) => {
  const response = await fetch(`https://cognito-idp.${region}.amazonaws.com/`, { method: 'POST', headers: { 'content-type': 'application/x-amz-json-1.1', 'x-amz-target': 'AWSCognitoIdentityProviderService.InitiateAuth' }, body: JSON.stringify({ AuthFlow: 'USER_PASSWORD_AUTH', ClientId: clientId, AuthParameters: { USERNAME: email, PASSWORD: password } }) })
  if (!response.ok) throw new Error('Email or password is incorrect.')
  const result = await response.json()
  return saveTokens({ access_token: result.AuthenticationResult.AccessToken, id_token: result.AuthenticationResult.IdToken, refresh_token: result.AuthenticationResult.RefreshToken, expires_in: result.AuthenticationResult.ExpiresIn })
}

export const signOut = () => {
  localStorage.removeItem(storageKey)
  window.location.assign(`https://${domain}/logout?${new URLSearchParams({ client_id: clientId, logout_uri: redirectUri() })}`)
}
