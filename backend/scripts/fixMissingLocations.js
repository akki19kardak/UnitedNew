import dns from "dns";
dns.setDefaultResultOrder("ipv4first");
dns.setServers(["8.8.8.8", "8.8.4.4"]);

import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Load .env from backend folder
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env") });

import Campaign from "../models/Campaign.js";

const geocodeLocation = async (city, state) => {
    try {
        const query = encodeURIComponent(`${city}, ${state}, India`);
        const url = `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1`;
        const res = await fetch(url, { headers: { "User-Agent": "UnitedImpact/1.0" } });
        const data = await res.json();
        if (data?.length > 0) {
            console.log(`✅ Geocoded "${city}, ${state}" → lat:${data[0].lat}, lng:${data[0].lon}`);
            return { latitude: parseFloat(data[0].lat), longitude: parseFloat(data[0].lon) };
        }
    } catch (err) {
        console.warn("⚠️ Geocoding failed:", err.message);
    }
    return { latitude: 0, longitude: 0 };
};

const fixDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI, {
            serverSelectionTimeoutMS: 10000,
            family: 4,
        });
        console.log("✅ Connected to MongoDB");

        const campaigns = await Campaign.find({
            $or: [
                { "location.coordinates.latitude": 0 },
                { "location.coordinates.latitude": null }
            ]
        });

        console.log(`Found ${campaigns.length} campaigns needing location fix`);

        for (const campaign of campaigns) {
            if (campaign.location?.city || campaign.location?.state) {
                process.stdout.write(`Fixing ${campaign.title}... `);
                const coords = await geocodeLocation(campaign.location.city, campaign.location.state);

                if (coords.latitude !== 0) {
                    campaign.location.coordinates = coords;
                    await campaign.save();
                } else {
                    console.log(`❌ Could not resolve coords for ${campaign.location.city}`);
                }

                // delay to not rate limit nominatim
                await new Promise(r => setTimeout(r, 1500));
            }
        }
        console.log("Done");
        process.exit(0);
    } catch (err) {
        console.error("❌ Error fixing:", err);
        process.exit(1);
    }
};

fixDB();
