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

interface TherapistSeed {
  firstName: string;
  lastName: string;
  displayName: string;
  bio: string;
  tagline: string;
  gender: string;
  ethnicity: string;
  age: number;
  height: string;
  hairColor: string;
  eyeColor: string;
  state: string;
  city: string;
  borough: string | null;
  latitude: number;
  longitude: number;
  massageTypes: string[];
  incallAvailable: boolean;
  outcallAvailable: boolean;
  incallPrice: number | null;
  outcallPrice: number | null;
  outcallRadius: number | null;
}

const THERAPIST_DATA: TherapistSeed[] = [
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
    firstName: "Zara",
    lastName: "Okafor",
    displayName: "Zara Okafor, LMT",
    bio: "Nigerian-American therapist blending West African healing traditions with modern massage techniques. Based in Bed-Stuy, I offer a warm, culturally affirming space for relaxation and healing.",
    tagline: "Afro-holistic healing & massage",
    gender: "Female",
    ethnicity: "Black",
    age: 27,
    height: "5'8\"",
    hairColor: "Black",
    eyeColor: "Dark Brown",
    state: "New York",
    city: "New York",
    borough: "Brooklyn",
    latitude: 40.6872,
    longitude: -73.9418,
    massageTypes: ["Deep Tissue", "Aromatherapy", "Swedish", "Hot Stone"],
    incallAvailable: true,
    outcallAvailable: true,
    incallPrice: 140,
    outcallPrice: 180,
    outcallRadius: 10,
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
    firstName: "Tiffany",
    lastName: "Morales",
    displayName: "Tiffany Morales, LMT",
    bio: "Bronx-born and raised, I'm proud to serve my community with affordable therapeutic massage. I specialize in Swedish and deep tissue techniques that address the everyday aches of working people.",
    tagline: "Affordable Bronx community massage",
    gender: "Female",
    ethnicity: "Hispanic",
    age: 28,
    height: "5'5\"",
    hairColor: "Dark Brown",
    eyeColor: "Brown",
    state: "New York",
    city: "New York",
    borough: "Bronx",
    latitude: 40.8448,
    longitude: -73.8648,
    massageTypes: ["Swedish", "Deep Tissue", "Sports", "Reflexology"],
    incallAvailable: true,
    outcallAvailable: true,
    incallPrice: 100,
    outcallPrice: 140,
    outcallRadius: 15,
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
    firstName: "Jade",
    lastName: "Morrison",
    displayName: "Jade Morrison, LMT",
    bio: "Hollywood Hills massage therapist with a celebrity clientele. My signature deep tissue technique uses slow, deliberate strokes to unlock chronic tension without painful pressure.",
    tagline: "Hollywood Hills premium deep tissue",
    gender: "Female",
    ethnicity: "Black",
    age: 33,
    height: "5'7\"",
    hairColor: "Black",
    eyeColor: "Dark Brown",
    state: "California",
    city: "Los Angeles",
    borough: null,
    latitude: 34.1003,
    longitude: -118.3268,
    massageTypes: ["Deep Tissue", "Swedish", "Hot Stone", "Aromatherapy"],
    incallAvailable: true,
    outcallAvailable: true,
    incallPrice: 200,
    outcallPrice: 250,
    outcallRadius: 10,
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
    firstName: "Anastasia",
    lastName: "Petrov",
    displayName: "Anastasia Petrov, LMT",
    bio: "Beverly Hills luxury therapist with a clientele of executives and celebrities. My signature Swedish-hot stone fusion treatment is designed for ultimate relaxation and skin rejuvenation.",
    tagline: "Beverly Hills celebrity-grade massage",
    gender: "Female",
    ethnicity: "White",
    age: 34,
    height: "5'8\"",
    hairColor: "Blonde",
    eyeColor: "Green",
    state: "California",
    city: "Beverly Hills",
    borough: null,
    latitude: 34.0736,
    longitude: -118.4004,
    massageTypes: ["Swedish", "Hot Stone", "Aromatherapy", "Couples"],
    incallAvailable: true,
    outcallAvailable: true,
    incallPrice: 250,
    outcallPrice: 300,
    outcallRadius: 10,
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
    firstName: "Crystal",
    lastName: "Diamond",
    displayName: "Crystal Diamond, LMT",
    bio: "Strip-adjacent luxury massage therapist offering in-room hotel sessions for visitors and premium studio treatments for locals. I specialize in Swedish and hot stone for ultimate Vegas relaxation.",
    tagline: "Vegas Strip luxury relaxation",
    gender: "Female",
    ethnicity: "White",
    age: 30,
    height: "5'8\"",
    hairColor: "Blonde",
    eyeColor: "Blue",
    state: "Nevada",
    city: "Las Vegas",
    borough: null,
    latitude: 36.1147,
    longitude: -115.1728,
    massageTypes: ["Swedish", "Hot Stone", "Aromatherapy", "Couples"],
    incallAvailable: true,
    outcallAvailable: true,
    incallPrice: 200,
    outcallPrice: 260,
    outcallRadius: 15,
  },
  {
    firstName: "Damian",
    lastName: "Stone",
    displayName: "Damian Stone, CMT",
    bio: "Former boxing trainer now offering deep tissue and sports massage to fighters and athletes across Las Vegas. My firm technique targets muscle knots and speeds recovery like no other.",
    tagline: "Vegas fighter recovery specialist",
    gender: "Male",
    ethnicity: "Black",
    age: 38,
    height: "6'2\"",
    hairColor: "Black",
    eyeColor: "Brown",
    state: "Nevada",
    city: "Las Vegas",
    borough: null,
    latitude: 36.1716,
    longitude: -115.1391,
    massageTypes: ["Sports", "Deep Tissue", "Swedish", "Thai"],
    incallAvailable: true,
    outcallAvailable: true,
    incallPrice: 160,
    outcallPrice: 200,
    outcallRadius: 20,
  },
  {
    firstName: "Bianca",
    lastName: "Delgado",
    displayName: "Bianca Delgado, LMT",
    bio: "Houston-based massage therapist with a decade of experience in the Texas Medical Center corridor. I specialize in deep tissue and sports massage for medical professionals and athletes working long, demanding shifts.",
    tagline: "Medical Center deep tissue specialist",
    gender: "Female",
    ethnicity: "Hispanic",
    age: 34,
    height: "5'5\"",
    hairColor: "Dark Brown",
    eyeColor: "Brown",
    state: "Texas",
    city: "Houston",
    borough: null,
    latitude: 29.7079,
    longitude: -95.4009,
    massageTypes: ["Deep Tissue", "Sports", "Swedish", "Reflexology"],
    incallAvailable: true,
    outcallAvailable: true,
    incallPrice: 140,
    outcallPrice: 180,
    outcallRadius: 15,
  },
  {
    firstName: "Trevor",
    lastName: "Whitfield",
    displayName: "Trevor Whitfield, CMT",
    bio: "Galleria-area therapist offering upscale Swedish and hot stone treatments in a private studio setting. My clientele includes busy executives who need efficient, high-quality stress relief between meetings.",
    tagline: "Galleria luxury executive massage",
    gender: "Male",
    ethnicity: "White",
    age: 38,
    height: "6'1\"",
    hairColor: "Brown",
    eyeColor: "Blue",
    state: "Texas",
    city: "Houston",
    borough: null,
    latitude: 29.737,
    longitude: -95.4613,
    massageTypes: ["Swedish", "Hot Stone", "Deep Tissue", "Aromatherapy"],
    incallAvailable: true,
    outcallAvailable: true,
    incallPrice: 165,
    outcallPrice: 210,
    outcallRadius: 12,
  },
  {
    firstName: "Colton",
    lastName: "Maddox",
    displayName: "Colton Maddox, LMT",
    bio: "Austin native and former college athlete specializing in sports recovery for the city's running and cycling community. I work closely with local gyms and training groups to keep athletes performing at their peak.",
    tagline: "Austin sports & endurance recovery",
    gender: "Male",
    ethnicity: "White",
    age: 30,
    height: "6'0\"",
    hairColor: "Blonde",
    eyeColor: "Green",
    state: "Texas",
    city: "Austin",
    borough: null,
    latitude: 30.2672,
    longitude: -97.7431,
    massageTypes: ["Sports", "Deep Tissue", "Swedish", "Thai"],
    incallAvailable: true,
    outcallAvailable: true,
    incallPrice: 145,
    outcallPrice: 185,
    outcallRadius: 15,
  },
  {
    firstName: "Vanessa",
    lastName: "Castellano",
    displayName: "Vanessa Castellano, RMT",
    bio: "Uptown Dallas therapist offering luxury Swedish and hot stone treatments in a beautifully appointed private studio. My clients appreciate the meticulous attention to detail in every session.",
    tagline: "Uptown Dallas luxury bodywork",
    gender: "Female",
    ethnicity: "Hispanic",
    age: 36,
    height: "5'7\"",
    hairColor: "Dark Brown",
    eyeColor: "Brown",
    state: "Texas",
    city: "Dallas",
    borough: null,
    latitude: 32.7955,
    longitude: -96.8025,
    massageTypes: ["Swedish", "Hot Stone", "Aromatherapy", "Couples"],
    incallAvailable: true,
    outcallAvailable: true,
    incallPrice: 160,
    outcallPrice: 200,
    outcallRadius: 10,
  },
  {
    firstName: "Camila",
    lastName: "Suarez",
    displayName: "Camila Suarez, LMT",
    bio: "Miami Beach therapist offering vibrant, energizing Swedish and hot stone treatments inspired by Latin American wellness traditions. My beachside studio is a favorite among locals and visiting professionals.",
    tagline: "Miami Beach Latin-inspired wellness",
    gender: "Female",
    ethnicity: "Hispanic",
    age: 28,
    height: "5'5\"",
    hairColor: "Dark Brown",
    eyeColor: "Brown",
    state: "Florida",
    city: "Miami",
    borough: null,
    latitude: 25.7907,
    longitude: -80.13,
    massageTypes: ["Swedish", "Hot Stone", "Aromatherapy", "Couples"],
    incallAvailable: true,
    outcallAvailable: true,
    incallPrice: 170,
    outcallPrice: 215,
    outcallRadius: 10,
  },
  {
    firstName: "Julian",
    lastName: "Alvarez",
    displayName: "Julian Alvarez, CMT",
    bio: "Brickell-based massage therapist catering to finance professionals and international travelers. I offer efficient, high-quality deep tissue and sports sessions tailored to busy schedules.",
    tagline: "Brickell executive deep tissue",
    gender: "Male",
    ethnicity: "Hispanic",
    age: 32,
    height: "5'10\"",
    hairColor: "Black",
    eyeColor: "Dark Brown",
    state: "Florida",
    city: "Miami",
    borough: null,
    latitude: 25.7617,
    longitude: -80.1918,
    massageTypes: ["Deep Tissue", "Sports", "Swedish", "Hot Stone"],
    incallAvailable: true,
    outcallAvailable: true,
    incallPrice: 175,
    outcallPrice: 220,
    outcallRadius: 8,
  },
  {
    firstName: "Heather",
    lastName: "Blankenship",
    displayName: "Heather Blankenship, LMT",
    bio: "Downtown Orlando therapist specializing in stress relief for hospitality and theme park industry workers. I offer flexible scheduling for those working long, physically demanding shifts.",
    tagline: "Hospitality worker recovery specialist",
    gender: "Female",
    ethnicity: "White",
    age: 31,
    height: "5'5\"",
    hairColor: "Blonde",
    eyeColor: "Blue",
    state: "Florida",
    city: "Orlando",
    borough: null,
    latitude: 28.5383,
    longitude: -81.3792,
    massageTypes: ["Swedish", "Deep Tissue", "Reflexology", "Aromatherapy"],
    incallAvailable: true,
    outcallAvailable: true,
    incallPrice: 120,
    outcallPrice: 160,
    outcallRadius: 15,
  },
  {
    firstName: "Kristen",
    lastName: "Abernathy",
    displayName: "Kristen Abernathy, LMT",
    bio: "Downtown Tampa therapist offering classic Swedish and hot stone massage in a calm, professional studio near the waterfront. I focus on creating a consistent, reliable wellness routine for regular clients.",
    tagline: "Downtown Tampa waterfront wellness",
    gender: "Female",
    ethnicity: "White",
    age: 37,
    height: "5'6\"",
    hairColor: "Auburn",
    eyeColor: "Green",
    state: "Florida",
    city: "Tampa",
    borough: null,
    latitude: 27.9506,
    longitude: -82.4572,
    massageTypes: ["Swedish", "Hot Stone", "Aromatherapy", "Reflexology"],
    incallAvailable: true,
    outcallAvailable: true,
    incallPrice: 130,
    outcallPrice: 170,
    outcallRadius: 12,
  },
  {
    firstName: "Whitney",
    lastName: "Larsson",
    displayName: "Whitney Larsson, LMT",
    bio: "River North therapist offering upscale Swedish and hot stone treatments for downtown Chicago professionals. My studio provides a quiet escape from the city's fast pace, just steps from the Loop.",
    tagline: "River North executive relaxation",
    gender: "Female",
    ethnicity: "White",
    age: 33,
    height: "5'7\"",
    hairColor: "Blonde",
    eyeColor: "Blue",
    state: "Illinois",
    city: "Chicago",
    borough: null,
    latitude: 41.8919,
    longitude: -87.6278,
    massageTypes: ["Swedish", "Hot Stone", "Deep Tissue", "Aromatherapy"],
    incallAvailable: true,
    outcallAvailable: true,
    incallPrice: 155,
    outcallPrice: 195,
    outcallRadius: 10,
  },
  {
    firstName: "Deshawn",
    lastName: "Coleman",
    displayName: "Deshawn Coleman, CMT",
    bio: "Lincoln Park therapist and former semi-pro football player specializing in sports recovery and injury rehabilitation. I work with local sports leagues and weekend athletes across the North Side.",
    tagline: "Lincoln Park sports rehab specialist",
    gender: "Male",
    ethnicity: "Black",
    age: 34,
    height: "6'2\"",
    hairColor: "Black",
    eyeColor: "Brown",
    state: "Illinois",
    city: "Chicago",
    borough: null,
    latitude: 41.9214,
    longitude: -87.6513,
    massageTypes: ["Sports", "Deep Tissue", "Swedish", "Reflexology"],
    incallAvailable: true,
    outcallAvailable: true,
    incallPrice: 145,
    outcallPrice: 185,
    outcallRadius: 12,
  },
  {
    firstName: "Agnieszka",
    lastName: "Nowak",
    displayName: "Agnieszka Nowak, RMT",
    bio: "Polish-American therapist in Wicker Park bringing traditional Eastern European deep tissue techniques to Chicago's arts community. My firm, methodical pressure is popular with clients carrying chronic tension.",
    tagline: "Eastern European deep tissue tradition",
    gender: "Female",
    ethnicity: "White",
    age: 39,
    height: "5'6\"",
    hairColor: "Blonde",
    eyeColor: "Blue",
    state: "Illinois",
    city: "Chicago",
    borough: null,
    latitude: 41.9088,
    longitude: -87.6796,
    massageTypes: ["Deep Tissue", "Swedish", "Sports", "Hot Stone"],
    incallAvailable: true,
    outcallAvailable: false,
    incallPrice: 125,
    outcallPrice: null,
    outcallRadius: null,
  },
];


