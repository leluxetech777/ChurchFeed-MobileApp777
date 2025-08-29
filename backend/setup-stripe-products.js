require('dotenv').config();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

async function createStripeProducts() {
  console.log('🚀 Setting up ChurchFeed Stripe products...\n');

  const products = [
    {
      name: 'ChurchFeed New Church Plan',
      description: 'Perfect for churches with 0-50 members',
      price: 1000, // $10.00 in cents
      tier: 'tier1',
      memberRange: '0-50 members'
    },
    {
      name: 'ChurchFeed Growing Church Plan', 
      description: 'Perfect for churches with 51-150 members',
      price: 1500, // $15.00 in cents
      tier: 'tier2',
      memberRange: '51-150 members'
    },
    {
      name: 'ChurchFeed Established Church Plan',
      description: 'Perfect for churches with 151-499 members', 
      price: 2000, // $20.00 in cents
      tier: 'tier3',
      memberRange: '151-499 members'
    },
    {
      name: 'ChurchFeed Mega Church Plan',
      description: 'Perfect for churches with 500+ members',
      price: 5000, // $50.00 in cents
      tier: 'tier4', 
      memberRange: '500+ members'
    }
  ];

  const priceIds = {};

  try {
    for (const productData of products) {
      console.log(`📦 Creating product: ${productData.name}...`);
      
      // Create product
      const product = await stripe.products.create({
        name: productData.name,
        description: productData.description,
        metadata: {
          tier: productData.tier,
          memberRange: productData.memberRange
        }
      });
      
      console.log(`✅ Product created: ${product.id}`);
      
      // Create recurring price
      const price = await stripe.prices.create({
        product: product.id,
        unit_amount: productData.price,
        currency: 'usd',
        recurring: {
          interval: 'month'
        },
        metadata: {
          tier: productData.tier
        }
      });
      
      priceIds[productData.tier] = price.id;
      console.log(`💰 Price created: ${price.id} ($${productData.price/100}/month)`);
      console.log(`🏷️  Tier: ${productData.tier} - ${productData.memberRange}\n`);
    }

    console.log('🎉 All products and prices created successfully!\n');
    console.log('📋 Add these Price IDs to your backend .env file:\n');
    console.log(`STRIPE_PRICE_TIER1=${priceIds.tier1}`);
    console.log(`STRIPE_PRICE_TIER2=${priceIds.tier2}`);  
    console.log(`STRIPE_PRICE_TIER3=${priceIds.tier3}`);
    console.log(`STRIPE_PRICE_TIER4=${priceIds.tier4}\n`);
    
    console.log('💡 Next steps:');
    console.log('1. Copy the price IDs above to your backend/.env file');
    console.log('2. Set up a webhook endpoint in Stripe Dashboard');
    console.log('3. Test your checkout flow!');

    return priceIds;

  } catch (error) {
    console.error('❌ Error creating products:', error.message);
    process.exit(1);
  }
}

// Run the setup
if (require.main === module) {
  createStripeProducts()
    .then(() => {
      console.log('\n✨ Setup complete!');
      process.exit(0);
    })
    .catch(error => {
      console.error('💥 Setup failed:', error);
      process.exit(1);
    });
}

module.exports = createStripeProducts;