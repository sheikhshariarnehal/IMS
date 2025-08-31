// Sample status types (matching database enum)
export type SampleStatus =
  | 'requested'
  | 'prepared'
  | 'delivered'
  | 'returned'
  | 'converted'
  | 'lost'
  | 'expired';

export type SamplePurpose =
  | 'Quality evaluation for bulk order'
  | 'Color matching test'
  | 'Premium fabric evaluation'
  | 'Lining material test'
  | 'Casual wear fabric sample'
  | 'Dress material evaluation'
  | 'Quality Check';

export type DeliveryMethod =
  | 'courier'
  | 'pickup'
  | 'express'
  | 'hand_delivery';

// Main Sample interface (matching database structure)
export interface Sample {
  id: string;
  sampleNumber: string;
  sampleName: string;
  description: string;

  // Customer information
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;

  // Product information
  productId: string;
  productName: string;
  productCode: string;

  // Sample details
  quantity: number;
  cost: number;
  purpose: SamplePurpose;

  // Status and dates
  status: SampleStatus;
  requestDate: Date;
  expectedReturnDate?: Date;
  actualReturnDate?: Date;

  // Delivery information
  deliveryAddress: string;
  deliveryMethod: DeliveryMethod;
  deliveryPerson: string;

  // Conversion information
  conversionSaleId?: string;
  conversionAmount?: number;
  conversionDate?: Date;

  // Metadata
  notes: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

// Filter interface
export interface SampleFilters {
  search?: string;
  status?: SampleStatus;
  customerId?: string;
  // productId?: string; // Removed - will be implemented later
  purpose?: SamplePurpose;
  deliveryMethod?: DeliveryMethod;
  overdueOnly?: boolean;
  convertedOnly?: boolean;
}

// Analytics interface
export interface SampleAnalytics {
  totalSamples: number;
  activeSamples: number;
  deliveredSamples: number;
  returnedSamples: number;
  convertedSamples: number;
  overdueSamples: number;
  conversionRate: number;
  averageCostPerSample: number;
  totalSampleCosts: number;
  revenueFromConversions: number;
  costPerConversion: number;
}

// Component prop interfaces
export interface SampleCardProps {
  sample: Sample;
  onPress: (sample: Sample) => void;
  onActionPress: (action: string, sample: Sample) => void;
}

export interface KPICardProps {
  title: string;
  value: string | number;
  icon: React.ComponentType<any>;
  color: string;
  trend?: 'up' | 'down';
  change?: number;
}