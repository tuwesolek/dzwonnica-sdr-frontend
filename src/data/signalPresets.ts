import type { ReceiverMode } from '../lib/receiverMode';

export const PLUTO_MIN_HZ = 70_000_000;
export const PLUTO_MAX_HZ = 6_000_000_000;

export const PRESET_CATEGORIES = [
  'broadcast',
  'amateur',
  'airband',
  'maritime',
  'rail',
  'safety',
  'digital',
  'satellite',
  'navigation',
  'ism',
  'wireless',
  'science',
] as const;

export type PresetCategory = (typeof PRESET_CATEGORIES)[number];
export type PresetCapability = 'audio' | 'spectrum';
export type PresetRegion = 'PL' | 'EU' | 'Region 1' | 'Global' | 'US';

export const PRESET_CATEGORY_LABELS: Record<PresetCategory, string> = {
  broadcast: 'Radio i TV',
  amateur: 'Krótkofalarstwo',
  airband: 'Lotnictwo',
  maritime: 'Morskie',
  rail: 'Kolej',
  safety: 'Służby i bezpieczeństwo',
  digital: 'Cyfrowe',
  satellite: 'Satelity',
  navigation: 'Nawigacja',
  ism: 'ISM i IoT',
  wireless: 'Sieci bezprzewodowe',
  science: 'Nauka i niezwykłe sygnały',
};

export type SignalPreset = {
  id: string;
  name: string;
  frequencyHz: number;
  mode: ReceiverMode;
  bandwidthHz: number;
  category: PresetCategory;
  modulation: string;
  protocol?: string;
  region: PresetRegion;
  description: string;
  tags: string[];
  capability: PresetCapability;
  caution?: boolean;
};

type PresetInput = Omit<SignalPreset, 'id' | 'tags'> & { id?: string; tags?: string[] };

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function preset(input: PresetInput): SignalPreset {
  return {
    ...input,
    id: input.id ?? `${input.category}-${slugify(input.name)}-${Math.round(input.frequencyHz)}`,
    tags: input.tags ?? [],
  };
}

const dabBlocks: Array<[string, number]> = [
  ['5A', 174.928], ['5B', 176.64], ['5C', 178.352], ['5D', 180.064],
  ['6A', 181.936], ['6B', 183.648], ['6C', 185.36], ['6D', 187.072],
  ['7A', 188.928], ['7B', 190.64], ['7C', 192.352], ['7D', 194.064],
  ['8A', 195.936], ['8B', 197.648], ['8C', 199.36], ['8D', 201.072],
  ['9A', 202.928], ['9B', 204.64], ['9C', 206.352], ['9D', 208.064],
  ['10A', 209.936], ['10B', 211.648], ['10C', 213.36], ['10D', 215.072],
  ['11A', 216.928], ['11B', 218.64], ['11C', 220.352], ['11D', 222.064],
  ['12A', 223.936], ['12B', 225.648], ['12C', 227.36], ['12D', 229.072],
  ['13A', 230.784], ['13B', 232.496], ['13C', 234.208], ['13D', 235.776],
  ['13E', 237.488], ['13F', 239.2],
];

const dabPresets = dabBlocks.map(([block, mhz]) => preset({
  name: `DAB+ blok ${block}`,
  frequencyHz: mhz * 1_000_000,
  mode: 'WBFM',
  bandwidthHz: 250_000,
  category: 'broadcast',
  modulation: 'DAB / OFDM',
  protocol: 'DAB+',
  region: 'EU',
  description: 'Środek europejskiego bloku DAB+. W aplikacji dostępny jest podgląd fragmentu widma, bez dekodera DAB.',
  tags: ['radio cyfrowe', 'vhf iii', block],
  capability: 'spectrum',
}));

const dvbtPresets = Array.from({ length: 28 }, (_, index) => {
  const channel = index + 21;
  return preset({
    name: `DVB-T/T2 kanał ${channel}`,
    frequencyHz: (474 + index * 8) * 1_000_000,
    mode: 'WBFM',
    bandwidthHz: 250_000,
    category: 'broadcast',
    modulation: 'OFDM',
    protocol: 'DVB-T/T2',
    region: 'EU',
    description: 'Środek kanału telewizji naziemnej. Widoczny jest wycinek szerokiego multipleksu 8 MHz.',
    tags: ['telewizja', 'mux', `k${channel}`],
    capability: 'spectrum',
  });
});

const pmr446Presets = Array.from({ length: 16 }, (_, index) => {
  const channel = index + 1;
  return preset({
    name: `PMR446 kanał ${channel}`,
    frequencyHz: 446_006_250 + index * 12_500,
    mode: 'FM',
    bandwidthHz: 12_500,
    category: 'safety',
    modulation: 'NFM',
    protocol: 'PMR446 analog',
    region: 'EU',
    description: 'Europejski kanał analogowego radia krótkiego zasięgu PMR446.',
    tags: ['walkie-talkie', '446', 'nfm'],
    capability: 'audio',
  });
});

const pkpPresets = Array.from({ length: 7 }, (_, index) => {
  const channel = index + 1;
  return preset({
    name: `PKP kanał R${channel}`,
    frequencyHz: 150_100_000 + index * 50_000,
    mode: 'FM',
    bandwidthHz: 12_500,
    category: 'rail',
    modulation: 'NFM',
    protocol: 'Analogowa radiołączność kolejowa',
    region: 'PL',
    description: 'Jeden z siedmiu krajowych kanałów analogowej sieci pociągowej 150 MHz. Użycie zależy od linii i lokalizacji.',
    tags: ['pkp', 'kolej', `r${channel}`, '150 mhz'],
    capability: 'audio',
    caution: true,
  });
});

