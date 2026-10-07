export function toggleSelection(selectedIds: readonly string[], optionId: string): string[] {
  return selectedIds.includes(optionId)
    ? selectedIds.filter((selectedId) => selectedId !== optionId)
    : [...selectedIds, optionId];
}

export function setBooleanResponse(
  responses: Readonly<Record<string, boolean>>,
  statementId: string,
  value: boolean,
): Record<string, boolean> {
  return { ...responses, [statementId]: value };
}

export function resolveRecognizedAnswer(answer: string, mockRecognition?: string): string {
  return mockRecognition?.trim() || answer.trim();
}
