import { v4 as uuidv4, v5 as uuidv5 } from 'uuid';

// UUID namespace for deterministic IDs (if needed)
const NAMESPACE = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';

/**
 * ID Generator for globally unique, deterministic IDs
 */
export class IdGenerator {
  /**
   * Generate a globally unique UUID v4
   */
  static uuid(): string {
    return uuidv4();
  }

  /**
   * Generate a deterministic UUID v5 based on input string
   * Useful for creating consistent IDs from known data
   */
  static deterministic(input: string): string {
    return uuidv5(input, NAMESPACE);
  }

  /**
   * Generate a local order ID with timestamp prefix for debugging
   */
  static localOrderId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    return `local_${timestamp}_${random}`;
  }

  /**
   * Generate a sync queue ID
   */
  static syncQueueId(): string {
    return `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate a sales ledger entry ID
   */
  static salesEntryId(): string {
    return `sale_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Validate if a string is a valid UUID
   */
  static isValidUUID(uuid: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }

  /**
   * Check if an ID is a local ID (starts with 'local_')
   */
  static isLocalId(id: string): boolean {
    return id.startsWith('local_');
  }

  /**
   * Extract timestamp from local ID for sorting/debugging
   */
  static getTimestampFromLocalId(localId: string): number | null {
    if (!this.isLocalId(localId)) return null;

    const parts = localId.split('_');
    if (parts.length >= 2) {
      const timestamp = parseInt(parts[1]);
      return isNaN(timestamp) ? null : timestamp;
    }
    return null;
  }

  /**
   * Generate a short ID for display purposes (not for storage)
   */
  static shortId(uuid: string): string {
    return uuid.substring(0, 8).toUpperCase();
  }
}