const fmBroadcastPresets = [87.5, 90, 95, 100.2, 105, 107.9].map((mhz) => preset({
  name: mhz === 100.2 ? 'FM 100,2 MHz — szybki start' : `Pasmo FM — ${String(mhz).replace('.', ',')} MHz`,
  frequencyHz: mhz * 1_000_000,
  mode: 'WBFM',
  bandwidthHz: 180_000,
  category: 'broadcast',
  modulation: 'WFM stereo',
  protocol: 'FM Broadcast / RDS',
  region: 'EU',
  description: mhz === 100.2 ? 'Sprawdzony punkt startowy instalacji Dzwonnica SDR.' : 'Punkt orientacyjny europejskiego pasma radiofonii UKF 87,5–108 MHz.',
  tags: ['radio', 'ukf', 'wbfm', 'rds'],
  capability: 'audio',
}));

const wifi24Channels: Array<[number, number]> = [[1, 2412], [6, 2437], [11, 2462], [13, 2472]];
const wifi5Channels: Array<[number, number]> = [[36, 5180], [44, 5220], [100, 5500], [140, 5700]];
const wifiPresets = [...wifi24Channels, ...wifi5Channels].map(([channel, mhz]) => preset({
  name: `Wi‑Fi kanał ${channel}`,
  frequencyHz: mhz * 1_000_000,
  mode: 'WBFM',
  bandwidthHz: 250_000,
  category: 'wireless',
  modulation: 'OFDM',
  protocol: channel <= 13 ? 'IEEE 802.11 2,4 GHz' : 'IEEE 802.11 5 GHz',
  region: 'EU',
  description: 'Środek kanału Wi‑Fi. Odbiornik pokazuje tylko wąski wycinek sygnału o szerokości wielu MHz.',
  tags: ['wifi', 'wlan', `${channel}`],
  capability: 'spectrum',
}));

const fpvRaceband = [5658, 5695, 5732, 5769, 5806, 5843, 5880, 5917].map((mhz, index) => preset({
  name: `FPV Raceband R${index + 1}`,
  frequencyHz: mhz * 1_000_000,
  mode: 'WBFM',
  bandwidthHz: 250_000,
  category: 'wireless',
  modulation: 'Analog FM video',
  protocol: '5,8 GHz FPV',
  region: 'Global',
  description: 'Popularny kanał analogowego wideo FPV; widoczny jest fragment szerokiego sygnału wizyjnego.',
  tags: ['dron', 'fpv', 'raceband'],
  capability: 'spectrum',
}));

