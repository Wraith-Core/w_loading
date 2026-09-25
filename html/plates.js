/* ════════════════════════════════════════════════════════════════════════════
   The survey plates behind the loading screen.

   Every plate is a real photograph with a named photographer, a source and a public-domain or
   CC0 licence (full list in CREDITS.md). All seven were cropped inside the print (no mount, no
   captions, no imprints) and graded with one recipe into a warm albumen monochrome
   (shadows #14110D, mids #6E6557, highlights #E4DCCB), 1920x1080 progressive JPG.

     id       the key of its caption in the locales: screen.plates.<id>.title / .credit
     title_*  the caption when a locale lacks the key; credit likewise
     focus    the subject ("x% y%"): background-position on screens that are not 16:9, and the
              point the slow drift zooms toward
     dirs     the layouts the plate may appear in. 'ltr' puts the wordmark bottom-left and the
              tip bottom-right; 'rtl' (Arabic) the other way round. A plate is left out of a
              layout where the wordmark would cover its subject.

   The order here is the playing order; Config.Plates (config.lua) can reorder or disable.
   ════════════════════════════════════════════════════════════════════════════ */
window.WL_PLATES = [
  {
    id: 'cape_horn',
    file: 'img/plates/cape_horn.jpg',
    title_en: 'Cape Horn near Celilo',
    title_ar: 'كيب هورن قرب سيليلو',
    credit: 'Carleton E. Watkins, 1867',
    source: 'https://www.metmuseum.org/art/collection/search/283222',
    licence: 'CC0 1.0 (The Metropolitan Museum of Art, Open Access)',
    focus: '62% 56%',
    dirs: ['ltr', 'rtl'],
  },
  {
    id: 'tetons',
    file: 'img/plates/tetons.jpg',
    title_en: 'The Tetons and the Snake River',
    title_ar: 'جبال تيتون ونهر سنيك',
    credit: 'Ansel Adams, 1942',
    source: 'https://catalog.archives.gov/id/519904',
    licence: 'Public domain (U.S. Government work, National Archives 79-AAG-1)',
    focus: '58% 30%',
    dirs: ['ltr', 'rtl'],
  },
  {
    id: 'sand_hills',
    file: 'img/plates/sand_hills.jpg',
    title_en: 'Desert Sand Hills near Sink of Carson, Nevada',
    title_ar: 'كثبان الرمل قرب مغيض كارسون، نيفادا',
    credit: 'Timothy H. O’Sullivan, 1867',
    source: 'https://commons.wikimedia.org/wiki/File:Timothy_H._O%27Sullivan_(American_-_Desert_Sand_Hills_near_Sink_of_Carson,_Nevada_-_Google_Art_Project.jpg',
    licence: 'Public domain (J. Paul Getty Museum, Open Content)',
    focus: '68% 46%',
    dirs: ['ltr', 'rtl'],
  },
  {
    id: 'hanging_rock',
    file: 'img/plates/hanging_rock.jpg',
    title_en: 'Hanging Rock, Foot of Echo Cañon',
    title_ar: 'الصخرة المعلّقة عند سفح وادي إيكو',
    credit: 'Andrew J. Russell, 1867–68',
    source: 'https://www.metmuseum.org/art/collection/search/265001',
    licence: 'CC0 1.0 (The Metropolitan Museum of Art, Open Access)',
    // the seated rider sits low on the right, just above the tip column: the drift zooms from
    // the bottom edge under him (so he rises, never sinks into the tip), and on a wide screen
    // the crop keeps the bottom of the print. In Arabic the wordmark would sit on him.
    focus: '81% 100%',
    dirs: ['ltr'],
  },
  {
    id: 'mirror_lake',
    file: 'img/plates/mirror_lake.jpg',
    title_en: 'Mirror Lake, Valley of the Yosemite',
    title_ar: 'بحيرة المرآة في وادي يوسميتي',
    credit: 'Eadweard Muybridge, 1872',
    source: 'https://www.metmuseum.org/art/collection/search/271123',
    licence: 'CC0 1.0 (The Metropolitan Museum of Art, Open Access)',
    focus: '50% 50%',
    dirs: ['ltr', 'rtl'],
  },
  {
    id: 'canyon_de_chelly',
    file: 'img/plates/canyon_de_chelly.jpg',
    title_en: 'Head of Cañyon de Chelle, Looking Down',
    title_ar: 'أعالي وادي دي شاي، نظرة إلى القاع',
    credit: 'Timothy H. O’Sullivan, 1873',
    source: 'https://www.metmuseum.org/art/collection/search/700114',
    licence: 'CC0 1.0 (The Metropolitan Museum of Art, Open Access)',
    focus: '52% 45%',
    dirs: ['ltr', 'rtl'],
  },
  {
    id: 'columbia',
    file: 'img/plates/columbia.jpg',
    title_en: 'View on the Columbia, Cascades',
    title_ar: 'على نهر كولومبيا عند الشلالات',
    credit: 'Carleton E. Watkins, 1867',
    source: 'https://www.metmuseum.org/art/collection/search/262612',
    licence: 'CC0 1.0 (The Metropolitan Museum of Art, Open Access)',
    focus: '55% 42%',
    dirs: ['ltr', 'rtl'],
  },
];
