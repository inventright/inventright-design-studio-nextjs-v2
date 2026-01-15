import { db } from '../lib/db';
import { pricingTiers, productPricing } from '../lib/db/schema';

async function seedPricing() {
  console.log('Starting pricing seed...');

  try {
    // Check if products already exist
    const existingProducts = await db.select().from(productPricing).limit(1);
    
    if (existingProducts.length > 0) {
      console.log('⚠️  Products already exist. Skipping seed.');
      return;
    }

    // Insert department base pricing (no tier - default pricing)
    console.log('Creating department base pricing...');
    const departments = [
      {
        productKey: 'sell_sheets',
        productName: 'Sell Sheets',
        productDescription: 'Professional sell sheet design',
        category: 'department',
        departmentId: 1,
        price: '299.00'
      },
      {
        productKey: 'virtual_prototypes',
        productName: 'Virtual Prototypes',
        productDescription: '3D virtual prototype rendering',
        category: 'department',
        departmentId: 2,
        price: '499.00'
      },
      {
        productKey: 'line_drawings',
        productName: 'Line Drawings',
        productDescription: 'Technical line drawings',
        category: 'department',
        departmentId: 3,
        price: '399.00'
      }
    ];

    for (const dept of departments) {
      const [product] = await db
        .insert(productPricing)
        .values({
          ...dept,
          currency: 'USD',
          pricingTierId: null, // Default pricing
          isActive: true
        })
        .returning();
      console.log(`✓ Created department pricing: ${product.productName} - $${product.price}`);
    }

    // Insert add-ons
    console.log('Creating add-on pricing...');
    const addons = [
      {
        productKey: 'rush_delivery',
        productName: 'Rush Delivery',
        productDescription: 'Expedited delivery within 3-5 business days',
        category: 'rush',
        price: '150.00'
      },
      {
        productKey: 'extra_revision',
        productName: 'Extra Revision',
        productDescription: 'Additional revision beyond included revisions',
        category: 'revision',
        price: '75.00'
      },
      {
        productKey: 'source_files',
        productName: 'Source Files',
        productDescription: 'Editable source files (AI, PSD, etc.)',
        category: 'addon',
        price: '100.00'
      },
      {
        productKey: 'multiple_concepts',
        productName: 'Multiple Concepts',
        productDescription: 'Additional design concept variations',
        category: 'addon',
        price: '200.00'
      }
    ];

    for (const addon of addons) {
      const [product] = await db
        .insert(productPricing)
        .values({
          ...addon,
          currency: 'USD',
          pricingTierId: null, // Default pricing
          departmentId: null,
          isActive: true
        })
        .returning();
      console.log(`✓ Created add-on pricing: ${product.productName} - $${product.price}`);
    }

    console.log('\n✅ Pricing seed completed successfully!');
    console.log(`Created ${departments.length + addons.length} products`);

  } catch (error) {
    console.error('❌ Error seeding pricing:', error);
    throw error;
  }
}

seedPricing()
  .then(() => {
    console.log('Seed script finished');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Seed script failed:', error);
    process.exit(1);
  });
