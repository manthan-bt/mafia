export interface UserIdentity {
    id: string;
    email?: string;
    username: string;
    provider: 'EMAIL' | 'GOOGLE' | 'APPLE';
    linkedDevices: string[];
}

export class AccountService {
    private static users: Record<string, UserIdentity> = {};

    static async login(email: string, provider: 'EMAIL' | 'GOOGLE' | 'APPLE'): Promise<UserIdentity> {
        // This would integrate with Passport.js or Supabase Auth
        const userId = Math.random().toString(36).substr(2, 9);
        const user: UserIdentity = {
            id: userId,
            email,
            username: email.split('@')[0],
            provider,
            linkedDevices: []
        };
        this.users[userId] = user;
        return user;
    }

    static linkDevice(userId: string, deviceId: string) {
        const user = this.users[userId];
        if (user && !user.linkedDevices.includes(deviceId)) {
            user.linkedDevices.push(deviceId);
        }
    }
}
