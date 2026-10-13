import {MediaAsset, MediaRatio} from '../models/site.models';

/**
 * REGISTRO DELLE IMMAGINI — l'unico file da toccare per sostituirle.
 *
 * Oggi sono foto segnaposto di Unsplash (licenza libera). Quando arriveranno
 * le foto della struttura basterà cambiare `photo(...)` con `local(...)` (o
 * con l'URL del CDN, lacuna backend B2): chiavi e didascalie restano uguali,
 * nessun componente va modificato.
 */

/** Larghezze generate per `srcset`. */
const WIDTHS = [480, 800, 1200, 1600] as const;
const DEFAULT_WIDTH = 1200;
const LQIP_WIDTH = 24;

function heightFor(width: number, ratio: MediaRatio): number {
  const [w, h] = ratio.split('/').map(Number);
  return Math.round((width * h) / w);
}

function unsplashUrl(id: string, width: number, ratio: MediaRatio, quality = 78): string {
  return `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${width}&h=${heightFor(width, ratio)}&q=${quality}`;
}

/** Foto segnaposto da Unsplash, ritagliata nel formato richiesto. */
function photo(id: string, alt: string, ratio: MediaRatio = '3/4', caption?: string): MediaAsset {
  return {
    src: unsplashUrl(id, DEFAULT_WIDTH, ratio),
    srcset: WIDTHS.map(width => `${unsplashUrl(id, width, ratio)} ${width}w`).join(', '),
    lqip: unsplashUrl(id, LQIP_WIDTH, ratio, 20),
    alt,
    ratio,
    caption,
  };
}

/**
 * Foto definitiva servita dal sito (`public/media/...`): da usare al posto
 * di `photo` quando arriveranno gli originali. Servono il file `-lqip`
 * (24px di larghezza) e le varianti `-480`, `-800`, `-1200`, `-1600`.
 */
export function local(path: string, alt: string, ratio: MediaRatio = '3/4', caption?: string): MediaAsset {
  const base = `/media/${path}`;
  return {
    src: `${base}-${DEFAULT_WIDTH}.webp`,
    srcset: WIDTHS.map(width => `${base}-${width}.webp ${width}w`).join(', '),
    lqip: `${base}-lqip.webp`,
    alt,
    ratio,
    caption,
  };
}

