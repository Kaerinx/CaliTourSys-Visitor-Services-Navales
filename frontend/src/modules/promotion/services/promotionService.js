import * as promotionApi from "./promotionApi";

let itineraryState = [];
const ITINERARY_SESSION_KEY = "calitoursys_itinerary_session";

const API_UNAVAILABLE_MESSAGE =
  "The public tourism API is unavailable, so no content could be loaded right now.";

const accentPalette = [
  "#B5451B",
  "#7B341E",
  "#1B4332",
  "#D4711B",
  "#1565C0",
  "#D4AC0D",
];

const clone = (value) => JSON.parse(JSON.stringify(value));

function notifyItineraryUpdated() {
  window.dispatchEvent(new CustomEvent("calitoursys:itinerary-updated"));
}

const wait = (payload, delay = 80) =>
  new Promise((resolve) => {
    window.setTimeout(() => resolve(clone(payload)), delay);
  });

// Returns live API data. If the API is unavailable we resolve to an empty value
// (never fabricated demo content) so the UI renders its empty state.
async function withApiData(apiCall, emptyValue = []) {
  try {
    const response = await apiCall();
    return response.data;
  } catch (error) {
    console.warn(API_UNAVAILABLE_MESSAGE, error);
    return clone(emptyValue);
  }
}

function formatPrice(price) {
  if (!price || price.amount === null || price.amount === undefined)
    return "Price upon inquiry";

  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: price.currency || "PHP",
  }).format(Number(price.amount));
}

function formatCurrencyAmount(amount) {
  if (amount === null || amount === undefined) return "Price upon inquiry";

  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    maximumFractionDigits: Number(amount) % 1 === 0 ? 0 : 2,
  }).format(Number(amount));
}

function packagePricingFields(tourismPackage) {
  return {
    basePrice: tourismPackage.basePrice ?? tourismPackage.base_price ?? null,
    basePax: tourismPackage.basePax ?? tourismPackage.base_pax ?? null,
    extraPaxPrice:
      tourismPackage.extraPaxPrice ?? tourismPackage.extra_pax_price ?? null,
    minPax: tourismPackage.minPax ?? tourismPackage.min_pax ?? null,
    maxPax: tourismPackage.maxPax ?? tourismPackage.max_pax ?? null,
    paymentRequired:
      tourismPackage.paymentRequired ??
      tourismPackage.payment_required ??
      false,
  };
}

function packagePricingSummary(tourismPackage) {
  const pricing = packagePricingFields(tourismPackage);

  if (pricing.basePrice === null || pricing.basePrice === undefined) {
    return "Price upon inquiry";
  }

  if (pricing.basePax) {
    return `${formatCurrencyAmount(pricing.basePrice)} good for ${pricing.basePax} pax`;
  }

  return formatCurrencyAmount(pricing.basePrice);
}

function packageExtraPaxSummary(tourismPackage) {
  const pricing = packagePricingFields(tourismPackage);
  if (pricing.extraPaxPrice === null || pricing.extraPaxPrice === undefined)
    return "";
  return `${formatCurrencyAmount(pricing.extraPaxPrice)} per extra person`;
}

