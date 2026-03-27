export interface StoreItem {
    sku: string;
    name: string;
    price: number;
    type: 'COSMETIC' | 'PERK';
}

export class MonetizationService {
    static BATTLE_PASS_COST = 1000; // Coins

    static readonly STORE_ITEMS: StoreItem[] = [
        { sku: 'skin_vampire', name: 'Vampire Mafia Skin', price: 500, type: 'COSMETIC' },
        { sku: 'frame_gold', name: 'Gold Rank Frame', price: 200, type: 'COSMETIC' },
        { sku: 'glow_red', name: 'Blood Glow Role Reveal', price: 300, type: 'COSMETIC' },
        { sku: 'custom_timer', name: 'Custom Timer Perk', price: 100, type: 'PERK' }
    ];

    static calculateRewards(isWinner: boolean, performanceScore: number): number {
        const base = isWinner ? 50 : 20;
        return base + Math.floor(performanceScore * 10);
    }
}
