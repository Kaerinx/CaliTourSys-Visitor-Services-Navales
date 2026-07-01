export const businessTypes = [
  "Hotel",
  "Resort",
  "Apartment Hotel",
  "Mabuhay Accommodation",
  "Homestay",
  "Travel and Tour Agency",
  "Travel Agency",
  "Tour Operator",
  "Online Travel Agency",
  "Tourist Land Transport Operator",
  "Tourist Water Transport Operator",
  "Tourist Air Transport Operator",
  "Motorized Banca",
  "MICE Organizer",
  "MICE Facility/ Venue",
  "Adventure/ Sports and Ecotourism Facility",
  "Restaurant",
  "Tourism Training Center",
  "Target Shooting Range",
  "Department Store/ Shopping Mall/ Tourist Shop/ Specialty Shop",
  "Farm Tourism Camp",
  "Gallery/ Museum",
  "Tourism Entertainment Complex",
  "Tourism Recreation Center",
  "Zoo",
  "Rest Area/ Restroom",
  "Surfing Camp",
  "Ambulatory Clinic",
  "Spa",
  "Tertiary Hospital",
];

export const businessTypeGroups = [
  {
    label: "Accommodation Establishments",
    options: [
      "Hotel",
      "Resort",
      "Apartment Hotel",
      "Mabuhay Accommodation",
      "Homestay",
    ],
  },
  {
    label: "Travel and Tour Services",
    options: [
      "Travel and Tour Agency",
      "Travel Agency",
      "Tour Operator",
      "Online Travel Agency",
    ],
  },
  {
    label: "Tourist Transport Operators",
    options: [
      "Tourist Land Transport Operator",
      "Tourist Water Transport Operator",
      "Tourist Air Transport Operator",
      "Motorized Banca",
    ],
  },
  {
    label: "Meetings, Incentives, Conventions and Exhibitions (MICE)",
    options: ["MICE Organizer", "MICE Facility/ Venue"],
  },
  {
    label: "Adventure/ Sports and Ecotourism Facilities",
    options: ["Adventure/ Sports and Ecotourism Facility"],
  },
  {
    label: "Tourism-related Enterprises",
    options: [
      "Restaurant",
      "Tourism Training Center",
      "Target Shooting Range",
      "Department Store/ Shopping Mall/ Tourist Shop/ Specialty Shop",
      "Farm Tourism Camp",
      "Gallery/ Museum",
      "Tourism Entertainment Complex",
      "Tourism Recreation Center",
      "Zoo",
      "Rest Area/ Restroom",
      "Surfing Camp",
    ],
  },
  {
    label: "Health and Wellness Services",
    options: ["Ambulatory Clinic", "Spa", "Tertiary Hospital"],
  },
];

export const commonPermitDocuments = [
  "Business Permit",
  "DTI/SEC Registration",
  "Barangay Clearance",
  "Zoning/Location Clearance",
  "BIR Certificate of Registration",
  "Fire Safety Inspection Certificate",
  "Sanitary Permit",
];

