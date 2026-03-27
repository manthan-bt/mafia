export interface SubscriptionInfo {
    isPremium: boolean;
    perks: string[];
    expiresAt?: Date;
}

export class SubscriptionService {
    private static userSubscriptions: Record<string, SubscriptionInfo> = {};

    static getSubscription(userId: string): SubscriptionInfo {
        return this.userSubscriptions[userId] ?? { isPremium: false, perks: [] };
    }

    static activatePremium(userId: string, months: number = 1) {
        const expiresAt = new Date();
        expiresAt.setMonth(expiresAt.getMonth() + months);

        this.userSubscriptions[userId] = {
            isPremium: true,
            perks: ['AD_FREE', 'EXCLUSIVE_FRAMES', 'VOTING_GLOW'],
            expiresAt
        };
    }

    static isAdFree(userId: string): boolean {
        const sub = this.getSubscription(userId);
        if (!sub.isPremium) return false;
        if (sub.expiresAt && sub.expiresAt < new Date()) return false;
        return sub.perks.includes('AD_FREE');
    }
}
