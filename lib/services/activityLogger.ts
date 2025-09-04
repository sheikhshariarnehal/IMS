import { supabase } from '@/lib/supabase';

export interface ActivityLogData {
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'VIEW' | 'LOGIN' | 'LOGOUT' | 'COMPLETE' | 'TRANSFER';
  module: 'AUTH' | 'PRODUCTS' | 'INVENTORY' | 'SALES' | 'CUSTOMERS' | 'REPORTS' | 'SETTINGS' | 'SAMPLES' | 'TRANSFERS' | 'SALE';
  description: string;
  entityType?: string;
  entityId?: number | string;
  entityName?: string;
  oldValues?: any;
  newValues?: any;
  creditAmount?: number;
  debitAmount?: number;
  ipAddress?: string;
  userAgent?: string;
}

export class ActivityLogger {
  private static instance: ActivityLogger;
  private currentUserId: number | null = null;

  private constructor() {}

  public static getInstance(): ActivityLogger {
    if (!ActivityLogger.instance) {
      ActivityLogger.instance = new ActivityLogger();
    }
    return ActivityLogger.instance;
  }

  public setCurrentUser(userId: number) {
    this.currentUserId = userId;
  }

  public async log(data: ActivityLogData): Promise<void> {
    try {
      // Skip logging in demo mode
      if (process.env.DEMO_MODE === 'true' || process.env.EXPO_PUBLIC_DEMO_MODE === 'true') {
        console.log('Demo mode: Skipping activity log:', data);
        return;
      }

      if (!this.currentUserId) {
        console.warn('No current user set for activity logging');
        return;
      }

      const logEntry = {
        user_id: this.currentUserId,
        action: data.action,
        module: data.module,
        description: data.description,
        entity_type: data.entityType,
        entity_id: data.entityId ? parseInt(data.entityId.toString()) : null,
        entity_name: data.entityName,
        old_values: data.oldValues ? JSON.stringify(data.oldValues) : null,
        new_values: data.newValues ? JSON.stringify(data.newValues) : null,
        credit_amount: data.creditAmount || 0,
        debit_amount: data.debitAmount || 0,
        ip_address: data.ipAddress || this.getClientIP(),
        user_agent: data.userAgent || this.getUserAgent(),
        created_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('activity_logs')
        .insert(logEntry);

      if (error) {
        console.error('Failed to log activity:', error);
      } else {
        console.log('Activity logged successfully:', data.action, data.module);
      }
    } catch (error) {
      console.error('Error logging activity:', error);
    }
  }

  // Convenience methods for common actions
  public async logCreate(module: ActivityLogData['module'], entityName: string, entityId?: number | string, newValues?: any): Promise<void> {
    await this.log({
      action: 'CREATE',
      module,
      description: `Created ${module.toLowerCase()}: ${entityName}`,
      entityType: module.toLowerCase(),
      entityId,
      entityName,
      newValues
    });
  }

  public async logUpdate(module: ActivityLogData['module'], entityName: string, entityId?: number | string, oldValues?: any, newValues?: any): Promise<void> {
    await this.log({
      action: 'UPDATE',
      module,
      description: `Updated ${module.toLowerCase()}: ${entityName}`,
      entityType: module.toLowerCase(),
      entityId,
      entityName,
      oldValues,
      newValues
    });
  }

  public async logDelete(module: ActivityLogData['module'], entityName: string, entityId?: number | string, oldValues?: any): Promise<void> {
    await this.log({
      action: 'DELETE',
      module,
      description: `Deleted ${module.toLowerCase()}: ${entityName}`,
      entityType: module.toLowerCase(),
      entityId,
      entityName,
      oldValues
    });
  }

  public async logView(module: ActivityLogData['module'], entityName?: string, entityId?: number | string): Promise<void> {
    await this.log({
      action: 'VIEW',
      module,
      description: `Viewed ${module.toLowerCase()}${entityName ? `: ${entityName}` : ''}`,
      entityType: module.toLowerCase(),
      entityId,
      entityName
    });
  }

  public async logLogin(userEmail: string): Promise<void> {
    await this.log({
      action: 'LOGIN',
      module: 'AUTH',
      description: `User logged in: ${userEmail}`,
      entityType: 'user',
      entityName: userEmail
    });
  }

  public async logLogout(userEmail: string): Promise<void> {
    await this.log({
      action: 'LOGOUT',
      module: 'AUTH',
      description: `User logged out: ${userEmail}`,
      entityType: 'user',
      entityName: userEmail
    });
  }

  public async logSale(saleNumber: string, amount: number, customerName?: string): Promise<void> {
    await this.log({
      action: 'CREATE',
      module: 'SALE',
      description: `Created sale: ${saleNumber} for amount: ${amount}${customerName ? ` (Customer: ${customerName})` : ''}`,
      entityType: 'sale',
      entityName: saleNumber,
      creditAmount: amount
    });
  }

  public async logTransfer(fromLocation: string, toLocation: string, productName: string, quantity: number): Promise<void> {
    await this.log({
      action: 'TRANSFER',
      module: 'TRANSFERS',
      description: `Transferred ${quantity} units of ${productName} from ${fromLocation} to ${toLocation}`,
      entityType: 'transfer',
      entityName: `${productName} (${quantity} units)`
    });
  }

  public async logComplete(module: ActivityLogData['module'], entityName: string, entityId?: number | string): Promise<void> {
    await this.log({
      action: 'COMPLETE',
      module,
      description: `Completed ${module.toLowerCase()}: ${entityName}`,
      entityType: module.toLowerCase(),
      entityId,
      entityName
    });
  }

  private getClientIP(): string {
    // In a real app, you might get this from the request headers
    // For now, return a placeholder
    return '127.0.0.1';
  }

  private getUserAgent(): string {
    if (typeof navigator !== 'undefined') {
      return navigator.userAgent;
    }
    return 'Mobile App';
  }
}

// Export singleton instance
export const activityLogger = ActivityLogger.getInstance();
