// Load environment variables first
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

// Now import other modules that depend on environment variables
import dbConnect from "@/lib/mongodb";
import RateConfig from "@/models/RateConfig";

const seedRates = async () => {
  try {
    await dbConnect();
    console.log("Connected to database");

    // Clear existing rates
    await RateConfig.deleteMany({});
    console.log("Cleared existing rate configurations");

    // Create sample rate configurations
    const sampleRates = [
      {
        type: 'mileage',
        value: 0.55, // $0.55 per mile
        effectiveDate: new Date('2024-01-01'),
      },
      {
        type: 'overtime_multiplier',
        multiplier: 1.5,
        condition: {
          dayType: 'weekday',
          designation: 'standard'
        },
        effectiveDate: new Date('2024-01-01'),
      },
      {
        type: 'overtime_multiplier',
        multiplier: 2.0,
        condition: {
          dayType: 'weekend',
          designation: 'standard'
        },
        effectiveDate: new Date('2024-01-01'),
      },
      {
        type: 'overtime_multiplier',
        multiplier: 2.5,
        condition: {
          dayType: 'holiday',
          designation: 'standard'
        },
        effectiveDate: new Date('2024-01-01'),
      },
    ];

    const createdRates = await RateConfig.insertMany(sampleRates);
    console.log(`Successfully seeded ${createdRates.length} rate configurations`);
    console.log("Sample rates:", JSON.stringify(createdRates, null, 2));
    
    process.exit(0);
  } catch (error) {
    console.error("Error seeding rates:", error);
    process.exit(1);
  }
};

seedRates();
