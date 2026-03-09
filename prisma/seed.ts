import { PrismaClient, Role, BookingStatus, LocationType } from "@prisma/client";
import { hash } from "bcryptjs";
import { Decimal } from "@prisma/client/runtime/library";

const prisma = new PrismaClient();

function generateBookingNumber(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 5; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return `SPA-${code}`;
}

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function randomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomElements<T>(arr: T[], min: number, max: number): T[] {
  const count = min + Math.floor(Math.random() * (max - min + 1));
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

const ALL_MASSAGE_TYPES = [
  "Swedish",
  "Deep Tissue",
  "Thai",
  "Sports",
  "Hot Stone",
  "Aromatherapy",
  "Reflexology",
  "Shiatsu",
  "Couples",
  "Prenatal",
];

const THERAPIST_DATA = [
  {
    firstName: "Elena",
    lastName: "Rodriguez",
    displayName: "Elena Rodriguez, LMT",
    bio: "Board-certified massage therapist with 12 years of experience specializing in deep tissue and sports massage. I focus on chronic pain relief and injury recovery, combining multiple techniques for optimal results.",
    tagline: "Expert deep tissue & sports massage therapy",
    gender: "Female",
    ethnicity: "Hispanic",
    age: 34,
    height: "5'6\"",
    hairColor: "Dark Brown",
    eyeColor: "Brown",
    state: "New York",
    city: "New York",
    borough: "Manhattan",
    latitude: 40.7589,
    longitude: -73.9851,
    massageTypes: ["Deep Tissue", "Sports", "Swedish", "Hot Stone"],
    incallAvailable: true,
    outcallAvailable: true,
    incallPrice: 180,
    outcallPrice: 220,
    outcallRadius: 10,
  },
  {
    firstName: "Marcus",
    lastName: "Chen",
    displayName: "Marcus Chen, CMT",
    bio: "Certified massage therapist trained in both Eastern and Western modalities. My approach blends Shiatsu with Swedish techniques for a deeply relaxing yet therapeutic experience.",
    tagline: "East meets West healing massage",
    gender: "Male",
    ethnicity: "Asian",
    age: 29,
    height: "5'10\"",
    hairColor: "Black",
    eyeColor: "Dark Brown",
    state: "California",
    city: "Los Angeles",
    borough: null,
    latitude: 34.0522,
    longitude: -118.2437,
    massageTypes: ["Shiatsu", "Swedish", "Deep Tissue", "Aromatherapy"],
    incallAvailable: true,
    outcallAvailable: true,
    incallPrice: 150,
    outcallPrice: 200,
    outcallRadius: 15,
  },
  {
    firstName: "Aisha",
    lastName: "Williams",
    displayName: "Aisha Williams, LMT",
    bio: "Specializing in prenatal and aromatherapy massage with 8 years of dedicated practice. I create a nurturing environment where mothers-to-be can find relief and relaxation.",
    tagline: "Prenatal & aromatherapy specialist",
    gender: "Female",
    ethnicity: "Black",
    age: 31,
    height: "5'4\"",
    hairColor: "Black",
    eyeColor: "Dark Brown",
    state: "Illinois",
    city: "Chicago",
    borough: null,
    latitude: 41.8781,
    longitude: -87.6298,
    massageTypes: ["Prenatal", "Aromatherapy", "Swedish", "Reflexology"],
    incallAvailable: true,
    outcallAvailable: false,
    incallPrice: 140,
    outcallPrice: null,
    outcallRadius: null,
  },
  {
    firstName: "James",
    lastName: "O'Brien",
    displayName: "James O'Brien, RMT",
    bio: "Former collegiate athlete turned registered massage therapist. I understand the demands athletes place on their bodies and specialize in sports recovery and injury prevention.",
    tagline: "Athletic recovery & sports massage expert",
    gender: "Male",
    ethnicity: "White",
    age: 38,
    height: "6'1\"",
    hairColor: "Red",
    eyeColor: "Green",
    state: "Texas",
    city: "Austin",
    borough: null,
    latitude: 30.2672,
    longitude: -97.7431,
    massageTypes: ["Sports", "Deep Tissue", "Swedish", "Thai"],
    incallAvailable: true,
    outcallAvailable: true,
    incallPrice: 130,
    outcallPrice: 170,
    outcallRadius: 20,
  },
  {
    firstName: "Mei",
    lastName: "Tanaka",
    displayName: "Mei Tanaka, LMT",
    bio: "Trained in traditional Thai massage in Chiang Mai, Thailand. I bring authentic technique and spiritual mindfulness to every session, helping clients achieve balance and flexibility.",
    tagline: "Authentic Thai massage practitioner",
    gender: "Female",
    ethnicity: "Asian",
    age: 27,
    height: "5'3\"",
    hairColor: "Black",
    eyeColor: "Dark Brown",
    state: "California",
    city: "San Francisco",
    borough: null,
    latitude: 37.7749,
    longitude: -122.4194,
    massageTypes: ["Thai", "Shiatsu", "Reflexology", "Aromatherapy"],
    incallAvailable: true,
    outcallAvailable: false,
    incallPrice: 160,
    outcallPrice: null,
    outcallRadius: null,
  },
  {
    firstName: "David",
    lastName: "Kim",
    displayName: "David Kim, CMT",
    bio: "Luxury spa therapist with a focus on hot stone and aromatherapy treatments. Every session is crafted to provide maximum relaxation in a premium, tranquil setting.",
    tagline: "Luxury hot stone & aromatherapy sessions",
    gender: "Male",
    ethnicity: "Asian",
    age: 33,
    height: "5'9\"",
    hairColor: "Black",
    eyeColor: "Brown",
    state: "New York",
    city: "New York",
    borough: "Brooklyn",
    latitude: 40.6782,
    longitude: -73.9442,
    massageTypes: ["Hot Stone", "Aromatherapy", "Swedish", "Couples"],
    incallAvailable: true,
    outcallAvailable: true,
    incallPrice: 200,
    outcallPrice: 250,
    outcallRadius: 8,
  },
  {
    firstName: "Sofia",
    lastName: "Petrov",
    displayName: "Sofia Petrov, LMT",
    bio: "Classically trained massage therapist with expertise in Swedish and couples massage. I believe in the healing power of touch and create deeply calming experiences.",
    tagline: "Classic Swedish & couples massage",
    gender: "Female",
    ethnicity: "White",
    age: 36,
    height: "5'7\"",
    hairColor: "Blonde",
    eyeColor: "Blue",
    state: "Florida",
    city: "Miami",
    borough: null,
    latitude: 25.7617,
    longitude: -80.1918,
    massageTypes: ["Swedish", "Couples", "Aromatherapy", "Hot Stone"],
    incallAvailable: true,
    outcallAvailable: true,
    incallPrice: 170,
    outcallPrice: 210,
    outcallRadius: 12,
  },
  {
    firstName: "Carlos",
    lastName: "Mendez",
    displayName: "Carlos Mendez, RMT",
    bio: "Registered massage therapist specializing in reflexology and deep tissue work. My technique targets pressure points to alleviate tension and promote natural healing.",
    tagline: "Reflexology & deep tissue healing",
    gender: "Male",
    ethnicity: "Hispanic",
    age: 41,
    height: "5'11\"",
    hairColor: "Dark Brown",
    eyeColor: "Brown",
    state: "Texas",
    city: "Houston",
    borough: null,
    latitude: 29.7604,
    longitude: -95.3698,
    massageTypes: ["Reflexology", "Deep Tissue", "Sports", "Swedish"],
    incallAvailable: true,
    outcallAvailable: true,
    incallPrice: 120,
    outcallPrice: 160,
    outcallRadius: 25,
  },
  {
    firstName: "Jasmine",
    lastName: "Patel",
    displayName: "Jasmine Patel, LMT",
    bio: "Ayurveda-inspired massage therapist bringing ancient Indian healing traditions into modern wellness. Specializing in aromatherapy with custom essential oil blends for each client.",
    tagline: "Ayurvedic aromatherapy & holistic healing",
    gender: "Female",
    ethnicity: "South Asian",
    age: 30,
    height: "5'5\"",
    hairColor: "Black",
    eyeColor: "Dark Brown",
    state: "New York",
    city: "New York",
    borough: "Queens",
    latitude: 40.7282,
    longitude: -73.7949,
    massageTypes: ["Aromatherapy", "Swedish", "Hot Stone", "Reflexology"],
    incallAvailable: true,
    outcallAvailable: false,
    incallPrice: 145,
    outcallPrice: null,
    outcallRadius: null,
  },
  {
    firstName: "Tyler",
    lastName: "Brooks",
    displayName: "Tyler Brooks, CSMT",
    bio: "Certified sports massage therapist working with professional and amateur athletes. I focus on performance optimization, injury prevention, and post-workout recovery.",
    tagline: "Pro athlete recovery specialist",
    gender: "Male",
    ethnicity: "Black",
    age: 35,
    height: "6'2\"",
    hairColor: "Black",
    eyeColor: "Brown",
    state: "Georgia",
    city: "Atlanta",
    borough: null,
    latitude: 33.749,
    longitude: -84.388,
    massageTypes: ["Sports", "Deep Tissue", "Thai", "Swedish"],
    incallAvailable: true,
    outcallAvailable: true,
    incallPrice: 155,
    outcallPrice: 195,
    outcallRadius: 15,
  },
  {
    firstName: "Hannah",
    lastName: "Larson",
    displayName: "Hannah Larson, LMT",
    bio: "Holistic massage therapist with a gentle, intuitive approach. I combine Swedish technique with mindfulness practices to help clients decompress from the stresses of daily life.",
    tagline: "Mindful Swedish massage & relaxation",
    gender: "Female",
    ethnicity: "White",
    age: 28,
    height: "5'8\"",
    hairColor: "Light Brown",
    eyeColor: "Hazel",
    state: "Washington",
    city: "Seattle",
    borough: null,
    latitude: 47.6062,
    longitude: -122.3321,
    massageTypes: ["Swedish", "Aromatherapy", "Hot Stone", "Prenatal"],
    incallAvailable: true,
    outcallAvailable: true,
    incallPrice: 140,
    outcallPrice: 180,
    outcallRadius: 10,
  },
  {
    firstName: "Robert",
    lastName: "Washington",
    displayName: "Robert Washington, CMT",
    bio: "15 years of experience in therapeutic massage with a focus on chronic pain management. I work closely with chiropractors and physical therapists to provide comprehensive care.",
    tagline: "Chronic pain relief & therapeutic massage",
    gender: "Male",
    ethnicity: "Black",
    age: 44,
    height: "5'10\"",
    hairColor: "Gray",
    eyeColor: "Brown",
    state: "Pennsylvania",
    city: "Philadelphia",
    borough: null,
    latitude: 39.9526,
    longitude: -75.1652,
    massageTypes: ["Deep Tissue", "Swedish", "Sports", "Reflexology"],
    incallAvailable: true,
    outcallAvailable: false,
    incallPrice: 135,
    outcallPrice: null,
    outcallRadius: null,
  },
  {
    firstName: "Yuki",
    lastName: "Sato",
    displayName: "Yuki Sato, LMT",
    bio: "Japanese-trained Shiatsu practitioner with additional certification in Thai massage. I use pressure point techniques and stretching to restore energy flow and relieve muscular tension.",
    tagline: "Shiatsu & Thai massage master",
    gender: "Female",
    ethnicity: "Asian",
    age: 32,
    height: "5'2\"",
    hairColor: "Black",
    eyeColor: "Dark Brown",
    state: "California",
    city: "San Diego",
    borough: null,
    latitude: 32.7157,
    longitude: -117.1611,
    massageTypes: ["Shiatsu", "Thai", "Reflexology", "Deep Tissue"],
    incallAvailable: true,
    outcallAvailable: true,
    incallPrice: 150,
    outcallPrice: 190,
    outcallRadius: 12,
  },
  {
    firstName: "Patrick",
    lastName: "Murphy",
    displayName: "Patrick Murphy, RMT",
    bio: "Registered massage therapist offering premium couples massage experiences. Whether it's a date night or anniversary, I create memorable relaxation experiences for two.",
    tagline: "Premium couples massage experiences",
    gender: "Male",
    ethnicity: "White",
    age: 37,
    height: "6'0\"",
    hairColor: "Brown",
    eyeColor: "Blue",
    state: "Nevada",
    city: "Las Vegas",
    borough: null,
    latitude: 36.1699,
    longitude: -115.1398,
    massageTypes: ["Couples", "Swedish", "Hot Stone", "Aromatherapy"],
    incallAvailable: true,
    outcallAvailable: true,
    incallPrice: 190,
    outcallPrice: 240,
    outcallRadius: 20,
  },
  {
    firstName: "Priya",
    lastName: "Sharma",
    displayName: "Priya Sharma, LMT",
    bio: "Wellness-focused massage therapist integrating hot stone therapy with deep tissue techniques. I specialize in helping clients manage stress and achieve deep relaxation.",
    tagline: "Hot stone & deep tissue wellness",
    gender: "Female",
    ethnicity: "South Asian",
    age: 29,
    height: "5'4\"",
    hairColor: "Black",
    eyeColor: "Dark Brown",
    state: "Massachusetts",
    city: "Boston",
    borough: null,
    latitude: 42.3601,
    longitude: -71.0589,
    massageTypes: ["Hot Stone", "Deep Tissue", "Swedish", "Aromatherapy"],
    incallAvailable: true,
    outcallAvailable: true,
    incallPrice: 165,
    outcallPrice: 205,
    outcallRadius: 8,
  },
  {
    firstName: "Antonio",
    lastName: "Reyes",
    displayName: "Antonio Reyes, CMT",
    bio: "Bilingual massage therapist (English/Spanish) specializing in therapeutic sports and deep tissue massage. I bring intensity and precision to every session for maximum relief.",
    tagline: "Bilingual sports & deep tissue specialist",
    gender: "Male",
    ethnicity: "Hispanic",
    age: 40,
    height: "5'11\"",
    hairColor: "Black",
    eyeColor: "Brown",
    state: "Arizona",
    city: "Phoenix",
    borough: null,
    latitude: 33.4484,
    longitude: -112.074,
    massageTypes: ["Sports", "Deep Tissue", "Swedish", "Thai"],
    incallAvailable: true,
    outcallAvailable: true,
    incallPrice: 110,
    outcallPrice: 150,
    outcallRadius: 30,
  },
  {
    firstName: "Lauren",
    lastName: "Scott",
    displayName: "Lauren Scott, LMT",
    bio: "Prenatal massage specialist and certified doula. I provide safe, nurturing massage therapy for expecting mothers at every stage of pregnancy, helping ease discomfort naturally.",
    tagline: "Certified prenatal massage & doula",
    gender: "Female",
    ethnicity: "White",
    age: 33,
    height: "5'6\"",
    hairColor: "Auburn",
    eyeColor: "Green",
    state: "Colorado",
    city: "Denver",
    borough: null,
    latitude: 39.7392,
    longitude: -104.9903,
    massageTypes: ["Prenatal", "Swedish", "Aromatherapy", "Reflexology"],
    incallAvailable: true,
    outcallAvailable: true,
    incallPrice: 145,
    outcallPrice: 185,
    outcallRadius: 15,
  },
  {
    firstName: "Darnell",
    lastName: "Jackson",
    displayName: "Darnell Jackson, LMT",
    bio: "Urban wellness advocate bringing affordable therapeutic massage to the community. My deep tissue and sports massage techniques are informed by 10 years of hands-on experience.",
    tagline: "Community-focused therapeutic massage",
    gender: "Male",
    ethnicity: "Black",
    age: 36,
    height: "6'3\"",
    hairColor: "Black",
    eyeColor: "Brown",
    state: "Maryland",
    city: "Baltimore",
    borough: null,
    latitude: 39.2904,
    longitude: -76.6122,
    massageTypes: ["Deep Tissue", "Sports", "Swedish", "Hot Stone"],
    incallAvailable: true,
    outcallAvailable: true,
    incallPrice: 100,
    outcallPrice: 140,
    outcallRadius: 18,
  },
  {
    firstName: "Natasha",
    lastName: "Volkov",
    displayName: "Natasha Volkov, RMT",
    bio: "European-trained massage therapist offering luxurious Swedish and hot stone treatments. I create a spa-like atmosphere in every session, prioritizing comfort and elegance.",
    tagline: "European luxury massage experience",
    gender: "Female",
    ethnicity: "White",
    age: 31,
    height: "5'9\"",
    hairColor: "Platinum Blonde",
    eyeColor: "Gray",
    state: "New York",
    city: "New York",
    borough: "Manhattan",
    latitude: 40.7831,
    longitude: -73.9712,
    massageTypes: ["Swedish", "Hot Stone", "Aromatherapy", "Couples"],
    incallAvailable: true,
    outcallAvailable: true,
    incallPrice: 220,
    outcallPrice: 250,
    outcallRadius: 5,
  },
  {
    firstName: "Kevin",
    lastName: "Tran",
    displayName: "Kevin Tran, LMT",
    bio: "Vietnamese-American massage therapist blending traditional Southeast Asian techniques with modern sports therapy. I work with runners, cyclists, and CrossFit athletes.",
    tagline: "Southeast Asian sports therapy",
    gender: "Male",
    ethnicity: "Asian",
    age: 28,
    height: "5'8\"",
    hairColor: "Black",
    eyeColor: "Dark Brown",
    state: "Oregon",
    city: "Portland",
    borough: null,
    latitude: 45.5152,
    longitude: -122.6784,
    massageTypes: ["Thai", "Sports", "Deep Tissue", "Shiatsu"],
    incallAvailable: true,
    outcallAvailable: true,
    incallPrice: 125,
    outcallPrice: 165,
    outcallRadius: 12,
  },
  {
    firstName: "Isabella",
    lastName: "Moreno",
    displayName: "Isabella Moreno, CMT",
    bio: "Holistic healer combining reflexology, aromatherapy, and Swedish massage into transformative wellness sessions. I use organic essential oils and prioritize natural healing.",
    tagline: "Organic holistic wellness massage",
    gender: "Female",
    ethnicity: "Hispanic",
    age: 26,
    height: "5'3\"",
    hairColor: "Dark Brown",
    eyeColor: "Brown",
    state: "Florida",
    city: "Orlando",
    borough: null,
    latitude: 28.5383,
    longitude: -81.3792,
    massageTypes: ["Reflexology", "Aromatherapy", "Swedish", "Hot Stone"],
    incallAvailable: true,
    outcallAvailable: false,
    incallPrice: 115,
    outcallPrice: null,
    outcallRadius: null,
  },
  {
    firstName: "William",
    lastName: "Hayes",
    displayName: "William Hayes, LMT",
    bio: "Veteran massage therapist with 20 years of practice. I specialize in chronic pain management using deep tissue, trigger point therapy, and Swedish techniques tailored to each client's needs.",
    tagline: "20 years of expert pain management",
    gender: "Male",
    ethnicity: "White",
    age: 52,
    height: "5'10\"",
    hairColor: "Silver",
    eyeColor: "Blue",
    state: "Tennessee",
    city: "Nashville",
    borough: null,
    latitude: 36.1627,
    longitude: -86.7816,
    massageTypes: ["Deep Tissue", "Swedish", "Reflexology", "Sports"],
    incallAvailable: true,
    outcallAvailable: false,
    incallPrice: 130,
    outcallPrice: null,
    outcallRadius: null,
  },
];

const CLIENT_DATA = [
  {
    firstName: "Sarah",
    lastName: "Mitchell",
    email: "sarah.mitchell@example.com",
    phone: "212-555-0101",
  },
  {
    firstName: "Michael",
    lastName: "Torres",
    email: "michael.torres@example.com",
    phone: "310-555-0202",
  },
  {
    firstName: "Emily",
    lastName: "Johnson",
    email: "emily.johnson@example.com",
    phone: "312-555-0303",
  },
  {
    firstName: "Daniel",
    lastName: "Park",
    email: "daniel.park@example.com",
    phone: "404-555-0404",
  },
  {
    firstName: "Jessica",
    lastName: "Nguyen",
    email: "jessica.nguyen@example.com",
    phone: "206-555-0505",
  },
];

const REVIEW_TEMPLATES = [
  {
    title: "Amazing experience!",
    comment:
      "One of the best massages I've ever had. The therapist was incredibly skilled and attentive to my problem areas. I left feeling completely rejuvenated.",
    rating: 5,
  },
  {
    title: "Very professional",
    comment:
      "Great technique and very professional setup. The pressure was perfect and they checked in throughout the session. Will definitely book again.",
    rating: 5,
  },
  {
    title: "Good but could improve",
    comment:
      "Overall a solid massage. The ambiance was nice and the therapist was friendly. Could use a bit more pressure in the shoulders but otherwise good.",
    rating: 4,
  },
  {
    title: "Excellent deep tissue work",
    comment:
      "Finally found someone who understands deep tissue! They worked out knots I've had for months. A little sore the next day but felt incredible after.",
    rating: 5,
  },
  {
    title: "Relaxing and therapeutic",
    comment:
      "Such a calming experience from start to finish. The essential oils were wonderful and the technique was smooth and flowing. Highly recommend.",
    rating: 5,
  },
  {
    title: "Decent session",
    comment:
      "It was a decent massage, nothing extraordinary. The therapist was on time and professional. The space was clean. Would consider returning.",
    rating: 3,
  },
  {
    title: "Fantastic couples massage",
    comment:
      "My partner and I had an incredible couples massage here. The therapist made us both feel comfortable and the synchronization between the two sessions was impressive.",
    rating: 5,
  },
  {
    title: "Great sports recovery",
    comment:
      "As a marathon runner, I need regular sports massages. This therapist really knows their anatomy and targeted exactly the muscle groups I needed work on.",
    rating: 4,
  },
  {
    title: "Wonderful prenatal massage",
    comment:
      "Being 7 months pregnant, I was nervous about getting a massage. The therapist made me feel completely safe and addressed all my aches. Such relief!",
    rating: 5,
  },
  {
    title: "Solid Thai massage",
    comment:
      "Authentic Thai massage technique with great stretching. I felt more flexible and energized afterwards. The session was exactly what I needed.",
    rating: 4,
  },
];

const THERAPIST_RESPONSES = [
  "Thank you so much for the kind words! It was a pleasure working with you.",
  "I'm glad you enjoyed the session! Looking forward to seeing you again.",
  "Thank you for the feedback! I'll make sure to focus on those areas next time.",
  null,
  null,
  "Thanks for your visit! I appreciate the honest feedback.",
  null,
  "So glad I could help with your training recovery!",
  null,
  null,
];

async function main() {
  console.log("Seeding database...\n");

  // Clean existing data
  await prisma.review.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.favorite.deleteMany();
  await prisma.availabilityException.deleteMany();
  await prisma.availability.deleteMany();
  await prisma.therapistProfile.deleteMany();
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
  await prisma.user.deleteMany();

  const hashedPassword = await hash("Password123!", 12);

  // Create client users
  const clients = [];
  for (const data of CLIENT_DATA) {
    const client = await prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        role: Role.CLIENT,
        emailVerified: new Date(),
      },
    });
    clients.push(client);
    console.log(`  Created client: ${data.firstName} ${data.lastName}`);
  }

  // Create therapist users with profiles and availability
  const therapistProfiles = [];
  for (const data of THERAPIST_DATA) {
    const user = await prisma.user.create({
      data: {
        email: `${data.firstName.toLowerCase()}.${data.lastName.toLowerCase()}@example.com`,
        password: hashedPassword,
        firstName: data.firstName,
        lastName: data.lastName,
        role: Role.THERAPIST,
        emailVerified: new Date(),
      },
    });

    const profile = await prisma.therapistProfile.create({
      data: {
        userId: user.id,
        displayName: data.displayName,
        slug: generateSlug(`${data.firstName}-${data.lastName}`),
        bio: data.bio,
        tagline: data.tagline,
        gender: data.gender,
        ethnicity: data.ethnicity,
        age: data.age,
        height: data.height,
        hairColor: data.hairColor,
        eyeColor: data.eyeColor,
        state: data.state,
        city: data.city,
        borough: data.borough,
        latitude: data.latitude,
        longitude: data.longitude,
        massageTypes: data.massageTypes,
        incallAvailable: data.incallAvailable,
        outcallAvailable: data.outcallAvailable,
        incallPricePerHour: data.incallPrice
          ? new Decimal(data.incallPrice)
          : null,
        outcallPricePerHour: data.outcallPrice
          ? new Decimal(data.outcallPrice)
          : null,
        outcallRadius: data.outcallRadius,
        isVerified: Math.random() > 0.3,
        isActive: true,
      },
    });

    // Create availability (weekday schedules, some with weekends)
    const startHour = 8 + Math.floor(Math.random() * 3); // 8-10 AM
    const endHour = 17 + Math.floor(Math.random() * 4); // 5-8 PM
    const workDays =
      Math.random() > 0.4 ? [1, 2, 3, 4, 5, 6] : [1, 2, 3, 4, 5]; // Mon-Fri or Mon-Sat

    for (const day of workDays) {
      await prisma.availability.create({
        data: {
          therapistProfileId: profile.id,
          dayOfWeek: day,
          startTime: `${startHour.toString().padStart(2, "0")}:00`,
          endTime: `${endHour.toString().padStart(2, "0")}:00`,
          isActive: true,
        },
      });
    }

    therapistProfiles.push(profile);
    console.log(
      `  Created therapist: ${data.displayName} (${data.city}, ${data.state})`
    );
  }

  // Create bookings and reviews
  console.log("\nCreating bookings and reviews...");
  const usedBookingNumbers = new Set<string>();
  let bookingCount = 0;
  let reviewCount = 0;

  for (let i = 0; i < 35; i++) {
    const client = randomElement(clients);
    const profile = randomElement(therapistProfiles);
    const serviceType = randomElement(profile.massageTypes as string[]);
    const isIncall = profile.incallAvailable
      ? profile.outcallAvailable
        ? Math.random() > 0.4
        : true
      : false;
    const locationType = isIncall ? LocationType.INCALL : LocationType.OUTCALL;
    const pricePerHour = isIncall
      ? profile.incallPricePerHour!
      : profile.outcallPricePerHour!;
    const duration = randomElement([60, 90, 120]);
    const totalPrice = pricePerHour
      .mul(duration)
      .div(60)
      .toDecimalPlaces(2);
    const bookingFee = totalPrice.mul(0.1).toDecimalPlaces(2);

    // Generate unique booking number
    let bookingNumber: string;
    do {
      bookingNumber = generateBookingNumber();
    } while (usedBookingNumbers.has(bookingNumber));
    usedBookingNumbers.add(bookingNumber);

    // Generate date (past 3 months for completed, future for pending)
    const isPast = i < 25;
    const daysOffset = isPast
      ? -(Math.floor(Math.random() * 90) + 1)
      : Math.floor(Math.random() * 30) + 1;
    const bookingDate = new Date();
    bookingDate.setDate(bookingDate.getDate() + daysOffset);
    bookingDate.setHours(0, 0, 0, 0);

    const startHour = 9 + Math.floor(Math.random() * 8); // 9 AM - 4 PM
    const startTime = `${startHour.toString().padStart(2, "0")}:00`;
    const endMinutes = startHour * 60 + duration;
    const endTime = `${Math.floor(endMinutes / 60)
      .toString()
      .padStart(2, "0")}:${(endMinutes % 60).toString().padStart(2, "0")}`;

    const status = isPast
      ? randomElement([
          BookingStatus.COMPLETED,
          BookingStatus.COMPLETED,
          BookingStatus.COMPLETED,
          BookingStatus.CANCELLED,
          BookingStatus.NO_SHOW,
        ])
      : randomElement([BookingStatus.PENDING, BookingStatus.ACCEPTED]);

    const booking = await prisma.booking.create({
      data: {
        bookingNumber,
        clientId: client.id,
        therapistProfileId: profile.id,
        date: bookingDate,
        startTime,
        endTime,
        duration,
        serviceType,
        locationType,
        outcallAddress:
          locationType === LocationType.OUTCALL
            ? "123 Client St, Apt 4B"
            : null,
        totalPrice,
        bookingFee,
        status,
        clientNotes:
          Math.random() > 0.6
            ? "Please focus on my lower back and shoulders."
            : null,
      },
    });
    bookingCount++;

    // Create reviews for completed bookings (70% chance)
    if (status === BookingStatus.COMPLETED && Math.random() > 0.3) {
      const reviewTemplate = randomElement(REVIEW_TEMPLATES);
      const responseIdx = REVIEW_TEMPLATES.indexOf(reviewTemplate);

      await prisma.review.create({
        data: {
          bookingId: booking.id,
          clientId: client.id,
          therapistProfileId: profile.id,
          rating: reviewTemplate.rating,
          title: reviewTemplate.title,
          comment: reviewTemplate.comment,
          therapistResponse: THERAPIST_RESPONSES[responseIdx] ?? null,
        },
      });
      reviewCount++;
    }
  }

  // Update therapist ratings from reviews
  for (const profile of therapistProfiles) {
    const reviews = await prisma.review.findMany({
      where: { therapistProfileId: profile.id, isVisible: true },
      select: { rating: true },
    });

    if (reviews.length > 0) {
      const avgRating =
        reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
      await prisma.therapistProfile.update({
        where: { id: profile.id },
        data: {
          rating: Math.round(avgRating * 10) / 10,
          reviewCount: reviews.length,
        },
      });
    }
  }

  // Create some favorites
  console.log("Creating favorites...");
  for (const client of clients) {
    const favCount = 2 + Math.floor(Math.random() * 4);
    const favProfiles = randomElements(therapistProfiles, favCount, favCount);
    for (const profile of favProfiles) {
      await prisma.favorite.create({
        data: {
          userId: client.id,
          therapistProfileId: profile.id,
        },
      });
    }
  }

  // Create an admin user
  await prisma.user.create({
    data: {
      email: "admin@spagram.com",
      password: hashedPassword,
      firstName: "Admin",
      lastName: "User",
      role: Role.ADMIN,
      emailVerified: new Date(),
    },
  });
  console.log("  Created admin: admin@spagram.com");

  console.log(`\nSeed complete!`);
  console.log(`  ${CLIENT_DATA.length} clients`);
  console.log(`  ${THERAPIST_DATA.length} therapists with profiles`);
  console.log(`  ${bookingCount} bookings`);
  console.log(`  ${reviewCount} reviews`);
  console.log(`  1 admin`);
  console.log(`\nAll users password: Password123!`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
