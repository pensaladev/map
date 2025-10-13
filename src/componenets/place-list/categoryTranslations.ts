import type { TFunction } from "i18next";
import type { CategoryConfig } from "./PlacesList";

// Mapping between category ids and their translation keys.
const CATEGORY_LABEL_KEYS: Record<string, string> = {
  competition: "placeCategory.competition",
  training: "placeCategory.training",
  hotels: "placeCategory.hotels",
  restaurants: "placeCategory.restaurants",
  artworks: "placeCategory.artworks",
  hospitals: "placeCategory.hospitals",
  transport: "placeCategory.transport",
  police: "placeCategory.police",
  attraction: "placeCategory.attraction",
  castle: "placeCategory.castle",
  church: "placeCategory.church",
  gallery: "placeCategory.gallery",
  memorial: "placeCategory.memorial",
  monument: "placeCategory.monument",
  mosque: "placeCategory.mosque",
  museum: "placeCategory.museum",
  viewpoints: "placeCategory.viewpoints",
  zoo: "placeCategory.zoo",
  bank: "placeCategory.bank",
  atm: "placeCategory.atm",
  firestation: "placeCategory.firestation",
  embassy: "placeCategory.embassy",
  consulate: "placeCategory.consulate",
  airport: "placeCategory.airport",
  bus: "placeCategory.bus",
  ferry: "placeCategory.ferry",
  railway: "placeCategory.railway",
};

export function translateCategoryLabel(
  category: CategoryConfig,
  t: TFunction,
): string {
  const key = CATEGORY_LABEL_KEYS[category.id];
  if (!key) return category.label;

  try {
    const translated = t(key, { defaultValue: category.label });
    // react-i18next returns the key itself when missing; fall back in that case.
    return translated && translated !== key ? translated : category.label;
  } catch (err) {
    console.error(
      `[categoryTranslations] Failed to translate category "${category.id}":`,
      err,
    );
    return category.label;
  }
}

export function withTranslatedCategoryLabels(
  categories: CategoryConfig[],
  t: TFunction,
): CategoryConfig[] {
  // Avoid mutating the original configuration array.
  return categories.map((category) => ({
    ...category,
    label: translateCategoryLabel(category, t),
  }));
}
