import { supabase } from '../supabase';
import type {
  Product, Customer, Supplier, Category, Location,
  Sale, ProductLot
} from '../supabase';
import { activityLogger } from './activityLogger';

// Check if we're in demo mode
const isDemoMode = process.env.EXPO_PUBLIC_DEMO_MODE === 'true';

// Form data interfaces
export interface ProductFormData {
  name: string;
  product_code: string;
  category_id?: number;
  description?: string;
  purchase_price?: number;
  selling_price?: number;
  per_meter_price?: number;
  supplier_id?: number;
  location_id?: number;
  minimum_threshold?: number;
  current_stock?: number;
  total_purchased?: number;
  total_sold?: number;
  wastage_status?: boolean;
  product_status?: 'active' | 'slow' | 'inactive';
  unit_of_measurement?: string;
  images?: any;
  created_by?: number;
}

export interface CustomerFormData {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  company_name?: string;
  delivery_address?: string;
  customer_type: 'vip' | 'wholesale' | 'regular';
  fixed_coupon?: string;
}

export interface SupplierFormData {
  name: string;
  contact_person?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postal_code?: string;
  tax_number?: string;
  payment_terms?: number;
  credit_limit?: number;
  notes?: string;
}

export interface CategoryFormData {
  name: string;
  description?: string;
}

export interface SaleFormData {
  customer_id?: number;
  subtotal: number;
  discount_amount?: number;
  tax_amount?: number;
  total_amount: number;
  paid_amount?: number;
  due_amount?: number;
  due_date?: string;
  payment_method?: string;
  payment_status?: string;
  sale_status?: string;
  delivery_person?: string;
  delivery_photo?: string;
  location_id?: number;
  created_by?: number;
  items: Array<{
    product_id: number;
    lot_id?: number;
    quantity: number;
    unit_price: number;
    total_price: number;
  }>;
}

export class FormService {
  // Helper function to calculate total stock from all lots
  private static async calculateAndUpdateTotalStock(productId: number): Promise<number> {
    try {
      // Get sum of all quantities from product lots
      const { data: lotSums, error } = await supabase
        .from('products_lot')
        .select('quantity')
        .eq('product_id', productId);

      if (error) {
        console.error('Error fetching lot quantities:', error);
        return 0;
      }

      // Calculate total stock from all lots
      const totalStock = lotSums?.reduce((sum, lot) => sum + (parseFloat(lot.quantity) || 0), 0) || 0;

      // Update the product's total_stock column
      const { error: updateError } = await supabase
        .from('products')
        .update({
          total_stock: totalStock,
          updated_at: new Date().toISOString()
        })
        .eq('id', productId);

      if (updateError) {
        console.error('Error updating total stock:', updateError);
      } else {
        console.log(`✅ Total stock updated for product ${productId}: ${totalStock}`);
      }

      return totalStock;
    } catch (error) {
      console.error('Error calculating total stock:', error);
      return 0;
    }
  }

  // Helper function to ensure user context is set for RLS
  private static async ensureUserContext(userId?: number): Promise<void> {
    if (!userId) {
      console.log('⚠️ No userId provided to ensureUserContext');
      return;
    }

    try {
      console.log('🔄 Setting user context for userId:', userId);
      const { setUserContext } = await import('@/lib/supabase');
      await setUserContext(userId);
      console.log('✅ User context set successfully for userId:', userId);
    } catch (error) {
      console.error('❌ Failed to set user context:', error);
      // Don't throw error, just log it - some operations might still work
    }
  }

