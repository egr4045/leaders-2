import { type AccountStore } from './store.js';

export class BotGateway {
  constructor(private store: AccountStore) {}

  /**
   * Called when a user messages the Telegram bot.
   * In a real app, this would be a webhook endpoint receiving updates from Telegram.
   */
  handleTelegramMessage(chatId: string, text: string): string {
    if (text.startsWith('/start')) {
      return 'Welcome to NEXUS bot. Send /link to link your account or /recover to get a recovery code.';
    }
    
    if (text.startsWith('/link')) {
      const code = Math.random().toString(36).substring(2, 8).toUpperCase();
      // Store code temporarily mapping to chatId
      return `Your linking code is: ${code}\nEnter this code in the game hub to link your Telegram account.`;
    }

    if (text.startsWith('/recover')) {
      const account = this.store.findBySocial('telegram', chatId);
      if (!account) {
        return 'No account linked to this Telegram. You cannot recover an account.';
      }
      
      const recoveryCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      // Store recovery code mapped to account.id
      return `Your one-time recovery code is: ${recoveryCode}\nEnter this code on the login screen.`;
    }

    return 'Unknown command.';
  }

  /**
   * Called when a user messages the VK bot.
   */
  handleVkMessage(userId: string, text: string): string {
    // Similar logic to Telegram, handled through VK API
    return 'VK integration coming soon.';
  }
}
