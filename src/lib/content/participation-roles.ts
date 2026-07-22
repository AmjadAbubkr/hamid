export const PARTICIPATION_ROLES = [
  "Speaker",
  "Panelist",
  "Host",
  "Delegate",
  "Rapporteur",
  "Facilitator",
  "Coordinator",
  "usher",
  "President",
  "Representative",
  "Ambassador",
  "Trainer",
  "Member",
  "Participant",
  "Other",
] as const;

export type ParticipationRole = (typeof PARTICIPATION_ROLES)[number];
