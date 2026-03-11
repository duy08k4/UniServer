class DbManager {
  async safeQuery<T>(fn: () => Promise<T>) {
    try {
      return await fn();
    } catch (e: any) {
      if (!this.isConnErr(e)) throw e;

      // retry 1 lần
      return await fn();
    }
  }

  private isConnErr(e: any) {
    const msg = String(e?.message || '').toLowerCase();

    return (
      msg.includes('connection terminated') ||
      msg.includes('connection lost') ||
      msg.includes('ecconnreset') ||
      msg.includes('broken pipe') ||
      msg.includes('connection closed')
    );
  }
}

export const dbManager = new DbManager();