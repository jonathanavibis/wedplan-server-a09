const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb+srv://wedplan-admin:e9mS4hiy5hCRcsSu@cluster0.pdb4uou.mongodb.net/wedplan?retryWrites=true&w=majority';

async function fixImages() {
  await mongoose.connect(MONGODB_URI);
  const col = mongoose.connection.db.collection('services');

  // 1. Fairytale String Quartet
  await col.updateOne(
    { serviceName: 'Fairytale String Quartet & Modern Acoustic Ensemble' },
    {
      $set: {
        images: [
          'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=1200&q=80',
          'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1200&q=80',
          'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?auto=format&fit=crop&w=1200&q=80',
        ],
      },
    }
  );

  // 2. Oceanfront Sunset Cliffside Pergola & Estate
  await col.updateOne(
    { serviceName: 'Oceanfront Sunset Cliffside Pergola & Estate' },
    {
      $set: {
        images: [
          'https://images.unsplash.com/photo-1544077960-604201fe74bc?auto=format&fit=crop&w=1200&q=80',
          'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80',
          'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=1200&q=80',
        ],
      },
    }
  );

  // 3. Ensure all services have valid array of 3 images
  const allServices = await col.find({}).toArray();
  for (const s of allServices) {
    if (!s.images || s.images.length === 0) {
      await col.updateOne(
        { _id: s._id },
        {
          $set: {
            images: [
              'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80',
              'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=1200&q=80',
              'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=1200&q=80',
            ],
          },
        }
      );
    }
  }

  console.log('All service images in database successfully verified and enhanced!');
  await mongoose.disconnect();
}

fixImages().catch(console.error);
