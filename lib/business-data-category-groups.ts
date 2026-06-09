import { BUSINESS_DATA_CATEGORIES } from "./business-data-categories";

export type BusinessDataCategoryGroup = {
  id: string;
  label: string;
  values: string[];
};

export const BUSINESS_DATA_CATEGORY_GROUPS: BusinessDataCategoryGroup[] = [
  {
    id: "food_hospitality",
    label: "Food & hospitality",
    values: [
      "restaurant",
      "cafe",
      "bakery",
      "bar",
      "meal_delivery",
      "meal_takeaway",
      "night_club",
      "liquor_store"
    ]
  },
  {
    id: "retail",
    label: "Retail & shopping",
    values: [
      "store",
      "supermarket",
      "convenience_store",
      "clothing_store",
      "shoe_store",
      "jewelry_store",
      "book_store",
      "electronics_store",
      "furniture_store",
      "home_goods_store",
      "hardware_store",
      "pet_store",
      "florist",
      "shopping_mall",
      "department_store",
      "bicycle_store"
    ]
  },
  {
    id: "health",
    label: "Health & wellness",
    values: [
      "doctor",
      "dentist",
      "hospital",
      "pharmacy",
      "drugstore",
      "physiotherapist",
      "veterinary_care",
      "beauty_salon",
      "hair_care",
      "spa",
      "gym"
    ]
  },
  {
    id: "education",
    label: "Education",
    values: ["school", "primary_school", "secondary_school", "university", "library"]
  },
  {
    id: "professional",
    label: "Professional services",
    values: [
      "accounting",
      "lawyer",
      "insurance_agency",
      "real_estate_agency",
      "travel_agency",
      "electrician",
      "plumber",
      "locksmith",
      "painter",
      "roofing_contractor",
      "moving_company",
      "laundry"
    ]
  },
  {
    id: "automotive",
    label: "Automotive",
    values: ["car_dealer", "car_rental", "car_repair", "car_wash", "gas_station", "parking"]
  },
  {
    id: "finance",
    label: "Finance",
    values: ["bank", "atm", "accounting", "insurance_agency"]
  },
  {
    id: "entertainment",
    label: "Entertainment & attractions",
    values: [
      "tourist_attraction",
      "museum",
      "amusement_park",
      "aquarium",
      "zoo",
      "movie_theater",
      "bowling_alley",
      "casino",
      "park",
      "stadium",
      "art_gallery"
    ]
  },
  {
    id: "government",
    label: "Government & public",
    values: [
      "local_government_office",
      "city_hall",
      "courthouse",
      "police",
      "fire_station",
      "post_office",
      "embassy"
    ]
  },
  {
    id: "transport",
    label: "Transport",
    values: [
      "airport",
      "bus_station",
      "train_station",
      "subway_station",
      "transit_station",
      "light_rail_station",
      "taxi_stand"
    ]
  },
  {
    id: "lodging",
    label: "Lodging & travel",
    values: ["lodging", "campground", "rv_park", "travel_agency"]
  },
  {
    id: "other",
    label: "Other",
    values: [
      "church",
      "mosque",
      "synagogue",
      "hindu_temple",
      "funeral_home",
      "cemetery",
      "storage"
    ]
  }
];

const categoryLabelByValue = new Map<string, string>(
  BUSINESS_DATA_CATEGORIES.map((category) => [category.value, category.label])
);

export function getGroupedCategoryOptions() {
  const used = new Set<string>();

  const grouped = BUSINESS_DATA_CATEGORY_GROUPS.map((group) => ({
    ...group,
    options: group.values
      .map((value) => {
        used.add(value);
        return {
          value,
          label: categoryLabelByValue.get(value) ?? value
        };
      })
      .filter((option) => categoryLabelByValue.has(option.value))
  }));

  const remaining = BUSINESS_DATA_CATEGORIES.filter(
    (category) => !used.has(category.value)
  ).map((category) => ({
    value: category.value,
    label: category.label
  }));

  if (remaining.length > 0) {
    grouped.push({
      id: "misc",
      label: "More categories",
      values: remaining.map((item) => item.value),
      options: remaining
    });
  }

  return grouped;
}

export const CATEGORY_RECOMMENDATIONS: Record<string, string[]> = {
  restaurant: ["cafe", "meal_takeaway", "bakery", "bar", "meal_delivery"],
  cafe: ["bakery", "restaurant", "meal_takeaway", "store"],
  dentist: ["doctor", "hospital", "pharmacy", "physiotherapist"],
  doctor: ["dentist", "hospital", "pharmacy", "physiotherapist"],
  school: ["primary_school", "secondary_school", "university", "library"],
  university: ["school", "library", "cafe", "lodging"],
  real_estate_agency: ["lawyer", "accounting", "insurance_agency", "bank"],
  gym: ["spa", "beauty_salon", "physiotherapist", "store"],
  hotel: ["lodging", "restaurant", "cafe", "travel_agency"],
  lodging: ["restaurant", "cafe", "travel_agency", "tourist_attraction"],
  store: ["shopping_mall", "supermarket", "clothing_store", "convenience_store"],
  lawyer: ["accounting", "real_estate_agency", "insurance_agency", "local_government_office"],
  default: ["restaurant", "cafe", "dentist", "real_estate_agency", "gym"]
};

export function getCategoryRecommendations(input: {
  category: string;
  locationLabel: string;
}) {
  const normalizedLocation = input.locationLabel.toLowerCase();
  const base = CATEGORY_RECOMMENDATIONS[input.category] ?? CATEGORY_RECOMMENDATIONS.default;

  const locationBoost: string[] = [];

  if (/university|campus|college/.test(normalizedLocation)) {
    locationBoost.push("university", "cafe", "library");
  }

  if (/mall|market|shopping/.test(normalizedLocation)) {
    locationBoost.push("store", "clothing_store", "restaurant");
  }

  if (/marina|beach|hotel|resort/.test(normalizedLocation)) {
    locationBoost.push("lodging", "restaurant", "travel_agency");
  }

  const merged = [...locationBoost, ...base, input.category];
  const unique = Array.from(new Set(merged)).filter((value) => value !== input.category);

  return unique.slice(0, 5).map((value) => ({
    value,
    label: categoryLabelByValue.get(value) ?? value
  }));
}
