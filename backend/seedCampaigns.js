import dns from "dns";
dns.setDefaultResultOrder("ipv4first");
dns.setServers(["8.8.8.8", "8.8.4.4"]);

import mongoose from "mongoose";
import dotenv from "dotenv";
import Campaign from "./models/Campaign.js";
import NGO from "./models/Ngo.js";
dotenv.config();

const seedDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
      family: 4,
    });
    console.log("✅ Connected to MongoDB");

    // Resolve all 10 NGO firebaseUids → MongoDB _ids
    const ngos = await NGO.find({
      firebaseUid: {
        $in: [
          "ngo_pratham_123",
          "ngo_goonj_234",
          "ngo_akshaya_345",
          "ngo_sewa_456",
          "ngo_pfa_567",
          "ngo_smile_678",
          "ngo_helpage_789",
          "ngo_cry_890",
          "ngo_nanhi_kali_901",
          "ngo_teach_india_012",
        ],
      },
    }).select("_id firebaseUid name");

    if (ngos.length === 0) {
      console.error("❌ No NGOs found! Run: node seedNGOs.js first");
      process.exit(1);
    }

    // Map firebaseUid → ObjectId
    const ngoMap = {};
    ngos.forEach((n) => {
      ngoMap[n.firebaseUid] = n._id;
      console.log(`   Resolved: ${n.name} → ${n._id}`);
    });

    const sampleCampaigns = [
      // ── PRATHAM (education) ─────────────────────────────────────
      {
        ngoId: ngoMap["ngo_pratham_123"],
        title: "Foundational Literacy for 10,000 Children in Bihar",
        description:
          "Millions of children in Bihar reach Grade 5 without being able to read a simple paragraph. Pratham's 'Teaching at the Right Level' (TaRL) methodology has proven to triple learning outcomes in just 45 days. This campaign funds learning camps, trained volunteers, and reading materials for 10,000 children across 200 government schools in Patna, Gaya, and Muzaffarpur districts.",
        shortDescription:
          "Pratham's proven TaRL method to make 10,000 Bihar children school-ready in 45 days.",
        category: "education",
        goalAmount: 3000000,
        currentAmount: 1850000,
        isUrgent: false,
        startDate: new Date(),
        endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
        status: "active",
        approvalStatus: "approved",
        imageUrl:
          "https://images.unsplash.com/photo-1613896527026-f195d5c818ed?q=80&w=800&auto=format&fit=crop",
        location: {
          city: "Patna",
          state: "Bihar",
          coordinates: { latitude: 25.5941, longitude: 85.1376 },
        },
      },
      {
        ngoId: ngoMap["ngo_pratham_123"],
        title: "Digital Learning Labs for Rural Rajasthan",
        description:
          "Remote villages in Rajasthan lack access to quality teachers and digital content. This campaign sets up 25 solar-powered digital learning labs in Barmer, Jaisalmer, and Bikaner, equipping them with tablets, offline content packs and trained local instructors. Each lab will serve 300+ children per year.",
        shortDescription:
          "25 solar-powered digital labs for 7,500+ children in remote Rajasthan villages.",
        category: "education",
        goalAmount: 4500000,
        currentAmount: 720000,
        isUrgent: false,
        startDate: new Date(),
        endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        status: "active",
        approvalStatus: "approved",
        imageUrl:
          "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?q=80&w=800&auto=format&fit=crop",
        location: {
          city: "Jaipur",
          state: "Rajasthan",
          coordinates: { latitude: 26.9124, longitude: 75.7873 },
        },
      },

      // ── GOONJ (disaster-relief / other) ─────────────────────────
      {
        ngoId: ngoMap["ngo_goonj_234"],
        title: "Help Rebuild Kerala After Floods",
        description:
          "The recent floods in Kerala have displaced thousands of families. Goonj is on the ground distributing dignity kits, rebuilding collapsed homes, and restoring community infrastructure. Your contribution goes directly to Goonj's RAHAT (disaster relief) teams operating in Wayanad, Idukki, and Ernakulam districts.",
        shortDescription:
          "Emergency relief and home-rebuilding for flood-affected families in Kerala.",
        category: "disaster-relief",
        goalAmount: 5000000,
        currentAmount: 1250000,
        isUrgent: true,
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        status: "active",
        approvalStatus: "approved",
        imageUrl:
          "https://images.unsplash.com/photo-1542282088-fe8426682b8f?q=80&w=800&auto=format&fit=crop",
        location: {
          city: "Kochi",
          state: "Kerala",
          coordinates: { latitude: 9.9312, longitude: 76.2673 },
        },
      },
      {
        ngoId: ngoMap["ngo_goonj_234"],
        title: "Women's Skill Development Centre – Pune",
        description:
          "Goonj is setting up a vocational training centre in Pune to teach tailoring, computer literacy, and handicraft making to 200 women from marginalized backgrounds. Graduates receive a starter kit (sewing machine or laptop) and are connected to Goonj's supply chain for steady income.",
        shortDescription:
          "Vocational training + starter kit for 200 women in Pune's underserved communities.",
        category: "women-empowerment",
        goalAmount: 1200000,
        currentAmount: 450000,
        isUrgent: false,
        startDate: new Date(),
        endDate: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000),
        status: "active",
        approvalStatus: "approved",
        imageUrl:
          "https://images.unsplash.com/photo-1567306226416-28f0efdc88ce?q=80&w=800&auto=format&fit=crop",
        location: {
          city: "Pune",
          state: "Maharashtra",
          coordinates: { latitude: 18.5204, longitude: 73.8567 },
        },
      },

      // ── AKSHAYA PATRA (child-welfare / environment) ──────────────
      {
        ngoId: ngoMap["ngo_akshaya_345"],
        title: "Mid-Day Meals for 5,000 Children in Odisha",
        description:
          "Akshaya Patra is expanding its mid-day meal programme to 50 more government schools in tribal Odisha. One hot nutritious meal a day keeps children in school and drastically reduces dropout rates. This campaign covers kitchen infrastructure, food costs, and delivery for an entire academic year for 5,000 children.",
        shortDescription:
          "Daily nutritious meals for 5,000 tribal children in Odisha for one full year.",
        category: "child-welfare",
        goalAmount: 6000000,
        currentAmount: 3200000,
        isUrgent: false,
        startDate: new Date(),
        endDate: new Date(Date.now() + 75 * 24 * 60 * 60 * 1000),
        status: "active",
        approvalStatus: "approved",
        imageUrl:
          "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?q=80&w=800&auto=format&fit=crop",
        location: {
          city: "Bhubaneswar",
          state: "Odisha",
          coordinates: { latitude: 20.2961, longitude: 85.8245 },
        },
      },
      {
        ngoId: ngoMap["ngo_akshaya_345"],
        title: "Clean Drinking Water for Maharashtra Villages",
        description:
          "Many villages in the Marathwada region are facing severe drought. Akshaya Patra is building 10 solar-powered water purification plants to provide clean drinking water to over 10,000 residents in Beed and Latur districts.",
        shortDescription:
          "10 solar water purification plants for 10,000 drought-affected villagers in Marathwada.",
        category: "environment",
        goalAmount: 3500000,
        currentAmount: 500000,
        isUrgent: false,
        startDate: new Date(),
        endDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
        status: "active",
        approvalStatus: "approved",
        imageUrl:
          "https://images.unsplash.com/photo-1538300261175-10eb0b368755?q=80&w=800&auto=format&fit=crop",
        location: {
          city: "Aurangabad",
          state: "Maharashtra",
          coordinates: { latitude: 19.8762, longitude: 75.3433 },
        },
      },

      // ── SEWA INTERNATIONAL (disaster-relief / health) ────────────
      {
        ngoId: ngoMap["ngo_sewa_456"],
        title: "Cyclone Relief for Andhra Pradesh Coast",
        description:
          "Cyclone landfall has devastated fishing communities along the Andhra coast, destroying homes and boats. Sewa International's rapid response teams are distributing emergency food packets, tarpaulins, and safe drinking water. Your donation enables them to reach 2,000 more families in the next 2 weeks.",
        shortDescription:
          "Emergency cyclone relief for 2,000 fishing families on the Andhra Pradesh coast.",
        category: "disaster-relief",
        goalAmount: 2500000,
        currentAmount: 1900000,
        isUrgent: true,
        startDate: new Date(),
        endDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
        status: "active",
        approvalStatus: "approved",
        imageUrl:
          "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=800&auto=format&fit=crop",
        location: {
          city: "Visakhapatnam",
          state: "Andhra Pradesh",
          coordinates: { latitude: 17.6868, longitude: 83.2185 },
        },
      },
      {
        ngoId: ngoMap["ngo_sewa_456"],
        title: "Free Healthcare Camp in Dharavi",
        description:
          "We organized a massive 5-day free healthcare camp in Dharavi, Mumbai — providing free checkups, basic medicines, eye testing, and dental care for residents who cannot afford standard healthcare. Over 10,000 residents were served. Help us fund the next edition.",
        shortDescription:
          "5-day free healthcare camp serving 10,000+ Dharavi residents — next edition.",
        category: "health",
        goalAmount: 800000,
        currentAmount: 800000,
        isUrgent: false,
        startDate: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        status: "completed",
        approvalStatus: "approved",
        imageUrl:
          "https://images.unsplash.com/photo-1584515933487-779824d29309?q=80&w=800&auto=format&fit=crop",
        location: {
          city: "Mumbai",
          state: "Maharashtra",
          coordinates: { latitude: 19.0544, longitude: 72.8532 },
        },
      },

      // ── PEOPLE FOR ANIMALS (animal-welfare) ──────────────────────
      {
        ngoId: ngoMap["ngo_pfa_567"],
        title: "Rescue and Rehab for Stray Dogs in Delhi NCR",
        description:
          "Winter is harsh for stray animals in Delhi. People For Animals is raising funds to buy warm bedding, medical supplies, anti-rabies vaccinations, and sterilisation for over 500 stray dogs in the NCR region. Every donation covers vaccination for 5 dogs.",
        shortDescription:
          "Rescue, vaccinate, and shelter 500 stray dogs in Delhi NCR this winter.",
        category: "animal-welfare",
        goalAmount: 500000,
        currentAmount: 320000,
        isUrgent: false,
        startDate: new Date(),
        endDate: new Date(Date.now() + 40 * 24 * 60 * 60 * 1000),
        status: "active",
        approvalStatus: "approved",
        imageUrl:
          "https://images.unsplash.com/photo-1544568100-847a948585b9?q=80&w=800&auto=format&fit=crop",
        location: {
          city: "New Delhi",
          state: "Delhi",
          coordinates: { latitude: 28.6139, longitude: 77.209 },
        },
      },

      // ── SMILE FOUNDATION (education / health) ────────────────────
      {
        ngoId: ngoMap["ngo_smile_678"],
        title: "Mission Education – School Dropout Recovery in UP",
        description:
          "Over 60 lakh children dropped out of schools in Uttar Pradesh post-COVID. Smile Foundation's Mission Education programme is identifying and re-enrolling out-of-school children in Varanasi and Lucknow districts. Funds cover remedial education, school kits, counsellors and community mobilisers for 2,000 children.",
        shortDescription:
          "Re-enrolling 2,000 COVID school dropouts in Uttar Pradesh through Smile Foundation.",
        category: "education",
        goalAmount: 2800000,
        currentAmount: 1650000,
        isUrgent: false,
        startDate: new Date(),
        endDate: new Date(Date.now() + 55 * 24 * 60 * 60 * 1000),
        status: "active",
        approvalStatus: "approved",
        imageUrl:
          "https://images.unsplash.com/photo-1512820790803-83ca734da794?q=80&w=800&auto=format&fit=crop",
        location: {
          city: "Varanasi",
          state: "Uttar Pradesh",
          coordinates: { latitude: 25.3176, longitude: 82.9739 },
        },
      },
      {
        ngoId: ngoMap["ngo_smile_678"],
        title: "Smile on Wheels – Mobile Health Unit for Jharkhand Tribes",
        description:
          "Smile Foundation's Smile on Wheels programme deploys fully-equipped mobile medical units to remote tribal areas. This campaign funds one new mobile unit for the Khunti and Gumla districts of Jharkhand, serving 15,000+ tribal families who have no access to a hospital within 50 km.",
        shortDescription:
          "Mobile healthcare unit for 15,000 tribal families in Jharkhand's most remote districts.",
        category: "health",
        goalAmount: 3500000,
        currentAmount: 980000,
        isUrgent: false,
        startDate: new Date(),
        endDate: new Date(Date.now() + 80 * 24 * 60 * 60 * 1000),
        status: "active",
        approvalStatus: "approved",
        imageUrl:
          "https://images.unsplash.com/photo-1579684385127-1ef15d508118?q=80&w=800&auto=format&fit=crop",
        location: {
          city: "Ranchi",
          state: "Jharkhand",
          coordinates: { latitude: 23.3441, longitude: 85.3096 },
        },
      },

      // ── HELPAGE INDIA (health / elderly) ─────────────────────────
      {
        ngoId: ngoMap["ngo_helpage_789"],
        title: "mHealth Clinics for Elderly in Rural Tamil Nadu",
        description:
          "HelpAge India's mHealth mobile clinics bring free medical care, medicines, and mental health support directly to elderly people in remote villages of Tamil Nadu who cannot travel to hospitals. This campaign funds 3 mHealth units for Tirunelveli, Madurai, and Thanjavur districts — serving 6,000 senior citizens for one year.",
        shortDescription:
          "3 mobile health clinics for 6,000 elderly citizens in rural Tamil Nadu.",
        category: "health",
        goalAmount: 4200000,
        currentAmount: 2100000,
        isUrgent: false,
        startDate: new Date(),
        endDate: new Date(Date.now() + 70 * 24 * 60 * 60 * 1000),
        status: "active",
        approvalStatus: "approved",
        imageUrl:
          "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?q=80&w=800&auto=format&fit=crop",
        location: {
          city: "Chennai",
          state: "Tamil Nadu",
          coordinates: { latitude: 13.0827, longitude: 80.2707 },
        },
      },

      // ── CRY – CHILD RIGHTS AND YOU (child-welfare) ───────────────
      {
        ngoId: ngoMap["ngo_cry_890"],
        title: "Stop Child Labour in Carpet Weaving Belts of UP",
        description:
          "CRY is working with 12 grassroots partners to withdraw children from hazardous carpet weaving units in Mirzapur and Bhadohi, UP — areas that supply 90% of India's hand-knotted carpet exports. Funds support rescue operations, bridge schooling, family livelihood support, and legal assistance for the most exploited children.",
        shortDescription:
          "Rescuing and re-enrolling child labourers from UP's carpet weaving districts.",
        category: "child-welfare",
        goalAmount: 1800000,
        currentAmount: 720000,
        isUrgent: true,
        startDate: new Date(),
        endDate: new Date(Date.now() + 50 * 24 * 60 * 60 * 1000),
        status: "active",
        approvalStatus: "approved",
        imageUrl:
          "https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?q=80&w=800&auto=format&fit=crop",
        location: {
          city: "Mirzapur",
          state: "Uttar Pradesh",
          coordinates: { latitude: 25.1501, longitude: 82.5697 },
        },
      },
      {
        ngoId: ngoMap["ngo_cry_890"],
        title: "Safe Shelter for Orphaned Children – Kolkata",
        description:
          "CRY is expanding its partner shelter home in Kolkata to accommodate 50 more children who have lost parents or been abandoned. Your donation covers dormitory construction, beds, nutritious food, and primary healthcare for these children for the first year.",
        shortDescription:
          "Expanding shelter capacity for 50 orphaned children in Kolkata.",
        category: "child-welfare",
        goalAmount: 2500000,
        currentAmount: 850000,
        isUrgent: false,
        startDate: new Date(),
        endDate: new Date(Date.now() + 80 * 24 * 60 * 60 * 1000),
        status: "active",
        approvalStatus: "approved",
        imageUrl:
          "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?q=80&w=800&auto=format&fit=crop",
        location: {
          city: "Kolkata",
          state: "West Bengal",
          coordinates: { latitude: 22.5726, longitude: 88.3639 },
        },
      },

      // ── NANHI KALI (women-empowerment / education) ───────────────
      {
        ngoId: ngoMap["ngo_nanhi_kali_901"],
        title: "Educate 500 Girls in Rural Rajasthan",
        description:
          "Project Nanhi Kali is sponsoring 500 underprivileged girls in remote Barmer and Sirohi villages for a full academic year. Each sponsorship covers school fees, uniform, textbooks, a nutritious meal, and weekly academic support sessions — ensuring they don't drop out before Grade 10.",
        shortDescription:
          "Full-year school sponsorship for 500 underprivileged girls in rural Rajasthan.",
        category: "women-empowerment",
        goalAmount: 2000000,
        currentAmount: 1800000,
        isUrgent: false,
        startDate: new Date(),
        endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
        status: "active",
        approvalStatus: "approved",
        imageUrl:
          "https://images.unsplash.com/photo-1571260899304-425eee4c7efc?q=80&w=800&auto=format&fit=crop",
        location: {
          city: "Jaipur",
          state: "Rajasthan",
          coordinates: { latitude: 26.9124, longitude: 75.7873 },
        },
      },

      // ── TEACH FOR INDIA (education) ──────────────────────────────
      {
        ngoId: ngoMap["ngo_teach_india_012"],
        title: "TFI Fellows for 10 Under-Resourced Mumbai Schools",
        description:
          "Teach For India's 2-year Fellows are placed as full-time teachers in Mumbai's most neglected government schools in Dharavi, Govandi, and Mankhurd. This campaign sponsors 10 new Fellows for one academic year — each Fellow directly transforms learning outcomes for 35+ children daily using innovative, child-centered pedagogy.",
        shortDescription:
          "Sponsoring 10 TFI Fellows in Mumbai's most neglected government schools.",
        category: "education",
        goalAmount: 3200000,
        currentAmount: 2400000,
        isUrgent: false,
        startDate: new Date(),
        endDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
        status: "active",
        approvalStatus: "approved",
        imageUrl:
          "https://images.unsplash.com/photo-1509062522246-3755977927d7?q=80&w=800&auto=format&fit=crop",
        location: {
          city: "Mumbai",
          state: "Maharashtra",
          coordinates: { latitude: 19.076, longitude: 72.8777 },
        },
      },
    ];

    // Remove campaigns with undefined ngoId (NGO not seeded yet)
    const valid = sampleCampaigns.filter((c) => {
      if (!c.ngoId) {
        console.warn(`⚠️  Skipping "${c.title}" — NGO not found`);
        return false;
      }
      return true;
    });

    await Campaign.deleteMany({});
    console.log("🗑️  Cleared existing campaigns");

    const inserted = await Campaign.insertMany(valid);
    console.log(`\n✅ ${inserted.length} campaigns seeded successfully!`);
    inserted.forEach((c) => console.log(`   ${c.title}`));

    process.exit(0);
  } catch (err) {
    console.error("❌ Error seeding campaigns:", err);
    process.exit(1);
  }
};

seedDB();