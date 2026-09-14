import type { PrismaClient } from "../../generated/prisma/client.js";
import type { RecognitionAttemptModel, RecognitionCandidate } from "../../models/index.js";

export type RecognitionAttemptInput = Omit<RecognitionAttemptModel, "id" | "createdAt">;

export interface RecognitionAttemptRepository {
  create(input: RecognitionAttemptInput): Promise<RecognitionAttemptModel>;
  findById(id: string): Promise<RecognitionAttemptModel | null>;
  /** Unlinks a user's attempts from them, keeping the anonymous record. Returns the count. */
  detachUser(userId: string): Promise<number>;
}

function toCandidates(value: unknown): readonly RecognitionCandidate[] {
  return Array.isArray(value) ? (value as RecognitionCandidate[]) : [];
}

export class PrismaRecognitionAttemptRepository implements RecognitionAttemptRepository {
  private readonly prisma: PrismaClient;

  public constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  public async create(input: RecognitionAttemptInput): Promise<RecognitionAttemptModel> {
    const row = await this.prisma.recognitionAttempt.create({
      data: { ...input, candidates: input.candidates.map((candidate) => ({ ...candidate })) },
    });
    return { ...row, candidates: toCandidates(row.candidates), topResultType: input.topResultType };
  }

  public async detachUser(userId: string): Promise<number> {
    const result = await this.prisma.recognitionAttempt.updateMany({ where: { userId }, data: { userId: null } });
    return result.count;
  }

  public async findById(id: string): Promise<RecognitionAttemptModel | null> {
    const row = await this.prisma.recognitionAttempt.findUnique({ where: { id } });
    if (row === null) {
      return null;
    }
    const topResultType = row.topResultType === "verse" || row.topResultType === "hymn" ? row.topResultType : null;
    return { ...row, candidates: toCandidates(row.candidates), topResultType };
  }
}