function dateParts(value) {
  if (!value) {
    return {
      day: "--",
      month: "TBA",
      year: "",
      date: "Date to be announced",
    };
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return {
      day: "--",
      month: "TBA",
      year: "",
      date: "Date to be announced",
    };
  }

  return {
    day: new Intl.DateTimeFormat("en-PH", { day: "2-digit" }).format(date),
    month: new Intl.DateTimeFormat("en-PH", { month: "short" })
      .format(date)
      .toUpperCase(),
    year: new Intl.DateTimeFormat("en-PH", { year: "numeric" }).format(date),
    date: new Intl.DateTimeFormat("en-PH", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
      .format(date)
      .toUpperCase(),
  };
}

function categoryName(category) {
  if (typeof category === "string") return category;
  return category?.name || "Tourism";
}

function colorFor(value, index = 0) {
  if (value?.color) return value.color;
  return accentPalette[index % accentPalette.length];
}

function mapProduct(product, index = 0) {
  return {
    id: product.slug,
    apiId: product.id,
    slug: product.slug,
    name: product.name,
    producer: product.business?.name || "Calabanga producer",
    businessId: product.business?.slug,
    price: formatPrice(product.price),
    category: categoryName(product.category),
    accent: colorFor(product.category, index),
    accredited: product.accreditationStatus === "accredited",
    featured: Boolean(product.isFeatured),
    description:
      product.shortDescription ||
      product.description ||
      "Public product information is being prepared.",
    tags: product.tags || [],
    imageUrl: product.primaryImage?.url,
  };
}

function slugify(value) {
  return String(value || "tourism-package")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function inferPackageCategory(tourismPackage) {
  const content = [
    tourismPackage.name,
    tourismPackage.description,
    tourismPackage.targetMarket,
    tourismPackage.remarks,
    ...(tourismPackage.items || []).map(
      (item) => `${item.name} ${item.location} ${item.status}`,
    ),
  ]
    .join(" ")
    .toLowerCase();

  if (
    /church|faith|heritage|devotion|pilgrim|relig|quipayo|hinulid|santo|visita/.test(
      content,
    )
  ) {
    return "Cultural";
  }

  if (
    /bay|coast|island|sea|fish|fishing|kawit|tanglad|cabgan|san miguel/.test(
      content,
    )
  ) {
    return "Nature";
  }

  if (/farm|agri|hacienda|harvest|countryside/.test(content)) {
    return "Food";
  }

  if (/food|product|bagoong|pili|seafood|producer|market|local/.test(content)) {
    return "Food";
  }

  if (/festival|event|calendar|celebration|parade/.test(content)) {
    return "Events";
  }

  return "Nature";
}

function packageCategoryList(tourismPackage, fallback) {
  // Categories are flexible combinations attached to the package. Prefer an
  // explicit array from the API; otherwise split a combined string (e.g.
  // "Sports, Outdoor & Endurance") so the UI can render the full cluster.
  if (
    Array.isArray(tourismPackage.categories) &&
    tourismPackage.categories.length
  ) {
    return tourismPackage.categories
      .map((category) => ({
        name: categoryName(category),
        color: category?.color || category?.markerColor || "",
      }))
      .filter((category) => category.name);
  }

  const combined = categoryName(tourismPackage.category) || fallback;
  return String(combined)
    .split(/\s*(?:,|\/|&|\+)\s*/)
    .map((name) => name.trim())
    .filter(Boolean)
    .map((name) => ({ name, color: "" }));
}

function mapReadyPackage(tourismPackage, index = 0) {
  const packageItems = Array.isArray(tourismPackage.items)
    ? tourismPackage.items.map((item) => ({
        ...item,
        proposedActivities: firstPresent(
          item?.proposedActivities,
          item?.proposed_activities,
          "",
        ),
      }))
    : [];
  const pricing = packagePricingFields(tourismPackage);
  const gallery = Array.isArray(tourismPackage.gallery)
    ? tourismPackage.gallery
        .map((image) => ({
          ...image,
          url: image.url || image.imageUrl,
        }))
        .filter((image) => image.url)
    : [];
  const category =
    categoryName(tourismPackage.category) ||
    inferPackageCategory(tourismPackage);
  const categories = packageCategoryList(tourismPackage, category);
  const packageId =
    tourismPackage.slug ||
    `package-${slugify(tourismPackage.name)}-${tourismPackage.id}`;

  return {
    id: packageId,
    apiId: tourismPackage.id,
    slug: packageId,
    name: tourismPackage.name,
    producer: "Calabanga Tourism Product Development",
    businessId: null,
    price: packagePricingSummary(tourismPackage),
    basePrice: pricing.basePrice,
    basePax: pricing.basePax,
    extraPaxPrice: pricing.extraPaxPrice,
    minPax: pricing.minPax,
    maxPax: pricing.maxPax,
    paymentRequired: Boolean(pricing.paymentRequired),
    extraPaxLabel: packageExtraPaxSummary(tourismPackage),
    category,
    categories,
    accent: accentPalette[(index + 2) % accentPalette.length],
    accredited: true,
    featured: true,
    description:
      tourismPackage.description ||
      tourismPackage.remarks ||
      "This tourism package has been approved for promotion handoff.",
    tags: [
      tourismPackage.targetMarket,
      tourismPackage.estimatedDuration,
    ].filter(Boolean),
    imageUrl:
      tourismPackage.primaryImage?.url ||
      tourismPackage.imageUrl ||
      packageImageForCategory(category),
    sourceModule: "product-development",
    packageStatus: tourismPackage.packageStatus,
    targetMarket: tourismPackage.targetMarket || "General visitors",
    estimatedDuration:
      tourismPackage.estimatedDuration || "Duration to be confirmed",
    durationDays: Number(tourismPackage.durationDays || 1),
    departureCapacity:
      tourismPackage.departureCapacity == null
        ? null
        : Number(tourismPackage.departureCapacity),
    itemCount: tourismPackage.itemCount ?? packageItems.length,
    assetCount:
      tourismPackage.assetCount ??
      packageItems.filter((item) => item.itemType === "Asset").length,
    activityCount:
      tourismPackage.activityCount ??
      packageItems.filter((item) => item.itemType === "Activity").length,
    remarks: tourismPackage.remarks || "",
    items: packageItems,
    gallery,
  };
}

async function getReadyPackageById(id) {
  let data = null;
  let mappedPackage = null;

  try {
    const response = await promotionApi.getPackageBySlug(id);
    data = response.data;
  } catch {
    const readyPackages = await withApiData(
      () => promotionApi.getReadyForPromotionPackages(),
      [],
    );
    mappedPackage = readyPackages
      .map(mapReadyPackage)
      .find(
        (packageCard) =>
          packageCard.id === id ||
          packageCard.slug === id ||
          packageCard.apiId === id,
      );
  }

  const tourismPackage = mappedPackage || (data ? mapReadyPackage(data) : null);

  if (!tourismPackage) {
    throw new Error("Package not found");
  }

  return {
    ...tourismPackage,
    businessProfile: {
      id: "calabanga-tourism-product-development",
      name: "Calabanga Tourism Product Development",
      type: "Tourism Office",
      owner: "LGU Calabanga",
      location: "Calabanga, Camarines Sur",
      accreditationStatus: "approved",
      accreditedSince: "2026",
      description:
        "Prepared by the Product Development module and approved for public promotion.",
      contacts: [],
    },
    gallery: tourismPackage.gallery || [],
    relatedProducts: [],
  };
}

function packageImageForCategory(category) {
  const images = {
    Cultural:
      "https://commons.wikimedia.org/wiki/Special:FilePath/Quipayo%20Church%20%28S.%20Ciencia%29%20-%20Flickr.jpg",
    Nature:
      "https://commons.wikimedia.org/wiki/Special:FilePath/Sunset%20at%20San%20Miguel%20Bay%2C%20Calabanga.jpg",
    Food: "https://commons.wikimedia.org/wiki/Special:FilePath/Sea%20Side%20Calabanga%20Camarines%20Sur.jpg",
    Events:
      "https://commons.wikimedia.org/wiki/Special:FilePath/Kawit%20Island%2C%20Calabanga%2C%20Camarines%20Sur.jpg",
  };

  return images[packageCategoryImageKey(category)] || images.Nature;
}

function packageCategoryImageKey(category) {
  const value = String(category || "").toLowerCase();
  if (value.includes("food")) return "Food";
  if (value.includes("event")) return "Events";
  if (value.includes("cultural")) return "Cultural";
  return "Nature";
}

function mapProductDetail(detail) {
  const product = mapProduct(
    {
      ...detail.product,
      description: detail.description,
    },
    0,
  );

  return {
    ...product,
    description: detail.description || product.description,
    gallery: detail.gallery || [],
    relatedProducts: (detail.relatedProducts || []).map(
      (relatedProduct, index) => mapProduct(relatedProduct, index + 1),
    ),
    businessProfile: mapBusiness(detail.business),
  };
}

function mapBusiness(business) {
  if (!business) return null;

  const primaryContact = business.contacts?.[0];
  const locationParts = [
    business.addressLine,
    business.barangay,
    business.municipality,
    business.province,
  ].filter(Boolean);

  return {
    id: business.slug,
    apiId: business.id,
    slug: business.slug,
    name: business.name,
    type: business.businessType,
    owner: business.ownerName,
    addressLine: business.addressLine,
    barangay: business.barangay,
    municipality: business.municipality,
    province: business.province,
    location: locationParts.join(", "),
    accreditationStatus: business.accreditation?.status || "pending",
    accreditationNumber: business.accreditation?.accreditationNumber || "",
    accreditedSince: business.accreditation?.issuedAt
      ? new Date(business.accreditation.issuedAt).getFullYear()
      : "verification pending",
    expiresAt: business.accreditation?.expiresAt,
    contactEmail:
      primaryContact?.contactType === "email"
        ? primaryContact.contactValue
        : "",
    phone:
      primaryContact?.contactType === "phone"
        ? primaryContact.contactValue
        : "",
    description:
      business.description ||
      "Public business profile information is being prepared.",
    contacts: business.contacts || [],
  };
}

function formatYear(value) {
  if (!value) return "verification pending";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "verification pending"
    : String(date.getFullYear());
}

function mapAccreditedBusiness(business) {
  const location = [
    business.barangay,
    business.municipality || business.cityMunicipality,
    business.province,
  ]
    .filter(Boolean)
    .join(", ");

  return {
    id: business.id,
    apiId: business.businessId,
    slug: business.slug,
    name: business.name,
    type: business.businessType || "Tourism Business",
    owner: business.ownerName || "Registered business owner",
    location: location || business.region || "Calabanga, Camarines Sur",
    accreditationStatus: business.accreditation?.status || "accredited",
    accreditationNumber: business.accreditation?.accreditationNumber,
    issuedAt: business.accreditation?.issuedAt,
    accreditedSince: formatYear(business.accreditation?.issuedAt),
    expiresAt: business.accreditation?.expiresAt,
    ratingAverage: Number(
      firstPresent(business.ratingAverage, business.rating_average, 0),
    ),
    reviewCount: Number(
      firstPresent(business.reviewCount, business.review_count, 0),
    ),
    contactEmail: business.contactEmail || "",
    phone: business.phone || "",
    addressLine: business.addressLine || "",
    barangay: business.barangay || "",
    municipality: business.municipality || business.cityMunicipality || "",
    province: business.province || "",
    region: business.region || "",
    latitude: business.latitude ?? null,
    longitude: business.longitude ?? null,
    legalStructure: business.legalStructure || "",
    partners: Array.isArray(business.partners) ? business.partners : [],
    authorizedRepresentativeName: business.authorizedRepresentativeName || "",
    authorizedRepresentativePosition:
      business.authorizedRepresentativePosition || "",
    imageUrl: business.primaryImage?.url || business.images?.[0]?.url || "",
    images: business.images || [],
    socialLinks: business.socialLinks || {},
    description:
      business.description ||
      `${business.businessType || "Tourism business"} accredited through the LGU Tourism Office.`,
    source: business.source,
  };
}

function mapEvent(event, index = 0) {
  const parts = dateParts(event.startsAt);
  const categories =
    Array.isArray(event.categories) && event.categories.length
      ? event.categories
          .map((category) => categoryName(category))
          .filter(Boolean)
      : [categoryName(event.category)];

  return {
    id: event.slug,
    apiId: event.id,
    slug: event.slug,
    title: event.title,
    ...parts,
    location: event.venueName || "Calabanga",
    category: categories[0] || categoryName(event.category),
    categories,
    accent: colorFor(event.category, index),
    desc:
      event.shortDescription ||
      event.description ||
      "Event details are being prepared.",
    featured: Boolean(event.isFeatured),
    startsAt: event.startsAt,
    endsAt: event.endsAt,
    imageUrl: event.primaryImage?.url,
    isRecurring: Boolean(event.isRecurring),
    recurrenceType: event.recurrenceType,
    usualMonth: event.usualMonth,
    nextOccurrenceDate: event.nextOccurrenceDate,
  };
}

function mapDestination(destination, index = 0) {
  return {
    id: destination.slug,
    apiId: destination.id,
    slug: destination.slug,
    name: destination.name,
    category: categoryName(destination.category),
    color: colorFor(destination.category, index),
    distance: destination.barangay || "Calabanga",
    address: [destination.barangay, "Calabanga", "Camarines Sur"]
      .filter(Boolean)
      .join(", "),
    hours:
      destination.openingHoursText || "Visiting information to be confirmed",
    description:
      destination.shortDescription ||
      destination.description ||
      "Destination details are being prepared.",
    x: 24 + ((index * 17) % 58),
    y: 24 + ((index * 23) % 52),
    accredited: true,
    featured: Boolean(destination.isFeatured),
    imageUrl: destination.primaryImage?.url,
  };
}

function mapTourismAsset(asset, index = 0) {
  return {
    id: asset.slug || `asset-${slugify(asset.name)}-${asset.id}`,
    apiId: asset.id,
    slug: asset.slug,
    name: asset.name,
    category: categoryName(asset.category),
    color: colorFor(asset.category, index),
    distance: asset.barangay || asset.location || "Calabanga",
    address: [asset.barangay || asset.location, "Calabanga", "Camarines Sur"]
      .filter(Boolean)
      .join(", "),
    hours: "Visiting information to be confirmed",
    description:
      asset.shortDescription ||
      asset.description ||
      "Tourism asset details are being prepared.",
    x: 24 + ((index * 17) % 58),
    y: 24 + ((index * 23) % 52),
    latitude: asset.latitude,
    longitude: asset.longitude,
    accredited: true,
    featured: true,
    imageUrl: asset.primaryImage?.url || asset.imageUrl,
    targetMarket: asset.targetMarket,
    sourceBusinessName: asset.sourceBusinessName,
    sourceBusinessType: asset.sourceBusinessType,
    sourceAccreditationRecordNumber: asset.sourceAccreditationRecordNumber,
    sourceModule: asset.sourceModule || "product-development",
  };
}

function mapMapLocation(location, index = 0) {
  return {
    id: location.slug || location.id,
    apiId: location.targetId || null,
    slug: location.slug,
    name: location.label,
    category: location.category || location.locationType,
    color: location.markerColor || colorFor(null, index),
    distance: location.barangay || "Map-ready",
    address: location.label,
    hours: "Visiting information to be confirmed",
    description:
      location.description || "Map discovery record from the public API.",
    x: 24 + ((index * 17) % 58),
    y: 24 + ((index * 23) % 52),
    latitude: location.latitude,
    longitude: location.longitude,
    locationType: location.locationType,
    accredited: true,
    imageUrl: location.primaryImage,
  };
}

function firstPresent(...values) {
  return values.find(
    (value) => value !== undefined && value !== null && value !== "",
  );
}

function normalizeMapLocationGallery(data) {
  const source = firstPresent(
    data.gallery,
    data.galleryImages,
    data.gallery_images,
    data.images,
    [],
  );
  const gallery = (Array.isArray(source) ? source : [])
    .map((image, index) => {
      if (typeof image === "string") {
        return {
          id: `gallery-${index}`,
          url: image,
          alt: data.name || data.label || "",
        };
      }

      const url = firstPresent(
        image?.url,
        image?.imageUrl,
        image?.image_url,
        image?.fileUrl,
        image?.file_url,
      );
      if (!url) return null;

      return {
        id: firstPresent(
          image.id,
          image.mediaAssetId,
          image.media_asset_id,
          `gallery-${index}`,
        ),
        url,
        alt: firstPresent(
          image.alt,
          image.altText,
          image.alt_text,
          data.name,
          data.label,
          "",
        ),
        isPrimary: Boolean(
          firstPresent(image.isPrimary, image.is_primary, false),
        ),
        displayOrder: Number(
          firstPresent(image.displayOrder, image.display_order, index),
        ),
      };
    })
    .filter(Boolean)
    .sort(
      (left, right) =>
        Number(right.isPrimary) - Number(left.isPrimary) ||
        left.displayOrder - right.displayOrder,
    );

  const primaryImage = firstPresent(
    data.primaryImage?.url,
    data.primaryImage,
    data.primary_image_url,
    data.imageUrl,
  );

  if (gallery.length || !primaryImage) return gallery;
  return [
    {
      id: "primary-image",
      url: primaryImage,
      alt: data.name || data.label || "",
    },
  ];
}

function normalizeMapLocationPackage(tourismPackage, index) {
  if (!tourismPackage) return null;
  const slug = firstPresent(
    tourismPackage.slug,
    tourismPackage.packageSlug,
    tourismPackage.package_slug,
  );
  if (!slug) return null;

  const priceAmount = firstPresent(
    tourismPackage.basePrice,
    tourismPackage.base_price,
    tourismPackage.price?.amount,
  );

  return {
    id: firstPresent(
      tourismPackage.id,
      tourismPackage.packageId,
      tourismPackage.package_id,
      slug,
    ),
    slug,
    name: firstPresent(
      tourismPackage.name,
      tourismPackage.packageName,
      tourismPackage.package_name,
      "Tour package",
    ),
    description: firstPresent(
      tourismPackage.description,
      tourismPackage.remarks,
      "",
    ),
    category: firstPresent(
      tourismPackage.category?.name,
      tourismPackage.category,
      "",
    ),
    targetMarket: firstPresent(
      tourismPackage.targetMarket,
      tourismPackage.target_market,
      "",
    ),
    duration: firstPresent(
      tourismPackage.estimatedDuration,
      tourismPackage.estimated_duration,
      tourismPackage.duration,
      "",
    ),
    priceLabel: firstPresent(
      tourismPackage.priceLabel,
      tourismPackage.price_label,
      priceAmount === undefined
        ? "Price upon inquiry"
        : formatCurrencyAmount(priceAmount),
    ),
    isPrimary: Boolean(
      firstPresent(tourismPackage.isPrimary, tourismPackage.is_primary, false),
    ),
    displayOrder: Number(
      firstPresent(
        tourismPackage.displayOrder,
        tourismPackage.display_order,
        index,
      ),
    ),
    primaryImage: firstPresent(
      tourismPackage.primaryImage?.url,
      tourismPackage.primaryImage,
      tourismPackage.primary_image,
      "",
    ),
  };
}

function normalizeOvernightOption(option, index) {
  const rawRate = firstPresent(
    option.rate,
    option.price,
    option.priceAmount,
    option.price_amount,
  );
  const rate =
    rawRate && typeof rawRate === "object" ? rawRate.amount : rawRate;
  const currency = firstPresent(
    rawRate && typeof rawRate === "object" ? rawRate.currency : undefined,
    option.currency,
    "PHP",
  );
  const capacityMin = firstPresent(option.capacityMin, option.capacity_min);
  const capacityMax = firstPresent(option.capacityMax, option.capacity_max);
  const capacityRange =
    capacityMin !== undefined || capacityMax !== undefined
      ? `${capacityMin ?? capacityMax}${capacityMax && capacityMax !== capacityMin ? `–${capacityMax}` : ""} guest${Number(capacityMax || capacityMin) === 1 ? "" : "s"}`
      : "";
  return {
    id: firstPresent(option.id, `overnight-${index}`),
    type: firstPresent(
      option.type,
      option.optionType,
      option.option_type,
      "Overnight stay",
    ),
    name: firstPresent(
      option.name,
      option.title,
      option.type,
      "Overnight stay",
    ),
    description: firstPresent(option.description, ""),
    capacity: firstPresent(
      option.capacity,
      option.capacityText,
      option.capacity_text,
      capacityRange,
      "",
    ),
    priceLabel: firstPresent(
      option.priceLabel,
      option.price_label,
      rate === undefined || rate === null
        ? "Price upon inquiry"
        : new Intl.NumberFormat("en-PH", {
            style: "currency",
            currency,
            maximumFractionDigits: Number(rate) % 1 === 0 ? 0 : 2,
          }).format(Number(rate)),
    ),
    billingUnit: (() => {
      const unit = firstPresent(
        option.billingUnit,
        option.billing_unit,
        rawRate && typeof rawRate === "object" ? rawRate.unit : undefined,
        "per_night",
      );
      return (
        {
          per_person_per_night: "per person / night",
          per_tent_per_night: "per tent / night",
          per_site_per_night: "per site / night",
          flat_rate: "flat rate",
          per_night: "per night",
        }[unit] || String(unit).replaceAll("_", " ")
      );
    })(),
    inclusions: Array.isArray(option.inclusions)
      ? option.inclusions
      : option.inclusions
        ? [option.inclusions]
        : [],
    notes: firstPresent(option.notes, ""),
    displayOrder: Number(
      firstPresent(option.displayOrder, option.display_order, index),
    ),
  };
}

function normalizeMapLocationDetails(data = {}) {
  const source =
    data.details && typeof data.details === "object"
      ? { ...data, ...data.details }
      : data;
  const visitInformation = firstPresent(
    source.visitInformation,
    source.visit_information,
    {},
  );
  const packageSource = firstPresent(
    source.packages,
    source.linkedPackages,
    source.linked_packages,
    source.packageLinks,
    [],
  );
  const activitySource = firstPresent(
    source.activities,
    source.linkedActivities,
    source.linked_activities,
    source.activityLinks,
    [],
  );
  const overnightSource = firstPresent(
    source.overnightOptions,
    source.overnight_options,
    source.overnightStays,
    [],
  );

  const packages = (Array.isArray(packageSource) ? packageSource : [])
    .map(normalizeMapLocationPackage)
    .filter(Boolean)
    .sort((left, right) => left.displayOrder - right.displayOrder);
  const explicitPrimaryPackage = normalizeMapLocationPackage(
    firstPresent(source.primaryPackage, source.primary_package),
    -1,
  );

  return {
    id: firstPresent(source.id, source.mapLocationId, source.map_location_id),
    locationType: firstPresent(source.locationType, source.location_type),
    name: firstPresent(source.name, source.label, ""),
    overview: firstPresent(
      source.overview,
      source.description,
      source.shortDescription,
      source.short_description,
      "",
    ),
    openingHours: firstPresent(
      source.openingHours,
      source.opening_hours,
      source.openingHoursText,
      source.opening_hours_text,
      visitInformation.openingHoursText,
      visitInformation.opening_hours_text,
      "",
    ),
    admissionInformation: firstPresent(
      source.admissionInformation,
      source.admission_information,
      source.admission,
      visitInformation.admissionInformation,
      visitInformation.admission_information,
      "",
    ),
    bestTime: firstPresent(
      source.bestTime,
      source.best_time,
      visitInformation.bestTimeToVisit,
      visitInformation.best_time_to_visit,
      "",
    ),
    accessibilityNotes: firstPresent(
      source.accessibilityNotes,
      source.accessibility_notes,
      source.accessibility,
      visitInformation.accessibilityNotes,
      visitInformation.accessibility_notes,
      "",
    ),
    address: [
      firstPresent(visitInformation.addressLine, visitInformation.address_line),
      visitInformation.barangay,
      visitInformation.municipality,
      visitInformation.province,
    ]
      .filter(Boolean)
      .join(", "),
    howToVisit: firstPresent(source.howToVisit, source.how_to_visit, ""),
    howToBook: firstPresent(source.howToBook, source.how_to_book, ""),
    gallery: normalizeMapLocationGallery(source),
    activities: (Array.isArray(activitySource) ? activitySource : []).map(
      (activity, index) => ({
        id: firstPresent(
          activity?.id,
          activity?.activityId,
          activity?.activity_id,
          `activity-${index}`,
        ),
        name: firstPresent(
          typeof activity === "string" ? activity : undefined,
          activity?.name,
          activity?.activityName,
          activity?.activity_name,
          "Activity",
        ),
        description: firstPresent(activity?.description, ""),
        duration: firstPresent(activity?.duration, ""),
        targetMarket: firstPresent(
          activity?.targetMarket,
          activity?.target_market,
          "",
        ),
        imageUrl: firstPresent(activity?.imageUrl, activity?.image_url, ""),
      }),
    ),
    packages,
    primaryPackage:
      (explicitPrimaryPackage &&
        (packages.find(
          (tourismPackage) =>
            tourismPackage.id === explicitPrimaryPackage.id ||
            tourismPackage.slug === explicitPrimaryPackage.slug,
        ) ||
          explicitPrimaryPackage)) ||
      packages.find((tourismPackage) => tourismPackage.isPrimary) ||
      packages[0] ||
      null,
    overnightOptions: (Array.isArray(overnightSource) ? overnightSource : [])
      .map(normalizeOvernightOption)
      .sort((left, right) => left.displayOrder - right.displayOrder),
  };
}

function mapArtifact(artifact, index = 0) {
  return {
    id: artifact.slug,
    apiId: artifact.id,
    slug: artifact.slug,
    name: artifact.name,
    era: artifact.eraLabel || artifact.category?.name || "Heritage",
    accent: colorFor(artifact.category, index),
    category: categoryName(artifact.category),
    desc:
      artifact.shortDescription ||
      artifact.description ||
      "Artifact details are being prepared.",
    details: artifact.historicalNotes || artifact.description,
    featured: Boolean(artifact.isFeatured),
    imageUrl: artifact.primaryImage?.url,
  };
}

function userMessageForError(error) {
  if (error?.status === 429)
    return "Too many requests. Please try again later.";
  if (error?.status === 404) return "This item is no longer available.";
  if (error?.code === "NETWORK_ERROR")
    return "Unable to connect to the tourism API. Please try again later.";
  return (
    error?.message || "The request could not be completed. Please try again."
  );
}

export async function getHome() {
  return withApiData(() => promotionApi.getHome(), {
    featuredProducts: [],
    upcomingEvents: [],
    featuredDestinations: [],
    featuredMuseumArtifacts: [],
    featuredPromotions: [],
  });
}

export async function getPromotions(params) {
  const data = await withApiData(() => promotionApi.getPromotions(params), []);
  return Array.isArray(data) ? data : [];
}

export function getCampaigns() {
  return wait([]);
}

export async function getEvents(params) {
  const data = await withApiData(() => promotionApi.getEvents(params), []);
  return data.map((event, index) =>
    event.slug ? mapEvent(event, index) : event,
  );
}

export async function getEventCategories() {
  const data = await withApiData(() => promotionApi.getEventCategories(), []);
  return Array.isArray(data) ? data : [];
}

export async function getDestinations(params) {
  const data = await withApiData(
    () => promotionApi.getDestinations(params),
    [],
  );
  return data.map((destination, index) =>
    destination.slug ? mapDestination(destination, index) : destination,
  );
}

export async function getTourismAssets(params) {
  const data = await withApiData(
    () => promotionApi.getTourismAssets(params),
    [],
  );
  return data.map((asset, index) =>
    asset.sourceModule === "product-development"
      ? mapTourismAsset(asset, index)
      : asset,
  );
}

export async function getPromotionalProducts(params) {
  const data = await withApiData(() => promotionApi.getProducts(params), []);

  return data.map((product, index) =>
    product.slug ? mapProduct(product, index) : product,
  );
}

export async function getPromotionalPackages() {
  const readyPackages = await withApiData(
    () => promotionApi.getReadyForPromotionPackages(),
    [],
  );

  return readyPackages.map(mapReadyPackage);
}

export async function getProductById(id) {
  const response = await promotionApi.getProductBySlug(id).catch((error) => {
    throw new Error(userMessageForError(error));
  });
  const data = response.data;

  if (data.product) return mapProductDetail(data);

  return { ...data, relatedProducts: [] };
}

export function getPackageById(id) {
  return getReadyPackageById(id);
}

export async function submitPackageBookingRequest(tourismPackage, payload) {
  try {
    const representative = payload.representativeContact || {
      fullName: payload.fullName,
      email: payload.email,
      phoneNumber: payload.phoneNumber,
    };
    const response = await promotionApi.submitPackageBookingRequest(
      tourismPackage.slug || tourismPackage.id,
      {
        packageId: tourismPackage.apiId,
        selectedPax: payload.selectedPax,
        fullName: representative.fullName.trim(),
        email: representative.email.trim().toLowerCase(),
        phoneNumber: representative.phoneNumber.trim(),
        representativeContact: {
          fullName: representative.fullName.trim(),
          email: representative.email.trim().toLowerCase(),
          phoneNumber: representative.phoneNumber.trim(),
          gender: representative.gender?.trim() || undefined,
        },
        participants: Array.isArray(payload.participants)
          ? payload.participants.map((participant) => ({
              fullName: participant.fullName.trim(),
              gender: participant.gender.trim(),
              ...(participant.age === "" || participant.age == null
                ? {}
                : { age: Number(participant.age) }),
              ...(participant.notes?.trim()
                ? { notes: participant.notes.trim() }
                : {}),
            }))
          : undefined,
        preferredBookingDate: payload.preferredBookingDate,
        startDate: payload.startDate || payload.preferredBookingDate,
        endDate: payload.endDate,
        durationDays: payload.durationDays,
        paymentMode: payload.paymentMode,
        paymentPlan: payload.paymentPlan,
        paymentMethod: payload.paymentMethod,
        message: payload.message?.trim() || undefined,
      },
    );

    return response.data;
  } catch (error) {
    throw new Error(userMessageForError(error));
  }
}

export async function lookupPackageBookingRequest(payload) {
  try {
    const response = await promotionApi.lookupPackageBookingRequest({
      bookingReference: payload.bookingReference.trim(),
      email: payload.email?.trim().toLowerCase() || undefined,
      phoneNumber: payload.phoneNumber?.trim() || undefined,
    });

    return response.data;
  } catch {
    throw new Error("No booking request matched those details.");
  }
}

export async function submitPackagePaymentProof(requestId, payload) {
  try {
    const formData = new FormData();
    formData.append("proof", payload.file);
    if (payload.paymentReferenceNumber?.trim()) {
      formData.append(
        "paymentReferenceNumber",
        payload.paymentReferenceNumber.trim(),
      );
    }
    if (payload.paymentMethod)
      formData.append("paymentMethod", payload.paymentMethod);
    if (payload.amount != null)
      formData.append("amount", String(payload.amount));
    if (payload.paymentNotes?.trim()) {
      formData.append("paymentNotes", payload.paymentNotes.trim());
    }

    const response = await promotionApi.submitPackagePaymentProof(
      requestId,
      formData,
    );
    return response.data;
  } catch (error) {
    throw new Error(userMessageForError(error));
  }
}

export async function getBusinessById(id) {
  const response = await promotionApi.getBusinessBySlug(id).catch((error) => {
    throw new Error(userMessageForError(error));
  });
  const data = response.data;

  return data.slug ? mapBusiness(data) : data;
}

export async function getAccreditedBusinesses(params = {}) {
  const data = await withApiData(
    () =>
      promotionApi.getBusinesses({ limit: 50, sort: "-issuedAt", ...params }),
    [],
  );

  return data.map((business) =>
    business.businessType || business.accreditation
      ? mapAccreditedBusiness(business)
      : business,
  );
}

export async function getAccreditedBusinessBySlug(slug) {
  const response = await promotionApi.getBusinessBySlug(slug).catch((error) => {
    throw new Error(userMessageForError(error));
  });
  const data = response.data;
  const business = mapAccreditedBusiness(data);

  return {
    ...business,
    relatedEstablishments: (data.relatedEstablishments || []).map(
      mapAccreditedBusiness,
    ),
  };
}

export async function getMapLocations(params = { format: "list" }) {
  const data = await withApiData(
    () => promotionApi.getMapLocations(params),
    [],
  );

  if (data?.type === "FeatureCollection") {
    return data.features.map((feature, index) =>
      mapMapLocation(
        {
          id: feature.properties.id,
          targetId: feature.properties.targetId,
          label: feature.properties.label,
          slug: feature.properties.slug,
          locationType: feature.properties.locationType,
          category: feature.properties.category,
          markerColor: feature.properties.markerColor,
          primaryImage: feature.properties.primaryImage,
          description: feature.properties.description,
          longitude: feature.geometry.coordinates[0],
          latitude: feature.geometry.coordinates[1],
        },
        index,
      ),
    );
  }

  return data.map((location, index) =>
    location.locationType ? mapMapLocation(location, index) : location,
  );
}

export async function getMapLocationGeoJson(params = {}) {
  return withApiData(
    () => promotionApi.getMapLocations({ ...params, format: "geojson" }),
    {
      type: "FeatureCollection",
      features: [],
    },
  );
}

export async function getEmergencyFacilitiesGeoJson() {
  const data = await withApiData(() => promotionApi.getEmergencyFacilities(), {
    type: "FeatureCollection",
    features: [],
  });

  if (data?.type === "FeatureCollection") {
    return {
      type: "FeatureCollection",
      features: Array.isArray(data.features) ? data.features : [],
    };
  }

  return {
    type: "FeatureCollection",
    features: (Array.isArray(data) ? data : [])
      .map((facility) => {
        const latitude = Number(firstPresent(facility.latitude, facility.lat));
        const longitude = Number(
          firstPresent(facility.longitude, facility.lng, facility.lon),
        );
        if (!Number.isFinite(latitude) || !Number.isFinite(longitude))
          return null;

        return {
          type: "Feature",
          geometry: { type: "Point", coordinates: [longitude, latitude] },
          properties: {
            ...facility,
            id: firstPresent(facility.id, facility.slug),
            name: firstPresent(
              facility.name,
              facility.label,
              "Emergency facility",
            ),
            facilityType: firstPresent(
              facility.facilityType,
              facility.facility_type,
            ),
            weeklyHours: firstPresent(
              facility.weeklyHours,
              facility.weekly_hours,
            ),
            publicContacts: firstPresent(
              facility.publicContacts,
              facility.public_contacts,
            ),
          },
        };
      })
      .filter(Boolean),
  };
}

export async function getMapLocationDetails(id, options = {}) {
  try {
    const response = await promotionApi.getMapLocationDetails(id, options);
    return normalizeMapLocationDetails(response.data || {});
  } catch (error) {
    if (error?.name === "AbortError") throw error;
    throw new Error(userMessageForError(error));
  }
}

export async function getMuseumItems(params) {
  const data = await withApiData(
    () => promotionApi.getMuseumArtifacts(params),
    [],
  );
  return data.map((artifact, index) =>
    artifact.slug ? mapArtifact(artifact, index) : artifact,
  );
}

function getStoredSessionToken() {
  return window.localStorage.getItem(ITINERARY_SESSION_KEY);
}

function setStoredSessionToken(token) {
  window.localStorage.setItem(ITINERARY_SESSION_KEY, token);
}

function clearStoredSessionToken() {
  window.localStorage.removeItem(ITINERARY_SESSION_KEY);
}

async function ensureItinerarySession() {
  const existingToken = getStoredSessionToken();
  if (existingToken) return existingToken;

  const response = await promotionApi.createItinerarySession();
  setStoredSessionToken(response.data.sessionToken);
  return response.data.sessionToken;
}

export function getItineraryItems() {
  return wait(itineraryState, 80);
}

export async function loadItinerary() {
  const sessionToken = getStoredSessionToken();
  if (!sessionToken) {
    itineraryState = [];
    return wait({ sessionToken: null, itemCount: 0, items: [] }, 60);
  }

  try {
    const response = await promotionApi.getItinerary(sessionToken);
    itineraryState = response.data.items.map((item) => ({
      id: item.id,
      backendItemId: item.id,
      itemId: item.targetId,
      apiId: item.targetId,
      itemType: item.itemType,
      title: item.titleSnapshot || item.summary?.title,
      savedAt: item.savedAt,
      summary: item.summary,
    }));

    return response.data;
  } catch (error) {
    if (error?.status === 404) {
      clearStoredSessionToken();
      itineraryState = [];
      return { sessionToken: null, itemCount: 0, items: [] };
    }

    throw new Error(userMessageForError(error));
  }
}

export function isSavedToItinerary(itemType, targetId, localId = targetId) {
  return itineraryState.some(
    (item) =>
      item.itemType === itemType &&
      (item.apiId === targetId ||
        item.itemId === targetId ||
        item.itemId === localId),
  );
}

export async function saveToItinerary(item) {
  let backendItem = null;

  if (item.apiId) {
    try {
      const sessionToken = await ensureItinerarySession();
      const response = await promotionApi.addItineraryItem(sessionToken, {
        itemType: item.itemType || item.type,
        targetId: item.apiId,
      });
      backendItem = response.data;
    } catch (error) {
      if (error?.status === 404) clearStoredSessionToken();
      throw new Error(userMessageForError(error));
    }
  }

  const nextItem = {
    id:
      backendItem?.id ||
      `${item.itemType || item.type}-${item.itemId || item.id}`,
    backendItemId: backendItem?.id,
    itemId: item.itemId || item.id,
    apiId: item.apiId || backendItem?.targetId,
    itemType: item.itemType || item.type,
    title: backendItem?.titleSnapshot || item.title || item.name,
    savedAt: backendItem?.savedAt || new Date().toISOString(),
  };

  itineraryState = [
    nextItem,
    ...itineraryState.filter(
      (saved) =>
        !(
          saved.itemType === nextItem.itemType &&
          (saved.itemId === nextItem.itemId ||
            (nextItem.apiId && saved.apiId === nextItem.apiId) ||
            (nextItem.backendItemId &&
              saved.backendItemId === nextItem.backendItemId))
        ),
    ),
  ];

  notifyItineraryUpdated();

  return wait(nextItem, 80);
}

export async function removeFromItinerary(item) {
  const itemId = item.itemId || item.id;
  const itemType = item.itemType || item.type;
  const savedItem = itineraryState.find(
    (saved) =>
      saved.itemType === itemType &&
      (saved.itemId === itemId ||
        saved.apiId === item.apiId ||
        saved.backendItemId === item.backendItemId),
  );

  if (savedItem?.backendItemId) {
    try {
      const sessionToken = getStoredSessionToken();
      if (sessionToken)
        await promotionApi.deleteItineraryItem(
          sessionToken,
          savedItem.backendItemId,
        );
    } catch (error) {
      if (error?.status !== 404) throw new Error(userMessageForError(error));
    }
  }

  itineraryState = itineraryState.filter(
    (saved) =>
      !(
        saved.itemType === itemType &&
        (saved.itemId === itemId ||
          saved.apiId === item.apiId ||
          saved.backendItemId === item.backendItemId)
      ),
  );

  notifyItineraryUpdated();

  return wait({ itemId, itemType, removed: true }, 80);
}

export async function submitTourismInquiry(payload) {
  try {
    const response = await promotionApi.submitInquiry({
      fullName: payload.fullName.trim(),
      email: payload.email.trim().toLowerCase(),
      contactNumber: payload.contactNumber?.trim() || undefined,
      subject: payload.subject.trim(),
      message: payload.message.trim(),
      sourcePage: payload.sourcePage,
      productId: payload.productId,
    });
    return response.data;
  } catch (error) {
    throw new Error(userMessageForError(error));
  }
}

export async function subscribeToNewsletter(payload) {
  try {
    const response = await promotionApi.subscribeNewsletter({
      email: payload.email.trim().toLowerCase(),
      fullName: payload.fullName?.trim() || undefined,
    });
    return response.data;
  } catch (error) {
    throw new Error(userMessageForError(error));
  }
}

export async function sharePublicItem(item) {
  const shareUrl =
    item.url ||
    `${window.location.origin}${item.path || window.location.pathname}`;
  const shareData = {
    title: item.title || item.name || "TWBIS Calabanga Tourism",
    text:
      item.text ||
      item.description ||
      item.desc ||
      "Explore Calabanga tourism information.",
    url: shareUrl,
  };

  if (navigator.share) {
    try {
      await navigator.share(shareData);
      return { method: "native", ...shareData };
    } catch {
      // Continue to clipboard fallback when native share is cancelled or unavailable.
    }
  }

  if (navigator.clipboard) {
    try {
      await navigator.clipboard.writeText(shareUrl);
      return { method: "clipboard", ...shareData };
    } catch {
      // Fall through to manual mode if clipboard permissions are denied.
    }
  }

  return { method: "manual", ...shareData };
}

export const promotionWriteApi = {
  createItinerarySession: promotionApi.createItinerarySession,
  getItinerary: promotionApi.getItinerary,
  addItineraryItem: promotionApi.addItineraryItem,
  deleteItineraryItem: promotionApi.deleteItineraryItem,
  submitInquiry: promotionApi.submitInquiry,
  subscribeNewsletter: promotionApi.subscribeNewsletter,
};