export const permitDocumentsByBusinessType = {
  "Travel and Tour Agency": [
    "DOT Travel Agency Accreditation / Application Proof",
    "DOT Tour Operator Accreditation / Application Proof",
    "Destination / Environmental Permit Matrix",
  ],
  "Travel Agency": [
    "DOT Travel Agency Accreditation / Application Proof",
  ],
  "Tour Operator": [
    "DOT Tour Operator Accreditation / Application Proof",
    "Destination / Environmental Permit Matrix",
  ],
  "Online Travel Agency": [
    "DOT Online Travel Agency Accreditation / Application Proof",
    "Privacy Notice / Data Protection Policy",
  ],
  "Tourist Land Transport Operator": [
    "DOT Tourist Transport Operator Accreditation / Application Proof",
    "LTFRB Franchise / Certificate of Public Convenience",
    "Vehicle OR/CR and Insurance",
  ],
  "Tourist Water Transport Operator": [
    "DOT Tourist Transport Operator Accreditation / Application Proof",
    "MARINA Registration / Safety Compliance",
    "Philippine Coast Guard Clearance",
    "Passenger Insurance",
  ],
  "Tourist Air Transport Operator": [
    "DOT Tourist Transport Operator Accreditation / Application Proof",
    "CAAP Operator Approval",
    "Passenger Insurance",
  ],
  "Motorized Banca": [
    "DOT Tourist Transport Operator Accreditation / Application Proof",
    "MARINA Registration / Safety Compliance",
    "Philippine Coast Guard Clearance",
    "Passenger Insurance",
  ],
  "MICE Organizer": [
    "DOT MICE Organizer Accreditation / Application Proof",
  ],
  "MICE Facility/ Venue": [
    "DOT MICE Facility Accreditation / Application Proof",
    "Occupancy Permit",
  ],
  "Adventure/ Sports and Ecotourism Facility": [
    "DOT Adventure / Ecotourism Accreditation / Application Proof",
    "Environmental / Protected Area Permit",
    "Public Liability Insurance",
  ],
  Restaurant: [
    "Food Establishment Permit",
  ],
  "Tourism Training Center": [
    "Training Program / Instructor Credentials",
  ],
  "Target Shooting Range": [
    "Range Operation Permit",
    "Public Liability Insurance",
  ],
  "Department Store/ Shopping Mall/ Tourist Shop/ Specialty Shop": [
    "Signage Permit",
  ],
  "Farm Tourism Camp": [
    "DOT Farm Tourism Accreditation / Application Proof",
    "Environmental / Protected Area Permit",
  ],
  "Gallery/ Museum": [
    "Occupancy Permit",
  ],
  "Tourism Entertainment Complex": [
    "Occupancy Permit",
    "Public Liability Insurance",
  ],
  "Tourism Recreation Center": [
    "Occupancy Permit",
    "Public Liability Insurance",
  ],
  Zoo: [
    "Wildlife Farm / Zoo Permit",
    "Public Liability Insurance",
  ],
  "Rest Area/ Restroom": [
    "Occupancy Permit",
  ],
  "Surfing Camp": [
    "DOT Adventure / Ecotourism Accreditation / Application Proof",
    "Public Liability Insurance",
  ],
  "Ambulatory Clinic": [
    "Health Facility License / Permit",
  ],
  Spa: [
    "Health and Wellness Service Permit",
  ],
  "Tertiary Hospital": [
    "DOH Hospital License",
  ],
  Hotel: [
    "DOT Accommodation Accreditation / Application Proof",
    "Occupancy Permit",
  ],
  Resort: [
    "DOT Accommodation Accreditation / Application Proof",
    "Occupancy Permit",
  ],
  "Apartment Hotel": [
    "DOT Accommodation Accreditation / Application Proof",
    "Occupancy Permit",
  ],
  "Mabuhay Accommodation": [
    "DOT Accommodation Accreditation / Application Proof",
    "Occupancy Permit",
  ],
  Homestay: [
    "DOT Homestay Accreditation / Application Proof",
  ],
};

export function getRequiredDocumentsForBusinessType(businessType) {
  const selectedTypes = Array.isArray(businessType)
    ? businessType
    : String(businessType || "")
        .split(",")
        .map((type) => type.trim())
        .filter(Boolean);
  const documents = new Set(commonPermitDocuments);

  for (const type of selectedTypes) {
    for (const document of permitDocumentsByBusinessType[type] || []) {
      documents.add(document);
    }
  }

  return Array.from(documents);
}

export const requiredDocuments = getRequiredDocumentsForBusinessType("");

const defaultBarangays = ["Poblacion", "San Isidro", "San Jose", "Santa Cruz"];

const city = (name, barangays = defaultBarangays) => ({ name, barangays });
const province = (name, cities = [city("Poblacion")]) => ({ name, cities });

