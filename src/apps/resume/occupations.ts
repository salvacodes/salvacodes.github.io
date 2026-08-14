import type { Occupation, Tenure } from './resume-model'

export const allOccupations = (tenures: Tenure[]): Occupation[] => tenures.flatMap((tenure) => tenure.occupations)

export const findOccupation = (tenures: Tenure[], id: string): Occupation | undefined =>
  allOccupations(tenures).find((occupation) => occupation.id === id)