const fixedPresets: SignalPreset[] = [
  ...fmBroadcastPresets,

  preset({ name: 'HAM 4 m — środek pasma', frequencyHz: 70_250_000, mode: 'USB', bandwidthHz: 2_700, category: 'amateur', modulation: 'SSB', region: 'Region 1', description: 'Środek europejskiego pasma amatorskiego 70 MHz; dostępność zależy od kraju.', tags: ['4m', 'ssb'], capability: 'audio' }),
  preset({ name: 'HAM 4 m — FM calling', frequencyHz: 70_450_000, mode: 'FM', bandwidthHz: 12_500, category: 'amateur', modulation: 'NFM', region: 'Region 1', description: 'Popularna częstotliwość wywoławcza FM w paśmie 4 m.', tags: ['4m', 'calling'], capability: 'audio' }),
  preset({ name: '2 m — CW', frequencyHz: 144_050_000, mode: 'CW', bandwidthHz: 400, category: 'amateur', modulation: 'CW', region: 'Region 1', description: 'Okolice aktywności telegraficznej w paśmie 2 m.', tags: ['2m', 'morse'], capability: 'audio' }),
  preset({ name: '2 m — FT8', frequencyHz: 144_174_000, mode: 'USB', bandwidthHz: 3_000, category: 'digital', modulation: 'USB / 8‑FSK', protocol: 'FT8', region: 'Region 1', description: 'Popularna częstotliwość FT8 w paśmie 2 m. Włącz dekoder FT8 po dostrojeniu.', tags: ['ham', '2m', 'wsjt-x'], capability: 'audio' }),
  preset({ name: '2 m — wywołanie SSB', frequencyHz: 144_300_000, mode: 'USB', bandwidthHz: 2_700, category: 'amateur', modulation: 'USB', region: 'Region 1', description: 'Częstotliwość wywoławcza SSB w Regionie 1.', tags: ['ham', '2m', 'calling'], capability: 'audio' }),
  preset({ name: '2 m — MSK144', frequencyHz: 144_360_000, mode: 'USB', bandwidthHz: 3_000, category: 'digital', modulation: 'USB / MSK', protocol: 'MSK144', region: 'Region 1', description: 'Aktywność meteor scatter w trybie MSK144.', tags: ['ham', 'meteor scatter', 'wsjt-x'], capability: 'audio' }),
  preset({ name: 'APRS Polska / Europa', frequencyHz: 144_800_000, mode: 'FM', bandwidthHz: 12_500, category: 'digital', modulation: 'NFM / AFSK 1200', protocol: 'APRS', region: 'EU', description: 'Europejska częstotliwość APRS 1200 baud.', tags: ['ham', 'packet', 'ax.25', '2m'], capability: 'audio' }),
  preset({ name: '2 m — wywołanie FM', frequencyHz: 145_500_000, mode: 'FM', bandwidthHz: 12_500, category: 'amateur', modulation: 'NFM', region: 'Region 1', description: 'Simpleksowa częstotliwość wywoławcza FM w Regionie 1.', tags: ['ham', 'calling', '2m'], capability: 'audio' }),
  preset({ name: 'ISS — głos / SSTV', frequencyHz: 145_800_000, mode: 'FM', bandwidthHz: 25_000, category: 'satellite', modulation: 'FM', protocol: 'ISS voice / SSTV', region: 'Global', description: 'Downlink głosowy i okazjonalne transmisje SSTV z ISS; harmonogram aktywności zmienia się.', tags: ['iss', 'sstv', 'space'], capability: 'audio' }),
  preset({ name: 'ISS — APRS', frequencyHz: 145_825_000, mode: 'FM', bandwidthHz: 25_000, category: 'satellite', modulation: 'FM / AFSK 1200', protocol: 'ARISS APRS', region: 'Global', description: 'Packet/APRS z Międzynarodowej Stacji Kosmicznej, gdy system jest aktywny.', tags: ['iss', 'aprs', 'packet'], capability: 'audio' }),

  preset({ name: '70 cm — CW', frequencyHz: 432_050_000, mode: 'CW', bandwidthHz: 400, category: 'amateur', modulation: 'CW', region: 'Region 1', description: 'Okolice aktywności CW w paśmie 70 cm.', tags: ['70cm', 'morse'], capability: 'audio' }),
  preset({ name: '70 cm — FT8', frequencyHz: 432_174_000, mode: 'USB', bandwidthHz: 3_000, category: 'digital', modulation: 'USB / 8‑FSK', protocol: 'FT8', region: 'Region 1', description: 'Popularna częstotliwość FT8 w paśmie 70 cm.', tags: ['ham', '70cm', 'wsjt-x'], capability: 'audio' }),
  preset({ name: '70 cm — wywołanie SSB', frequencyHz: 432_200_000, mode: 'USB', bandwidthHz: 2_700, category: 'amateur', modulation: 'USB', region: 'Region 1', description: 'Częstotliwość wywoławcza SSB w paśmie 70 cm.', tags: ['ham', '70cm', 'calling'], capability: 'audio' }),
  preset({ name: '70 cm — wywołanie FM', frequencyHz: 433_500_000, mode: 'FM', bandwidthHz: 12_500, category: 'amateur', modulation: 'NFM', region: 'Region 1', description: 'Simpleksowa częstotliwość wywoławcza FM w Regionie 1.', tags: ['ham', '70cm', 'calling'], capability: 'audio' }),
  preset({ name: '70 cm — APRS', frequencyHz: 432_500_000, mode: 'FM', bandwidthHz: 12_500, category: 'digital', modulation: 'NFM / AFSK 1200', protocol: 'APRS', region: 'Region 1', description: 'Częstotliwość APRS przewidziana w planie pasma 70 cm.', tags: ['ham', '70cm', 'packet'], capability: 'audio' }),
  preset({ name: '23 cm — CW', frequencyHz: 1_296_050_000, mode: 'CW', bandwidthHz: 400, category: 'amateur', modulation: 'CW', region: 'Region 1', description: 'Okolice aktywności CW w paśmie 23 cm.', tags: ['23cm', 'morse'], capability: 'audio' }),
  preset({ name: '23 cm — FT8', frequencyHz: 1_296_174_000, mode: 'USB', bandwidthHz: 3_000, category: 'digital', modulation: 'USB / 8‑FSK', protocol: 'FT8', region: 'Region 1', description: 'Popularna częstotliwość FT8 w paśmie 23 cm.', tags: ['ham', '23cm'], capability: 'audio' }),
  preset({ name: '23 cm — wywołanie SSB', frequencyHz: 1_296_200_000, mode: 'USB', bandwidthHz: 2_700, category: 'amateur', modulation: 'USB', region: 'Region 1', description: 'Częstotliwość wywoławcza SSB w paśmie 23 cm.', tags: ['ham', '23cm', 'calling'], capability: 'audio' }),
  preset({ name: '13 cm — narrowband', frequencyHz: 2_320_200_000, mode: 'USB', bandwidthHz: 2_700, category: 'amateur', modulation: 'USB', region: 'Region 1', description: 'Środek aktywności wąskopasmowej pasma 13 cm.', tags: ['ham', '13cm', 'microwave'], capability: 'audio' }),
  preset({ name: '9 cm — narrowband', frequencyHz: 3_400_200_000, mode: 'USB', bandwidthHz: 2_700, category: 'amateur', modulation: 'USB', region: 'Region 1', description: 'Okolice aktywności wąskopasmowej 3,4 GHz; krajowe przydziały mogą się różnić.', tags: ['ham', '9cm', 'microwave'], capability: 'audio' }),
  preset({ name: '6 cm — narrowband', frequencyHz: 5_760_200_000, mode: 'USB', bandwidthHz: 2_700, category: 'amateur', modulation: 'USB', region: 'Region 1', description: 'Środek aktywności wąskopasmowej pasma 6 cm.', tags: ['ham', '6cm', 'microwave'], capability: 'audio' }),

  preset({ name: 'VOR / ILS NAV — początek pasma', frequencyHz: 108_000_000, mode: 'AM', bandwidthHz: 25_000, category: 'airband', modulation: 'AM', protocol: 'VOR / ILS localizer', region: 'Global', description: 'Dolna granica lotniczego pasma radionawigacyjnego 108–117,975 MHz.', tags: ['vor', 'ils', 'nav'], capability: 'audio' }),
  preset({ name: 'Airband — początek łączności', frequencyHz: 118_000_000, mode: 'AM', bandwidthHz: 12_500, category: 'airband', modulation: 'AM', protocol: 'VHF COM', region: 'Global', description: 'Dolna granica cywilnego pasma łączności lotniczej VHF.', tags: ['air', 'com', 'tower'], capability: 'audio' }),
  preset({ name: 'Airband 121,500 — emergency', frequencyHz: 121_500_000, mode: 'AM', bandwidthHz: 25_000, category: 'airband', modulation: 'AM', protocol: 'Aeronautical emergency', region: 'Global', description: 'Międzynarodowa lotnicza częstotliwość alarmowa. Tylko odbiór.', tags: ['guard', 'mayday', 'elt'], capability: 'audio', caution: true }),
  preset({ name: 'Airband 123,100 — SAR', frequencyHz: 123_100_000, mode: 'AM', bandwidthHz: 25_000, category: 'airband', modulation: 'AM', protocol: 'Search and Rescue', region: 'Global', description: 'Pomocnicza częstotliwość poszukiwawczo-ratownicza wobec 121,5 MHz.', tags: ['sar', 'rescue'], capability: 'audio', caution: true }),
  preset({ name: 'Air-to-air 123,450', frequencyHz: 123_450_000, mode: 'AM', bandwidthHz: 25_000, category: 'airband', modulation: 'AM', protocol: 'Air-to-air', region: 'Global', description: 'Łączność powietrze–powietrze przewidziana dla obszarów odległych i oceanicznych.', tags: ['airair', 'chat'], capability: 'audio' }),
  preset({ name: 'ACARS Europa 131,525', frequencyHz: 131_525_000, mode: 'AM', bandwidthHz: 25_000, category: 'digital', modulation: 'AM / MSK', protocol: 'ACARS', region: 'EU', description: 'Popularny europejski kanał transmisji danych ACARS.', tags: ['airband', 'aircraft', 'data'], capability: 'audio' }),
  preset({ name: 'ACARS 131,725', frequencyHz: 131_725_000, mode: 'AM', bandwidthHz: 25_000, category: 'digital', modulation: 'AM / MSK', protocol: 'ACARS', region: 'EU', description: 'Europejski kanał transmisji danych ACARS; aktywność zależy od operatora.', tags: ['airband', 'aircraft', 'data'], capability: 'audio' }),
  preset({ name: 'ACARS 131,825', frequencyHz: 131_825_000, mode: 'AM', bandwidthHz: 25_000, category: 'digital', modulation: 'AM / MSK', protocol: 'ACARS', region: 'EU', description: 'Europejski kanał transmisji danych ACARS; aktywność zależy od operatora.', tags: ['airband', 'aircraft', 'data'], capability: 'audio' }),
  preset({ name: 'VDL Mode 4 CSC', frequencyHz: 136_925_000, mode: 'AM', bandwidthHz: 25_000, category: 'digital', modulation: 'GFSK', protocol: 'VDL Mode 4', region: 'Global', description: 'Wspólny kanał sygnalizacyjny VDL Mode 4.', tags: ['airband', 'vdl4', 'data'], capability: 'audio' }),
  preset({ name: 'VDL Mode 2 CSC', frequencyHz: 136_975_000, mode: 'AM', bandwidthHz: 25_000, category: 'digital', modulation: 'D8PSK', protocol: 'VDL Mode 2', region: 'Global', description: 'Wspólny kanał sygnalizacyjny VDL Mode 2.', tags: ['airband', 'vdl2', 'data'], capability: 'audio' }),
  preset({ name: 'Military air emergency 243,000', frequencyHz: 243_000_000, mode: 'AM', bandwidthHz: 25_000, category: 'airband', modulation: 'AM', protocol: 'Military air emergency', region: 'Global', description: 'Lotnicza częstotliwość alarmowa 243 MHz. Tylko odbiór.', tags: ['guard', 'milair', 'emergency'], capability: 'audio', caution: true }),
  preset({ name: 'UAT ADS‑B 978', frequencyHz: 978_000_000, mode: 'WBFM', bandwidthHz: 250_000, category: 'airband', modulation: 'CPFSK', protocol: 'ADS‑B UAT', region: 'US', description: 'Amerykański kanał ADS‑B UAT. W Europie zwykle brak lokalnej aktywności; podgląd widma bez dekodera.', tags: ['adsb', 'uat', 'aircraft'], capability: 'spectrum' }),
  preset({ name: 'SSR / Mode S uplink 1030', frequencyHz: 1_030_000_000, mode: 'WBFM', bandwidthHz: 250_000, category: 'airband', modulation: 'Pulsed', protocol: 'SSR / Mode S interrogation', region: 'Global', description: 'Zapytania radarów wtórnych do transponderów. Podgląd impulsów w widmie.', tags: ['radar', 'mode-s', 'aircraft'], capability: 'spectrum' }),
  preset({ name: 'ADS‑B / Mode S 1090', frequencyHz: 1_090_000_000, mode: 'WBFM', bandwidthHz: 250_000, category: 'airband', modulation: 'PPM', protocol: 'ADS‑B Extended Squitter', region: 'Global', description: 'Bardzo aktywny lotniczy downlink ADS‑B/Mode S. Preset pokazuje widmo; aplikacja nie ma jeszcze dekodera 1090ES.', tags: ['adsb', 'mode-s', 'aircraft'], capability: 'spectrum' }),

  preset({ name: 'Marine kanał 6', frequencyHz: 156_300_000, mode: 'FM', bandwidthHz: 25_000, category: 'maritime', modulation: 'FM', protocol: 'VHF maritime', region: 'Global', description: 'Kanał bezpieczeństwa między statkami, zgodnie z planem morskim VHF.', tags: ['ship', 'vhf', 'ch6'], capability: 'audio', caution: true }),
  preset({ name: 'Marine kanał 70 — DSC', frequencyHz: 156_525_000, mode: 'FM', bandwidthHz: 25_000, category: 'digital', modulation: 'FSK', protocol: 'Digital Selective Calling', region: 'Global', description: 'Cyfrowe wywołanie selektywne i alarmowanie; kanał nie służy do rozmów głosowych.', tags: ['marine', 'dsc', 'distress'], capability: 'audio', caution: true }),
  preset({ name: 'Marine kanał 13', frequencyHz: 156_650_000, mode: 'FM', bandwidthHz: 25_000, category: 'maritime', modulation: 'FM', protocol: 'Bridge-to-bridge', region: 'Global', description: 'Kanał bezpieczeństwa nawigacji i łączności mostek–mostek.', tags: ['ship', 'vhf', 'ch13'], capability: 'audio', caution: true }),
  preset({ name: 'Marine kanał 16 — distress/calling', frequencyHz: 156_800_000, mode: 'FM', bandwidthHz: 25_000, category: 'maritime', modulation: 'FM', protocol: 'VHF distress and calling', region: 'Global', description: 'Międzynarodowy morski kanał alarmowy, bezpieczeństwa i wywoławczy. Tylko odbiór.', tags: ['ship', 'mayday', 'ch16'], capability: 'audio', caution: true }),
  preset({ name: 'AIS 1', frequencyHz: 161_975_000, mode: 'FM', bandwidthHz: 25_000, category: 'digital', modulation: 'GMSK', protocol: 'AIS', region: 'Global', description: 'Automatyczny System Identyfikacji statków, kanał AIS 1.', tags: ['marine', 'ship', 'ais'], capability: 'audio' }),
  preset({ name: 'AIS 2', frequencyHz: 162_025_000, mode: 'FM', bandwidthHz: 25_000, category: 'digital', modulation: 'GMSK', protocol: 'AIS', region: 'Global', description: 'Automatyczny System Identyfikacji statków, kanał AIS 2.', tags: ['marine', 'ship', 'ais'], capability: 'audio' }),

  preset({ name: 'GSM‑R uplink — środek', frequencyHz: 877_200_000, mode: 'WBFM', bandwidthHz: 250_000, category: 'rail', modulation: 'GMSK', protocol: 'GSM‑R', region: 'EU', description: 'Środek europejskiego pasma uplink GSM‑R 874,4–880 MHz. Podgląd widma.', tags: ['kolej', 'ertms', 'gsm'], capability: 'spectrum', caution: true }),
  preset({ name: 'GSM‑R downlink — środek', frequencyHz: 922_200_000, mode: 'WBFM', bandwidthHz: 250_000, category: 'rail', modulation: 'GMSK', protocol: 'GSM‑R', region: 'EU', description: 'Środek europejskiego pasma downlink GSM‑R 919,4–925 MHz. Podgląd widma.', tags: ['kolej', 'ertms', 'gsm'], capability: 'spectrum', caution: true }),
  preset({ name: 'FRMCS / RMR 1900 — środek', frequencyHz: 1_905_000_000, mode: 'WBFM', bandwidthHz: 250_000, category: 'rail', modulation: 'OFDM', protocol: 'FRMCS / Railway Mobile Radio', region: 'EU', description: 'Środek pasma 1900–1910 MHz przeznaczonego dla przyszłej kolejowej łączności szerokopasmowej.', tags: ['kolej', '5g', 'frmcs'], capability: 'spectrum', caution: true }),

  preset({ name: 'TETRA emergency uplink — środek', frequencyHz: 382_500_000, mode: 'WBFM', bandwidthHz: 25_000, category: 'safety', modulation: 'π/4‑DQPSK', protocol: 'TETRA', region: 'EU', description: 'Środek zharmonizowanego pasma terminal–stacja 380–385 MHz. Podgląd widma, bez dekodowania treści.', tags: ['tetra', 'public safety'], capability: 'spectrum', caution: true }),
  preset({ name: 'TETRA emergency downlink — środek', frequencyHz: 392_500_000, mode: 'WBFM', bandwidthHz: 25_000, category: 'safety', modulation: 'π/4‑DQPSK', protocol: 'TETRA', region: 'EU', description: 'Środek zharmonizowanego pasma stacja–terminal 390–395 MHz. Podgląd widma, bez dekodowania treści.', tags: ['tetra', 'public safety'], capability: 'spectrum', caution: true }),
  preset({ name: 'ELT / Cospas‑Sarsat 406,05', frequencyHz: 406_050_000, mode: 'WBFM', bandwidthHz: 100_000, category: 'safety', modulation: 'BPSK', protocol: '406 MHz distress beacon', region: 'Global', description: 'Pasmo radiopław ratunkowych. Sygnał alarmowy; tylko odbiór i żadnych prób nadawania.', tags: ['elt', 'epirb', 'plb', 'rescue'], capability: 'spectrum', caution: true }),
  ...pmr446Presets,

  preset({ name: 'Radiosondy 400,15 — dolna część', frequencyHz: 400_150_000, mode: 'FM', bandwidthHz: 25_000, category: 'digital', modulation: 'FSK', protocol: 'Meteorological radiosonde', region: 'EU', description: 'Początek popularnego zakresu radiosond meteorologicznych 400,15–406 MHz; dokładny kanał zależy od startu.', tags: ['weather', 'balloon', 'sonde'], capability: 'audio' }),
  preset({ name: 'Radiosondy 403 MHz', frequencyHz: 403_000_000, mode: 'FM', bandwidthHz: 25_000, category: 'digital', modulation: 'FSK', protocol: 'Meteorological radiosonde', region: 'EU', description: 'Często używany rejon pasma radiosond meteorologicznych.', tags: ['weather', 'balloon', 'sonde'], capability: 'audio' }),
  preset({ name: 'Radiosondy 405 MHz', frequencyHz: 405_000_000, mode: 'FM', bandwidthHz: 25_000, category: 'digital', modulation: 'FSK', protocol: 'Meteorological radiosonde', region: 'EU', description: 'Górna część popularnego zakresu radiosond meteorologicznych.', tags: ['weather', 'balloon', 'sonde'], capability: 'audio' }),
  preset({ name: 'DMR hotspot 438,800', frequencyHz: 438_800_000, mode: 'FM', bandwidthHz: 12_500, category: 'digital', modulation: '4FSK', protocol: 'DMR', region: 'PL', description: 'Popularna w Polsce częstotliwość simpleksowa/hotspotowa DMR; sprawdź lokalny plan.', tags: ['ham', 'dmr', 'hotspot'], capability: 'audio' }),

  preset({ name: 'NOAA APT 137,100', frequencyHz: 137_100_000, mode: 'FM', bandwidthHz: 40_000, category: 'satellite', modulation: 'FM', protocol: 'APT weather image', region: 'Global', description: 'Klasyczny kanał analogowych obrazów pogodowych. Aktywny satelita i kanał zmieniają się — sprawdź aktualny rozkład przelotów.', tags: ['noaa', 'weather', 'apt'], capability: 'audio' }),
  preset({ name: 'Weather satellite 137,620', frequencyHz: 137_620_000, mode: 'FM', bandwidthHz: 120_000, category: 'satellite', modulation: 'QPSK / FM', protocol: 'LRPT / weather satellite', region: 'Global', description: 'Popularny kanał satelitów pogodowych; rodzaj transmisji i aktywność zmieniają się.', tags: ['meteor', 'weather', 'lrpt'], capability: 'audio' }),
  preset({ name: 'NOAA APT 137,9125', frequencyHz: 137_912_500, mode: 'FM', bandwidthHz: 40_000, category: 'satellite', modulation: 'FM', protocol: 'APT weather image', region: 'Global', description: 'Klasyczny kanał analogowych obrazów pogodowych; aktywność zależy od satelity.', tags: ['noaa', 'weather', 'apt'], capability: 'audio' }),
  preset({ name: 'Amatorski downlink satelitarny 145,950', frequencyHz: 145_950_000, mode: 'FM', bandwidthHz: 25_000, category: 'satellite', modulation: 'FM / USB', protocol: 'Amateur satellite', region: 'Global', description: 'Popularny rejon downlinków satelitów amatorskich; konkretny tryb zależy od satelity.', tags: ['ham', 'cubesat', 'leo'], capability: 'audio' }),
  preset({ name: 'Amatorski downlink satelitarny 435,800', frequencyHz: 435_800_000, mode: 'FM', bandwidthHz: 25_000, category: 'satellite', modulation: 'FM / FSK', protocol: 'Amateur satellite', region: 'Global', description: 'Popularny rejon downlinków UHF satelitów amatorskich i CubeSatów.', tags: ['ham', 'cubesat', 'leo'], capability: 'audio' }),
  preset({ name: 'Inmarsat L‑band — środek', frequencyHz: 1_542_000_000, mode: 'WBFM', bandwidthHz: 250_000, category: 'satellite', modulation: 'PSK / TDMA', protocol: 'Inmarsat', region: 'Global', description: 'Środek części downlink pasma L Inmarsat. Podgląd widma, bez dekodowania usług.', tags: ['satcom', 'l-band'], capability: 'spectrum' }),
  preset({ name: 'Iridium — środek pasma', frequencyHz: 1_621_250_000, mode: 'WBFM', bandwidthHz: 250_000, category: 'satellite', modulation: 'DE‑QPSK', protocol: 'Iridium', region: 'Global', description: 'Środek pasma satelitarnego Iridium 1616–1626,5 MHz. Podgląd widma.', tags: ['satcom', 'l-band'], capability: 'spectrum' }),

  preset({ name: 'GPS L5 / Galileo E5a', frequencyHz: 1_176_450_000, mode: 'WBFM', bandwidthHz: 250_000, category: 'navigation', modulation: 'Spread spectrum', protocol: 'GNSS L5 / E5a', region: 'Global', description: 'Cywilny sygnał nawigacyjny GPS L5 i Galileo E5a. Zwykle poniżej poziomu szumu bez obróbki korelacyjnej.', tags: ['gps', 'galileo', 'gnss'], capability: 'spectrum' }),
  preset({ name: 'Galileo E5b / BeiDou B2', frequencyHz: 1_207_140_000, mode: 'WBFM', bandwidthHz: 250_000, category: 'navigation', modulation: 'Spread spectrum', protocol: 'GNSS E5b / B2', region: 'Global', description: 'Sygnały nawigacyjne Galileo/BeiDou; podgląd wąskiego fragmentu szerokiego widma.', tags: ['galileo', 'beidou', 'gnss'], capability: 'spectrum' }),
  preset({ name: 'GPS L2', frequencyHz: 1_227_600_000, mode: 'WBFM', bandwidthHz: 250_000, category: 'navigation', modulation: 'Spread spectrum', protocol: 'GPS L2', region: 'Global', description: 'Częstotliwość nośna GPS L2.', tags: ['gps', 'gnss'], capability: 'spectrum' }),
  preset({ name: 'Galileo E6', frequencyHz: 1_278_750_000, mode: 'WBFM', bandwidthHz: 250_000, category: 'navigation', modulation: 'Spread spectrum', protocol: 'Galileo E6', region: 'Global', description: 'Częstotliwość nośna europejskiego systemu Galileo E6.', tags: ['galileo', 'gnss'], capability: 'spectrum' }),
  preset({ name: 'BeiDou B1I', frequencyHz: 1_561_098_000, mode: 'WBFM', bandwidthHz: 250_000, category: 'navigation', modulation: 'Spread spectrum', protocol: 'BeiDou B1I', region: 'Global', description: 'Częstotliwość sygnału nawigacyjnego BeiDou B1I.', tags: ['beidou', 'gnss'], capability: 'spectrum' }),
  preset({ name: 'GPS L1 / Galileo E1', frequencyHz: 1_575_420_000, mode: 'WBFM', bandwidthHz: 250_000, category: 'navigation', modulation: 'Spread spectrum', protocol: 'GNSS L1 / E1', region: 'Global', description: 'Najbardziej znana nośna GNSS: GPS L1 oraz Galileo E1.', tags: ['gps', 'galileo', 'gnss'], capability: 'spectrum' }),
  preset({ name: 'GLONASS L1 — środek', frequencyHz: 1_602_000_000, mode: 'WBFM', bandwidthHz: 250_000, category: 'navigation', modulation: 'Spread spectrum / FDMA', protocol: 'GLONASS L1', region: 'Global', description: 'Środkowy rejon kanałów częstotliwościowych GLONASS L1.', tags: ['glonass', 'gnss'], capability: 'spectrum' }),

  preset({ name: 'ISM 433,920 — czujniki i piloty', frequencyHz: 433_920_000, mode: 'AM', bandwidthHz: 20_000, category: 'ism', modulation: 'OOK / ASK / FSK', protocol: 'SRD 433 MHz', region: 'EU', description: 'Bardzo aktywny kanał pilotów, stacji pogodowych, czujników i automatyki domowej.', tags: ['ook', 'sensor', 'remote', 'weather'], capability: 'audio' }),
  preset({ name: 'Meshtastic EU_433 LongFast', frequencyHz: 433_875_000, mode: 'WBFM', bandwidthHz: 250_000, category: 'ism', modulation: 'LoRa CSS', protocol: 'Meshtastic LongFast', region: 'EU', description: 'Domyślna częstotliwość Meshtastic EU_433 LongFast, szerokość 250 kHz.', tags: ['lora', 'mesh', 'iot'], capability: 'spectrum' }),
  preset({ name: 'LoRaWAN EU868 kanał 0', frequencyHz: 868_100_000, mode: 'WBFM', bandwidthHz: 125_000, category: 'ism', modulation: 'LoRa CSS', protocol: 'LoRaWAN', region: 'EU', description: 'Jeden z trzech podstawowych kanałów LoRaWAN EU868.', tags: ['lora', 'iot', 'chirp'], capability: 'spectrum' }),
  preset({ name: 'LoRaWAN EU868 kanał 1', frequencyHz: 868_300_000, mode: 'WBFM', bandwidthHz: 125_000, category: 'ism', modulation: 'LoRa CSS', protocol: 'LoRaWAN', region: 'EU', description: 'Jeden z trzech podstawowych kanałów LoRaWAN EU868.', tags: ['lora', 'iot', 'chirp'], capability: 'spectrum' }),
  preset({ name: 'LoRaWAN EU868 kanał 2', frequencyHz: 868_500_000, mode: 'WBFM', bandwidthHz: 125_000, category: 'ism', modulation: 'LoRa CSS', protocol: 'LoRaWAN', region: 'EU', description: 'Jeden z trzech podstawowych kanałów LoRaWAN EU868.', tags: ['lora', 'iot', 'chirp'], capability: 'spectrum' }),
  preset({ name: 'Meshtastic EU_868 LongFast', frequencyHz: 869_525_000, mode: 'WBFM', bandwidthHz: 250_000, category: 'ism', modulation: 'LoRa CSS', protocol: 'Meshtastic LongFast', region: 'EU', description: 'Domyślna częstotliwość Meshtastic EU_868 LongFast, szerokość 250 kHz.', tags: ['lora', 'mesh', 'iot'], capability: 'spectrum' }),
  preset({ name: 'Meshtastic 2,4 GHz — środek pasma', frequencyHz: 2_441_750_000, mode: 'WBFM', bandwidthHz: 250_000, category: 'ism', modulation: 'LoRa CSS', protocol: 'Meshtastic LORA_24', region: 'Global', description: 'Środek obsługiwanego przez Meshtastic zakresu 2400–2483,5 MHz; kanał zależy od konfiguracji.', tags: ['lora', 'mesh', 'iot'], capability: 'spectrum' }),

  preset({ name: 'Bluetooth — kanał reklamowy 37', frequencyHz: 2_402_000_000, mode: 'WBFM', bandwidthHz: 250_000, category: 'wireless', modulation: 'GFSK', protocol: 'Bluetooth LE', region: 'Global', description: 'Dolny kanał reklamowy BLE. Widoczny jest fragment impulsowej transmisji 2 MHz.', tags: ['ble', 'beacon', 'iot'], capability: 'spectrum' }),
  preset({ name: 'Bluetooth — kanał reklamowy 38', frequencyHz: 2_426_000_000, mode: 'WBFM', bandwidthHz: 250_000, category: 'wireless', modulation: 'GFSK', protocol: 'Bluetooth LE', region: 'Global', description: 'Środkowy kanał reklamowy BLE.', tags: ['ble', 'beacon', 'iot'], capability: 'spectrum' }),
  preset({ name: 'Bluetooth — kanał reklamowy 39', frequencyHz: 2_480_000_000, mode: 'WBFM', bandwidthHz: 250_000, category: 'wireless', modulation: 'GFSK', protocol: 'Bluetooth LE', region: 'Global', description: 'Górny kanał reklamowy BLE.', tags: ['ble', 'beacon', 'iot'], capability: 'spectrum' }),
  preset({ name: 'DECT Europa — środek', frequencyHz: 1_890_000_000, mode: 'WBFM', bandwidthHz: 250_000, category: 'wireless', modulation: 'GFSK / TDMA', protocol: 'DECT', region: 'EU', description: 'Środek europejskiego pasma telefonii bezprzewodowej DECT 1880–1900 MHz.', tags: ['cordless', 'phone'], capability: 'spectrum' }),
  ...wifiPresets,
  ...fpvRaceband,

  preset({ name: 'LTE B20 downlink — środek', frequencyHz: 806_000_000, mode: 'WBFM', bandwidthHz: 250_000, category: 'wireless', modulation: 'OFDM', protocol: 'LTE band 20', region: 'EU', description: 'Środek pasma downlink LTE 800. Podgląd niewielkiego wycinka kanału komórkowego.', tags: ['4g', 'cellular', '800'], capability: 'spectrum' }),
  preset({ name: 'LTE B8 downlink — środek', frequencyHz: 942_500_000, mode: 'WBFM', bandwidthHz: 250_000, category: 'wireless', modulation: 'OFDM', protocol: 'LTE/GSM band 8', region: 'EU', description: 'Środek europejskiego pasma downlink 900 MHz.', tags: ['4g', 'gsm', 'cellular'], capability: 'spectrum' }),
  preset({ name: 'LTE B3 downlink — środek', frequencyHz: 1_842_500_000, mode: 'WBFM', bandwidthHz: 250_000, category: 'wireless', modulation: 'OFDM', protocol: 'LTE band 3', region: 'EU', description: 'Środek europejskiego pasma downlink LTE 1800.', tags: ['4g', 'cellular', '1800'], capability: 'spectrum' }),
  preset({ name: 'LTE B1 downlink — środek', frequencyHz: 2_140_000_000, mode: 'WBFM', bandwidthHz: 250_000, category: 'wireless', modulation: 'OFDM', protocol: 'LTE/UMTS band 1', region: 'EU', description: 'Środek europejskiego pasma downlink 2100 MHz.', tags: ['4g', '3g', 'cellular'], capability: 'spectrum' }),
  preset({ name: 'LTE B7 downlink — środek', frequencyHz: 2_655_000_000, mode: 'WBFM', bandwidthHz: 250_000, category: 'wireless', modulation: 'OFDM', protocol: 'LTE band 7', region: 'EU', description: 'Środek europejskiego pasma downlink LTE 2600.', tags: ['4g', 'cellular', '2600'], capability: 'spectrum' }),
  preset({ name: '5G n78 — środek', frequencyHz: 3_600_000_000, mode: 'WBFM', bandwidthHz: 250_000, category: 'wireless', modulation: 'OFDM', protocol: '5G NR n78', region: 'EU', description: 'Środek szerokiego pasma 5G 3,4–3,8 GHz; widoczny jest tylko wąski wycinek.', tags: ['5g', 'cellular', 'nr'], capability: 'spectrum' }),

  preset({ name: 'GRAVES radar — meteor scatter', frequencyHz: 143_050_000, mode: 'USB', bandwidthHz: 5_000, category: 'science', modulation: 'CW radar carrier', protocol: 'GRAVES bistatic radar', region: 'EU', description: 'Francuski radar kosmiczny używany przez obserwatorów do odbioru odbić od meteorów i satelitów.', tags: ['meteor', 'radar', 'space'], capability: 'audio' }),
  preset({ name: 'Linia wodoru 21 cm', frequencyHz: 1_420_405_752, mode: 'WBFM', bandwidthHz: 250_000, category: 'science', modulation: 'Naturalna emisja widmowa', protocol: 'HI spectral line', region: 'Global', description: 'Linia neutralnego wodoru 1420,405752 MHz. Wymaga anteny, LNA i długiej integracji.', tags: ['radio astronomy', 'hydrogen', '21cm'], capability: 'spectrum' }),
  preset({ name: 'Linia OH 1612 MHz', frequencyHz: 1_612_231_000, mode: 'WBFM', bandwidthHz: 250_000, category: 'science', modulation: 'Naturalna emisja widmowa', protocol: 'OH spectral line', region: 'Global', description: 'Jedna z linii widmowych rodnika hydroksylowego, interesująca dla radioastronomii.', tags: ['radio astronomy', 'oh', 'maser'], capability: 'spectrum' }),
  preset({ name: 'Linia OH 1665 MHz', frequencyHz: 1_665_402_000, mode: 'WBFM', bandwidthHz: 250_000, category: 'science', modulation: 'Naturalna emisja widmowa', protocol: 'OH spectral line', region: 'Global', description: 'Główna linia widmowa rodnika hydroksylowego.', tags: ['radio astronomy', 'oh', 'maser'], capability: 'spectrum' }),
  preset({ name: 'Linia OH 1667 MHz', frequencyHz: 1_667_359_000, mode: 'WBFM', bandwidthHz: 250_000, category: 'science', modulation: 'Naturalna emisja widmowa', protocol: 'OH spectral line', region: 'Global', description: 'Główna linia widmowa rodnika hydroksylowego.', tags: ['radio astronomy', 'oh', 'maser'], capability: 'spectrum' }),
  preset({ name: 'Linia OH 1720 MHz', frequencyHz: 1_720_530_000, mode: 'WBFM', bandwidthHz: 250_000, category: 'science', modulation: 'Naturalna emisja widmowa', protocol: 'OH spectral line', region: 'Global', description: 'Satelitarna linia widmowa rodnika hydroksylowego.', tags: ['radio astronomy', 'oh', 'maser'], capability: 'spectrum' }),
];

export const SIGNAL_PRESETS: SignalPreset[] = [
  ...fixedPresets,
  ...pkpPresets,
  ...dabPresets,
  ...dvbtPresets,
].filter((item) => item.frequencyHz >= PLUTO_MIN_HZ && item.frequencyHz <= PLUTO_MAX_HZ);

export function formatPresetFrequency(hz: number): string {
  if (hz >= 1_000_000_000) return `${(hz / 1_000_000_000).toFixed(6).replace(/0+$/, '').replace(/\.$/, '')} GHz`;
  return `${(hz / 1_000_000).toFixed(6).replace(/0+$/, '').replace(/\.$/, '')} MHz`;
}

export function formatPresetBandwidth(hz: number): string {
  return hz >= 1_000 ? `${Number((hz / 1_000).toFixed(1))} kHz` : `${hz} Hz`;
}