export const philippineLocations = [
  {
    name: "Region I - Ilocos Region",
    provinces: [
      province("Ilocos Norte", [city("Laoag City")]),
      province("Ilocos Sur", [city("Vigan City")]),
      province("La Union", [city("San Fernando City")]),
      province("Pangasinan", [city("Dagupan City")]),
    ],
  },
  {
    name: "Region II - Cagayan Valley",
    provinces: [
      province("Batanes", [city("Basco")]),
      province("Cagayan", [city("Tuguegarao City")]),
      province("Isabela", [city("Ilagan City")]),
      province("Nueva Vizcaya", [city("Bayombong")]),
      province("Quirino", [city("Cabarroguis")]),
    ],
  },
  {
    name: "Region III - Central Luzon",
    provinces: [
      province("Aurora", [city("Baler")]),
      province("Bataan", [city("Balanga City")]),
      province("Bulacan", [city("Malolos City")]),
      province("Nueva Ecija", [city("Cabanatuan City")]),
      province("Pampanga", [city("City of San Fernando")]),
      province("Tarlac", [city("Tarlac City")]),
      province("Zambales", [city("Olongapo City")]),
    ],
  },
  {
    name: "Region IV-A - CALABARZON",
    provinces: [
      province("Batangas", [city("Batangas City")]),
      province("Cavite", [city("Tagaytay City")]),
      province("Laguna", [city("Santa Rosa City")]),
      province("Quezon", [city("Lucena City")]),
      province("Rizal", [city("Antipolo City")]),
    ],
  },
  {
    name: "MIMAROPA Region",
    provinces: [
      province("Marinduque", [city("Boac")]),
      province("Occidental Mindoro", [city("Mamburao")]),
      province("Oriental Mindoro", [city("Calapan City")]),
      province("Palawan", [city("Puerto Princesa City")]),
      province("Romblon", [city("Romblon")]),
    ],
  },
  {
    name: "Region V - Bicol Region",
    provinces: [
      province("Albay", [city("Legazpi City")]),
      province("Camarines Norte", [city("Daet")]),
      province("Camarines Sur", [
        city("Baao", ["Agdangan Poblacion","Antipolo","Bagumbayan","Buluang","Caranday","Cristo Rey","Del Pilar","Del Rosario","Iyagan","La Medalla","Lourdes","Nababarera","Pugay","Sagrada","Salvacion","San Francisco","San Isidro","San Jose","San Juan","San Nicolas","San Rafael","San Ramon","San Roque","San Vicente","Santa Cruz","Santa Eulalia","Santa Isabel","Santa Teresa","Santa Teresita","Tapol"]),
        city("Balatan", ["Cabanbanan","Cabungan","Camangahan","Cayogcog","Coguit","Duran","Laganac","Luluasan","Montenegro","Pararao","Pulang Daga","Sagrada Nacacale","San Francisco","Santiago Nacacale","Siramag","Tapayas","Tomatarayo"]),
        city("Bato", ["Agos","Bacolod","Buluang","Caricot","Cawacagan","Cotmon","Cristo Rey","Del Rosario","Divina Pastora","Goyudan","Lobong","Lubigan","Mainit","Manga","Masoli","Neighborhood","Niño Jesus","Pagatpatan","Palo","Payak","Sagrada","Salvacion","San Isidro","San Juan","San Miguel","San Rafael","San Roque","San Vicente","Santa Cruz","Santiago","Sooc","Tagpolo","Tres Reyes"]),
        city("Bombon", ["Pagao","San Antonio","San Francisco","San Isidro","San Jose","San Roque","Santo Domingo","Siembre"]),
        city("Buhi", ["Amlongan","Antipolo","Burocbusoc","Cabatuan","Cagmaslog","De La Fe","Delos Angeles","Divino Rostro","Gabas","Ibayugan","Igbac","Ipil","Iraya","Labawon","Lourdes","Macaangay","Monte Calvario","Namurabod","Sagrada Familia","Salvacion","San Antonio","San Buenaventura","San Francisco","San Isidro","San Jose Baybayon","San Jose Salay","San Pascual","San Pedro","San Rafael","San Ramon","San Roque","San Vicente","Santa Clara","Santa Cruz","Santa Elena","Santa Isabel","Santa Justina","Tambo"]),
        city("Bula", ["Bagoladio","Bagumbayan","Balaogan","Caorasan","Casugad","Causip","Fabrica","Inoyonan","Itangon","Kinalabasahan","La Purisima","La Victoria","Lanipga","Lubgan","Ombao Heights","Ombao Polpog","Palsong","Panoypoyan","Pawili","Sagrada","Salvacion","San Agustin","San Francisco","San Isidro","San Jose","San Miguel","San Ramon","San Roque","San Roque Heights","Santa Elena","Santo Domingo","Santo Niño","Taisan"]),
        city("Cabusao", ["Barcelonita","Biong","Camagong","Castillo","New Poblacion","Pandan","San Pedro","Santa Cruz","Santa Lutgarda"]),
        city("Calabanga", ["Balatasan","Balombon","Balongay","Belen","Bigaas","Binaliw","Binanuaanan Grande","Binanuaanan Pequeño","Bonot-Santa Rosa","Burabod","Cabanbanan","Cagsao","Camuning","Comaguingking","Del Carmen","Dominorog","Fabrica","Harobay","La Purisima","Lugsad","Manguiring","Pagatpat","Paolbo","Pinada","Punta Tarawal","Quinale","Sabang","Salvacion-Baybay","San Antonio","San Antonio Poblacion","San Bernardino","San Francisco","San Isidro","San Lucas","San Miguel","San Pablo","San Roque","San Vicente","Santa Cruz Poblacion","Santa Cruz Ratay","Santa Isabel","Santa Salud","Santo Domingo","Santo Niño","Siba-o","Sibobo","Sogod","Tomagodtod"]),
        city("Camaligan", ["Dugcal","Marupit","San Francisco","San Jose-San Pablo","San Juan-San Ramon","San Lucas","San Marcos","San Mateo","San Roque","Santo Domingo","Santo Tomas","Sua","Tarosanan"]),
        city("Canaman", ["Baras","Del Rosario","Dinaga","Fundado","Haring","Iquin","Linaga","Mangayawan","Palo","Pangpang","Poro","San Agustin","San Francisco","San Jose East","San Jose West","San Juan","San Nicolas","San Roque","San Vicente","Santa Cruz","Santa Teresita","Sua","Talidtid","Tibgao"]),
        city("Caramoan", ["Agaas","Antolon","Bacgong","Bahay","Bikal","Binanuahan","Cabacongan","Cadong","Canatuan","Caputatan","Colongcogong","Daraga","Gata","Gibgos","Gogon","Guijalo","Hanopol","Hanoy","Haponan","Ilawod","Ili-Centro","Lidong","Lubas","Malabog","Maligaya","Mampirao","Mandiclum","Maqueda","Minalaba","Oring","Oroc-Osoc","Pagolinan","Pandanan","Paniman","Patag-Belen","Pili-Centro","Pili-Tabiguian","Poloan","Salvacion","San Roque","San Vicente","Santa Cruz","Solnopan","Tabgon","Tabiguian","Tabog","Tawog","Terogo","Toboan"]),
        city("Del Gallego", ["Bagong Silang","Bucal","Cabasag","Comadaycaday","Comadogcadog","Domagondong","Kinalangan","Mabini","Magais I","Magais II","Mansalaya","Nagkalit","Palaspas","Pamplona","Pasay","Pinagdapian","Pinugusan","Poblacion Zone III","Sabang","Salvacion","San Juan","San Pablo","Santa Rita I","Santa Rita II","Sinagawsawan","Sinuknipan I","Sinuknipan II","Sugsugin","Tabion","Tomagoktok","Zone I Fatima","Zone II San Antonio"]),
        city("Gainza", ["Cagbunga","Dahilig","District I","District II","Loob","Malbong","Namuat","Sampaloc"]),
        city("Garchitorena", ["Ason","Bahi","Barangay I","Barangay II","Barangay III","Barangay IV","Binagasbasan","Burabod","Cagamutan","Cagnipa","Canlong","Dangla","Del Pilar","Denrica","Harrison","Mansangat","Pambuhan","Sagrada","Salvacion","San Vicente","Sumaoy","Tamiawon","Toytoy"]),
        city("Goa", ["Abucayan","Bagumbayan Grande","Bagumbayan Pequeño","Balaynan","Belen","Buyo","Cagaycay","Catagbacan","Digdigon","Gimaga","Halawig-Gogon","Hiwacloy","La Purisima","Lamon","Matacla","Maymatan","Maysalay","Napawon","Panday","Payatan","Pinaglabanan","Salog","San Benito","San Isidro","San Isidro West","San Jose","San Juan Bautista","San Juan Evangelista","San Pedro","Scout Fuentebella","Tabgon","Tagongtong","Tamban","Taytay"]),
        city("Iriga", ["Antipolo","Cristo Rey","Del Rosario","Francia","La Anunciacion","La Medalla","La Purisima","La Trinidad","Niño Jesus","Perpetual Help","Sagrada","Salvacion","San Agustin","San Andres","San Antonio","San Francisco","San Isidro","San Jose","San Juan","San Miguel","San Nicolas","San Pedro","San Rafael","San Ramon","San Roque","San Vicente Norte","San Vicente Sur","Santa Cruz Norte","Santa Cruz Sur","Santa Elena","Santa Isabel","Santa Maria","Santa Teresita","Santiago","Santo Domingo","Santo Niño"]),
        city("Lagonoy", ["Agosais","Agpo-Camagong-Tabog","Amoguis","Balaton","Binanuahan","Bocogan","Burabod","Cabotonan","Dahat","Del Carmen","Gimagtocon","Ginorangan","Gubat","Guibahoy","Himanag","Kinahologan","Loho","Manamoc","Mangogon","Mapid","Olas","Omalo","Panagan","Panicuan","Pinamihagan","San Francisco","San Isidro","San Isidro Norte","San Isidro Sur","San Rafael","San Ramon","San Roque","San Sebastian","San Vicente","Santa Cruz","Santa Maria","Saripongpong","Sipaco"]),
        city("Libmanan", ["Aslong","Awayan","Bagacay","Bagadion","Bagamelon","Bagumbayan","Bahao","Bahay","Begajo Norte","Begajo Sur","Beguito Nuevo","Beguito Viejo","Bikal","Busak","Caima","Calabnigan","Camambugan","Cambalidio","Candami","Candato","Cawayan","Concepcion","Cuyapi","Danawan","Duang Niog","Handong","Ibid","Inalahan","Labao","Libod I","Libod II","Loba-loba","Mabini","Malansad Nuevo","Malansad Viejo","Malbogon","Malinao","Mambalite","Mambayawas","Mambulo Nuevo","Mambulo Viejo","Mancawayan","Mandacanan","Mantalisay","Padlos","Pag-oring Nuevo","Pag-oring Viejo","Palangon","Palong","Patag","Planza","Poblacion","Potot","Puro-Batia","Rongos","Salvacion","San Isidro","San Juan","San Pablo","San Vicente","Sibujo","Sigamot","Station-Church Site","Taban-Fundado","Tampuhan","Tanag","Tarum","Tinalmud Nuevo","Tinalmud Viejo","Tinangkihan","Udoc","Umalo","Uson","Villadima","Villasocorro"]),
        city("Lupi", ["Alleomar","Bagangan Sr.","Bagong Sikat","Bangon","Barrera Jr.","Barrera Sr.","Bel-Cruz","Belwang","Buenasuerte","Bulawan Jr.","Bulawan Sr.","Cabutagan","Casay","Colacling","Cristo Rey","Del Carmen","Haguimit","Haluban","Kaibigan","La Purisima","Lourdes","Mangcawayan","Napolidan","Poblacion","Polantuna","Sagrada","Salvacion","San Isidro","San Jose","San Pedro","San Rafael Norte","San Rafael Sur","San Ramon","San Vicente","Sooc","Tanawan","Tapi","Tible"]),
        city("Magarao", ["Barobaybay","Bell","Carangcang","Carigsa","Casuray","Monserrat","Ponong","San Francisco","San Isidro","San Juan","San Miguel","San Pantaleon","Santa Lucia","Santa Rosa","Santo Tomas"]),
        city("Milaor", ["Alimbuyog","Amparado","Balagbag","Borongborongan","Cabugao","Capucnasan","Dalipay","Del Rosario","Flordeliz","Lipot","Mayaopayawan","Maycatmon","Maydaso","San Antonio","San Jose","San Miguel","San Roque","San Vicente","Santo Domingo","Tarusanan"]),
        city("Minalabac", ["Antipolo","Bagolatao","Bagongbong","Baliuag Nuevo","Baliuag Viejo","Catanusan","Del Carmen-Del Rosario","Del Socorro","Hamoraon","Hobo","Irayang Solong","Magadap","Malitbog","Manapao","Mataoroc","Sagrada","Salingogon","San Antonio","San Felipe-Santiago","San Francisco","San Jose","San Juan-San Lorenzo","Taban","Tariric","Timbang"]),
        city("Nabua", ["Angustia","Antipolo Old","Antipolo Young","Aro-aldao","Bustrac","Dolorosa","Duran","Inapatan","La Opinion","La Purisima","Lourdes Old","Lourdes Young","Malawag","Paloyon Oriental","Paloyon Proper","Salvacion Que Gatos","San Antonio","San Antonio Ogbon","San Esteban","San Francisco","San Isidro","San Isidro Inapatan","San Jose","San Juan","San Luis","San Miguel","San Nicolas","San Roque","San Roque Madawon","San Roque Sagumay","San Vicente Gorong-Gorong","San Vicente Ogbon","Santa Barbara","Santa Cruz","Santa Elena Baras","Santa Lucia Baras","Santiago Old","Santiago Young","Santo Domingo","Tandaay","Topas Proper","Topas Sogod"]),
        city("Naga", ["Abella","Bagumbayan Norte","Bagumbayan Sur","Balatas","Calauag","Cararayan","Carolina","Concepcion Grande","Concepcion Pequeña","Dayangdang","Del Rosario","Dinaga","Igualdad Interior","Lerma","Liboton","Mabolo","Pacol","Panicuason","Peñafrancia","Sabang","San Felipe","San Francisco","San Isidro","Santa Cruz","Tabuco","Tinago","Triangulo"]),
        city("Ocampo", ["Ayugan","Cabariwan","Cagmanaba","Del Rosario","Gatbo","Guinaban","Hanawan","Hibago","La Purisima Nuevo","May-ogob","New Moriones","Old Moriones","Pinit","Poblacion Central","Poblacion East","Poblacion West","Salvacion","San Antonio","San Francisco","San Jose Oras","San Roque Commonal","San Vicente","Santa Cruz","Santo Niño","Villaflorida"]),
        city("Pamplona", ["Batang","Burabod","Cagbibi","Cagbunga","Calawat","Del Rosario","Patong","Poblacion","Salvacion","San Gabriel","San Isidro","San Rafael","San Ramon","San Vicente","Tambo","Tampadong","Veneracion"]),
        city("Pasacao", ["Antipolo","Bagong Silang","Bahay","Balogo","Caranan","Cuco","Dalupaon","Hubo","Itulan","Macad","Odicon","Quitang","Salvacion","San Antonio","San Cirilo","Santa Rosa del Norte","Santa Rosa del Sur","Tilnac","Tinalmud"]),
        city("Pili", ["Anayan","Bagong Sirang","Binanwaanan","Binobong","Cadlan","Caroyroyan","Curry","Del Rosario","Himaao","La Purisima","New San Roque","Old San Roque","Palestina","Pawili","Sagrada","Sagurong","San Agustin","San Antonio","San Isidro","San Jose","San Juan","San Vicente","Santiago","Santo Niño","Tagbong","Tinangis"]),
        city("Presentacion", ["Ayugao","Bagong Sirang","Baliguian","Bantugan","Bicalen","Bitaogan","Buenavista","Bulalacao","Cagnipa","Lagha","Lidong","Liwacsa","Maangas","Pagsangahan","Patrocinio","Pili","Santa Maria","Tanawan"]),
        city("Ragay", ["Agao-ao","Agrupacion","Amomokpok","Apad","Apale","Banga Caves","Baya","Binahan Proper","Binahan Upper","Buenasuerte","Cabadisan","Cabinitan","Cabugao","Caditaan","Cale","Catabangan Proper","F. Simeon","Godofredo Reyes Sr.","Inandawa","Laguio","Lanipga-Cawayan","Liboro","Lohong","Lower Omon","Lower Santa Cruz","Panaytayan","Panaytayan Nuevo","Patalunan","Poblacion Ilaod","Poblacion Iraya","Port Junction Norte","Port Junction Sur","Salvacion","Samay","San Rafael","Tagbac","Upper Omon","Upper Santa Cruz"]),
        city("Sagñay", ["Aniog","Atulayan","Bongalon","Buracan","Catalotoan","Del Carmen","Kilantaao","Kilomaon","Mabca","Minadongjol","Nato","Patitinan","San Antonio","San Isidro","San Roque","Santo Niño","Sibaguan","Tinorongan","Turague"]),
        city("San Fernando", ["Alianza","Beberon","Bical","Bocal","Bonifacio","Buenavista","Calascagas","Cotmo","Daculang Tubig","Del Pilar","Gñaran","Grijalvo","Lupi","Maragñi","Pamukid","Pinamasagan","Pipian","Planza","Rizal","San Joaquin","Santa Cruz","Tagpocol"]),
        city("San Jose", ["Adiangao","Bagacay","Bahay","Boclod","Calalahan","Calawit","Camagong","Catalotoan","Danlog","Del Carmen","Dolo","Kinalansan","Mampirao","Manzana","Minoro","Palale","Ponglon","Pugay","Sabang","Salogon","San Antonio","San Juan","San Vicente","Santa Cruz","Soledad","Tagas","Tambangan","Telegrafo","Tominawog"]),
        city("Sipocot", ["Aldezar","Alteza","Anib","Awayan","Azucena","Bagong Sirang","Binahian","Bolo Norte","Bolo Sur","Bulan","Bulawan","Cabuyao","Caima","Calagbangan","Calampinay","Carayrayan","Cotmo","Gabi","Gaongan","Impig","Lipilip","Lubigan Jr.","Lubigan Sr.","Malaguico","Malubago","Manangle","Mangapo","Mangga","Manlubang","Mantila","North Centro","North Villazar","Sagrada Familia","Salanda","Salvacion","San Isidro","San Vicente","Serranzana","South Centro","South Villazar","Taisan","Tara","Tible","Tula-tula","Vigaan","Yabo"]),
        city("Siruma", ["Bagong Sirang","Bahao","Boboan","Butawanan","Cabugao","Fundado","Homestead","La Purisima","Mabuhay","Malaconini","Matandang Siruma","Nalayahan","Pamintan-Bantilan","Pinitan","Poblacion","Salvacion","San Andres","San Ramon","Sulpa","Tandoc","Tongo-Bantigue","Vito"]),
        city("Tigaon", ["Abo","Cabalinadan","Caraycayon","Casuna","Consocep","Coyaoyao","Gaao","Gingaroy","Gubat","Huyonhuyon","Libod","Mabalodbalod","May-anao","Panagan","Poblacion","Salvacion","San Antonio","San Francisco","San Miguel","San Rafael","Talojongon","Tinawagan","Vinagre"]),
        city("Tinambac", ["Agay-ayan","Antipolo","Bagacay","Banga","Bani","Bataan","Binalay","Bolaobalite","Buenavista","Buyo","Cagliliog","Caloco","Camagong","Canayonan","Cawaynan","Daligan","Filarca","La Medalla","La Purisima","Lupi","Magsaysay","Magtang","Mananao","New Caaluan","Olag Grande","Olag Pequeño","Old Caaluan","Pag-asa","Pantat","Sagrada","Salvacion","Salvacion Poblacion","San Antonio","San Isidro","San Jose","San Pascual","San Ramon","San Roque","San Vicente","Santa Cruz","Sogod","Tambang","Tierra Nevada","Union"]),
      ]),
      province("Catanduanes", [city("Virac")]),
      province("Masbate", [city("Masbate City")]),
      province("Sorsogon", [city("Sorsogon City")]),
    ],
  },
  {
    name: "Region VI - Western Visayas",
    provinces: [
      province("Aklan", [city("Kalibo")]),
      province("Antique", [city("San Jose de Buenavista")]),
      province("Capiz", [city("Roxas City")]),
      province("Guimaras", [city("Jordan")]),
      province("Iloilo", [city("Iloilo City")]),
      province("Negros Occidental", [city("Bacolod City")]),
    ],
  },
  {
    name: "Region VII - Central Visayas",
    provinces: [
      province("Bohol", [city("Tagbilaran City")]),
      province("Cebu", [city("Cebu City")]),
      province("Negros Oriental", [city("Dumaguete City")]),
      province("Siquijor", [city("Siquijor")]),
    ],
  },
  {
    name: "Region VIII - Eastern Visayas",
    provinces: [
      province("Biliran", [city("Naval")]),
      province("Eastern Samar", [city("Borongan City")]),
      province("Leyte", [city("Tacloban City")]),
      province("Northern Samar", [city("Catarman")]),
      province("Samar", [city("Catbalogan City")]),
      province("Southern Leyte", [city("Maasin City")]),
    ],
  },
  {
    name: "Region IX - Zamboanga Peninsula",
    provinces: [
      province("Zamboanga del Norte", [city("Dipolog City")]),
      province("Zamboanga del Sur", [city("Pagadian City")]),
      province("Zamboanga Sibugay", [city("Ipil")]),
    ],
  },
  {
    name: "Region X - Northern Mindanao",
    provinces: [
      province("Bukidnon", [city("Malaybalay City")]),
      province("Camiguin", [city("Mambajao")]),
      province("Lanao del Norte", [city("Iligan City")]),
      province("Misamis Occidental", [city("Oroquieta City")]),
      province("Misamis Oriental", [city("Cagayan de Oro City")]),
    ],
  },
  {
    name: "Region XI - Davao Region",
    provinces: [
      province("Davao de Oro", [city("Nabunturan")]),
      province("Davao del Norte", [city("Tagum City")]),
      province("Davao del Sur", [city("Davao City")]),
      province("Davao Occidental", [city("Malita")]),
      province("Davao Oriental", [city("Mati City")]),
    ],
  },
  {
    name: "Region XII - SOCCSKSARGEN",
    provinces: [
      province("Cotabato", [city("Kidapawan City")]),
      province("Sarangani", [city("Alabel")]),
      province("South Cotabato", [city("Koronadal City")]),
      province("Sultan Kudarat", [city("Isulan")]),
    ],
  },
  {
    name: "Region XIII - Caraga",
    provinces: [
      province("Agusan del Norte", [city("Butuan City")]),
      province("Agusan del Sur", [city("Prosperidad")]),
      province("Dinagat Islands", [city("San Jose")]),
      province("Surigao del Norte", [city("Surigao City")]),
      province("Surigao del Sur", [city("Tandag City")]),
    ],
  },
  {
    name: "NCR - National Capital Region",
    provinces: [
      province("Metro Manila", [
        city("City of Manila"),
        city("Quezon City"),
        city("Makati City"),
        city("Pasig City"),
      ]),
    ],
  },
  {
    name: "CAR - Cordillera Administrative Region",
    provinces: [
      province("Abra", [city("Bangued")]),
      province("Apayao", [city("Kabugao")]),
      province("Benguet", [city("Baguio City")]),
      province("Ifugao", [city("Lagawe")]),
      province("Kalinga", [city("Tabuk City")]),
      province("Mountain Province", [city("Bontoc")]),
    ],
  },
  {
    name: "BARMM - Bangsamoro Autonomous Region in Muslim Mindanao",
    provinces: [
      province("Basilan", [city("Isabela City")]),
      province("Lanao del Sur", [city("Marawi City")]),
      province("Maguindanao", [city("Buluan")]),
      province("Sulu", [city("Jolo")]),
      province("Tawi-Tawi", [city("Bongao")]),
    ],
  },
  {
    name: "NIR - Negros Island Region",
    provinces: [
      province("Negros Occidental", [city("Bacolod City")]),
      province("Negros Oriental", [city("Dumaguete City")]),
      province("Siquijor", [city("Siquijor")]),
    ],
  },
];

