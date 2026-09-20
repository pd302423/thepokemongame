/** A curated sample of ten taxa from the Upper Siwalik (Pinjor Fm.) and
 *  Narmada Pleistocene records. Ages, formations and faunal associations
 *  are real to the precision shown; a shipping build would read occurrences
 *  from the Paleobiology Database and derive the tiers from them.
 *
 *  Silhouettes are tapered bones in a 200x140 frame, ground near y=126. */

export type Tier = "here" | "formation" | "world";

export interface Bone {
  a: [number, number];
  ra: number;
  b: [number, number];
  rb: number;
}

export interface Mark {
  d: string;
  w: number;
  fill?: boolean;
}

export interface Species {
  id: string;
  binomial: string;
  common: string;
  from: number;
  to: number;
  tier: Tier;
  mass: string;
  height: string;
  diet: string;
  formation: string;
  note: string;
  coats: string[];
  bones: Bone[];
  marks: Mark[];
}

const B = (ax: number, ay: number, ra: number, bx: number, by: number, rb: number): Bone => ({
  a: [ax, ay],
  ra,
  b: [bx, by],
  rb
});

export const TIER_LABEL: Record<Tier, string> = {
  here: "Found here",
  formation: "This formation",
  world: "This world"
};

export const TIER_BLURB: Record<Tier, string> = {
  here: "Confirmed occurrences within 50 km of the survey position.",
  formation: "Recorded from the same formation, elsewhere along the Siwalik front.",
  world: "Shared this climate and continent, but is not recorded at this site."
};

export const TIER_WEIGHT: Record<Tier, number> = { here: 5, formation: 3, world: 1 };