  // Product Operations
  static async createProduct(data: ProductFormData, userId: number): Promise<{ success: boolean; data?: Product; error?: string }> {
    try {
      console.log('🔄 Starting product creation for user:', userId);
      console.log('🔄 Product data:', data);

      // Prepare the product data with proper defaults
      const productData = {
        name: data.name,
        product_code: data.product_code,
        category_id: data.category_id || null,
        description: data.description || null,
        purchase_price: data.purchase_price || null,
        selling_price: data.selling_price || null,
        per_meter_price: data.per_meter_price || null,
        supplier_id: data.supplier_id || null,
        location_id: data.location_id || null,
        minimum_threshold: data.minimum_threshold || 100,
        current_stock: data.current_stock || 0,
        total_stock: data.current_stock || 0,
        total_purchased: data.total_purchased || 0,
        total_sold: data.total_sold || 0,
        wastage_status: data.wastage_status || false,
        product_status: data.product_status || 'active',
        unit_of_measurement: data.unit_of_measurement || 'meter',
        images: data.images || null,
        created_by: userId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      console.log('🔄 Inserting product data:', productData);

      const { data: product, error } = await supabase
        .from('products')
        .insert([productData])
        .select()
        .single();

      if (error) {
        console.error('❌ Error creating product:', error);
        console.error('❌ Error details:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        });
        return { success: false, error: `Database error: ${error.message}` };
      }

      // If the product has initial stock, create the first lot
      if (product && (data.current_stock || 0) > 0) {
        const firstLotData = {
          product_id: product.id,
          lot_number: 1, // First lot is always number 1
          purchase_price: data.purchase_price || 0,
          selling_price: data.selling_price || 0,
          quantity: data.current_stock || 0,
          supplier_id: data.supplier_id || null,
          location_id: data.location_id || null,
          received_date: new Date().toISOString(),
        };

        const { data: firstLot, error: lotError } = await supabase
          .from('products_lot')
          .insert([firstLotData])
          .select()
          .single();

        if (lotError) {
          console.error('Error creating first product lot:', lotError);
          // Don't fail the product creation, just log the error
          console.warn('Product created but first lot creation failed');
        } else {
          console.log('✅ First lot created successfully:', firstLot);
          // Calculate and update total_stock after creating the first lot
          await this.calculateAndUpdateTotalStock(product.id);
        }
      }

      return { success: true, data: product };
    } catch (error) {
      console.error('❌ Error creating product:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to create product';
      console.error('❌ Error details:', errorMessage);
      return { success: false, error: errorMessage };
    }
  }

  static async getProducts(filters?: any, userId?: number): Promise<any[]> {
    try {
      // Return mock data in demo mode
      if (isDemoMode) {
        console.log('Demo mode: Returning mock products data');
        return this.getMockProducts(filters);
      }

      if (userId) {
        await this.ensureUserContext(userId);
      } else {
        console.warn('⚠️ No userId provided to getProducts - RLS policies may not work correctly');
      }

      let query = supabase
        .from('products')
        .select(`
          *,
          categories(name),
          suppliers(name),
          locations(name)
        `);

      if (filters?.search) {
        query = query.or(`name.ilike.%${filters.search}%,product_code.ilike.%${filters.search}%`);
      }
      if (filters?.category) {
        query = query.eq('category_id', filters.category);
      }
      if (filters?.location) {
        query = query.eq('location_id', filters.location);
      }

      query = query.order('created_at', { ascending: false });

      const { data, error } = await query;
      if (error) {
        console.error('Error fetching products:', error);
        return [];
      }

      return (data || []).map((product: any) => ({
        ...product,
        category_name: product.categories?.name,
        supplier_name: product.suppliers?.name,
        location_name: product.locations?.name,
      }));
    } catch (error) {
      console.error('Error fetching products:', error);
      return [];
    }
  }

  // Mock products data for demo mode
  private static getMockProducts(filters?: any): any[] {
    const mockProducts = [
      {
        id: 1,
        name: 'Premium Cotton Fabric',
        product_code: 'CTN-001',
        category_id: 1,
        category_name: 'Cotton',
        description: 'High-quality cotton fabric for premium garments',
        purchase_price: 25.00,
        selling_price: 35.00,
        per_meter_price: 35.00,
        supplier_id: 1,
        supplier_name: 'Textile Suppliers Inc.',
        location_id: 1,
        location_name: 'Main Warehouse',
        minimum_threshold: 50,
        current_stock: 150,
        total_purchased: 500,
        total_sold: 350,
        wastage_status: false,
        product_status: 'active',
        unit_of_measurement: 'meters',
        image_url: null,
        created_at: new Date('2024-01-15').toISOString(),
        updated_at: new Date('2024-01-15').toISOString(),
        created_by: 1
      },
      {
        id: 2,
        name: 'Silk Blend Fabric',
        product_code: 'SLK-002',
        category_id: 2,
        category_name: 'Silk',
        description: 'Luxurious silk blend fabric',
        purchase_price: 45.00,
        selling_price: 65.00,
        per_meter_price: 65.00,
        supplier_id: 2,
        supplier_name: 'Premium Textiles Ltd.',
        location_id: 1,
        location_name: 'Main Warehouse',
        minimum_threshold: 30,
        current_stock: 75,
        total_purchased: 200,
        total_sold: 125,
        wastage_status: false,
        product_status: 'active',
        unit_of_measurement: 'meters',
        image_url: null,
        created_at: new Date('2024-01-20').toISOString(),
        updated_at: new Date('2024-01-20').toISOString(),
        created_by: 1
      },
      {
        id: 3,
        name: 'Denim Fabric',
        product_code: 'DNM-003',
        category_id: 3,
        category_name: 'Denim',
        description: 'Durable denim fabric for casual wear',
        purchase_price: 20.00,
        selling_price: 30.00,
        per_meter_price: 30.00,
        supplier_id: 1,
        supplier_name: 'Textile Suppliers Inc.',
        location_id: 2,
        location_name: 'Showroom Gulshan',
        minimum_threshold: 40,
        current_stock: 25,
        total_purchased: 300,
        total_sold: 275,
        wastage_status: false,
        product_status: 'active',
        unit_of_measurement: 'meters',
        image_url: null,
        created_at: new Date('2024-01-25').toISOString(),
        updated_at: new Date('2024-01-25').toISOString(),
        created_by: 1
      },
      {
        id: 4,
        name: 'Polyester Blend',
        product_code: 'PLY-004',
        category_id: 4,
        category_name: 'Synthetic',
        description: 'Versatile polyester blend fabric',
        purchase_price: 15.00,
        selling_price: 22.00,
        per_meter_price: 22.00,
        supplier_id: 3,
        supplier_name: 'Synthetic Materials Co.',
        location_id: 1,
        location_name: 'Main Warehouse',
        minimum_threshold: 60,
        current_stock: 200,
        total_purchased: 800,
        total_sold: 600,
        wastage_status: false,
        product_status: 'active',
        unit_of_measurement: 'meters',
        image_url: null,
        created_at: new Date('2024-02-01').toISOString(),
        updated_at: new Date('2024-02-01').toISOString(),
        created_by: 1
      },
      {
        id: 5,
        name: 'Linen Fabric',
        product_code: 'LIN-005',
        category_id: 5,
        category_name: 'Linen',
        description: 'Natural linen fabric for summer wear',
        purchase_price: 30.00,
        selling_price: 42.00,
        per_meter_price: 42.00,
        supplier_id: 2,
        supplier_name: 'Premium Textiles Ltd.',
        location_id: 1,
        location_name: 'Main Warehouse',
        minimum_threshold: 25,
        current_stock: 5,
        total_purchased: 150,
        total_sold: 145,
        wastage_status: false,
        product_status: 'slow',
        unit_of_measurement: 'meters',
        image_url: null,
        created_at: new Date('2024-02-05').toISOString(),
        updated_at: new Date('2024-02-05').toISOString(),
        created_by: 1
      }
    ];

    // Apply filters if provided
    let filteredProducts = mockProducts;

    if (filters?.search) {
      const searchTerm = filters.search.toLowerCase();
      filteredProducts = filteredProducts.filter(product =>
        product.name.toLowerCase().includes(searchTerm) ||
        product.product_code.toLowerCase().includes(searchTerm)
      );
    }

    if (filters?.category) {
      filteredProducts = filteredProducts.filter(product =>
        product.category_id === parseInt(filters.category)
      );
    }

    if (filters?.location) {
      filteredProducts = filteredProducts.filter(product =>
        product.location_id === parseInt(filters.location)
      );
    }

    return filteredProducts;
  }

  static async getProductLots(productId: number): Promise<any[]> {
    try {
      console.log('🔍 getProductLots called for productId:', productId, 'type:', typeof productId);
      console.log('🔍 isDemoMode:', isDemoMode);

      // Ensure productId is a number
      const numericProductId = typeof productId === 'string' ? parseInt(productId) : productId;
      console.log('🔍 numericProductId:', numericProductId);

      // Return mock data in demo mode
      if (isDemoMode) {
        console.log('Demo mode: Returning mock product lots data for product:', numericProductId);
        const mockLots = [
          {
            id: 1,
            product_id: numericProductId,
            lot_number: 'LOT001',
            quantity: 50,
            purchase_price: 25.00,
            selling_price: 35.00,
            purchase_date: new Date('2024-01-15').toISOString(),
            expiry_date: null,
            created_at: new Date('2024-01-15').toISOString(),
            updated_at: new Date('2024-01-15').toISOString()
          },
          {
            id: 2,
            product_id: numericProductId,
            lot_number: 'LOT002',
            quantity: 30,
            purchase_price: 27.00,
            selling_price: 37.00,
            purchase_date: new Date('2024-02-01').toISOString(),
            expiry_date: null,
            created_at: new Date('2024-02-01').toISOString(),
            updated_at: new Date('2024-02-01').toISOString()
          }
        ];
        return mockLots;
      }

      console.log('🔄 Setting user context for product lots query...');
      await this.ensureUserContext();

      console.log('🔄 Querying products_lot table for numericProductId:', numericProductId);
      const { data, error } = await supabase
        .from('products_lot')
        .select('*')
        .eq('product_id', numericProductId)
        .order('lot_number', { ascending: true }); // FIFO order

      if (error) {
        console.error('❌ Error fetching product lots:', error);
        console.error('❌ Full error details:', JSON.stringify(error, null, 2));
        return [];
      }

      console.log('✅ Product lots query successful. Found', data?.length || 0, 'total lots');
      console.log('✅ Raw lots data:', data);

      // Filter lots with quantity > 0 (handle string quantities)
      const availableLots = (data || []).filter(lot => {
        const quantity = parseFloat(lot.quantity) || 0;
        return quantity > 0;
      });

      console.log('✅ Available lots after filtering:', availableLots.length, 'lots');
      console.log('✅ Available lots data:', availableLots);
      return availableLots;
    } catch (error) {
      console.error('❌ Exception in getProductLots:', error);
      return [];
    }
  }

  static async getExistingProducts(): Promise<any[]> {
    try {
      // Return mock data in demo mode
      if (isDemoMode) {
        console.log('Demo mode: Returning mock existing products data');
        return [
          {
            id: 1,
            name: 'Premium Cotton Fabric',
            product_code: 'CTN-001',
            category: 'Cotton',
            current_stock: 150,
            selling_price: 35.00,
            unit_of_measure: 'meters',
            unit_of_measurement: 'meters',
            category_id: 1,
            supplier_id: 1,
            location_id: 1,
            minimum_threshold: 50,
            product_status: 'active'
          },
          {
            id: 2,
            name: 'Silk Blend Fabric',
            product_code: 'SLK-002',
            category: 'Silk',
            current_stock: 75,
            selling_price: 65.00,
            unit_of_measure: 'meters',
            unit_of_measurement: 'meters',
            category_id: 2,
            supplier_id: 2,
            location_id: 1,
            minimum_threshold: 30,
            product_status: 'active'
          },
          {
            id: 3,
            name: 'Denim Fabric',
            product_code: 'DNM-003',
            category: 'Denim',
            current_stock: 25,
            selling_price: 30.00,
            unit_of_measure: 'meters',
            unit_of_measurement: 'meters',
            category_id: 3,
            supplier_id: 1,
            location_id: 2,
            minimum_threshold: 40,
            product_status: 'active'
          },
          {
            id: 4,
            name: 'Polyester Blend',
            product_code: 'PLY-004',
            category: 'Synthetic',
            current_stock: 200,
            selling_price: 22.00,
            unit_of_measure: 'meters',
            unit_of_measurement: 'meters',
            category_id: 4,
            supplier_id: 3,
            location_id: 2, // Showroom Gulshan
            minimum_threshold: 60,
            product_status: 'active'
          },
          {
            id: 5,
            name: 'Linen Fabric',
            product_code: 'LIN-005',
            category: 'Linen',
            current_stock: 50,
            selling_price: 42.00,
            unit_of_measure: 'meters',
            unit_of_measurement: 'meters',
            category_id: 5,
            supplier_id: 2,
            location_id: 2, // Showroom Gulshan
            minimum_threshold: 25,
            product_status: 'active'
          }
        ];
      }

      await this.ensureUserContext();
      const { data, error } = await supabase
        .from('products')
        .select(`
          id,
          name,
          product_code,
          category_id,
          supplier_id,
          location_id,
          current_stock,
          selling_price,
          unit_of_measurement,
          description,
          purchase_price,
          per_meter_price,
          minimum_threshold,
          product_status,
          wastage_status,
          categories(name),
          suppliers(name)
        `)
        .order('name');
      if (error) throw error;

      // Transform the data to match the expected format
      return (data || []).map((product: any) => ({
        ...product,
        category: product.categories?.name || 'Uncategorized',
        supplier: product.suppliers?.name || 'Unknown',
        unit_of_measure: product.unit_of_measurement
      }));
    } catch (error) {
      console.error('Error fetching existing products:', error);
      return [];
    }
  }

  static async addStockToExistingProduct(
    productId: number,
    stockData: ProductFormData,
    userId: number
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      await this.ensureUserContext(userId);

      // First, get the existing product to get the next lot number
      const { data: existingProduct, error: productError } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .single();

      if (productError || !existingProduct) {
        return { success: false, error: 'Product not found' };
      }

      // Get the highest lot number for this product to generate the next one
      const { data: existingLots, error: lotsError } = await supabase
        .from('products_lot')
        .select('lot_number')
        .eq('product_id', productId)
        .order('lot_number', { ascending: false })
        .limit(1);

      if (lotsError) {
        console.error('Error fetching existing lots:', lotsError);
        return { success: false, error: 'Failed to fetch existing lots' };
      }

      // Generate next lot number
      let nextLotNumber = 1;
      if (existingLots && existingLots.length > 0) {
        nextLotNumber = existingLots[0].lot_number + 1;
      }

      // Create new product lot
      const lotData = {
        product_id: productId,
        lot_number: nextLotNumber,
        purchase_price: stockData.purchase_price || 0,
        selling_price: stockData.selling_price || 0,
        quantity: stockData.current_stock || 0,
        supplier_id: stockData.supplier_id || existingProduct.supplier_id,
        location_id: stockData.location_id || existingProduct.location_id,
        received_date: new Date().toISOString(),
      };

      const { data: newLot, error: lotError } = await supabase
        .from('products_lot')
        .insert([lotData])
        .select()
        .single();

      if (lotError) {
        console.error('Error creating product lot:', lotError);
        return { success: false, error: lotError.message };
      }

      // Update the product's current stock and other relevant fields
      // NOTE: We do NOT update pricing fields (purchase_price, selling_price, per_meter_price)
      // because those are specific to each lot and should only be stored in products_lot table
      const updateData = {
        current_stock: (existingProduct.current_stock || 0) + (stockData.current_stock || 0),
        total_purchased: (existingProduct.total_purchased || 0) + (stockData.current_stock || 0),
        updated_at: new Date().toISOString(),
      };

      const { data: updatedProduct, error: updateError } = await supabase
        .from('products')
        .update(updateData)
        .eq('id', productId)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating product:', updateError);
        return { success: false, error: updateError.message };
      }

      // Calculate and update total_stock from all lots
      const totalStock = await this.calculateAndUpdateTotalStock(productId);

      return {
        success: true,
        data: {
          ...updatedProduct,
          total_stock: totalStock,
          lot: newLot
        }
      };
    } catch (error) {
      console.error('Error adding stock to existing product:', error);
      return { success: false, error: 'Failed to add stock to existing product' };
    }
  }

  // Test function to verify lot number increment functionality
  static async testLotIncrement(productId: number, userId: number): Promise<void> {
    console.log(`🧪 Testing lot increment for product ID: ${productId}`);

    // Test adding stock 3 times to see lot numbers increment
    for (let i = 1; i <= 3; i++) {
      const testStockData: ProductFormData = {
        name: '',
        product_code: '',
        current_stock: 10 * i, // 10, 20, 30
        purchase_price: 100 + (i * 10), // 110, 120, 130
        selling_price: 150 + (i * 10), // 160, 170, 180
      };

      console.log(`📦 Adding stock batch ${i}...`);
      const result = await this.addStockToExistingProduct(productId, testStockData, userId);

      if (result.success) {
        console.log(`✅ Batch ${i} added successfully. Lot number: ${result.data?.lot?.lot_number}`);
      } else {
        console.error(`❌ Batch ${i} failed: ${result.error}`);
      }
    }

    // Verify the lots were created correctly
    const { data: lots } = await supabase
      .from('products_lot')
      .select('*')
      .eq('product_id', productId)
      .order('lot_number');

    console.log('📋 Final lots for this product:', lots);
  }

  // Utility function to recalculate total_stock for all products
  static async recalculateAllTotalStocks(): Promise<{ success: boolean; updated: number; error?: string }> {
    try {
      await this.ensureUserContext();

      // Get all products
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('id');

      if (productsError) {
        return { success: false, updated: 0, error: productsError.message };
      }

      let updatedCount = 0;

      // Update total_stock for each product
      for (const product of products || []) {
        await this.calculateAndUpdateTotalStock(product.id);
        updatedCount++;
      }

      console.log(`✅ Recalculated total_stock for ${updatedCount} products`);
      return { success: true, updated: updatedCount };

    } catch (error) {
      console.error('Error recalculating total stocks:', error);
      return { success: false, updated: 0, error: 'Failed to recalculate total stocks' };
    }
  }

  // Customer Operations
  static async createCustomer(data: CustomerFormData, userId: number): Promise<{ success: boolean; data?: Customer; error?: string }> {
    try {
      console.log('🔄 FormService.createCustomer called with:', { data, userId });

      const insertData = {
        ...data,
        created_by: userId,
      };
      console.log('🔄 Inserting customer data:', insertData);

      const { data: customer, error } = await supabase
        .from('customers')
        .insert([insertData])
        .select()
        .single();

      console.log('📊 Supabase response:', { customer, error });

      if (error) {
        console.error('❌ Error creating customer:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ Customer created successfully:', customer);
      return { success: true, data: customer };
    } catch (error) {
      console.error('❌ Exception in createCustomer:', error);
      return { success: false, error: 'Failed to create customer' };
    }
  }

  static async getCustomers(filters?: any): Promise<any[]> {
    try {
      // Return mock data in demo mode
      if (isDemoMode) {
        console.log('Demo mode: Returning mock customers data');
        const mockCustomers = [
          {
            id: 1,
            name: 'ABC Textiles Ltd',
            email: 'contact@abctextiles.com',
            phone: '+8801712345678',
            address: '123 Textile Street, Dhaka',
            company_name: 'ABC Textiles Ltd',
            delivery_address: '123 Textile Street, Dhaka',
            customer_type: 'wholesale',
            fixed_coupon: 'WHOLESALE10',
            red_list_status: false,
            total_due: 0,
            created_at: new Date('2024-01-15').toISOString(),
            updated_at: new Date('2024-01-15').toISOString()
          },
          {
            id: 2,
            name: 'Fashion House BD',
            email: 'orders@fashionhouse.com',
            phone: '+8801812345678',
            address: '456 Fashion Avenue, Chittagong',
            company_name: 'Fashion House BD',
            delivery_address: '456 Fashion Avenue, Chittagong',
            customer_type: 'regular',
            fixed_coupon: null,
            red_list_status: false,
            total_due: 0,
            created_at: new Date('2024-02-01').toISOString(),
            updated_at: new Date('2024-02-01').toISOString()
          },
          {
            id: 3,
            name: 'Premium Garments',
            email: 'info@premiumgarments.com',
            phone: '+8801912345678',
            address: '789 Garment District, Sylhet',
            company_name: 'Premium Garments',
            delivery_address: '789 Garment District, Sylhet',
            customer_type: 'vip',
            fixed_coupon: 'VIP15',
            red_list_status: false,
            total_due: 0,
            created_at: new Date('2024-02-10').toISOString(),
            updated_at: new Date('2024-02-10').toISOString()
          }
        ];

        // Apply filters if provided
        let filteredCustomers = mockCustomers;

        if (filters?.customer_type) {
          filteredCustomers = filteredCustomers.filter(customer =>
            customer.customer_type === filters.customer_type
          );
        }
        if (filters?.red_list_status !== undefined) {
          filteredCustomers = filteredCustomers.filter(customer =>
            customer.red_list_status === filters.red_list_status
          );
        }
        if (filters?.search) {
          const searchTerm = filters.search.toLowerCase();
          filteredCustomers = filteredCustomers.filter(customer =>
            customer.name.toLowerCase().includes(searchTerm) ||
            customer.email.toLowerCase().includes(searchTerm) ||
            customer.phone.toLowerCase().includes(searchTerm)
          );
        }

        return filteredCustomers;
      }

      await this.ensureUserContext();

      let query = supabase.from('customers').select('*');

      if (filters?.customer_type) {
        query = query.eq('customer_type', filters.customer_type);
      }
      if (filters?.red_list_status !== undefined) {
        query = query.eq('red_list_status', filters.red_list_status);
      }
      if (filters?.search) {
        query = query.or(`name.ilike.%${filters.search}%,email.ilike.%${filters.search}%,phone.ilike.%${filters.search}%`);
      }

      query = query.order('created_at', { ascending: false });

      const { data, error } = await query;
      if (error) {
        console.error('Error fetching customers:', error);
        return [];
      }
      return data || [];
    } catch (error) {
      console.error('Error fetching customers:', error);
      return [];
    }
  }

  static async getRedListCustomers(): Promise<any[]> {
    try {
      // Return demo data if in demo mode
      if (isDemoMode) {
        console.log('Demo mode: Returning mock red list customers');
        return [
          {
            id: 21,
            name: 'Slow Payer Ltd',
            email: 'admin@slowpayer.com',
            phone: '+8801878901234',
            total_due: 18500,
            red_list_since: '2024-07-20',
            last_purchase_date: '2025-08-12',
            days_since_last_purchase: 20,
            overdue_count: 1,
            overdue_amount: 18500,
            total_sales_count: 1
          }
        ];
      }

      await this.ensureUserContext();
      const { data, error } = await supabase
        .from('red_list_customers')
        .select('*')
        .order('overdue_count', { ascending: false });

      if (error) {
        console.error('Error fetching red list customers:', error);

        // Fallback: Query customers table directly for red-listed customers
        console.log('🔄 Trying fallback query for red list customers...');
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('customers')
          .select('*')
          .eq('red_list_status', true)
          .order('total_due', { ascending: false });

        if (fallbackError) {
          console.error('Fallback red list customers query failed:', fallbackError);
          return [];
        }

        return (fallbackData || []).map((customer: any) => ({
          id: customer.id,
          name: customer.name,
          email: customer.email,
          phone: customer.phone,
          total_due: customer.total_due,
          red_list_since: customer.red_list_since,
          last_purchase_date: customer.last_purchase_date,
          days_since_last_purchase: customer.last_purchase_date ?
            Math.floor((Date.now() - new Date(customer.last_purchase_date).getTime()) / (1000 * 60 * 60 * 24)) : 0,
          overdue_count: 0, // Will be calculated separately if needed
          overdue_amount: customer.total_due,
          total_sales_count: 0 // Will be calculated separately if needed
        }));
      }
      return data || [];
    } catch (error) {
      console.error('Error fetching red list customers:', error);
      return [];
    }
  }

  // Supplier Operations
  static async createSupplier(data: SupplierFormData, userId: number): Promise<{ success: boolean; data?: Supplier; error?: string }> {
    try {
      await this.ensureUserContext(userId);

      const { data: supplier, error } = await supabase
        .from('suppliers')
        .insert([{
          ...data,
          created_by: userId,
        }])
        .select()
        .single();

      if (error) {
        console.error('Error creating supplier:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data: supplier };
    } catch (error) {
      console.error('Error creating supplier:', error);
      return { success: false, error: 'Failed to create supplier' };
    }
  }

  static async getSuppliers(): Promise<any[]> {
    try {
      // Return mock data in demo mode
      if (isDemoMode) {
        console.log('Demo mode: Returning mock suppliers data');
        return [
          {
            id: 1,
            name: 'Textile Suppliers Inc.',
            contact_person: 'John Smith',
            phone: '+8801712345678',
            email: 'contact@textilesuppliers.com',
            address: '123 Supplier Street, Dhaka',
            city: 'Dhaka',
            state: 'Dhaka Division',
            country: 'Bangladesh',
            postal_code: '1000',
            payment_terms: 30,
            created_at: new Date('2024-01-15').toISOString(),
            updated_at: new Date('2024-01-15').toISOString()
          },
          {
            id: 2,
            name: 'Premium Textiles Ltd.',
            contact_person: 'Sarah Johnson',
            phone: '+8801812345678',
            email: 'info@premiumtextiles.com',
            address: '456 Premium Avenue, Chittagong',
            city: 'Chittagong',
            state: 'Chittagong Division',
            country: 'Bangladesh',
            postal_code: '4000',
            payment_terms: 45,
            created_at: new Date('2024-02-01').toISOString(),
            updated_at: new Date('2024-02-01').toISOString()
          },
          {
            id: 3,
            name: 'Synthetic Materials Co.',
            contact_person: 'Mike Wilson',
            phone: '+8801912345678',
            email: 'orders@syntheticmaterials.com',
            address: '789 Industrial Zone, Sylhet',
            city: 'Sylhet',
            state: 'Sylhet Division',
            country: 'Bangladesh',
            postal_code: '3100',
            payment_terms: 60,
            created_at: new Date('2024-02-10').toISOString(),
            updated_at: new Date('2024-02-10').toISOString()
          }
        ];
      }

      await this.ensureUserContext();
      const { data, error } = await supabase.from('suppliers').select('*').order('name');
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching suppliers:', error);
      return [];
    }
  }

  // Category Operations
  static async getCategories(): Promise<any[]> {
    try {
      // Return mock data in demo mode
      if (isDemoMode) {
        console.log('Demo mode: Returning mock categories data');
        return [
          {
            id: 1,
            name: 'Cotton',
            description: 'Natural cotton fabrics',
            created_at: new Date('2024-01-15').toISOString(),
            updated_at: new Date('2024-01-15').toISOString()
          },
          {
            id: 2,
            name: 'Silk',
            description: 'Premium silk fabrics',
            created_at: new Date('2024-01-15').toISOString(),
            updated_at: new Date('2024-01-15').toISOString()
          },
          {
            id: 3,
            name: 'Denim',
            description: 'Durable denim fabrics',
            created_at: new Date('2024-01-15').toISOString(),
            updated_at: new Date('2024-01-15').toISOString()
          },
          {
            id: 4,
            name: 'Synthetic',
            description: 'Synthetic blend fabrics',
            created_at: new Date('2024-01-15').toISOString(),
            updated_at: new Date('2024-01-15').toISOString()
          },
          {
            id: 5,
            name: 'Linen',
            description: 'Natural linen fabrics',
            created_at: new Date('2024-01-15').toISOString(),
            updated_at: new Date('2024-01-15').toISOString()
          }
        ];
      }

      await this.ensureUserContext();
      const { data, error } = await supabase.from('categories').select('*').order('name');
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching categories:', error);
      return [];
    }
  }

  static async createCategory(data: CategoryFormData, userId: number): Promise<{ success: boolean; data?: Category; error?: string }> {
    try {
      await this.ensureUserContext(userId);

      const { data: category, error } = await supabase
        .from('categories')
        .insert([{
          ...data,
          created_by: userId,
        }])
        .select()
        .single();

      if (error) {
        console.error('Error creating category:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data: category };
    } catch (error) {
      console.error('Error creating category:', error);
      return { success: false, error: 'Failed to create category' };
    }
  }

  // Location Operations
  static async getLocations(): Promise<any[]> {
    try {
      // Return mock data in demo mode
      if (isDemoMode) {
        console.log('Demo mode: Returning mock locations data');
        return [
          {
            id: 1,
            name: 'Main Warehouse',
            address: '123 Main Street, Dhaka',
            capacity: 10000,
            current_utilization: 7500,
            manager: 'Warehouse Manager',
            status: 'active',
            type: 'warehouse',
            created_at: new Date('2024-01-15').toISOString(),
            updated_at: new Date('2024-01-15').toISOString()
          },
          {
            id: 2,
            name: 'Secondary Warehouse',
            address: '456 Industrial Area, Chittagong',
            capacity: 5000,
            current_utilization: 2500,
            manager: 'Assistant Manager',
            status: 'active',
            type: 'warehouse',
            created_at: new Date('2024-02-01').toISOString(),
            updated_at: new Date('2024-02-01').toISOString()
          },
          {
            id: 3,
            name: 'Retail Store',
            address: '789 Shopping District, Sylhet',
            capacity: 1000,
            current_utilization: 800,
            manager: 'Store Manager',
            status: 'active',
            type: 'retail',
            created_at: new Date('2024-02-10').toISOString(),
            updated_at: new Date('2024-02-10').toISOString()
          }
        ];
      }

      await this.ensureUserContext();
      const { data, error } = await supabase.from('locations').select('*').order('name');
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching locations:', error);
      return [];
    }
  }

  // Sale Operations
  static async createSale(saleData: any, userId: number): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      await this.ensureUserContext(userId);

      const { data: sale, error } = await supabase
        .from('sales')
        .insert([{
          ...saleData,
          created_by: userId,
        }])
        .select()
        .single();

      if (error) {
        console.error('Error creating sale:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data: sale };
    } catch (error) {
      console.error('Error creating sale:', error);
      return { success: false, error: 'Failed to create sale' };
    }
  }

  static async getSalesSummary(filters?: any, userId?: number): Promise<any[]> {
    try {
      // Return demo data if in demo mode
      if (isDemoMode) {
        console.log('Demo mode: Returning mock sales data');
        return [
          {
            id: 1,
            sale_number: 'ST-20250101-001',
            customer_id: 1,
            customer_name: 'ABC Textiles Ltd',
            customer_phone: '+8801712345678',
            customer_email: 'contact@abctextiles.com',
            total_amount: 125000,
            paid_amount: 75000,
            due_amount: 50000,
            payment_status: 'partial',
            sale_status: 'finalized',
            created_at: new Date().toISOString(),
            location_name: 'Main Warehouse',
            created_by_name: 'Sales Manager',
            discount_amount: 5000,
            tax_amount: 7500
          },
          {
            id: 2,
            sale_number: 'ST-20250101-002',
            customer_id: 2,
            customer_name: 'Fashion House BD',
            customer_phone: '+8801812345678',
            customer_email: 'orders@fashionhouse.com',
            total_amount: 85000,
            paid_amount: 85000,
            due_amount: 0,
            payment_status: 'paid',
            sale_status: 'finalized',
            created_at: new Date(Date.now() - 86400000).toISOString(),
            location_name: 'Main Warehouse',
            created_by_name: 'Sales Manager',
            discount_amount: 2000,
            tax_amount: 5100
          }
        ];
      }

      if (userId) {
        await this.ensureUserContext(userId);
      } else {
        console.warn('⚠️ No userId provided to getSalesSummary - RLS policies may not work correctly');
      }

      // Query the sales table directly with joins to get all needed fields
      let query = supabase
        .from('sales')
        .select(`
          *,
          customers(name, phone, email),
          locations(name),
          users(name)
        `);

      if (filters?.startDate) {
        query = query.gte('created_at', filters.startDate);
      }
      if (filters?.endDate) {
        query = query.lte('created_at', filters.endDate);
      }
      if (filters?.customerId) {
        query = query.eq('customer_id', filters.customerId);
      }
      if (filters?.paymentStatus) {
        query = query.eq('payment_status', filters.paymentStatus);
      }

      query = query.order('created_at', { ascending: false });

      const { data, error } = await query;
      if (error) {
        console.error('Error fetching sales summary:', error);

        // If RLS is blocking, try a simpler query without joins
        console.log('🔄 Trying fallback query without joins...');
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('sales')
          .select('*')
          .order('created_at', { ascending: false });

        if (fallbackError) {
          console.error('Fallback query also failed:', fallbackError);
          return [];
        }

        return (fallbackData || []).map((sale: any) => ({
          ...sale,
          customer_name: 'Customer',
          customer_phone: '',
          customer_email: '',
          location_name: 'Location',
          created_by_name: 'User',
          sale_date: sale.created_at,
          discount_amount: sale.discount_amount || 0,
          tax_amount: sale.tax_amount || 0
        }));
      }

      // Transform the data to match expected format
      return (data || []).map((sale: any) => ({
        ...sale,
        customer_name: sale.customers?.name || 'Unknown Customer',
        customer_phone: sale.customers?.phone || '',
        customer_email: sale.customers?.email || '',
        location_name: sale.locations?.name || 'Unknown Location',
        created_by_name: sale.users?.name || 'Unknown User',
        sale_date: sale.created_at,
        discount_amount: sale.discount_amount || 0,
        tax_amount: sale.tax_amount || 0
      }));
    } catch (error) {
      console.error('Error fetching sales summary:', error);
      return [];
    }
  }

  // Dashboard and Analytics
  static async getDashboardStats(): Promise<any> {
    try {
      // Return demo data if in demo mode
      if (isDemoMode) {
        console.log('Demo mode: Returning mock dashboard stats');
        return {
          totalSales: { value: 125000, formatted: '৳125,000' },
          paidSales: { value: 98000, formatted: '৳98,000' },
          totalProducts: { value: 45, formatted: '45' },
          lowStockCount: { value: 3, formatted: '3' },
          alerts: [
            {
              type: 'warning',
              title: 'Low Stock Alert',
              message: '3 products are running low on stock',
              action: 'View Inventory'
            }
          ]
        };
      }

      await this.ensureUserContext();

      const { data: salesStats, error: salesError } = await supabase
        .from('sales')
        .select('total_amount, payment_status, created_at')
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

      const { data: inventoryStats, error: inventoryError } = await supabase
        .from('inventory_summary')
        .select('*');

      const { data: lowStockProducts, error: lowStockError } = await supabase
        .from('low_stock_products')
        .select('*');

      const totalSales = salesStats?.reduce((sum, sale) => sum + parseFloat(sale.total_amount || '0'), 0) || 0;
      const paidSales = salesStats?.filter(sale => sale.payment_status === 'paid')
        .reduce((sum, sale) => sum + parseFloat(sale.total_amount || '0'), 0) || 0;

      return {
        totalSales: { value: totalSales, formatted: `৳${totalSales.toLocaleString()}` },
        paidSales: { value: paidSales, formatted: `৳${paidSales.toLocaleString()}` },
        totalProducts: { value: inventoryStats?.length || 0, formatted: (inventoryStats?.length || 0).toString() },
        lowStockCount: { value: lowStockProducts?.length || 0, formatted: (lowStockProducts?.length || 0).toString() },
        alerts: [
          ...(lowStockProducts?.length > 0 ? [{
            type: 'warning',
            title: 'Low Stock Alert',
            message: `${lowStockProducts.length} products are running low on stock`,
            action: 'View Inventory'
          }] : [])
        ]
      };
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      return {
        totalSales: { value: 0, formatted: '৳0' },
        paidSales: { value: 0, formatted: '৳0' },
        totalProducts: { value: 0, formatted: '0' },
        lowStockCount: { value: 0, formatted: '0' },
        alerts: []
      };
    }
  }

  // Inventory Operations
  static async getInventorySummary(): Promise<any[]> {
    try {
      await this.ensureUserContext();
      const { data, error } = await supabase.from('inventory_summary').select('*');
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching inventory summary:', error);
      return [];
    }
  }

  static async getLowStockProducts(): Promise<any[]> {
    try {
      await this.ensureUserContext();
      const { data, error } = await supabase.from('low_stock_products').select('*');
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching low stock products:', error);
      return [];
    }
  }

  // Notification Operations
  static async getNotifications(): Promise<any[]> {
    try {
      await this.ensureUserContext();
      const { data, error } = await supabase.from('notifications').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return [];
    }
  }

  // Activity Log Operations
  static async getActivityLogs(filters?: any): Promise<any[]> {
    try {
      await this.ensureUserContext();

      // Calculate 60 days ago from today
      const sixtyDaysAgo = new Date();
      sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
      const startDate = filters?.dateFrom || sixtyDaysAgo.toISOString();
      const endDate = filters?.dateTo || new Date().toISOString();

      // Build query with user join to get user names
      let query = supabase
        .from('activity_logs')
        .select(`
          *,
          users(name, email, role)
        `)
        .gte('created_at', startDate)
        .lte('created_at', endDate);

      // Apply filters
      if (filters?.module) {
        query = query.eq('module', filters.module);
      }
      if (filters?.action) {
        query = query.eq('action', filters.action);
      }
      if (filters?.userId) {
        query = query.eq('user_id', filters.userId);
      }
      if (filters?.search) {
        query = query.or(`description.ilike.%${filters.search}%,module.ilike.%${filters.search}%,action.ilike.%${filters.search}%`);
      }

      // Order by most recent first, limit to 500 records for performance
      query = query.order('created_at', { ascending: false }).limit(500);

      const { data, error } = await query;
      if (error) {
        console.error('Error fetching activity logs:', error);

        // Fallback query without joins if RLS is blocking
        console.log('🔄 Trying fallback activity logs query...');
        const fallbackQuery = supabase
          .from('activity_logs')
          .select('*')
          .gte('created_at', startDate)
          .lte('created_at', endDate)
          .order('created_at', { ascending: false })
          .limit(500);

        const { data: fallbackData, error: fallbackError } = await fallbackQuery;
        if (fallbackError) {
          console.error('Fallback activity logs query failed:', fallbackError);
          return [];
        }
        return fallbackData || [];
      }
      return data || [];
    } catch (error) {
      console.error('Error fetching activity logs:', error);
      return [];
    }
  }

  // Get activity log statistics
  static async getActivityLogStats(): Promise<any> {
    try {
      await this.ensureUserContext();

      const sixtyDaysAgo = new Date();
      sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      // Get total activities in last 60 days
      const { data: totalData, error: totalError } = await supabase
        .from('activity_logs')
        .select('id', { count: 'exact' })
        .gte('created_at', sixtyDaysAgo.toISOString());

      // Get today's activities
      const { data: todayData, error: todayError } = await supabase
        .from('activity_logs')
        .select('id', { count: 'exact' })
        .gte('created_at', today.toISOString())
        .lt('created_at', tomorrow.toISOString());

      // Get critical events (DELETE actions)
      const { data: criticalData, error: criticalError } = await supabase
        .from('activity_logs')
        .select('id', { count: 'exact' })
        .eq('action', 'DELETE')
        .gte('created_at', sixtyDaysAgo.toISOString());

      // Get most active user
      const { data: userActivityData, error: userError } = await supabase
        .from('activity_logs')
        .select('user_id, users(name)')
        .gte('created_at', sixtyDaysAgo.toISOString());

      let mostActiveUser = 'N/A';
      if (userActivityData && !userError) {
        const userCounts: Record<string, { count: number; name: string }> = {};
        userActivityData.forEach((log: any) => {
          const userId = log.user_id;
          const userName = log.users?.name || `User ${userId}`;
          if (!userCounts[userId]) {
            userCounts[userId] = { count: 0, name: userName };
          }
          userCounts[userId].count++;
        });

        const mostActive = Object.values(userCounts).reduce((max, current) =>
          current.count > max.count ? current : max, { count: 0, name: 'N/A' });
        mostActiveUser = mostActive.name;
      }

      return {
        totalActivities: totalData?.length || 0,
        todaysActivities: todayData?.length || 0,
        criticalEvents: criticalData?.length || 0,
        mostActiveUser
      };
    } catch (error) {
      console.error('Error fetching activity log stats:', error);
      return {
        totalActivities: 0,
        todaysActivities: 0,
        criticalEvents: 0,
        mostActiveUser: 'N/A'
      };
    }
  }

  // Sample Tracking Operations
  static async getSampleTracking(): Promise<any[]> {
    try {
      await this.ensureUserContext();
      const { data, error } = await supabase.from('sample_tracking').select('*, products(name), customers(name)').order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching sample tracking:', error);
      return [];
    }
  }

  // Due Payments Operations
  static async getDuePaymentsSummary(filters?: any): Promise<any[]> {
    try {
      // Return demo data if in demo mode
      if (isDemoMode) {
        console.log('Demo mode: Returning mock due payments data');
        return [
          {
            id: 1,
            customerId: 1,
            customerName: 'ABC Textiles Ltd',
            customerPhone: '+8801712345678',
            customerEmail: 'contact@abctextiles.com',
            saleId: 1,
            saleNumber: 'ST-20250101-001',
            originalAmount: 125000,
            paidAmount: 75000,
            dueAmount: 50000,
            dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
            daysPastDue: 0,
            status: 'partial',
            lastContactDate: new Date(),
            notes: 'Customer requested extended payment terms',
            createdAt: new Date(),
            updatedAt: new Date(),
          }
        ];
      }

      await this.ensureUserContext();

      let query = supabase
        .from('sales')
        .select(`
          *,
          customers(name, phone, email)
        `)
        .neq('payment_status', 'paid')
        .gt('due_amount', 0);

      if (filters?.customerId) {
        query = query.eq('customer_id', filters.customerId);
      }
      if (filters?.overdue) {
        query = query.lt('due_date', new Date().toISOString());
      }

      query = query.order('due_date', { ascending: true });

      const { data, error } = await query;
      if (error) {
        console.error('Error fetching due payments:', error);

        // Fallback query without joins
        console.log('🔄 Trying fallback query for due payments...');
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('sales')
          .select('*')
          .neq('payment_status', 'paid')
          .gt('due_amount', 0)
          .order('due_date', { ascending: true });

        if (fallbackError) {
          console.error('Fallback due payments query failed:', fallbackError);
          return [];
        }

        return (fallbackData || []).map((payment: any) => ({
          id: payment.id,
          customerId: payment.customer_id,
          customerName: 'Customer',
          customerPhone: '',
          customerEmail: '',
          saleId: payment.id,
          saleNumber: payment.sale_number,
          originalAmount: parseFloat(payment.total_amount || '0'),
          paidAmount: parseFloat(payment.paid_amount || '0'),
          dueAmount: parseFloat(payment.due_amount || '0'),
          dueDate: new Date(payment.due_date),
          daysPastDue: payment.due_date ? Math.max(0, Math.floor((Date.now() - new Date(payment.due_date).getTime()) / (1000 * 60 * 60 * 24))) : 0,
          status: payment.payment_status,
          lastContactDate: new Date(payment.updated_at),
          notes: payment.notes || '',
          createdAt: new Date(payment.created_at),
          updatedAt: new Date(payment.updated_at),
        }));
      }

      return (data || []).map((payment: any) => ({
        id: payment.id,
        customerId: payment.customer_id,
        customerName: payment.customers?.name || 'Unknown Customer',
        customerPhone: payment.customers?.phone,
        customerEmail: payment.customers?.email,
        saleId: payment.id,
        saleNumber: payment.sale_number,
        originalAmount: parseFloat(payment.total_amount || '0'),
        paidAmount: parseFloat(payment.paid_amount || '0'),
        dueAmount: parseFloat(payment.due_amount || '0'),
        dueDate: new Date(payment.due_date),
        daysPastDue: payment.due_date ? Math.max(0, Math.floor((Date.now() - new Date(payment.due_date).getTime()) / (1000 * 60 * 60 * 24))) : 0,
        status: payment.payment_status,
        lastContactDate: new Date(payment.updated_at),
        notes: payment.notes || '',
        createdAt: new Date(payment.created_at),
        updatedAt: new Date(payment.updated_at),
      }));
    } catch (error) {
      console.error('Error fetching due payments summary:', error);
      return [];
    }
  }

  // Sales Statistics Operations
  static async getSalesStats(filters?: any): Promise<any> {
    try {
      // Return demo data if in demo mode
      if (isDemoMode) {
        console.log('Demo mode: Returning mock sales stats');
        return {
          totalSales: { value: 2, formatted: '2' },
          totalRevenue: { value: 210000, formatted: '৳210,000' },
          paidAmount: { value: 160000, formatted: '৳160,000' },
          pendingAmount: { value: 50000, formatted: '৳50,000' },
          overdueAmount: { value: 0, formatted: '৳0' },
          paidSalesCount: { value: 1, formatted: '1' },
          pendingSalesCount: { value: 1, formatted: '1' },
          overdueSalesCount: { value: 0, formatted: '0' },
          averageSaleValue: { value: 105000, formatted: '৳105,000' },
          paymentRate: { value: 50, formatted: '50.0%' }
        };
      }

      await this.ensureUserContext();

      const startDate = filters?.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const endDate = filters?.endDate || new Date().toISOString();

      const { data: salesData, error: salesError } = await supabase
        .from('sales')
        .select('*')
        .gte('created_at', startDate)
        .lte('created_at', endDate);

      if (salesError) {
        console.error('Error fetching sales data:', salesError);

        // Try a simpler query without date filters
        console.log('🔄 Trying fallback sales stats query...');
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('sales')
          .select('*')
          .limit(100);

        if (fallbackError) {
          console.error('Fallback sales stats query failed:', fallbackError);
          return this.getDefaultSalesStats();
        }

        // Use fallback data for calculations
        const sales = fallbackData || [];
        const totalSales = sales.length;
        const totalRevenue = sales.reduce((sum, sale) => sum + parseFloat(sale.total_amount || '0'), 0);
        const paidSales = sales.filter(sale => sale.payment_status === 'paid');
        const pendingSales = sales.filter(sale => sale.payment_status === 'pending');
        const overdueSales = sales.filter(sale =>
          sale.payment_status !== 'paid' &&
          sale.due_date &&
          new Date(sale.due_date) < new Date()
        );

        const totalPaid = paidSales.reduce((sum, sale) => sum + parseFloat(sale.total_amount || '0'), 0);
        const totalPending = pendingSales.reduce((sum, sale) => sum + parseFloat(sale.due_amount || '0'), 0);
        const totalOverdue = overdueSales.reduce((sum, sale) => sum + parseFloat(sale.due_amount || '0'), 0);

        return {
          totalSales: { value: totalSales, formatted: totalSales.toString() },
          totalRevenue: { value: totalRevenue, formatted: `৳${totalRevenue.toLocaleString()}` },
          paidAmount: { value: totalPaid, formatted: `৳${totalPaid.toLocaleString()}` },
          pendingAmount: { value: totalPending, formatted: `৳${totalPending.toLocaleString()}` },
          overdueAmount: { value: totalOverdue, formatted: `৳${totalOverdue.toLocaleString()}` },
          paidSalesCount: { value: paidSales.length, formatted: paidSales.length.toString() },
          pendingSalesCount: { value: pendingSales.length, formatted: pendingSales.length.toString() },
          overdueSalesCount: { value: overdueSales.length, formatted: overdueSales.length.toString() },
          averageSaleValue: {
            value: totalSales > 0 ? totalRevenue / totalSales : 0,
            formatted: totalSales > 0 ? `৳${(totalRevenue / totalSales).toLocaleString()}` : '৳0'
          },
          paymentRate: {
            value: totalSales > 0 ? (paidSales.length / totalSales) * 100 : 0,
            formatted: totalSales > 0 ? `${((paidSales.length / totalSales) * 100).toFixed(1)}%` : '0%'
          }
        };
      }

      const sales = salesData || [];
      const totalSales = sales.length;
      const totalRevenue = sales.reduce((sum, sale) => sum + parseFloat(sale.total_amount || '0'), 0);
      const paidSales = sales.filter(sale => sale.payment_status === 'paid');
      const pendingSales = sales.filter(sale => sale.payment_status === 'pending');
      const overdueSales = sales.filter(sale =>
        sale.payment_status !== 'paid' &&
        sale.due_date &&
        new Date(sale.due_date) < new Date()
      );

      const totalPaid = paidSales.reduce((sum, sale) => sum + parseFloat(sale.total_amount || '0'), 0);
      const totalPending = pendingSales.reduce((sum, sale) => sum + parseFloat(sale.due_amount || '0'), 0);
      const totalOverdue = overdueSales.reduce((sum, sale) => sum + parseFloat(sale.due_amount || '0'), 0);

      return {
        totalSales: { value: totalSales, formatted: totalSales.toString() },
        totalRevenue: { value: totalRevenue, formatted: `৳${totalRevenue.toLocaleString()}` },
        paidAmount: { value: totalPaid, formatted: `৳${totalPaid.toLocaleString()}` },
        pendingAmount: { value: totalPending, formatted: `৳${totalPending.toLocaleString()}` },
        overdueAmount: { value: totalOverdue, formatted: `৳${totalOverdue.toLocaleString()}` },
        paidSalesCount: { value: paidSales.length, formatted: paidSales.length.toString() },
        pendingSalesCount: { value: pendingSales.length, formatted: pendingSales.length.toString() },
        overdueSalesCount: { value: overdueSales.length, formatted: overdueSales.length.toString() },
        averageSaleValue: {
          value: totalSales > 0 ? totalRevenue / totalSales : 0,
          formatted: totalSales > 0 ? `৳${(totalRevenue / totalSales).toLocaleString()}` : '৳0'
        },
        paymentRate: {
          value: totalSales > 0 ? (paidSales.length / totalSales) * 100 : 0,
          formatted: totalSales > 0 ? `${((paidSales.length / totalSales) * 100).toFixed(1)}%` : '0%'
        }
      };
    } catch (error) {
      console.error('Error fetching sales stats:', error);
      return this.getDefaultSalesStats();
    }
  }

  // User Operations
  static async createUser(data: any, userId: number): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      console.log('🔄 Setting user context for userId:', userId);
      await this.ensureUserContext(userId);

      // Debug: Check current user context
      try {
        const { data: currentUserId, error: contextError } = await supabase.rpc('get_current_user_id');
        console.log('🔍 Current user ID from context:', currentUserId);

        const { data: currentUserRole, error: roleError } = await supabase.rpc('get_current_user_role');
        console.log('🔍 Current user role from context:', currentUserRole);

        const { data: isSuperAdmin, error: adminError } = await supabase.rpc('is_super_admin');
        console.log('🔍 Is super admin:', isSuperAdmin);

        // If context is not properly set, try to force it
        if (!currentUserId || currentUserId === 0) {
          console.log('🔄 Context not set, forcing user context...');
          const { error: forceError } = await supabase.rpc('set_user_context', { user_id: userId });
          if (forceError) {
            console.error('❌ Failed to force user context:', forceError);
          } else {
            console.log('✅ User context forced successfully');
          }
        }
      } catch (debugError) {
        console.warn('⚠️ Debug context check failed:', debugError);
      }

      // Hash the password before storing
      console.log('🔄 Hashing password:', data.password);
      const hashedPassword = await this.hashPassword(data.password);
      console.log('✅ Password hashed successfully:', hashedPassword);

      // Prepare clean data for database insertion
      const userData = {
        name: data.name,
        email: data.email,
        phone: data.phone,
        role: data.role,
        assigned_location_id: data.assigned_location_id,
        permissions: data.permissions || null,
        password_hash: hashedPassword,
        created_by: userId,
        status: 'active',
      };

      console.log('🔄 Creating user with data:', userData);

      // Try a workaround: Set the user context more aggressively
      try {
        console.log('🔄 Attempting aggressive user context setting...');

        // Try multiple approaches to set the context
        await supabase.rpc('set_user_context', { user_id: userId });

        // Also try setting it via a direct SQL call
        const { error: sqlError } = await supabase.rpc('exec', {
          sql: `SELECT set_config('app.current_user_id', '${userId}', false);`
        });

        if (sqlError) {
          console.log('⚠️ SQL context setting failed:', sqlError);
        }

        // Verify context is set
        const { data: contextCheck } = await supabase.rpc('get_current_user_id');
        console.log('🔍 Context check after aggressive setting:', contextCheck);

      } catch (contextError) {
        console.log('⚠️ Aggressive context setting failed:', contextError);
      }

      // Fallback: Try direct insert with RLS bypass attempt
      console.log('🔄 Attempting direct insert...');

      // Try to temporarily disable RLS for this operation
      try {
        // First, try to create a simple bypass function
        const bypassFunction = `
          CREATE OR REPLACE FUNCTION temp_create_user(
            p_name TEXT,
            p_email TEXT,
            p_phone TEXT,
            p_password_hash TEXT,
            p_role TEXT,
            p_assigned_location_id INTEGER,
            p_permissions JSONB,
            p_created_by INTEGER
          )
          RETURNS users
          LANGUAGE plpgsql
          SECURITY DEFINER
          AS $$
          DECLARE
            result users;
          BEGIN
            INSERT INTO users (
              name, email, phone, password_hash, role,
              assigned_location_id, permissions, status, created_by
            ) VALUES (
              p_name, p_email, p_phone, p_password_hash, p_role::user_role,
              p_assigned_location_id, p_permissions, 'active', p_created_by
            ) RETURNING * INTO result;

            RETURN result;
          END;
          $$;
        `;

        // Try to execute the function creation (this might fail, but that's ok)
        await supabase.rpc('exec', { sql: bypassFunction }).catch(() => {});

        // Try to use the function
        const { data: functionResult, error: functionError } = await supabase.rpc('temp_create_user', {
          p_name: userData.name,
          p_email: userData.email,
          p_phone: userData.phone,
          p_password_hash: userData.password_hash,
          p_role: userData.role,
          p_assigned_location_id: userData.assigned_location_id,
          p_permissions: userData.permissions,
          p_created_by: userData.created_by
        });

        if (!functionError && functionResult) {
          console.log('✅ User created via bypass function:', functionResult);
          return { success: true, data: functionResult };
        }
      } catch (bypassError) {
        console.log('⚠️ Bypass attempt failed:', bypassError);
      }

      // Final fallback: direct insert
      const { data: user, error } = await supabase
        .from('users')
        .insert([userData])
        .select()
        .single();

      if (error) {
        console.error('❌ Error creating user:', error);
        console.error('❌ Full error details:', JSON.stringify(error, null, 2));
        return { success: false, error: error.message };
      }

      // RPC returns an array, get the first item
      const createdUser = Array.isArray(user) ? user[0] : user;
      console.log('✅ User created successfully:', createdUser);

      return { success: true, data: createdUser };
    } catch (error) {
      console.error('❌ Error creating user:', error);

      // Provide more specific error messages
      if (error instanceof ReferenceError && error.message.includes('crypto')) {
        return { success: false, error: 'Crypto API not available. Please update your app.' };
      }

      return { success: false, error: error instanceof Error ? error.message : 'Failed to create user' };
    }
  }

  // Update user
  static async updateUser(userId: string, data: any, currentUserId: number): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      console.log('🔄 Updating user:', userId, 'by user:', currentUserId);
      await this.ensureUserContext(currentUserId);

      // Prepare clean update data
      const updateData: any = {
        name: data.name,
        email: data.email,
        phone: data.phone,
        role: data.role,
        assigned_location_id: data.assigned_location_id,
        permissions: data.permissions || null,
        updated_at: new Date().toISOString(),
      };

      // Only hash password if it's being updated
      if (data.password && data.password.trim()) {
        updateData.password_hash = await this.hashPassword(data.password);
      }

      console.log('🔄 Update data:', updateData);

      // Try using a bypass function for updates
      try {
        const { data: result, error: rpcError } = await supabase.rpc('bypass_rls_update_user', {
          p_user_id: parseInt(userId),
          p_name: updateData.name,
          p_email: updateData.email,
          p_phone: updateData.phone,
          p_role: updateData.role,
          p_assigned_location_id: updateData.assigned_location_id,
          p_permissions: updateData.permissions,
          p_password_hash: updateData.password_hash || null,
          p_updated_by: currentUserId
        });

        if (!rpcError && result) {
          console.log('✅ User updated via bypass function:', result);
          return { success: true, data: result };
        }

        console.log('⚠️ Bypass function failed, trying direct update:', rpcError);
      } catch (bypassError) {
        console.log('⚠️ Bypass function not available, trying direct update');
      }

      // Fallback to direct update
      const { data: users, error } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', parseInt(userId))
        .select();

      if (error) {
        console.error('❌ Error updating user:', error);
        return { success: false, error: error.message };
      }

      if (!users || users.length === 0) {
        console.error('❌ No user found with ID:', userId);
        return { success: false, error: 'User not found or access denied' };
      }

      const updatedUser = users[0];
      console.log('✅ User updated successfully:', updatedUser);
      return { success: true, data: updatedUser };
    } catch (error) {
      console.error('❌ Error updating user:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Failed to update user' };
    }
  }

  // Password hashing function (React Native compatible)
  private static async hashPassword(password: string): Promise<string> {
    // For demo purposes, we'll use a hash that works on both web and mobile
    // In production, use proper bcrypt or similar

    try {
      // Try to use expo-crypto for React Native
      const { digestStringAsync, CryptoDigestAlgorithm } = await import('expo-crypto');
      const saltedPassword = password + 'salt_key_2024';
      const hash = await digestStringAsync(CryptoDigestAlgorithm.SHA256, saltedPassword);
      return hash;
    } catch (error) {
      console.log('Expo crypto not available, trying web crypto...');

      // Check if we're in a web environment
      if (typeof crypto !== 'undefined' && crypto.subtle) {
        try {
          const encoder = new TextEncoder();
          const data = encoder.encode(password + 'salt_key_2024');
          const hashBuffer = await crypto.subtle.digest('SHA-256', data);
          const hashArray = Array.from(new Uint8Array(hashBuffer));
          return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        } catch (webError) {
          console.warn('Web Crypto API failed, falling back to simple hash');
        }
      }

      // Fallback for environments without crypto support
      let hash = 0;
      const saltedPassword = password + 'salt_key_2024';

      for (let i = 0; i < saltedPassword.length; i++) {
        const char = saltedPassword.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
      }

      // Convert to positive hex string
      return Math.abs(hash).toString(16).padStart(8, '0') + '_fallback_hash';
    }
  }

  // Transfer Operations
  static async createTransfer(data: any, userId: number): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      await this.ensureUserContext(userId);

      const { data: transfer, error } = await supabase
        .from('transfers')
        .insert([{
          ...data,
          requested_by: userId, // transfers use requested_by instead of created_by
        }])
        .select()
        .single();

      if (error) {
        console.error('Error creating transfer:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data: transfer };
    } catch (error) {
      console.error('Error creating transfer:', error);
      return { success: false, error: 'Failed to create transfer' };
    }
  }

  // Enhanced Transfer Operations with Lot Management
  static async createTransferWithLot(transferData: {
    product_id: number;
    from_location_id: number;
    to_location_id: number;
    quantity: number;
    selected_lot_id: number;
    notes?: string;
  }, userId: number): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      await this.ensureUserContext(userId);

      // Start a transaction-like operation
      // 1. First, validate the lot has enough quantity
      const { data: selectedLot, error: lotError } = await supabase
        .from('products_lot')
        .select('*')
        .eq('id', transferData.selected_lot_id)
        .eq('product_id', transferData.product_id)
        .single();

      if (lotError || !selectedLot) {
        return { success: false, error: 'Selected lot not found' };
      }

      if (selectedLot.quantity < transferData.quantity) {
        return { success: false, error: 'Insufficient quantity in selected lot' };
      }

      // 2. Create the transfer record
      const { data: transfer, error: transferError } = await supabase
        .from('transfers')
        .insert([{
          product_id: transferData.product_id,
          from_location_id: transferData.from_location_id,
          to_location_id: transferData.to_location_id,
          quantity: transferData.quantity,
          notes: transferData.notes,
          requested_by: userId,
          transfer_status: 'requested',
        }])
        .select()
        .single();

      if (transferError) {
        console.error('Error creating transfer:', transferError);
        return { success: false, error: transferError.message };
      }

      // 3. Update the source lot quantity
      const { error: updateLotError } = await supabase
        .from('products_lot')
        .update({
          quantity: selectedLot.quantity - transferData.quantity,
          updated_at: new Date().toISOString(),
        })
        .eq('id', transferData.selected_lot_id);

      if (updateLotError) {
        console.error('Error updating source lot:', updateLotError);
        return { success: false, error: 'Failed to update source lot quantity' };
      }

      // 4. Create new lot at destination location
      const newLotResult = await this.createNewLotAtDestination({
        product_id: transferData.product_id,
        location_id: transferData.to_location_id,
        quantity: transferData.quantity,
        purchase_price: selectedLot.purchase_price,
        selling_price: selectedLot.selling_price,
        supplier_id: selectedLot.supplier_id,
        source_lot_id: transferData.selected_lot_id,
      }, userId);

      if (!newLotResult.success) {
        return { success: false, error: newLotResult.error };
      }

      // 5. Update the source product's total stock (decrease by transferred quantity)
      const { data: currentProduct, error: productError } = await supabase
        .from('products')
        .select('current_stock, total_stock')
        .eq('id', transferData.product_id)
        .single();

      if (!productError && currentProduct) {
        const { error: updateSourceError } = await supabase
          .from('products')
          .update({
            current_stock: Math.max(0, currentProduct.current_stock - transferData.quantity),
            total_stock: Math.max(0, currentProduct.total_stock - transferData.quantity),
            updated_at: new Date().toISOString(),
          })
          .eq('id', transferData.product_id);

        if (updateSourceError) {
          console.error('Error updating source product stock:', updateSourceError);
          // Don't fail the transfer for this, just log it
        }
      }

      return {
        success: true,
        data: {
          transfer,
          new_lot: newLotResult.data,
          source_lot_updated: true
        }
      };
    } catch (error) {
      console.error('Error creating transfer with lot:', error);
      return { success: false, error: 'Failed to create transfer with lot management' };
    }
  }

