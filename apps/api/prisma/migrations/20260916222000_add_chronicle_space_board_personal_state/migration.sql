
CREATE TABLE "chronicle_space_board_personal_states" (
  "chronicleId" UUID NOT NULL,
  "userId" UUID NOT NULL,
  "state" JSONB NOT NULL,
  "revision" INTEGER NOT NULL DEFAULT 1,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "chronicle_space_board_personal_states_pkey" PRIMARY KEY ("chronicleId", "userId"),
  CONSTRAINT "chronicle_space_board_personal_states_chronicle_fk" FOREIGN KEY ("chronicleId") REFERENCES "chronicles"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "chronicle_space_board_personal_states_user_fk" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "chronicle_space_board_personal_states_userId_idx" ON "chronicle_space_board_personal_states"("userId");