export const SPECIES: Species[] = [
  {
    id: "elephas-hysudricus",
    binomial: "Elephas hysudricus",
    common: "Siwalik elephant",
    from: 2600,
    to: 200,
    tier: "here",
    mass: "4.5 t",
    height: "3.1 m",
    diet: "Grazer",
    formation: "Pinjor Fm.",
    note: "The commonest large proboscidean in the Pinjor beds, and widely read as close to the ancestry of the living Asian elephant. Tall, narrow skull; high-crowned molars built for the coarse grass that spread across these floodplains as the monsoon weakened.",
    coats: ["#6B6257", "#5A5248", "#7A6E60"],
    bones: [
      B(70, 60, 30, 124, 56, 33), B(116, 40, 22, 136, 44, 20), B(142, 46, 23, 158, 50, 18),
      B(163, 60, 8, 172, 86, 5.5), B(172, 86, 5.5, 167, 108, 3.6), B(139, 44, 17, 130, 64, 15),
      B(146, 76, 11, 149, 124, 7.5), B(133, 78, 10, 131, 124, 7),
      B(85, 76, 12, 84, 124, 8), B(73, 78, 11, 69, 124, 7.5), B(66, 58, 5, 57, 84, 2.4)
    ],
    marks: [
      { d: "M162 70 C 176 80, 192 82, 196 68", w: 2.2 },
      { d: "M157 74 C 170 85, 184 87, 189 76", w: 1.8 },
      { d: "M149 48 m -1.6 0 a 1.6 1.6 0 1 0 3.2 0 a 1.6 1.6 0 1 0 -3.2 0", w: 1.6, fill: true }
    ]
  },
  {
    id: "stegodon-insignis",
    binomial: "Stegodon insignis",
    common: "Siwalik stegodon",
    from: 2580,
    to: 600,
    tier: "here",
    mass: "5.2 t",
    height: "3.4 m",
    diet: "Browser",
    formation: "Pinjor Fm.",
    note: "Not an elephant but a cousin, with low-crowned ridged molars suited to leaves and soft browse. Its tusks grew so close together that the trunk had to be carried to one side — a detail reconstructed from tusk sockets, not from any soft tissue.",
    coats: ["#6E6455", "#7D7161", "#5F574B"],
    bones: [
      B(68, 58, 31, 126, 54, 34), B(118, 38, 23, 138, 42, 21), B(144, 44, 24, 160, 48, 19),
      B(165, 58, 8.5, 175, 86, 6), B(175, 86, 6, 171, 110, 3.8), B(140, 42, 18, 131, 62, 16),
      B(148, 74, 12, 151, 124, 8), B(134, 76, 11, 132, 124, 7.5),
      B(84, 74, 13, 83, 124, 8.5), B(71, 76, 12, 67, 124, 8), B(64, 56, 5.5, 54, 82, 2.6)
    ],
    marks: [
      { d: "M164 66 C 182 72, 199 66, 203 50", w: 2.6 },
      { d: "M160 70 C 177 77, 193 72, 198 57", w: 2.1 },
      { d: "M151 46 m -1.7 0 a 1.7 1.7 0 1 0 3.4 0 a 1.7 1.7 0 1 0 -3.4 0", w: 1.7, fill: true }
    ]
  },
  {
    id: "sivatherium-giganteum",
    binomial: "Sivatherium giganteum",
    common: "Siwalik giant giraffid",
    from: 2580,
    to: 900,
    tier: "here",
    mass: "1.2 t",
    height: "2.2 m",
    diet: "Browser",
    formation: "Pinjor Fm.",
    note: "A short-necked giraffe built like an ox, carrying two pairs of ossicones — small over the eyes, broad and palmate behind. Named for Shiva, from the hills these beds are named for. Among the heaviest ruminants known.",
    coats: ["#8C6A3F", "#9A7A4C", "#7B5C36"],
    bones: [
      B(74, 70, 24, 120, 66, 26), B(112, 54, 20, 126, 50, 16), B(130, 48, 11, 144, 30, 9),
      B(147, 26, 11, 166, 24, 9),
      B(136, 82, 9, 139, 124, 6), B(124, 84, 8.5, 122, 124, 5.5),
      B(86, 82, 10, 86, 124, 6.5), B(75, 84, 9, 71, 124, 6), B(70, 68, 5, 60, 84, 2.2)
    ],
    marks: [
      { d: "M152 17 C 146 8, 137 7, 134 13", w: 2.4 },
      { d: "M164 16 C 170 7, 180 8, 182 16", w: 2.4 },
      { d: "M148 21 C 145 14, 140 12, 137 15", w: 1.5 },
      { d: "M159 24 m -1.5 0 a 1.5 1.5 0 1 0 3 0 a 1.5 1.5 0 1 0 -3 0", w: 1.5, fill: true }
    ]
  },
  {
    id: "hexaprotodon-sivalensis",
    binomial: "Hexaprotodon sivalensis",
    common: "Siwalik hippopotamus",
    from: 2580,
    to: 100,
    tier: "here",
    mass: "1.8 t",
    height: "1.4 m",
    diet: "Grazer",
    formation: "Pinjor Fm.",
    note: "Six incisors instead of four, and eye sockets set lower than a modern hippo's — a hippo that spent rather less of its day submerged. Its remains are common wherever the Siwalik rivers left channel sands, which is why it turns up under this terrace.",
    coats: ["#5E5A55", "#6B655D", "#524E49"],
    bones: [
      B(70, 84, 25, 128, 82, 27), B(134, 80, 23, 158, 82, 20),
      B(146, 98, 10, 148, 124, 8), B(132, 100, 9.5, 130, 124, 7.5),
      B(84, 98, 10, 84, 124, 8), B(71, 100, 9.5, 67, 124, 7.5), B(66, 82, 6, 55, 90, 2.6)
    ],
    marks: [
      { d: "M170 88 C 176 92, 176 98, 170 100", w: 1.8 },
      { d: "M152 74 m -1.5 0 a 1.5 1.5 0 1 0 3 0 a 1.5 1.5 0 1 0 -3 0", w: 1.5, fill: true },
      { d: "M162 96 L 165 102 M170 96 L 172 102", w: 1.5 }
    ]
  },
  {
    id: "megalochelys-atlas",
    binomial: "Megalochelys atlas",
    common: "Colossal tortoise",
    from: 2580,
    to: 1400,
    tier: "here",
    mass: "1 t",
    height: "1.8 m shell",
    diet: "Browser",
    formation: "Pinjor Fm.",
    note: "A shell approaching two metres — the largest land tortoise in the fossil record. It goes out of the Siwaliks in the early Pleistocene, at about the point the hills start shedding boulder beds and the rivers turn harsh.",
    coats: ["#6F6247", "#7E7053", "#5E5340"],
    bones: [
      B(72, 86, 30, 128, 86, 30), B(84, 66, 26, 118, 66, 26),
      B(134, 86, 13, 152, 80, 10), B(156, 76, 9, 168, 74, 7.5),
      B(120, 106, 10, 124, 124, 8), B(82, 106, 10, 78, 124, 8), B(100, 110, 9, 102, 124, 7)
    ],
    marks: [
      { d: "M78 74 C 100 58, 116 58, 134 74", w: 1.8 },
      { d: "M86 62 L 88 82 M100 58 L 100 80 M114 59 L 113 81", w: 1.4 },
      { d: "M164 70 m -1.4 0 a 1.4 1.4 0 1 0 2.8 0 a 1.4 1.4 0 1 0 -2.8 0", w: 1.4, fill: true }
    ]
  },
  {
    id: "equus-sivalensis",
    binomial: "Equus sivalensis",
    common: "Siwalik horse",
    from: 2580,
    to: 600,
    tier: "formation",
    mass: "380 kg",
    height: "1.5 m",
    diet: "Grazer",
    formation: "Pinjor Fm.",
    note: "The arrival of true horses in these beds is a dating tool in its own right — the 'Equus datum' marks the spread of open grassland across Asia. Where you find it, the forest had already thinned.",
    coats: ["#7C6349", "#8B7154", "#6A5540"],
    bones: [
      B(78, 70, 21, 124, 68, 23), B(122, 58, 18, 136, 48, 14), B(139, 44, 12, 156, 40, 10),
      B(140, 86, 8, 143, 124, 5.5), B(129, 88, 7.5, 127, 124, 5),
      B(88, 86, 9, 88, 124, 6), B(78, 88, 8, 74, 124, 5.5), B(74, 68, 5, 62, 86, 2.2)
    ],
    marks: [
      { d: "M136 40 C 132 30, 130 28, 132 26", w: 1.6 },
      { d: "M142 38 C 140 28, 139 26, 141 24", w: 1.6 },
      { d: "M150 38 m -1.4 0 a 1.4 1.4 0 1 0 2.8 0 a 1.4 1.4 0 1 0 -2.8 0", w: 1.4, fill: true },
      { d: "M124 54 C 132 44, 136 36, 138 30", w: 2.2 }
    ]
  },
  {
    id: "pachycrocuta-brevirostris",
    binomial: "Pachycrocuta brevirostris",
    common: "Giant short-faced hyena",
    from: 2580,
    to: 400,
    tier: "formation",
    mass: "110 kg",
    height: "1.0 m",
    diet: "Bone-crusher",
    formation: "Pinjor Fm.",
    note: "The largest hyena that ever lived, and almost certainly more scavenger than hunter — its jaws could open the long bones nothing else could reach. Wherever its coprolites survive, they are full of splintered bone.",
    coats: ["#7A6B58", "#665A4B", "#8A7A65"],
    bones: [
      B(76, 76, 20, 122, 70, 22), B(120, 62, 18, 138, 58, 15), B(141, 56, 13, 158, 58, 10),
      B(142, 88, 8, 145, 124, 5.5), B(131, 90, 8, 129, 124, 5.5),
      B(86, 90, 8.5, 86, 124, 6), B(76, 92, 8, 72, 124, 5.5), B(72, 76, 5, 60, 88, 2.2)
    ],
    marks: [
      { d: "M136 48 C 134 40, 136 36, 141 36", w: 1.8 },
      { d: "M146 47 C 145 39, 148 36, 152 38", w: 1.8 },
      { d: "M152 56 m -1.4 0 a 1.4 1.4 0 1 0 2.8 0 a 1.4 1.4 0 1 0 -2.8 0", w: 1.4, fill: true },
      { d: "M158 64 L 164 66 M156 68 L 162 70", w: 1.3 }
    ]
  },
  {
    id: "crocodylus-palaeindicus",
    binomial: "Crocodylus palaeindicus",
    common: "Siwalik crocodile",
    from: 2580,
    to: 300,
    tier: "formation",
    mass: "450 kg",
    height: "4.6 m long",
    diet: "Ambush predator",
    formation: "Pinjor Fm.",
    note: "A broad-snouted crocodile of the Siwalik channels, possibly on the line toward the living mugger. Its scutes turn up in the same sands as the hippo — the two shared a river that no longer exists.",
    coats: ["#5A5C46", "#4B4D3B", "#6A6C52"],
    bones: [
      B(58, 100, 15, 112, 98, 17), B(112, 98, 17, 150, 100, 13), B(152, 100, 12, 180, 102, 8),
      B(56, 100, 13, 34, 108, 6), B(34, 108, 6, 16, 116, 3),
      B(120, 112, 7, 126, 122, 5), B(70, 112, 7, 64, 122, 5),
      B(146, 112, 6, 152, 122, 4.5), B(94, 112, 6, 90, 122, 4.5)
    ],
    marks: [
      { d: "M158 94 m -1.4 0 a 1.4 1.4 0 1 0 2.8 0 a 1.4 1.4 0 1 0 -2.8 0", w: 1.4, fill: true },
      { d: "M164 104 L 168 108 M172 104 L 175 108 M156 106 L 159 110", w: 1.3 },
      { d: "M70 90 L 74 84 M86 88 L 90 82 M102 88 L 106 82 M118 89 L 122 83", w: 1.5 }
    ]
  },
  {
    id: "palaeoloxodon-namadicus",
    binomial: "Palaeoloxodon namadicus",
    common: "Narmada straight-tusked elephant",
    from: 800,
    to: 24,
    tier: "world",
    mass: "11 t",
    height: "4.5 m",
    diet: "Browser",
    formation: "Narmada Valley",
    note: "Known chiefly from the Narmada Valley, well south of here, and a contender for the largest land mammal ever to have lived — the size estimates rest on a handful of fragmentary limb bones, so treat them as a range, not a record.",
    coats: ["#6A6156", "#5B534A", "#786D5F"],
    bones: [
      B(66, 50, 33, 126, 46, 36), B(116, 28, 25, 138, 32, 23), B(144, 32, 26, 162, 36, 20),
      B(168, 48, 9, 178, 80, 6), B(178, 80, 6, 174, 106, 4), B(141, 32, 20, 131, 54, 18),
      B(150, 68, 13, 153, 124, 8.5), B(134, 70, 12, 132, 124, 8),
      B(82, 68, 14, 81, 124, 9), B(68, 70, 13, 63, 124, 8.5), B(62, 48, 6, 51, 78, 2.8)
    ],
    marks: [
      { d: "M166 58 C 184 64, 202 54, 205 34", w: 2.8 },
      { d: "M161 62 C 178 70, 195 62, 199 44", w: 2.2 },
      { d: "M154 32 m -1.7 0 a 1.7 1.7 0 1 0 3.4 0 a 1.7 1.7 0 1 0 -3.4 0", w: 1.7, fill: true }
    ]
  },
  {
    id: "bos-namadicus",
    binomial: "Bos namadicus",
    common: "Indian aurochs",
    from: 700,
    to: 12,
    tier: "world",
    mass: "900 kg",
    height: "1.8 m",
    diet: "Grazer",
    formation: "Narmada Valley",
    note: "The Indian aurochs, and the likely wild stock behind zebu cattle. It survived deep enough into the Holocene that the people who first herded its descendants would have known the wild animal.",
    coats: ["#4F473E", "#5E564A", "#6C6353"],
    bones: [
      B(78, 66, 24, 126, 64, 26), B(120, 52, 21, 138, 50, 17), B(142, 48, 14, 158, 50, 11),
      B(142, 86, 9, 145, 124, 6), B(130, 88, 8.5, 128, 124, 5.5),
      B(88, 86, 10, 88, 124, 6.5), B(77, 88, 9, 73, 124, 6), B(74, 64, 5, 62, 82, 2.2)
    ],
    marks: [
      { d: "M140 40 C 132 30, 120 30, 116 40", w: 2.4 },
      { d: "M150 40 C 158 30, 170 32, 172 42", w: 2.4 },
      { d: "M152 48 m -1.5 0 a 1.5 1.5 0 1 0 3 0 a 1.5 1.5 0 1 0 -3 0", w: 1.5, fill: true }
    ]
  }
];

export const SPECIES_BY_ID: Record<string, Species> = Object.fromEntries(SPECIES.map((s) => [s.id, s]));