export const calabangaLocation = {
  region: "Region V - Bicol Region",
  province: "Camarines Sur",
  cityMunicipality: "Calabanga",
  zipCode: "4405",
};

const bicolRegion = philippineLocations.find(
  (location) => location.name === calabangaLocation.region
);
const camarinesSur = bicolRegion?.provinces.find(
  (location) => location.name === calabangaLocation.province
);
const calabangaCity = camarinesSur?.cities.find(
  (location) => location.name === calabangaLocation.cityMunicipality
);

export const calabangaBarangays = calabangaCity?.barangays || [];

export const demoApplications = [
  {
    id: "APP-2026-001",
    business_name: "Sunset Beach Resort",
    business_type: "Resort",
    type: "New Accreditation",
    business_permit_number: "BP-2026-00124",
    dti_sec_registration_number: "DTI-2026-7712",
    owner: "John Martinez",
    contact_number: "+63 912 345 6789",
    address: "Zone 2, Coastal Road, San Francisco, Calabanga, Camarines Sur",
    status: "under_review",
    submitted_at: "2026-05-10T09:30:00",
    updated_at: "2026-05-12T10:00:00",
    priority: "High",
    documents: [
      { name: "Business Permit", status: "verified", uploaded_at: "2026-05-10T09:35:00" },
      { name: "DTI/SEC Registration", status: "verified", uploaded_at: "2026-05-10T09:36:00" },
    ],
  },
  {
    id: "APP-2026-002",
    business_name: "City Heritage Hotel",
    business_type: "Hotel",
    type: "Renewal",
    business_permit_number: "BP-2026-00210",
    dti_sec_registration_number: "SEC-2026-3488",
    owner: "Maria Garcia",
    contact_number: "+63 917 222 4401",
    address: "Rizal Street, Naga City, Camarines Sur",
    status: "pending",
    submitted_at: "2026-05-12T09:00:00",
    updated_at: "2026-05-13T11:20:00",
    priority: "Medium",
    documents: [
      { name: "Business Permit", status: "submitted", uploaded_at: "2026-05-12T09:05:00" },
      { name: "DTI/SEC Registration", status: "submitted", uploaded_at: "2026-05-12T09:07:00" },
    ],
  },
  {
    id: "APP-2026-003",
    business_name: "Island Paradise Tours",
    business_type: "Travel and Tour Agency",
    type: "New Accreditation",
    business_permit_number: "BP-2026-00318",
    dti_sec_registration_number: "DTI-2026-9320",
    owner: "Carlos Reyes",
    contact_number: "+63 905 889 1102",
    address: "Poblacion, Caramoan, Camarines Sur",
    status: "for_revision",
    submitted_at: "2026-05-08T15:15:00",
    updated_at: "2026-05-13T08:45:00",
    priority: "High",
    documents: [
      { name: "Business Permit", status: "for_revision", uploaded_at: "2026-05-08T15:20:00" },
      { name: "DTI/SEC Registration", status: "verified", uploaded_at: "2026-05-08T15:22:00" },
    ],
  },
];

export const demoAuditLogs = [
  {
    event_number: "AUD-2026-1057",
    action: "Updated role permissions",
    module: "Role Management",
    severity: "medium",
    actor_name: "Admin User",
    created_at: "2026-05-14T16:45:00",
  },
  {
    event_number: "AUD-2026-1055",
    action: "Failed login attempt",
    module: "Authentication",
    severity: "high",
    actor_name: "Ana Reyes",
    created_at: "2026-05-14T13:05:00",
  },
];
