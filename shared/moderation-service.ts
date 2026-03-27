export class ModerationService {
    private static readonly RESTRICTED_PATTERNS = [
        /bomb/i,
        /attack/i,
        /terror/i,
        /kill.*real/i,
        /explosive/i,
        // Add more patterns based on requirements
    ];

    /**
     * Evaluates text for real-world threat content.
     * @param text Input text to evaluate.
     * @returns boolean true if text is flagged, false otherwise.
     */
    static isFlagged(text: string): boolean {
        return this.RESTRICTED_PATTERNS.some((pattern) => pattern.test(text));
    }

    /**
     * Logs metadata for flagged content (mock implementation).
     * In a real system, this would send an encrypted hash to the server.
     */
    static logFlagged(userId: string, lobbyId: string, category: string): void {
        console.warn(`[MODERATION] Content flagged for user ${userId} in lobby ${lobbyId}. Category: ${category}`);
    }
}
