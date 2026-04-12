export class UnauthenticatedError extends Error {
  constructor(message = 'Sign in required.') {
    super(message)
    this.name = 'UnauthenticatedError'
  }
}
