export type MatchEvidenceSlot = "front" | "back";

export interface MatchEvidence {
  id: string;
  matchId: string;
  slot: MatchEvidenceSlot;
  photoType: string;
  uploadedByUserId: string;
  createdAt: string;
}

export interface UploadMatchEvidenceInput {
  slot: MatchEvidenceSlot;
  photo: string;
}