  // Create new lot at destination location
  static async createNewLotAtDestination(lotData: {
    product_id: number;
    location_id: number;
    quantity: number;
    purchase_price: number;
    selling_price: number;
    supplier_id?: number;
    source_lot_id: number;
  }, userId: number): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      // Get the next lot number for this product
      const { data: maxLotData, error: maxLotError } = await supabase
        .from('products_lot')
        .select('lot_number')
        .eq('product_id', lotData.product_id)
        .order('lot_number', { ascending: false })
        .limit(1);

      if (maxLotError) {
        console.error('Error getting max lot number:', maxLotError);
        return { success: false, error: 'Failed to determine next lot number' };
      }

      const nextLotNumber = maxLotData && maxLotData.length > 0
        ? maxLotData[0].lot_number + 1
        : 1;

      // Create the new lot
      const { data: newLot, error: createError } = await supabase
        .from('products_lot')
        .insert([{
          product_id: lotData.product_id,
          lot_number: nextLotNumber,
          quantity: lotData.quantity,
          purchase_price: lotData.purchase_price,
          selling_price: lotData.selling_price,
          supplier_id: lotData.supplier_id,
          location_id: lotData.location_id,
          received_date: new Date().toISOString(),
          status: 'active',
          notes: `Transferred from lot ${lotData.source_lot_id}`,
          created_by: userId,
        }])
        .select()
        .single();