const CLIENT_DATA = [
  { firstName: "Sarah", lastName: "Mitchell", email: "sarah.mitchell@gmail.com", phone: "212-555-0101" },
  { firstName: "Michael", lastName: "Torres", email: "michael.torres@gmail.com", phone: "310-555-0202" },
  { firstName: "Emily", lastName: "Johnson", email: "emily.johnson@gmail.com", phone: "312-555-0303" },
  { firstName: "Daniel", lastName: "Park", email: "daniel.park@gmail.com", phone: "404-555-0404" },
  { firstName: "Jessica", lastName: "Nguyen", email: "jessica.nguyen@gmail.com", phone: "206-555-0505" },
  { firstName: "Christopher", lastName: "Lee", email: "christopher.lee@gmail.com", phone: "718-555-0606" },
  { firstName: "Amanda", lastName: "Garcia", email: "amanda.garcia@gmail.com", phone: "323-555-0707" },
  { firstName: "Jason", lastName: "Brown", email: "jason.brown@gmail.com", phone: "702-555-0808" },
  { firstName: "Rachel", lastName: "Kim", email: "rachel.kim@gmail.com", phone: "415-555-0909" },
  { firstName: "Kevin", lastName: "Davis", email: "kevin.davis@gmail.com", phone: "646-555-1010" },
];

