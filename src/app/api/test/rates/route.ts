import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import RateConfig from "@/models/RateConfig";

export async function GET() {
  try {
    await dbConnect();
    console.log("Database connected successfully");
    
    const rates = await RateConfig.find({}).lean();
    console.log("Found rates:", rates);
    
    return NextResponse.json({
      success: true,
      rates: rates || []
    });
  } catch (error) {
    console.error("Error in test endpoint:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch rates" },
      { status: 500 }
    );
  }
}