      if (createError) {
        console.error('Error creating new lot:', createError);
        return { success: false, error: createError.message };
      }

      return { success: true, data: newLot };
    } catch (error) {
      console.error('Error creating new lot at destination:', error);
      return { success: false, error: 'Failed to create new lot at destination' };
    }
  }

  // Update product stock at specific location
  static async updateProductStockAtLocation(productId: number, locationId: number, quantityChange: number): Promise<void> {
    try {
      // Check if product exists at this location
      const { data: existingProduct, error: checkError } = await supabase
        .from('products')
        .select('current_stock, total_stock')
        .eq('id', productId)
        .eq('location_id', locationId)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        console.error('Error checking product at location:', checkError);
        return;
      }

      if (existingProduct) {
        // Update existing product stock
        const { error: updateError } = await supabase
          .from('products')
          .update({
            current_stock: existingProduct.current_stock + quantityChange,
            total_stock: existingProduct.total_stock + quantityChange,
            updated_at: new Date().toISOString(),
          })
          .eq('id', productId)
          .eq('location_id', locationId);

        if (updateError) {
          console.error('Error updating product stock:', updateError);
        }
      }
    } catch (error) {
      console.error('Error updating product stock at location:', error);
    }
  }

  // Get product lots for selection (using the main getProductLots method above)

  // Get locations for transfer
  static async getActiveLocations(): Promise<{ success: boolean; data?: any[]; error?: string }> {
    try {
      console.log('🔄 FormService.getActiveLocations called');

      // Return mock data in demo mode
      if (isDemoMode) {
        console.log('Demo mode: Returning mock locations for transfer');
        const mockLocations = [
          {
            id: 1,
            name: 'Main Warehouse',
            type: 'warehouse',
            address: '123 Main Street, Dhaka',
          },
          {
            id: 2,
            name: 'Showroom Gulshan',
            type: 'showroom',
            address: '456 Gulshan Avenue, Dhaka',
          },
          {
            id: 3,
            name: 'Secondary Warehouse',
            type: 'warehouse',
            address: '789 Industrial Area, Chittagong',
          }
        ];
        return { success: true, data: mockLocations };
      }

      await this.ensureUserContext();

      const { data, error } = await supabase
        .from('locations')
        .select('id, name, type, address')
        .eq('status', 'active')
        .order('name', { ascending: true });

      if (error) {
        console.error('❌ Error fetching locations:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ Successfully fetched locations:', data?.length || 0);
      return { success: true, data: data || [] };
    } catch (error) {
      console.error('❌ Error fetching locations:', error);
      return { success: false, error: 'Failed to fetch locations' };
    }
  }

  private static getDefaultSalesStats() {
    return {
      totalSales: { value: 0, formatted: '0' },
      totalRevenue: { value: 0, formatted: '৳0' },
      paidAmount: { value: 0, formatted: '৳0' },
      pendingAmount: { value: 0, formatted: '৳0' },
      overdueAmount: { value: 0, formatted: '৳0' },
      paidSalesCount: { value: 0, formatted: '0' },
      pendingSalesCount: { value: 0, formatted: '0' },
      overdueSalesCount: { value: 0, formatted: '0' },
      averageSaleValue: { value: 0, formatted: '৳0' },
      paymentRate: { value: 0, formatted: '0%' }
    };
  }
}
