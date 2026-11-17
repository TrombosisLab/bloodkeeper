-- Dark Secret is a Flaw, not a Background. Preserve its rating, origin,
-- instance details, and selection identity while correcting the stored family.
UPDATE "character_advantage_selections"
SET "category" = 'FLAW'
WHERE "definitionKey" = 'dark-secret'
  AND "category" <> 'FLAW';