export const MEDIA = {
  /* --- Casa --- */
  heroBalcony: photo('1708809766808-352e4348ede7', 'Il balcone apparecchiato per la colazione', '3/4'),
  entrance: photo('1588729739599-574d626149d4', 'Il portone in legno e vetro dell\'ingresso', '3/4'),
  hallway: photo('1721852474658-884e1881fe31', 'Il corridoio con la grande porta in legno', '3/4'),
  lounge: photo('1646974400439-321c4a9240b9', 'Il salotto comune con le poltrone vicino alle finestre', '4/3'),
  windowView: photo('1775922428717-fe41d4ce5751', 'La campagna vista da una finestra aperta', '3/4'),
  windowViewWide: photo('1775923130853-0cff74aafb77', 'Il paesaggio dalla finestra della camera', '4/3'),

  /* --- Camere (senza didascalie: non descrivono la camera vera) --- */
  roomOneA: photo('1731336250970-dc942b5e0746', 'Letto matrimoniale accanto alla finestra', '3/4'),
  roomOneB: photo('1549488497-f4bf0a7f8aee', 'Comodino con lampada e tende bianche', '3/4'),
  roomOneC: photo('1786553450386-ab62ff2e140e', 'Il bagno con due lavabi e luce calda', '3/4'),
  roomOneD: photo('1773000857265-419482ddf6b2', 'Il lago e le montagne dalla finestra', '4/3'),
  roomTwoA: photo('1731336478850-6bce7235e320', 'Letto bianco con testiera in legno', '3/4'),
  roomTwoB: photo('1605346434674-a440ca4dc4c0', 'Lenzuola bianche e comodino in legno scuro', '3/4'),
  roomTwoC: photo('1663659505016-d358722c06c3', 'Lavabo del bagno privato', '3/4'),
  roomTwoD: photo('1666813721996-42956e40788e', 'Lettura sul letto nel pomeriggio', '4/3'),
  roomThreeA: photo('1698927100805-2a32718a7e05', 'Camera ampia con letto e quadro alla parete', '3/4'),
  roomThreeB: photo('1639678349557-ffe5bed73ce7', 'Cuscini azzurri e un dipinto sopra il letto', '3/4'),
  roomThreeC: photo('1663659505923-68e15ba8a6d5', 'Flacone di cortesia sul lavabo', '3/4'),
  roomThreeD: photo('1572177215152-32f247303126', 'Angolo lettura con poltrona bianca', '4/3'),
  roomFourA: photo('1711059985570-4c32ed12a12c', 'Letto con lenzuola bianche e cuscini', '3/4'),
  roomFourB: photo('1444201983204-c43cbd584d93', 'Piumone bianco e lampada da tavolo', '3/4'),
  roomFourC: photo('1697466246311-698914070744', 'Camera con letto e specchio', '3/4'),
  roomFourD: photo('1775923293081-598283c494bc', 'La piscina e il paesaggio dalla finestra', '4/3'),

  /* --- Colazione e pasticceria --- */
  breakfastTable: photo('1721821299313-7d0d490f10a9', 'Cornetti e caffè sulla tavola della colazione', '3/4'),
  breakfastCroissant: photo('1574282341541-0b3ed53adcd2', 'Tazza di tè accanto a un vassoio di cornetti', '3/4'),
  breakfastSpread: photo('1528699633788-424224dc89b5', 'Pane, dolci e caffè', '4/3'),
  breakfastCoffee: photo('1602578291182-3e7563f272b0', 'Il caffè versato nella tazza', '3/4'),
  breakfastFruit: photo('1563723930313-e4f6c7c8748e', 'Frutta di stagione in una ciotola rossa', '3/4'),
  pastryHero: photo('1786508310292-348de6ae6163', 'La vetrina della pasticceria con i dolci del giorno', '3/4'),
  pastryPlate: photo('1571292226185-6a16b4d879ee', 'Un piatto di pasticcini', '3/4'),
  pastryCornetto: photo('1635282544448-19b74a304711', 'Cornetto al burro su un piattino', '3/4'),
  pastryBaked: photo('1760446260022-b9d485ee80b0', 'Dolci da forno dorati con il bordo pizzicato', '3/4'),
  pastryCannoli: photo('1777333033326-d20ad009b24e', 'Un cannolo appena farcito', '3/4'),
  pastryCannoliBox: photo('1752079432431-43f97209f979', 'Cannoli nella scatola da asporto', '3/4'),
  pastryCake: photo('1635282530626-d8c4c325b204', 'Torta al cioccolato con glassa bianca', '3/4'),
  pastryCheesecake: photo('1635282530672-7d3c2c2c3c5d', 'Torta di ricotta con cioccolato', '3/4'),
  pastryLoaf: photo('1635282540409-3171279a0e47', 'Lievitato con gocce di cioccolato', '3/4'),

  /* --- Servizi --- */
  serviceTransfer: photo('1691319682770-83c081187018', 'Auto bianca parcheggiata davanti a un palazzo', '4/5'),
  serviceExperience: photo('1668946406806-d3e52ecb1afb', 'Un cesto di peperoncini calabresi', '4/5'),
  serviceBike: photo('1691319683295-fd669fc7eda9', 'Una bicicletta appoggiata al muro', '4/5'),

  /* --- Territorio --- */
  oldTown: photo('1623321582875-eaecd545e76a', 'Vicolo acciottolato del centro storico', '3/4'),
  oldTownWalk: photo('1547064663-cb81d9059c29', 'Una passeggiata fra i vicoli', '3/4'),
  oldTownTower: photo('1755772690472-9570c7862335', 'Una strada stretta con la torre dell\'orologio', '3/4'),
  oldTownPlants: photo('1691160330091-b982b0edc82c', 'Una facciata coperta di piante', '3/4'),
  silaLake: photo('1666039878560-cee0ec30d7ce', 'Un lago tra i boschi e le montagne', '3/4'),
  silaForest: photo('1489945796694-07eba0228bc7', 'Alberi sulla riva di un lago', '3/4'),
  silaShore: photo('1564416178719-cc9cad556230', 'Lago con gli alberi ai lati', '4/3'),
  silaCanoe: photo('1563441770353-231b00db4bec', 'Una canoa sul lago', '3/4'),
  coastCastle: photo('1701870856791-12a03982d431', 'Un castello su una scogliera sul mare', '3/4'),
  coastBeach: photo('1701870856515-82eba2ec6736', 'Spiaggia con una barca nell\'acqua', '3/4'),
  coastBoats: photo('1692650679395-4e2cb1cdeb2d', 'Barche nella baia', '4/3'),
  coastVillage: photo('1599498831042-b07cb9ae23e3', 'Il borgo sul mare', '3/4'),
  coastSwim: photo('1701870856373-bc7273fe6c2c', 'Bagnanti nell\'acqua trasparente', '3/4'),
  coastRocks: photo('1588417560067-35006789ce96', 'Scogli sulla spiaggia', '3/4'),
} as const;

export type MediaKey = keyof typeof MEDIA;
