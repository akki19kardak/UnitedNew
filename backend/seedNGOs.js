import dns from "dns";
dns.setDefaultResultOrder("ipv4first");
dns.setServers(["8.8.8.8", "8.8.4.4"]);

import mongoose from "mongoose";
import dotenv from "dotenv";
import NGO from "./models/Ngo.js";
dotenv.config();


const indianNGOs = [

  {
    firebaseUid: "ngo_pratham_123",
    email: "contact@pratham.org",
    name: "Pratham Education Foundation",
    description:
      "To improve the quality of education in India and ensure that every child is in school and learning well. Founded in 1995 in Mumbai, Pratham is one of the largest NGOs working in education across rural India, famous for its ASER (Annual Status of Education Report) and Teaching at the Right Level methodology.",
    darpanId: "MH/2000/0004699",
    isVerified: true,
    verifiedAt: new Date(),
    phone: "+91-22-66231000",
    city: "Mumbai",
    state: "Maharashtra",
    website: "https://www.pratham.org",
    cause: "education",
    status: "approved",
    logoUrl:
      "https://upload.wikimedia.org/wikipedia/en/thumb/9/9d/Pratham_logo.png/220px-Pratham_logo.png",
    totalDonations: 50000000,
    totalDonors: 12000,
    totalCampaigns: 5,
  },
  {
    firebaseUid: "ngo_goonj_234",
    email: "info@goonj.org",
    name: "Goonj",
    description:
      "Founded in 1999 by Anshu Gupta (Magsaysay Award winner), Goonj bridges the gap between cities and villages by channelizing urban surplus material as a resource for rural development. Their 'Cloth for Work' model treats dignity as non-negotiable in charity.",
    darpanId: "DL/2001/0001234",
    isVerified: true,
    verifiedAt: new Date(),
    phone: "+91-11-26972351",
    city: "New Delhi",
    state: "Delhi",
    website: "https://www.goonj.org",
    cause: "other",
    status: "approved",
    logoUrl:
      "https://upload.wikimedia.org/wikipedia/en/thumb/4/4b/Goonj-logo.png/220px-Goonj-logo.png",
    totalDonations: 85000000,
    totalDonors: 25000,
    totalCampaigns: 8,
  },
  {
    firebaseUid: "ngo_akshaya_345",
    email: "contact@akshayapatra.org",
    name: "Akshaya Patra Foundation",
    description:
      "Started in 2000 in Bengaluru, Akshaya Patra implements the world's largest NGO-run mid-day meal program, serving over 2.25 million children across 16 states daily. They believe no child should be deprived of education due to hunger.",
    darpanId: "KA/2001/0007823",
    isVerified: true,
    verifiedAt: new Date(),
    phone: "+91-80-30143400",
    city: "Bengaluru",
    state: "Karnataka",
    website: "https://www.akshayapatra.org",
    cause: "child-welfare",
    status: "approved",
    logoUrl:
      "https://upload.wikimedia.org/wikipedia/en/thumb/b/b9/Akshaya_Patra_Foundation_Logo.png/220px-Akshaya_Patra_Foundation_Logo.png",
    totalDonations: 150000000,
    totalDonors: 40000,
    totalCampaigns: 6,
  },
  {
    firebaseUid: "ngo_sewa_456",
    email: "info@sewainternational.org",
    name: "Sewa International",
    description:
      "Sewa International serves humanity in distress through disaster relief, healthcare, education and livelihood support across India and abroad. They have responded to major disasters including the Gujarat earthquake, Kedarnath floods, and COVID-19.",
    darpanId: "DL/2003/0009876",
    isVerified: true,
    verifiedAt: new Date(),
    phone: "+91-11-43072786",
    city: "New Delhi",
    state: "Delhi",
    website: "https://www.sewainternational.org",
    cause: "disaster-relief",
    status: "approved",
    totalDonations: 40000000,
    totalDonors: 9000,
    totalCampaigns: 4,
  },
  {
    firebaseUid: "ngo_pfa_567",
    email: "info@petaIndia.com",
    name: "People For Animals",
    description:
      "People For Animals (PFA) is India's largest animal welfare organisation, founded by Maneka Gandhi. They rescue and rehabilitate abused and injured animals, run animal hospitals, and advocate for animal rights legislation across India.",
    darpanId: "DL/1992/0003456",
    isVerified: true,
    verifiedAt: new Date(),
    phone: "+91-11-23389430",
    city: "New Delhi",
    state: "Delhi",
    website: "https://www.peopleforanimals.in",
    cause: "animal-welfare",
    status: "approved",
    totalDonations: 20000000,
    totalDonors: 5000,
    totalCampaigns: 3,
  },

  // ── NEW 5 REAL NGOs ────────────────────────────────────────────
  {
    firebaseUid: "ngo_smile_678",
    email: "info@smilefoundationindia.org",
    name: "Smile Foundation",
    description:
      "Established in 2002 in New Delhi, Smile Foundation impacts the lives of over 20 lakh children and their families every year. With 400+ projects across 27 states, they work on education, healthcare, livelihood, and women empowerment through programmes like Mission Education, Smile on Wheels (mobile health), and Swabhiman (women empowerment).",
    darpanId: "DL/2002/0006789",
    isVerified: true,
    verifiedAt: new Date(),
    phone: "+91-11-43123700",
    city: "New Delhi",
    state: "Delhi",
    website: "https://www.smilefoundationindia.org",
    cause: "education",
    status: "approved",
    logoUrl:
      "https://www.smilefoundationindia.org/images/smile-foundation-logo.png",
    totalDonations: 120000000,
    totalDonors: 35000,
    totalCampaigns: 9,
  },
  {
    firebaseUid: "ngo_helpage_789",
    email: "contact@helpageindia.org",
    name: "HelpAge India",
    description:
      "Founded in 1978 in New Delhi, HelpAge India is a leading NGO working for the rights and needs of disadvantaged older persons. They run mobile health units (mHealth), elder help lines, and rehabilitation programs across India, impacting millions of elderly citizens who face poverty, abuse, or abandonment.",
    darpanId: "DL/1978/0002345",
    isVerified: true,
    verifiedAt: new Date(),
    phone: "+91-11-41688955",
    city: "New Delhi",
    state: "Delhi",
    website: "https://www.helpageindia.org",
    cause: "health",
    status: "approved",
    logoUrl:
      "https://www.helpageindia.org/wp-content/uploads/2020/07/helpage-logo.png",
    totalDonations: 75000000,
    totalDonors: 18000,
    totalCampaigns: 7,
  },
  {
    firebaseUid: "ngo_cry_890",
    email: "info@cry.org",
    name: "CRY – Child Rights and You",
    description:
      "Founded in 1979 by Rippan Kapur, CRY has impacted the lives of over 4.7 million children across 20 states. CRY partners with 144 grassroots organizations to ensure children's rights to survival, education, protection from labour and marriage, and participation. Their approach focuses on systemic change rather than charity.",
    darpanId: "MH/1979/0001567",
    isVerified: true,
    verifiedAt: new Date(),
    phone: "+91-22-23887801",
    city: "Mumbai",
    state: "Maharashtra",
    website: "https://www.cry.org",
    cause: "child-welfare",
    status: "approved",
    logoUrl: "https://www.cry.org/images/cry-logo.png",
    totalDonations: 90000000,
    totalDonors: 28000,
    totalCampaigns: 6,
  },
  {
    firebaseUid: "ngo_nanhi_kali_901",
    email: "contact@nanhikali.org",
    name: "Nanhi Kali – Project by K.C. Mahindra Education Trust",
    description:
      "Started in 1996 by Anand Mahindra, Nanhi Kali (meaning 'a little bud') has educated over 700,000 underprivileged girls across 15 states. The programme provides a 10-year sponsorship model covering school fees, uniforms, books, and academic support — ensuring girls complete formal schooling till Grade 10.",
    darpanId: "MH/1996/0003210",
    isVerified: true,
    verifiedAt: new Date(),
    phone: "+91-22-66521000",
    city: "Mumbai",
    state: "Maharashtra",
    website: "https://www.nanhikali.org",
    cause: "women-empowerment",
    status: "approved",
    logoUrl: "https://www.nanhikali.org/Content/images/logo.png",
    totalDonations: 60000000,
    totalDonors: 22000,
    totalCampaigns: 5,
  },
  {
    firebaseUid: "ngo_teach_india_012",
    email: "contact@teachforindia.org",
    name: "Teach For India",
    description:
      "Founded in 2007 by Shaheen Mistri as part of the Teach For All global network, Teach For India recruits talented graduates and professionals for a 2-year Fellowship to teach in under-resourced schools. Operating in 9 cities including Mumbai, Delhi, Pune, Bengaluru and Hyderabad, TFI has trained 3,400+ alumni and currently has 900 active Fellows teaching 33,000 children.",
    darpanId: "MH/2007/0009123",
    isVerified: true,
    verifiedAt: new Date(),
    phone: "+91-22-61450800",
    city: "Mumbai",
    state: "Maharashtra",
    website: "https://www.teachforindia.org",
    cause: "education",
    status: "approved",
    logoUrl: "https://www.teachforindia.org/img/tfi-logo.png",
    totalDonations: 45000000,
    totalDonors: 15000,
    totalCampaigns: 4,
  },
];

const seedDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
      family: 4,
    });
    console.log("✅ Connected to MongoDB");

    // Clear only seeded NGOs (by firebaseUid)
    await NGO.deleteMany({
      firebaseUid: { $in: indianNGOs.map((n) => n.firebaseUid) },
    });

    const inserted = await NGO.insertMany(indianNGOs);
    console.log(`\n✅ ${inserted.length} NGOs seeded successfully!`);
    inserted.forEach((n) => console.log(`   ${n.name} → _id: ${n._id}`));

    process.exit(0);
  } catch (err) {
    console.error("❌ Error seeding NGOs:", err);
    process.exit(1);
  }
};

seedDB();