import { useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Select } from "../ui/select";
import { X, CheckCircle, Lock, Mail } from "lucide-react";

const existingEmails = ["owner@business.com", "john@sunsetresort.com"];

const makeLocationValue = (label: string) =>
  label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

const createCity = (
  label: string,
  barangays = ["Poblacion", "San Isidro", "San Jose", "Santa Cruz"]
) => ({
  value: makeLocationValue(label),
  label,
  barangays,
});

const createProvince = (label: string, cities: ReturnType<typeof createCity>[]) => ({
  value: makeLocationValue(label),
  label,
  cities,
});

const philippineLocations = [
  {
    value: "region-1",
    label: "Region I - Ilocos Region",
    provinces: [
      createProvince("Ilocos Norte", [createCity("Laoag City")]),
      createProvince("Ilocos Sur", [createCity("Vigan City")]),
      createProvince("La Union", [createCity("San Fernando City")]),
      createProvince("Pangasinan", [createCity("Dagupan City")]),
    ],
  },
  {
    value: "region-2",
    label: "Region II - Cagayan Valley",
    provinces: [
      createProvince("Batanes", [createCity("Basco")]),
      createProvince("Cagayan", [createCity("Tuguegarao City")]),
      createProvince("Isabela", [createCity("Ilagan City")]),
      createProvince("Nueva Vizcaya", [createCity("Bayombong")]),
      createProvince("Quirino", [createCity("Cabarroguis")]),
    ],
  },
  {
    value: "region-3",
    label: "Region III - Central Luzon",
    provinces: [
      createProvince("Aurora", [createCity("Baler")]),
      createProvince("Bataan", [createCity("Balanga City")]),
      createProvince("Bulacan", [createCity("Malolos City")]),
      createProvince("Nueva Ecija", [createCity("Cabanatuan City")]),
      createProvince("Pampanga", [createCity("City of San Fernando")]),
      createProvince("Tarlac", [createCity("Tarlac City")]),
      createProvince("Zambales", [createCity("Olongapo City")]),
    ],
  },
  {
    value: "region-4a",
    label: "Region IV-A - CALABARZON",
    provinces: [
      createProvince("Batangas", [createCity("Batangas City")]),
      createProvince("Cavite", [createCity("Tagaytay City")]),
      createProvince("Laguna", [createCity("Santa Rosa City")]),
      createProvince("Quezon", [createCity("Lucena City")]),
      createProvince("Rizal", [createCity("Antipolo City")]),
    ],
  },
  {
    value: "mimaropa",
    label: "MIMAROPA Region",
    provinces: [
      createProvince("Marinduque", [createCity("Boac")]),
      createProvince("Occidental Mindoro", [createCity("Mamburao")]),
      createProvince("Oriental Mindoro", [createCity("Calapan City")]),
      createProvince("Palawan", [createCity("Puerto Princesa City")]),
      createProvince("Romblon", [createCity("Romblon")]),
    ],
  },
  {
    value: "region-5",
    label: "Region V - Bicol Region",
    provinces: [
      createProvince("Albay", [createCity("Legazpi City")]),
      createProvince("Camarines Norte", [createCity("Daet")]),
      createProvince("Camarines Sur", [
        createCity("Baao", "Agdangan Poblacion|Antipolo|Bagumbayan|Buluang|Caranday|Cristo Rey|Del Pilar|Del Rosario|Iyagan|La Medalla|Lourdes|Nababarera|Pugay|Sagrada|Salvacion|San Francisco|San Isidro|San Jose|San Juan|San Nicolas|San Rafael|San Ramon|San Roque|San Vicente|Santa Cruz|Santa Eulalia|Santa Isabel|Santa Teresa|Santa Teresita|Tapol".split("|")),
        createCity("Balatan", "Cabanbanan|Cabungan|Camangahan|Cayogcog|Coguit|Duran|Laganac|Luluasan|Montenegro|Pararao|Pulang Daga|Sagrada Nacacale|San Francisco|Santiago Nacacale|Siramag|Tapayas|Tomatarayo".split("|")),
        createCity("Bato", "Agos|Bacolod|Buluang|Caricot|Cawacagan|Cotmon|Cristo Rey|Del Rosario|Divina Pastora|Goyudan|Lobong|Lubigan|Mainit|Manga|Masoli|Neighborhood|Nino Jesus|Pagatpatan|Palo|Payak|Sagrada|Salvacion|San Isidro|San Juan|San Miguel|San Rafael|San Roque|San Vicente|Santa Cruz|Santiago|Sooc|Tagpolo|Tres Reyes".split("|")),
        createCity("Bombon", "Pagao|San Antonio|San Francisco|San Isidro|San Jose|San Roque|Santo Domingo|Siembre".split("|")),
        createCity("Buhi", "Amlongan|Antipolo|Burocbusoc|Cabatuan|Cagmaslog|De La Fe|Delos Angeles|Divino Rostro|Gabas|Ibayugan|Igbac|Ipil|Iraya|Labawon|Lourdes|Macaangay|Monte Calvario|Namurabod|Sagrada Familia|Salvacion|San Antonio|San Buenaventura|San Francisco|San Isidro|San Jose Baybayon|San Jose Salay|San Pascual|San Pedro|San Rafael|San Ramon|San Roque|San Vicente|Santa Clara|Santa Cruz|Santa Elena|Santa Isabel|Santa Justina|Tambo".split("|")),
        createCity("Bula", "Bagoladio|Bagumbayan|Balaogan|Caorasan|Casugad|Causip|Fabrica|Inoyonan|Itangon|Kinalabasahan|La Purisima|La Victoria|Lanipga|Lubgan|Ombao Heights|Ombao Polpog|Palsong|Panoypoyan|Pawili|Sagrada|Salvacion|San Agustin|San Francisco|San Isidro|San Jose|San Miguel|San Ramon|San Roque|San Roque Heights|Santa Elena|Santo Domingo|Santo Nino|Taisan".split("|")),
        createCity("Cabusao", "Barcelonita|Biong|Camagong|Castillo|New Poblacion|Pandan|San Pedro|Santa Cruz|Santa Lutgarda".split("|")),
        createCity("Calabanga", "Balatasan|Balombon|Balongay|Belen|Bigaas|Binaliw|Binanuaanan Grande|Binanuaanan Pequeno|Bonot-Santa Rosa|Burabod|Cabanbanan|Cagsao|Camuning|Comaguingking|Del Carmen|Dominorog|Fabrica|Harobay|La Purisima|Lugsad|Manguiring|Pagatpat|Paolbo|Pinada|Punta Tarawal|Quinale|Sabang|Salvacion-Baybay|San Antonio|San Antonio Poblacion|San Bernardino|San Francisco|San Isidro|San Lucas|San Miguel|San Pablo|San Roque|San Vicente|Santa Cruz Poblacion|Santa Cruz Ratay|Santa Isabel|Santa Salud|Santo Domingo|Santo Nino|Siba-o|Sibobo|Sogod|Tomagodtod".split("|")),
        createCity("Camaligan", "Dugcal|Marupit|San Francisco|San Jose-San Pablo|San Juan-San Ramon|San Lucas|San Marcos|San Mateo|San Roque|Santo Domingo|Santo Tomas|Sua|Tarosanan".split("|")),
        createCity("Canaman", "Baras|Del Rosario|Dinaga|Fundado|Haring|Iquin|Linaga|Mangayawan|Palo|Pangpang|Poro|San Agustin|San Francisco|San Jose East|San Jose West|San Juan|San Nicolas|San Roque|San Vicente|Santa Cruz|Santa Teresita|Sua|Talidtid|Tibgao".split("|")),
        createCity("Caramoan", "Agaas|Antolon|Bacgong|Bahay|Bikal|Binanuahan|Cabacongan|Cadong|Canatuan|Caputatan|Colongcogong|Daraga|Gata|Gibgos|Gogon|Guijalo|Hanopol|Hanoy|Haponan|Ilawod|Ili-Centro|Lidong|Lubas|Malabog|Maligaya|Mampirao|Mandiclum|Maqueda|Minalaba|Oring|Oroc-Osoc|Pagolinan|Pandanan|Paniman|Patag-Belen|Pili-Centro|Pili-Tabiguian|Poloan|Salvacion|San Roque|San Vicente|Santa Cruz|Solnopan|Tabgon|Tabiguian|Tabog|Tawog|Terogo|Toboan".split("|")),
        createCity("Del Gallego", "Bagong Silang|Bucal|Cabasag|Comadaycaday|Comadogcadog|Domagondong|Kinalangan|Mabini|Magais I|Magais II|Mansalaya|Nagkalit|Palaspas|Pamplona|Pasay|Pinagdapian|Pinugusan|Poblacion Zone III|Sabang|Salvacion|San Juan|San Pablo|Santa Rita I|Santa Rita II|Sinagawsawan|Sinuknipan I|Sinuknipan II|Sugsugin|Tabion|Tomagoktok|Zone I Fatima|Zone II San Antonio".split("|")),
        createCity("Gainza", "Cagbunga|Dahilig|District I|District II|Loob|Malbong|Namuat|Sampaloc".split("|")),
        createCity("Garchitorena", "Ason|Bahi|Barangay I|Barangay II|Barangay III|Barangay IV|Binagasbasan|Burabod|Cagamutan|Cagnipa|Canlong|Dangla|Del Pilar|Denrica|Harrison|Mansangat|Pambuhan|Sagrada|Salvacion|San Vicente|Sumaoy|Tamiawon|Toytoy".split("|")),
        createCity("Goa", "Abucayan|Bagumbayan Grande|Bagumbayan Pequeno|Balaynan|Belen|Buyo|Cagaycay|Catagbacan|Digdigon|Gimaga|Halawig-Gogon|Hiwacloy|La Purisima|Lamon|Matacla|Maymatan|Maysalay|Napawon|Panday|Payatan|Pinaglabanan|Salog|San Benito|San Isidro|San Isidro West|San Jose|San Juan Bautista|San Juan Evangelista|San Pedro|Scout Fuentebella|Tabgon|Tagongtong|Tamban|Taytay".split("|")),
        createCity("Iriga", "Antipolo|Cristo Rey|Del Rosario|Francia|La Anunciacion|La Medalla|La Purisima|La Trinidad|Nino Jesus|Perpetual Help|Sagrada|Salvacion|San Agustin|San Andres|San Antonio|San Francisco|San Isidro|San Jose|San Juan|San Miguel|San Nicolas|San Pedro|San Rafael|San Ramon|San Roque|San Vicente Norte|San Vicente Sur|Santa Cruz Norte|Santa Cruz Sur|Santa Elena|Santa Isabel|Santa Maria|Santa Teresita|Santiago|Santo Domingo|Santo Nino".split("|")),
        createCity("Lagonoy", "Agosais|Agpo-Camagong-Tabog|Amoguis|Balaton|Binanuahan|Bocogan|Burabod|Cabotonan|Dahat|Del Carmen|Gimagtocon|Ginorangan|Gubat|Guibahoy|Himanag|Kinahologan|Loho|Manamoc|Mangogon|Mapid|Olas|Omalo|Panagan|Panicuan|Pinamihagan|San Francisco|San Isidro|San Isidro Norte|San Isidro Sur|San Rafael|San Ramon|San Roque|San Sebastian|San Vicente|Santa Cruz|Santa Maria|Saripongpong|Sipaco".split("|")),
        createCity("Libmanan", "Aslong|Awayan|Bagacay|Bagadion|Bagamelon|Bagumbayan|Bahao|Bahay|Begajo Norte|Begajo Sur|Beguito Nuevo|Beguito Viejo|Bikal|Busak|Caima|Calabnigan|Camambugan|Cambalidio|Candami|Candato|Cawayan|Concepcion|Cuyapi|Danawan|Duang Niog|Handong|Ibid|Inalahan|Labao|Libod I|Libod II|Loba-loba|Mabini|Malansad Nuevo|Malansad Viejo|Malbogon|Malinao|Mambalite|Mambayawas|Mambulo Nuevo|Mambulo Viejo|Mancawayan|Mandacanan|Mantalisay|Padlos|Pag-oring Nuevo|Pag-oring Viejo|Palangon|Palong|Patag|Planza|Poblacion|Potot|Puro-Batia|Rongos|Salvacion|San Isidro|San Juan|San Pablo|San Vicente|Sibujo|Sigamot|Station-Church Site|Taban-Fundado|Tampuhan|Tanag|Tarum|Tinalmud Nuevo|Tinalmud Viejo|Tinangkihan|Udoc|Umalo|Uson|Villadima|Villasocorro".split("|")),
        createCity("Lupi", "Alleomar|Bagangan Sr.|Bagong Sikat|Bangon|Barrera Jr.|Barrera Sr.|Bel-Cruz|Belwang|Buenasuerte|Bulawan Jr.|Bulawan Sr.|Cabutagan|Casay|Colacling|Cristo Rey|Del Carmen|Haguimit|Haluban|Kaibigan|La Purisima|Lourdes|Mangcawayan|Napolidan|Poblacion|Polantuna|Sagrada|Salvacion|San Isidro|San Jose|San Pedro|San Rafael Norte|San Rafael Sur|San Ramon|San Vicente|Sooc|Tanawan|Tapi|Tible".split("|")),
        createCity("Magarao", "Barobaybay|Bell|Carangcang|Carigsa|Casuray|Monserrat|Ponong|San Francisco|San Isidro|San Juan|San Miguel|San Pantaleon|Santa Lucia|Santa Rosa|Santo Tomas".split("|")),
        createCity("Milaor", "Alimbuyog|Amparado|Balagbag|Borongborongan|Cabugao|Capucnasan|Dalipay|Del Rosario|Flordeliz|Lipot|Mayaopayawan|Maycatmon|Maydaso|San Antonio|San Jose|San Miguel|San Roque|San Vicente|Santo Domingo|Tarusanan".split("|")),
        createCity("Minalabac", "Antipolo|Bagolatao|Bagongbong|Baliuag Nuevo|Baliuag Viejo|Catanusan|Del Carmen-Del Rosario|Del Socorro|Hamoraon|Hobo|Irayang Solong|Magadap|Malitbog|Manapao|Mataoroc|Sagrada|Salingogon|San Antonio|San Felipe-Santiago|San Francisco|San Jose|San Juan-San Lorenzo|Taban|Tariric|Timbang".split("|")),
        createCity("Nabua", "Angustia|Antipolo Old|Antipolo Young|Aro-aldao|Bustrac|Dolorosa|Duran|Inapatan|La Opinion|La Purisima|Lourdes Old|Lourdes Young|Malawag|Paloyon Oriental|Paloyon Proper|Salvacion Que Gatos|San Antonio|San Antonio Ogbon|San Esteban|San Francisco|San Isidro|San Isidro Inapatan|San Jose|San Juan|San Luis|San Miguel|San Nicolas|San Roque|San Roque Madawon|San Roque Sagumay|San Vicente Gorong-Gorong|San Vicente Ogbon|Santa Barbara|Santa Cruz|Santa Elena Baras|Santa Lucia Baras|Santiago Old|Santiago Young|Santo Domingo|Tandaay|Topas Proper|Topas Sogod".split("|")),
        createCity("Naga", "Abella|Bagumbayan Norte|Bagumbayan Sur|Balatas|Calauag|Cararayan|Carolina|Concepcion Grande|Concepcion Pequena|Dayangdang|Del Rosario|Dinaga|Igualdad Interior|Lerma|Liboton|Mabolo|Pacol|Panicuason|Penafrancia|Sabang|San Felipe|San Francisco|San Isidro|Santa Cruz|Tabuco|Tinago|Triangulo".split("|")),
        createCity("Ocampo", "Ayugan|Cabariwan|Cagmanaba|Del Rosario|Gatbo|Guinaban|Hanawan|Hibago|La Purisima Nuevo|May-ogob|New Moriones|Old Moriones|Pinit|Poblacion Central|Poblacion East|Poblacion West|Salvacion|San Antonio|San Francisco|San Jose Oras|San Roque Commonal|San Vicente|Santa Cruz|Santo Nino|Villaflorida".split("|")),
        createCity("Pamplona", "Batang|Burabod|Cagbibi|Cagbunga|Calawat|Del Rosario|Patong|Poblacion|Salvacion|San Gabriel|San Isidro|San Rafael|San Ramon|San Vicente|Tambo|Tampadong|Veneracion".split("|")),
        createCity("Pasacao", "Antipolo|Bagong Silang|Bahay|Balogo|Caranan|Cuco|Dalupaon|Hubo|Itulan|Macad|Odicon|Quitang|Salvacion|San Antonio|San Cirilo|Santa Rosa del Norte|Santa Rosa del Sur|Tilnac|Tinalmud".split("|")),
        createCity("Pili", "Anayan|Bagong Sirang|Binanwaanan|Binobong|Cadlan|Caroyroyan|Curry|Del Rosario|Himaao|La Purisima|New San Roque|Old San Roque|Palestina|Pawili|Sagrada|Sagurong|San Agustin|San Antonio|San Isidro|San Jose|San Juan|San Vicente|Santiago|Santo Nino|Tagbong|Tinangis".split("|")),
        createCity("Presentacion", "Ayugao|Bagong Sirang|Baliguian|Bantugan|Bicalen|Bitaogan|Buenavista|Bulalacao|Cagnipa|Lagha|Lidong|Liwacsa|Maangas|Pagsangahan|Patrocinio|Pili|Santa Maria|Tanawan".split("|")),
        createCity("Ragay", "Agao-ao|Agrupacion|Amomokpok|Apad|Apale|Banga Caves|Baya|Binahan Proper|Binahan Upper|Buenasuerte|Cabadisan|Cabinitan|Cabugao|Caditaan|Cale|Catabangan Proper|F. Simeon|Godofredo Reyes Sr.|Inandawa|Laguio|Lanipga-Cawayan|Liboro|Lohong|Lower Omon|Lower Santa Cruz|Panaytayan|Panaytayan Nuevo|Patalunan|Poblacion Ilaod|Poblacion Iraya|Port Junction Norte|Port Junction Sur|Salvacion|Samay|San Rafael|Tagbac|Upper Omon|Upper Santa Cruz".split("|")),
        createCity("Sagnay", "Aniog|Atulayan|Bongalon|Buracan|Catalotoan|Del Carmen|Kilantaao|Kilomaon|Mabca|Minadongjol|Nato|Patitinan|San Antonio|San Isidro|San Roque|Santo Nino|Sibaguan|Tinorongan|Turague".split("|")),
        createCity("San Fernando", "Alianza|Beberon|Bical|Bocal|Bonifacio|Buenavista|Calascagas|Cotmo|Daculang Tubig|Del Pilar|Gnaran|Grijalvo|Lupi|Maragni|Pamukid|Pinamasagan|Pipian|Planza|Rizal|San Joaquin|Santa Cruz|Tagpocol".split("|")),
        createCity("San Jose", "Adiangao|Bagacay|Bahay|Boclod|Calalahan|Calawit|Camagong|Catalotoan|Danlog|Del Carmen|Dolo|Kinalansan|Mampirao|Manzana|Minoro|Palale|Ponglon|Pugay|Sabang|Salogon|San Antonio|San Juan|San Vicente|Santa Cruz|Soledad|Tagas|Tambangan|Telegrafo|Tominawog".split("|")),
        createCity("Sipocot", "Aldezar|Alteza|Anib|Awayan|Azucena|Bagong Sirang|Binahian|Bolo Norte|Bolo Sur|Bulan|Bulawan|Cabuyao|Caima|Calagbangan|Calampinay|Carayrayan|Cotmo|Gabi|Gaongan|Impig|Lipilip|Lubigan Jr.|Lubigan Sr.|Malaguico|Malubago|Manangle|Mangapo|Mangga|Manlubang|Mantila|North Centro|North Villazar|Sagrada Familia|Salanda|Salvacion|San Isidro|San Vicente|Serranzana|South Centro|South Villazar|Taisan|Tara|Tible|Tula-tula|Vigaan|Yabo".split("|")),
        createCity("Siruma", "Bagong Sirang|Bahao|Boboan|Butawanan|Cabugao|Fundado|Homestead|La Purisima|Mabuhay|Malaconini|Matandang Siruma|Nalayahan|Pamintan-Bantilan|Pinitan|Poblacion|Salvacion|San Andres|San Ramon|Sulpa|Tandoc|Tongo-Bantigue|Vito".split("|")),
        createCity("Tigaon", "Abo|Cabalinadan|Caraycayon|Casuna|Consocep|Coyaoyao|Gaao|Gingaroy|Gubat|Huyonhuyon|Libod|Mabalodbalod|May-anao|Panagan|Poblacion|Salvacion|San Antonio|San Francisco|San Miguel|San Rafael|Talojongon|Tinawagan|Vinagre".split("|")),
        createCity("Tinambac", "Agay-ayan|Antipolo|Bagacay|Banga|Bani|Bataan|Binalay|Bolaobalite|Buenavista|Buyo|Cagliliog|Caloco|Camagong|Canayonan|Cawaynan|Daligan|Filarca|La Medalla|La Purisima|Lupi|Magsaysay|Magtang|Mananao|New Caaluan|Olag Grande|Olag Pequeno|Old Caaluan|Pag-asa|Pantat|Sagrada|Salvacion|Salvacion Poblacion|San Antonio|San Isidro|San Jose|San Pascual|San Ramon|San Roque|San Vicente|Santa Cruz|Sogod|Tambang|Tierra Nevada|Union".split("|")),
      ]),
      createProvince("Catanduanes", [createCity("Virac")]),
      createProvince("Masbate", [createCity("Masbate City")]),
      createProvince("Sorsogon", [createCity("Sorsogon City")]),
    ],
  },
  {
    value: "region-6",
    label: "Region VI - Western Visayas",
    provinces: [
      createProvince("Aklan", [createCity("Kalibo")]),
      createProvince("Antique", [createCity("San Jose de Buenavista")]),
      createProvince("Capiz", [createCity("Roxas City")]),
      createProvince("Guimaras", [createCity("Jordan")]),
      createProvince("Iloilo", [createCity("Iloilo City")]),
    ],
  },
  {
    value: "region-7",
    label: "Region VII - Central Visayas",
    provinces: [
      createProvince("Bohol", [createCity("Tagbilaran City")]),
      createProvince("Cebu", [createCity("Cebu City")]),
      createProvince("Siquijor", [createCity("Siquijor")]),
    ],
  },
  {
    value: "region-8",
    label: "Region VIII - Eastern Visayas",
    provinces: [
      createProvince("Biliran", [createCity("Naval")]),
      createProvince("Eastern Samar", [createCity("Borongan City")]),
      createProvince("Leyte", [createCity("Tacloban City")]),
      createProvince("Northern Samar", [createCity("Catarman")]),
      createProvince("Samar", [createCity("Catbalogan City")]),
      createProvince("Southern Leyte", [createCity("Maasin City")]),
    ],
  },
  {
    value: "region-9",
    label: "Region IX - Zamboanga Peninsula",
    provinces: [
      createProvince("Zamboanga del Norte", [createCity("Dipolog City")]),
      createProvince("Zamboanga del Sur", [createCity("Pagadian City")]),
      createProvince("Zamboanga Sibugay", [createCity("Ipil")]),
    ],
  },
  {
    value: "region-10",
    label: "Region X - Northern Mindanao",
    provinces: [
      createProvince("Bukidnon", [createCity("Malaybalay City")]),
      createProvince("Camiguin", [createCity("Mambajao")]),
      createProvince("Lanao del Norte", [createCity("Iligan City")]),
      createProvince("Misamis Occidental", [createCity("Oroquieta City")]),
      createProvince("Misamis Oriental", [createCity("Cagayan de Oro City")]),
    ],
  },
  {
    value: "region-11",
    label: "Region XI - Davao Region",
    provinces: [
      createProvince("Davao de Oro", [createCity("Nabunturan")]),
      createProvince("Davao del Norte", [createCity("Tagum City")]),
      createProvince("Davao del Sur", [createCity("Davao City")]),
      createProvince("Davao Occidental", [createCity("Malita")]),
      createProvince("Davao Oriental", [createCity("Mati City")]),
    ],
  },
  {
    value: "region-12",
    label: "Region XII - SOCCSKSARGEN",
    provinces: [
      createProvince("Cotabato", [createCity("Kidapawan City")]),
      createProvince("Sarangani", [createCity("Alabel")]),
      createProvince("South Cotabato", [createCity("Koronadal City")]),
      createProvince("Sultan Kudarat", [createCity("Isulan")]),
    ],
  },
  {
    value: "region-13",
    label: "Region XIII - Caraga",
    provinces: [
      createProvince("Agusan del Norte", [createCity("Butuan City")]),
      createProvince("Agusan del Sur", [createCity("Prosperidad")]),
      createProvince("Dinagat Islands", [createCity("San Jose")]),
      createProvince("Surigao del Norte", [createCity("Surigao City")]),
      createProvince("Surigao del Sur", [createCity("Tandag City")]),
    ],
  },
  {
    value: "ncr",
    label: "NCR - National Capital Region",
    provinces: [
      createProvince("Metro Manila", [
        createCity("City of Manila", ["Ermita", "Malate", "Paco", "Sampaloc"]),
        createCity("Quezon City", ["Bagumbayan", "Commonwealth", "Diliman", "Novaliches"]),
        createCity("Makati City", ["Bel-Air", "Poblacion", "San Antonio", "Urdaneta"]),
      ]),
    ],
  },
  {
    value: "car",
    label: "CAR - Cordillera Administrative Region",
    provinces: [
      createProvince("Abra", [createCity("Bangued")]),
      createProvince("Apayao", [createCity("Kabugao")]),
      createProvince("Benguet", [createCity("Baguio City")]),
      createProvince("Ifugao", [createCity("Lagawe")]),
      createProvince("Kalinga", [createCity("Tabuk City")]),
      createProvince("Mountain Province", [createCity("Bontoc")]),
    ],
  },
  {
    value: "barmm",
    label: "BARMM - Bangsamoro Autonomous Region in Muslim Mindanao",
    provinces: [
      createProvince("Basilan", [createCity("Isabela City")]),
      createProvince("Lanao del Sur", [createCity("Marawi City")]),
      createProvince("Maguindanao", [createCity("Buluan")]),
      createProvince("Sulu", [createCity("Jolo")]),
      createProvince("Tawi-Tawi", [createCity("Bongao")]),
    ],
  },
  {
    value: "nir",
    label: "NIR - Negros Island Region",
    provinces: [
      createProvince("Negros Occidental", [createCity("Bacolod City")]),
      createProvince("Negros Oriental", [createCity("Dumaguete City")]),
      createProvince("Siquijor", [createCity("Siquijor")]),
    ],
  },
];

