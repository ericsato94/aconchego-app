import { GENERIC_ERROR } from '../data/messages'

/** Erro com mensagem já pensada para o usuário (vinda do nosso servidor ou do próprio app). */
export class UserFacingError extends Error {}

/** Texto a mostrar para um erro qualquer: só repassa mensagens nossas; o resto vira a mensagem padrão. */
export const userMessage = (err: unknown) => (err instanceof UserFacingError && err.message ? err.message : GENERIC_ERROR)
