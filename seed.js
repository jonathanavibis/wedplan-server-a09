require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Service = require('./models/Service');
const Booking = require('./models/Booking');
const Transaction = require('./models/Transaction');

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('[Seed] Connected to MongoDB Atlas...');

    // Clear existing collections to ensure fresh clean state
    await User.deleteMany({});
    await Service.deleteMany({});
    await Booking.deleteMany({});
    await Transaction.deleteMany({});

    console.log('[Seed] Cleared existing records.');

    // 1. Create Users
    const salt = await bcrypt.genSalt(10);
    const adminPassword = await bcrypt.hash('Admin@123456', salt);
    const vendorPassword = await bcrypt.hash('Vendor@123456', salt);
    const customerPassword = await bcrypt.hash('Customer@123456', salt);

    const admin = await User.create({
      name: 'WedPlan Administrator',
      email: 'admin@wedplan.com',
      password: adminPassword,
      role: 'Admin',
      image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
    });

    const vendor1 = await User.create({
      name: 'Sarah Jenkins',
      email: 'vendor@wedplan.com',
      password: vendorPassword,
      role: 'Vendor',
      businessName: 'Rosewood Wedding Studios',
      image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80',
      subscriptionPlan: 'free',
    });

    const vendor2 = await User.create({
      name: 'Michael & Elena Chang',
      email: 'premium@wedplan.com',
      password: vendorPassword,
      role: 'Vendor',
      businessName: 'Grand Opulence Events & Venues',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
      subscriptionPlan: 'premium',
      subscriptionExpiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    });

    const customer1 = await User.create({
      name: 'Emily Parker',
      email: 'customer@wedplan.com',
      password: customerPassword,
      role: 'Customer',
      image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80',
    });

    console.log('[Seed] Created default users: Admin, Vendors, Customer.');

    // 2. Create Services (Approved & Active)
    const servicesData = [
      {
        vendorId: vendor1._id,
        serviceName: 'Cinematic Dream Wedding Photography & 4K Film',
        category: 'Photography & Videography',
        description: 'Complete full-day wedding coverage featuring 2 master photographers and 1 drone operator. Includes 800+ color-graded high-resolution photos, a 5-minute cinematic highlight reel, and full ceremony capture delivered on custom wooden USB and online gallery.',
        price: 2450,
        location: 'New York, NY',
        images: [
          'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80',
          'https://images.unsplash.com/photo-1537633552985-df8429e8048b?auto=format&fit=crop&w=1200&q=80',
          'https://images.unsplash.com/photo-1606800052052-a08af7148866?auto=format&fit=crop&w=1200&q=80',
        ],
        status: 'Approved',
        isActive: true,
      },
      {
        vendorId: vendor2._id,
        serviceName: 'The Glasshouse Botanical Chateau & Pavilion',
        category: 'Wedding Venues',
        description: 'An ethereal luxury glasshouse venue nestled in 15 acres of manicured rose gardens and historic woodlands. Accommodates up to 350 seated guests, featuring crystal chandeliers, heated marble flooring, private bridal suite, and full panoramic mountain views.',
        price: 8500,
        location: 'Hudson Valley, NY',
        images: [
          'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=1200&q=80',
          'https://images.unsplash.com/photo-1545232979-8bf68ee9b1af?auto=format&fit=crop&w=1200&q=80',
          'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&w=1200&q=80',
        ],
        status: 'Approved',
        isActive: true,
      },
      {
        vendorId: vendor1._id,
        serviceName: 'Bohemian Luxe Floral Installations & Styling',
        category: 'Decoration & Florist',
        description: 'Artisanal organic floral installations featuring fragrant David Austin garden roses, trailing eucalyptus, Italian ruscus, and suspended floral clouds. Includes grand bridal arch, 15 customized tablescapes, candles, and aisle markers.',
        price: 3200,
        location: 'Brooklyn, NY',
        images: [
          'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=1200&q=80',
          'https://images.unsplash.com/photo-1523438885200-e635ba2c371e?auto=format&fit=crop&w=1200&q=80',
          'https://images.unsplash.com/photo-1470246973918-29a93221c455?auto=format&fit=crop&w=1200&q=80',
        ],
        status: 'Approved',
        isActive: true,
      },
      {
        vendorId: vendor2._id,
        serviceName: 'Gourmet French-Mediterranean 5-Course Plated Banquet',
        category: 'Catering Services',
        description: 'Award-winning farm-to-table wedding feast prepared by Michelin-trained chefs. Includes artisanal charcuterie grazing table, champagne reception, five-course seated dinner with wine pairings, late-night gourmet truffle sliders, and custom dessert bar.',
        price: 5800,
        location: 'Manhattan, NY',
        images: [
          'https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&w=1200&q=80',
          'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=80',
          'https://images.unsplash.com/photo-1551218808-94e220e084d2?auto=format&fit=crop&w=1200&q=80',
        ],
        status: 'Approved',
        isActive: true,
      },
      {
        vendorId: vendor1._id,
        serviceName: 'Glamour Bridal Glow Makeup & Hair Artistry',
        category: 'Makeup & Styling',
        description: 'Bespoke bridal glam designed to keep you radiant all day and night. Includes detailed pre-wedding preview trial, luxury airbrush foundation, premium mink lashes, touch-up kit, and styling for bride plus up to 4 bridesmaids.',
        price: 1200,
        location: 'Queens, NY',
        images: [
          'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=1200&q=80',
          'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=1200&q=80',
          'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=1200&q=80',
        ],
        status: 'Approved',
        isActive: true,
      },
      {
        vendorId: vendor2._id,
        serviceName: 'Haute Couture Bridal Gowns & Bespoke Tuxedos',
        category: 'Wedding Fashion',
        description: 'Exclusive private styling suite offering hand-stitched lace silhouettes, French silk tulles, and custom Italian bespoke wool tuxedos. Includes 3 fitting sessions, custom veil, and complete day-of dressing concierge service.',
        price: 3600,
        location: 'SoHo, NY',
        images: [
          'https://images.unsplash.com/photo-1594552072238-b8a33785b261?auto=format&fit=crop&w=1200&q=80',
          'https://images.unsplash.com/photo-1546804784-896d0dca3805?auto=format&fit=crop&w=1200&q=80',
          'https://images.unsplash.com/photo-1509967419530-da38b4704bc6?auto=format&fit=crop&w=1200&q=80',
        ],
        status: 'Approved',
        isActive: true,
      },
      {
        vendorId: vendor2._id,
        serviceName: 'Oceanfront Sunset Cliffside Pergola & Estate',
        category: 'Wedding Venues',
        description: 'Breathtaking seaside estate featuring an infinity cliffside ceremony platform with waves crashing below. Complete with lawn games, illuminated cocktail terrace, and secluded beachfront access for sunset couples portraits.',
        price: 9200,
        location: 'Montauk, NY',
        images: [
          'https://images.unsplash.com/photo-1544077960-604201fe74bc?auto=format&fit=crop&w=1200&q=80',
          'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80',
        ],
        status: 'Approved',
        isActive: true,
      },
      {
        vendorId: vendor2._id,
        serviceName: 'Fairytale String Quartet & Modern Acoustic Ensemble',
        category: 'Photography & Videography',
        description: 'Classical elegance meets contemporary pop covers. Four virtuoso conservatory musicians perform timeless classical entrance songs followed by Bridgerton-inspired pop arrangements during your cocktail reception.',
        price: 1800,
        location: 'Jersey City, NJ',
        images: [
          'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?auto=format&fit=crop&w=1200&q=80',
          'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1200&q=80',
        ],
        status: 'Approved',
        isActive: true,
      },
      {
        vendorId: vendor1._id,
        serviceName: 'Pending Modern Rustic Barn & Vineyard Venue',
        category: 'Wedding Venues',
        description: 'Handcrafted timber frame barn with polished concrete floors, fairy light canopies, and wine barrels. Awaiting final review from admin team.',
        price: 6400,
        location: 'Catskills, NY',
        images: [
          'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=1200&q=80',
          'https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&w=1200&q=80',
          'https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=1200&q=80',
        ],
        status: 'Pending',
        isActive: true,
      }
    ];

    const insertedServices = await Service.insertMany(servicesData);
    console.log(`[Seed] Inserted ${insertedServices.length} wedding services across all categories.`);

    // 3. Create Sample Booking
    await Booking.create({
      serviceId: insertedServices[0]._id,
      vendorId: vendor1._id,
      customerId: customer1._id,
      eventDate: '2027-06-20',
      eventLocation: 'Central Park Conservatory, NYC',
      message: 'Hello! We love your photography style and would love to book you for our summer wedding ceremony and reception.',
      status: 'Pending',
    });

    // 4. Create Sample Transaction
    await Transaction.create({
      vendorId: vendor2._id,
      plan: 'premium',
      amount: 49.0,
      currency: 'usd',
      stripeSessionId: 'cs_test_seed_grandopulence_sub_001',
      status: 'completed',
    });

    console.log('[Seed] Database seeding completed successfully! ✨');
    process.exit(0);
  } catch (err) {
    console.error('[Seed Error]:', err);
    process.exit(1);
  }
};

seedData();