const REVIEW_TEMPLATES = [
  {
    title: "Amazing experience!",
    comment: "One of the best massages I've ever had. The therapist was incredibly skilled and attentive to my problem areas. I left feeling completely rejuvenated.",
    rating: 5,
  },
  {
    title: "Very professional",
    comment: "Great technique and very professional setup. The pressure was perfect and they checked in throughout the session. Will definitely book again.",
    rating: 5,
  },
  {
    title: "Good but could improve",
    comment: "Overall a solid massage. The ambiance was nice and the therapist was friendly. Could use a bit more pressure in the shoulders but otherwise good.",
    rating: 4,
  },
  {
    title: "Excellent deep tissue work",
    comment: "Finally found someone who understands deep tissue! They worked out knots I've had for months. A little sore the next day but felt incredible after.",
    rating: 5,
  },
  {
    title: "Relaxing and therapeutic",
    comment: "Such a calming experience from start to finish. The essential oils were wonderful and the technique was smooth and flowing. Highly recommend.",
    rating: 5,
  },
  {
    title: "Decent session",
    comment: "It was a decent massage, nothing extraordinary. The therapist was on time and professional. The space was clean. Would consider returning.",
    rating: 3,
  },
  {
    title: "Fantastic couples massage",
    comment: "My partner and I had an incredible couples massage here. The therapist made us both feel comfortable and the synchronization between the two sessions was impressive.",
    rating: 5,
  },
  {
    title: "Great sports recovery",
    comment: "As a marathon runner, I need regular sports massages. This therapist really knows their anatomy and targeted exactly the muscle groups I needed work on.",
    rating: 4,
  },
  {
    title: "Wonderful prenatal massage",
    comment: "Being 7 months pregnant, I was nervous about getting a massage. The therapist made me feel completely safe and addressed all my aches. Such relief!",
    rating: 5,
  },
  {
    title: "Solid Thai massage",
    comment: "Authentic Thai massage technique with great stretching. I felt more flexible and energized afterwards. The session was exactly what I needed.",
    rating: 4,
  },
  {
    title: "Life-changing deep tissue",
    comment: "I've been dealing with lower back pain for years and after just one session I felt significant relief. The therapist really understood my body's needs.",
    rating: 5,
  },
  {
    title: "Perfect after-work unwind",
    comment: "Booked an evening session after a stressful day at work and it was exactly what I needed. The aromatherapy oils were heavenly and the pressure was just right.",
    rating: 5,
  },
  {
    title: "Great first experience",
    comment: "This was my first professional massage and the therapist made me feel completely at ease. They explained everything and the session was incredibly relaxing.",
    rating: 4,
  },
  {
    title: "Hot stone heaven",
    comment: "The hot stone massage was absolute bliss. The warmth penetrated deep into my muscles and the therapist's technique was flawless. Already booked my next session.",
    rating: 5,
  },
  {
    title: "Helped my sciatica",
    comment: "I've been struggling with sciatica for months. The therapist focused on the right areas and I felt immediate improvement. Worth every penny.",
    rating: 5,
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
  "That means the world to me! Chronic pain relief is my passion.",
  null,
  "So happy to hear it was a great first experience! Welcome to the massage world.",
  "Hot stone is one of my favorites too! Can't wait for your next visit.",
  null,
];

async function main() {
  console.log(`Seeding database with ${THERAPIST_DATA.length} therapists...\n`);

  // Clean existing data
  await prisma.message.deleteMany();
  await prisma.review.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.favorite.deleteMany();
  await prisma.availabilityException.deleteMany();
  await prisma.availability.deleteMany();
  await prisma.therapistProfile.deleteMany();
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
  await prisma.user.deleteMany();
  await prisma.platformSettings.deleteMany();

  const hashedPassword = await hash("TempPass@123", 12);

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
  const usedSlugs = new Set<string>();

  for (let index = 0; index < THERAPIST_DATA.length; index++) {
    const data = THERAPIST_DATA[index];
    const therapistNumber = index + 1;
    const email = `${data.firstName.toLowerCase().replace(/[^a-z]/g, "")}.${data.lastName.toLowerCase().replace(/[^a-z]/g, "")}@gmail.com`;

    // Handle duplicate emails by appending a number
    let finalEmail = email;
    let emailCounter = 1;
    while (await prisma.user.findUnique({ where: { email: finalEmail } })) {
      finalEmail = email.replace("@", `${++emailCounter}@`);
    }

    const user = await prisma.user.create({
      data: {
        email: finalEmail,
        password: hashedPassword,
        firstName: data.firstName,
        lastName: data.lastName,
        role: Role.THERAPIST,
        emailVerified: new Date(),
      },
    });

    // Generate unique slug
    let slug = generateSlug(`${data.firstName}-${data.lastName}`);
    let slugCounter = 1;
    while (usedSlugs.has(slug)) {
      slug = generateSlug(`${data.firstName}-${data.lastName}-${++slugCounter}`);
    }
    usedSlugs.add(slug);

    const profile = await prisma.therapistProfile.create({
      data: {
        userId: user.id,
        displayName: data.displayName,
        slug,
        bio: data.bio,
        tagline: data.tagline,
        profilePhoto: `/api/uploads/therapist-${therapistNumber}.jpg`,
        galleryPhotos: [
          `/api/uploads/therapist-${therapistNumber}-1.jpg`,
          `/api/uploads/therapist-${therapistNumber}-2.jpg`,
          `/api/uploads/therapist-${therapistNumber}-3.jpg`,
        ],
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
        incallPricePerHour: data.incallPrice ? new Decimal(data.incallPrice) : null,
        outcallPricePerHour: data.outcallPrice ? new Decimal(data.outcallPrice) : null,
        outcallRadius: data.outcallRadius,
        isVerified: Math.random() > 0.2,
        isActive: true,
      },
    });

    // Create availability (weekday schedules, some with weekends)
    const startHour = 8 + Math.floor(Math.random() * 3); // 8-10 AM
    const endHour = 17 + Math.floor(Math.random() * 4); // 5-8 PM
    const workDays =
      Math.random() > 0.4 ? [1, 2, 3, 4, 5, 6] : [1, 2, 3, 4, 5];

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
    const location = data.borough
      ? `${data.borough}, ${data.city}`
      : data.city;
    console.log(`  Created therapist #${therapistNumber}: ${data.displayName} (${location}, ${data.state})`);
  }

  // Create bookings and reviews
  console.log("\nCreating bookings and reviews...");
  const usedBookingNumbers = new Set<string>();
  let bookingCount = 0;
  let reviewCount = 0;

  // Create 150 bookings for more realistic data
  for (let i = 0; i < 150; i++) {
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

    if (!pricePerHour) continue;

    const duration = randomElement([60, 90, 120]);
    const totalPrice = pricePerHour.mul(duration).div(60).toDecimalPlaces(2);
    const bookingFee = totalPrice.mul(0.1).toDecimalPlaces(2);

    let bookingNumber: string;
    do {
      bookingNumber = generateBookingNumber();
    } while (usedBookingNumbers.has(bookingNumber));
    usedBookingNumbers.add(bookingNumber);

    const isPast = i < 110;
    const daysOffset = isPast
      ? -(Math.floor(Math.random() * 180) + 1)
      : Math.floor(Math.random() * 30) + 1;
    const bookingDate = new Date();
    bookingDate.setDate(bookingDate.getDate() + daysOffset);
    bookingDate.setHours(0, 0, 0, 0);

    const bookingStartHour = 9 + Math.floor(Math.random() * 8);
    const startTime = `${bookingStartHour.toString().padStart(2, "0")}:00`;
    const endMinutes = bookingStartHour * 60 + duration;
    const endTime = `${Math.floor(endMinutes / 60).toString().padStart(2, "0")}:${(endMinutes % 60).toString().padStart(2, "0")}`;

    const clientNotes = [
      "Please focus on my lower back and shoulders.",
      "I have a knot between my shoulder blades that's been bothering me.",
      "First time getting a massage, please go easy on pressure.",
      "I prefer firm pressure throughout the session.",
      "I have lower back pain from sitting at a desk all day.",
      "Please avoid my left knee area — recent injury.",
      "I'd like extra focus on my neck and upper traps.",
      null,
      null,
      null,
      null,
    ];

    const status = isPast
      ? randomElement([
          BookingStatus.COMPLETED,
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
            ? randomElement([
                "123 Client St, Apt 4B",
                "456 Park Avenue, Suite 12",
                "789 Broadway, Floor 3",
                "321 West End Ave, Apt 7A",
                "555 Ocean Drive, Unit 202",
              ])
            : null,
        totalPrice,
        bookingFee,
        status,
        clientNotes: randomElement(clientNotes),
      },
    });
    bookingCount++;

    // Create reviews for completed bookings (65% chance)
    if (status === BookingStatus.COMPLETED && Math.random() > 0.35) {
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
          therapistResponse: THERAPIST_RESPONSES[responseIdx % THERAPIST_RESPONSES.length] ?? null,
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

  // Create favorites
  console.log("Creating favorites...");
  for (const client of clients) {
    const favCount = 3 + Math.floor(Math.random() * 6);
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

  // Create platform settings
  await prisma.platformSettings.create({
    data: {
      bookingFeePercent: 10,
      supportedMassageTypes: ALL_MASSAGE_TYPES,
      supportedStates: ["New York", "California", "Nevada", "Texas", "Florida", "Illinois"],
    },
  });
  console.log("  Created platform settings");

  // Create an admin user
  await prisma.user.create({
    data: {
      email: "admin@gmail.com",
      password: hashedPassword,
      firstName: "Admin",
      lastName: "User",
      role: Role.ADMIN,
      emailVerified: new Date(),
    },
  });
  console.log("  Created admin: admin@gmail.com");

  console.log(`\nSeed complete!`);
  console.log(`  ${CLIENT_DATA.length} clients`);
  console.log(`  ${THERAPIST_DATA.length} therapists with profiles`);
  console.log(`  ${bookingCount} bookings`);
  console.log(`  ${reviewCount} reviews`);
  console.log(`  1 admin`);
  console.log(`\nAll users password: TempPass@123`);
  console.log(`\nTherapist photos: place real photos in /uploads (project root) named therapist-1.jpg, therapist-2.jpg, ... therapist-${THERAPIST_DATA.length}.jpg for profile photos, and therapist-1-1.jpg, therapist-1-2.jpg, therapist-1-3.jpg (etc, per therapist number) for gallery photos. They'll be served automatically at /api/uploads/<filename>.jpg once present; until then profilePhoto/galleryPhotos point at files that don't exist yet.`);
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