interface RegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRegister: () => void;
  onLoginClick: () => void;
}

export function RegistrationModal({
  isOpen,
  onClose,
  onLoginClick,
}: RegistrationModalProps) {
  const [showSuccess, setShowSuccess] = useState(false);
  const [registrationError, setRegistrationError] = useState("");

  const [firstName, setFirstName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [lastName, setLastName] = useState("");
  const [sex, setSex] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [region, setRegion] = useState("");
  const [province, setProvince] = useState("");
  const [cityMunicipality, setCityMunicipality] = useState("");
  const [barangay, setBarangay] = useState("");
  const [businessAddress, setBusinessAddress] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [telephoneNumber, setTelephoneNumber] = useState("");
  const [isCertified, setIsCertified] = useState(false);

  const selectedRegion = philippineLocations.find(
    (location) => location.value === region
  );
  const selectedProvince = selectedRegion?.provinces.find(
    (location) => location.value === province
  );
  const selectedCity = selectedProvince?.cities.find(
    (location) => location.value === cityMunicipality
  );

  if (!isOpen) return null;

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    const normalizedEmail = email.trim().toLowerCase();
    const mobilePattern = /^(\+63|0)?\s?9\d{2}\s?\d{3}\s?\d{4}$/;

    if (existingEmails.includes(normalizedEmail)) {
      setRegistrationError("An account with this email address already exists.");
      return;
    }

    if (!mobilePattern.test(mobileNumber.trim())) {
      setRegistrationError("Enter a valid Philippine mobile number.");
      return;
    }

    if (password !== confirmPassword) {
      setRegistrationError("Password and confirm password must match.");
      return;
    }

    if (!isCertified) {
      setRegistrationError(
        "Please certify that the information provided is true and complete."
      );
      return;
    }

    setRegistrationError("");
    setShowSuccess(true);
  };

  const handleLoginClick = () => {
    setShowSuccess(false);
    onLoginClick();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative w-full max-w-3xl max-h-[92vh] overflow-y-auto rounded-lg bg-white shadow-2xl">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-10 rounded-full p-2 transition-colors hover:bg-gray-100"
          aria-label="Close registration form"
        >
          <X className="size-5 text-gray-500" />
        </button>

        {showSuccess ? (
          <div className="p-10 text-center">
            <div className="mx-auto mb-6 flex size-20 items-center justify-center rounded-full bg-green-100 text-green-600">
              <CheckCircle className="size-10" />
            </div>
            <h2 className="mb-2 text-2xl">Registration Submitted</h2>
            <p className="mx-auto max-w-md text-muted-foreground">
              A verification email has been sent to {email}. Please verify your
              email address before signing in to your business account.
            </p>
            <div className="mt-8 flex justify-center gap-3">
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
              <Button onClick={handleLoginClick}>Go to Sign In</Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-8 p-8">
            {registrationError && (
              <div
                className="sticky top-0 z-20 -mx-8 -mt-8 border-b border-destructive/30 bg-white/95 px-8 py-4 backdrop-blur"
                role="alert"
              >
                <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {registrationError}
                </div>
              </div>
            )}

            <section className="space-y-6 border-b border-border pb-8">
              <h2 className="text-2xl">Personal Information</h2>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label required>First Name</Label>
                  <Input
                    value={firstName}
                    onChange={(event) => setFirstName(event.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Middle Name</Label>
                  <Input
                    value={middleName}
                    onChange={(event) => setMiddleName(event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label required>Last Name</Label>
                  <Input
                    value={lastName}
                    onChange={(event) => setLastName(event.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <fieldset className="space-y-2">
                  <legend className="text-sm font-medium">Sex</legend>
                  <div className="flex flex-wrap gap-4">
                    {["Male", "Female"].map((option) => (
                      <label
                        key={option}
                        className="flex items-center gap-2 text-sm"
                      >
                        <input
                          type="radio"
                          name="sex"
                          value={option}
                          checked={sex === option}
                          onChange={(event) => setSex(event.target.value)}
                          required
                        />
                        {option}
                      </label>
                    ))}
                  </div>
                </fieldset>
              </div>
            </section>

            <section className="space-y-6 border-b border-border pb-8">
              <h2 className="text-2xl">Business Information</h2>

              <div className="space-y-2">
                <Label required>
                  Business Name{" "}
                  <span className="text-xs font-normal">
                    (should be the name reflected on the enterprise's Business
                    Permits)
                  </span>
                </Label>
                <Input
                  value={businessName}
                  onChange={(event) => setBusinessName(event.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label required>Region</Label>
                  <Select
                    value={region}
                    onChange={(event) => {
                      setRegion(event.target.value);
                      setProvince("");
                      setCityMunicipality("");
                      setBarangay("");
                    }}
                    required
                  >
                    <option value="">Select Philippine region</option>
                    {philippineLocations.map((location) => (
                      <option key={location.value} value={location.value}>
                        {location.label}
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label required>Province</Label>
                  <Select
                    value={province}
                    onChange={(event) => {
                      setProvince(event.target.value);
                      setCityMunicipality("");
                      setBarangay("");
                    }}
                    disabled={!region}
                    required
                  >
                    <option value="">Select Philippine province</option>
                    {selectedRegion?.provinces.map((location) => (
                      <option key={location.value} value={location.value}>
                        {location.label}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label required>City | Municipality</Label>
                  <Select
                    value={cityMunicipality}
                    onChange={(event) => {
                      setCityMunicipality(event.target.value);
                      setBarangay("");
                    }}
                    disabled={!province}
                    required
                  >
                    <option value="">Select Philippine city or municipality</option>
                    {selectedProvince?.cities.map((location) => (
                      <option key={location.value} value={location.value}>
                        {location.label}
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label required>Barangay</Label>
                  <Select
                    value={barangay}
                    onChange={(event) => setBarangay(event.target.value)}
                    disabled={!cityMunicipality}
                    required
                  >
                    <option value="">Select Philippine barangay</option>
                    {selectedCity?.barangays.map((location) => (
                      <option key={location} value={location}>
                        {location}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_128px]">
                <div className="space-y-2">
                  <Label required>
                    Business Address{" "}
                    <span className="text-xs font-normal">
                      (Building / House / Block / Lot No., Street)
                    </span>
                  </Label>
                  <Input
                    value={businessAddress}
                    onChange={(event) => setBusinessAddress(event.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label required>Zip Code</Label>
                  <Input
                    value={zipCode}
                    onChange={(event) => setZipCode(event.target.value)}
                    required
                  />
                </div>
              </div>
            </section>

            <section className="space-y-6 border-b border-border pb-8">
              <h2 className="text-2xl">Account Information</h2>

              <div className="space-y-2">
                <Label required>Email Address</Label>
                <div className="relative">
                  <Input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="pr-10"
                    required
                  />
                  <Mail className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                </div>
              </div>

              <p className="text-sm leading-relaxed text-foreground">
                NOTE: Make sure that the email address you provided is ACTIVE
                and VALID. For ESTABLISHMENTS, ensure that this is a corporate
                email address or an email address that will be permanently
                associated to your company. Please refrain from using your
                personal email address as notifications and official
                communications will be forwarded to your registered email.
              </p>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label required>Password</Label>
                  <div className="relative">
                    <Input
                      type="password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      className="pr-10"
                      minLength={8}
                      required
                    />
                    <Lock className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label required>Confirm Password</Label>
                  <div className="relative">
                    <Input
                      type="password"
                      value={confirmPassword}
                      onChange={(event) =>
                        setConfirmPassword(event.target.value)
                      }
                      className="pr-10"
                      minLength={8}
                      required
                    />
                    <Lock className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  </div>
                </div>
              </div>
            </section>

            <section className="space-y-6 border-b border-border pb-8">
              <h2 className="text-2xl">Contact Information</h2>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label required>Mobile No.</Label>
                  <Input
                    value={mobileNumber}
                    onChange={(event) => setMobileNumber(event.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Telephone No.</Label>
                  <Input
                    value={telephoneNumber}
                    onChange={(event) =>
                      setTelephoneNumber(event.target.value)
                    }
                  />
                </div>
              </div>
            </section>

            <section className="space-y-6">
              <label className="flex items-start gap-2 text-sm leading-relaxed">
                <input
                  type="checkbox"
                  checked={isCertified}
                  onChange={(event) => setIsCertified(event.target.checked)}
                  className="mt-1"
                />
                <span>
                  I certify that I am duly authorized to accomplish this
                  application form and that the information provided herein are
                  true, correct and complete statements to the best of my
                  knowledge and in compliance with the provisions of pertinent
                  laws, rules, and regulations of the Republic of the
                  Philippines.
                </span>
              </label>

              <p className="text-sm">
                By clicking Register Account, you agree to our{" "}
                <a
                  href="#"
                  className="text-[var(--color-gov-blue)] hover:underline"
                >
                  Data Privacy Notice
                </a>
                .
              </p>

              {registrationError && (
                <div
                  className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
                  role="alert"
                >
                  {registrationError}
                </div>
              )}

              <div className="flex items-center justify-between gap-4">
                <button
                  type="button"
                  onClick={onLoginClick}
                  className="text-sm text-[var(--color-gov-blue)] hover:underline"
                >
                  Go to sign in page
                </button>
                <Button type="submit" size="lg">
                  Register Account
                </Button>
              </div>
            </section>
          </form>
        )}
      </div>
    </div>
  );
}
