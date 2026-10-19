import { catalog } from '../services/catalog'
import { QUESTIONS, QUIZ, questionByRole, type Identity } from './config'

/** Monta o resultado a partir das respostas: identidade, dor, objeção e plano recomendado. */
export function buildResult(answers: Record<string, string>) {
  const identityKey = answers.historias && QUIZ.identities[answers.historias] ? answers.historias : 'bichos'
  const identity: Identity = QUIZ.identities[identityKey]

  const painQ = questionByRole('pain')
  const objectionQ = questionByRole('objection')
  const budgetQ = questionByRole('budget')

  const pain = painQ ? answers[painQ.id] : undefined
  const objection = objectionQ ? answers[objectionQ.id] : undefined
  const tier = budgetQ?.options.find((o) => o.id === answers[budgetQ.id])?.tier ?? 'basico'
  const age = QUESTIONS.find((q) => q.id === 'idade')?.options.find((o) => o.id === answers.idade)?.label

  return {
    identityKey,
    identity,
    painText: pain ? QUIZ.painEcho[pain] : undefined,
    objection: objection ? QUIZ.objectionAnswers[objection] : undefined,
    recommendedPlan: QUIZ.offer.recommendByTier[tier],
    age,
    stories: identity.stories.map((id) => catalog.byId(id)).filter((s) => s !== undefined),
  }
}
