// Report types
export type ReportType = 
  | 'sales' 
  // | 'product_performance'  // Removed - will be implemented later
  | 'customer' 
  // | 'inventory'  // Removed - will be implemented later
  | 'financial' 
  | 'sample';

export type ExportFormat = 'pdf' | 'excel' | 'csv' | 'json';

// Base report interface
interface BaseReport {
  id: string;
  reportName: string;
  reportType: string;
  dateRange: {
    start: Date;
    end: Date;
  };
  generatedAt: Date;
  generatedBy: string;
}

// Sales report interface
export interface SalesReport extends BaseReport {
  totalSales: number;
  totalRevenue: number;
  totalTransactions: number;
  averageOrderValue: number;
  // topProducts removed - will be implemented later
  topCustomers: {
    customerId: string;
    customerName: string;
    totalPurchases: number;
    totalSpent: number;
    lastPurchase: Date;
  }[];
  salesByCategory: {
    category: string;
    sales: number;
    revenue: number;
    percentage: number;
  }[];
  salesByLocation: {
    locationId: string;
    locationName: string;
    sales: number;
    revenue: number;
  }[];
  paymentAnalysis: {
    paid: number;
    pending: number;
    overdue: number;
    totalDue: number;
  };
  trends: {
    date: Date;
    sales: number;
    revenue: number;
    transactions: number;
  }[];
}

// Product performance report interface - removed, will be implemented later
// export interface ProductPerformanceReport extends BaseReport {}

// Customer report interface
export interface CustomerReport extends BaseReport {
  customers: {
    customerId: string;
    customerName: string;
    totalPurchases: number;
    totalSpent: number;
    lastPurchase: Date;
    averageOrderValue: number;
    customerType: string;
    loyaltyScore: number;
  }[];
}

// Inventory report interface
export interface InventoryReport extends BaseReport {
  // inventory removed - will be implemented later
}

// Financial report interface
export interface FinancialReport extends BaseReport {
  revenue: number;
  costOfGoodsSold: number;
  grossProfit: number;
  expenses: {
    category: string;
    amount: number;
    percentage: number;
  }[];
  netProfit: number;
  cashFlow: {
    date: Date;
    inflow: number;
    outflow: number;
    balance: number;
  }[];
}

// Sample report interface
export interface SampleReport extends BaseReport {
  totalSamples: number;
  deliveredSamples: number;
  returnedSamples: number;
  convertedSamples: number;
  conversionRate: number;
  sampleCost: number;
  revenueFromConversions: number;
  roi: number;
  samples: {
    sampleId: string;
    sampleName: string;
    customerId: string;
    customerName: string;
    deliveryDate: Date;
    returnDate?: Date;
    status: string;
    cost: number;
    converted: boolean;
    conversionValue?: number;
  }[];
}

// Scheduled report interface
export interface ScheduledReport {
  id: string;
  name: string;
  reportType: ReportType;
  template: string;
  schedule: {
    frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly';
    time: string;
    dayOfWeek?: number;
    dayOfMonth?: number;
    timezone: string;
  };
  recipients: {
    userId: string;
    email: string;
    name: string;
  }[];
  format: ExportFormat[];
  isActive: boolean;
  lastRun?: Date;
  nextRun?: Date;
  createdBy: string;
  createdAt: Date;
}

// Report template interface
export interface ReportTemplate {
  id: string;
  name: string;
  reportType: ReportType;
  description: string;
  sections: {
    id: string;
    type: string;
    title: string;
    dataSource: string;
    options: Record<string, any>;
  }[];
  createdBy: string;
  createdAt: Date;
  lastModified: Date;
}

// Business Intelligence interface
export interface BusinessIntelligence {
  kpis: {
    revenue: {
      current: number;
      previous: number;
      growth: number;
      target: number;
      achievement: number;
    };
    profit: {
      current: number;
      previous: number;
      margin: number;
      target: number;
    };
    customers: {
      total: number;
      new: number;
      retained: number;
      churn: number;
    };
    inventory: {
      turnover: number;
      value: number;
      efficiency: number;
      wastage: number;
    };
  };
  trends: {
    sales?: {
      date: Date;
      value: number;
    }[];
    customers?: {
      date: Date;
      value: number;
    }[];
    inventory?: {
      date: Date;
      value: number;
    }[];
  }[];
  forecasts: {
    sales: {
      date: Date;
      predicted: number;
      confidence: number;
    }[];
    // demand removed - will be implemented later
    cashFlow: {
      date: Date;
      predicted: number;
      confidence: number;
    }[];
  };
  insights: {
    id: string;
    type: 'opportunity' | 'risk' | 'trend' | 'anomaly';
    title: string;
    description: string;
    impact: 'high' | 'medium' | 'low';
    confidence: number;
    recommendations: string[];
    dataPoints: Record<string, any>;
    generatedAt: Date;
  }[];
}