/**
 * Adult Content Keywords Database
 * Categorized keywords for adult content detection with scoring weights
 */
const AdultKeywords = {
    // Sexual keywords - Score: +5 each
    sexual: new Set([
        "porn", "xxx", "sex", "nude", "naked", "nsfw", "adult", "18+", "21+",
        "explicit", "mature", "erotic", "sensual", "intimate", "seductive",
        "provocative", "risque", "racy", "steamy", "sultry", "kinky",
        "fetish", "bdsm", "bondage", "dominatrix", "escort", "webcam",
        "camgirl", "onlyfans", "patreon adult", "premium content",
        "uncensored", "uncut", "raw", "hardcore", "softcore",
        "lingerie", "bikini model", "topless", "bottomless", "striptease",
        "lap dance", "pole dance", "exotic dancer", "adult entertainment",
        "red light", "pleasure", "desire", "lust", "passion",
        // French terms
        "sexe", "nu", "nue", "adulte", "érotique", "charme",
        "coquin", "coquine", "sensuel", "sensuelle", "intime",
        // Common misspellings
        "p0rn", "s3x", "pr0n", "xxx", "xxxx"
    ]),

    // Porn brands and sites - Score: +10 each
    pornBrands: new Set([
        "pornhub", "xvideos", "xhamster", "redtube", "youporn", "tube8",
        "spankwire", "keezmovies", "extremetube", "mofosex", "pornmd",
        "xnxx", "beeg", "txxx", "porn.com", "eporner", "tnaflix",
        "empflix", "drtuber", "slutload", "fapdu", "pornerbros",
        "brazzers", "bangbros", "naughtyamerica", "realitykings",
        "mofos", "fakehub", "digitalplayground", "wickedpictures",
        "vivid", "hustler", "playboy", "penthouse", "manyvids",
        "clips4sale", "iwantclips", "modelhub", "chaturbate", "myfreecams",
        "cam4", "bongacams", "stripchat", "livejasmin", "flirt4free",
        "onlyfans", "fansly", "justforfans", "4based"
    ]),

    // Explicit actions - Score: +7 each
    explicitActions: new Set([
        "masturbate", "masturbation", "orgasm", "climax", "ejaculate",
        "penetrate", "penetration", "intercourse", "copulate", "fornicate",
        "fellatio", "cunnilingus", "oral sex", "anal sex", "vaginal sex",
        "threesome", "foursome", "orgy", "gangbang", "bukkake",
        "creampie", "facial", "cumshot", "blowjob", "handjob",
        "fingering", "fisting", "rimming", "pegging", "69",
        "doggystyle", "missionary", "cowgirl", "reverse cowgirl",
        "spoon", "standing", "bent over", "on top", "from behind",
        // French
        "masturbation", "pénétration", "fellation", "sodomie"
    ]),

    // Suspicious patterns - Score: +3 each
    suspiciousPatterns: new Set([
        "click here", "free trial", "no credit card", "100% free",
        "join now", "sign up free", "premium access", "vip access",
        "exclusive content", "members only", "private show", "live show",
        "hot singles", "meet singles", "hookup", "dating",
        "cam show", "live cam", "private cam", "watch now",
        "download now", "stream now", "full video", "hd video",
        "4k video", "premium video", "leaked", "scandal",
        // French
        "cliquez ici", "gratuit", "inscription gratuite", "contenu exclusif",
        "rencontre", "célibataires", "webcam", "vidéo complète"
    ]),

    // URL patterns to detect (regex patterns)
    urlPatterns: [
        /\/porn\//i,
        /\/xxx\//i,
        /\/adult\//i,
        /\/nsfw\//i,
        /\/sex\//i,
        /\/nude\//i,
        /\/18\+/i,
        /\/explicit\//i,
        /\/mature\//i,
        /\/erotic\//i,
        /porn/i,
        /xxx/i,
        /sex/i,
        /nude/i,
        /adult/i,
        /nsfw/i,
        /onlyfans/i,
        /chaturbate/i,
        /pornhub/i,
        /xvideos/i,
        /xhamster/i,
        /redtube/i
    ],

    // Suspicious image dimensions (common porn thumbnail sizes)
    suspiciousImageSizes: [
        { width: 320, height: 180 },  // 16:9 thumbnail
        { width: 640, height: 360 },  // 16:9 medium
        { width: 1280, height: 720 }, // 16:9 HD
        { width: 1920, height: 1080 }, // 16:9 Full HD
        { width: 300, height: 169 },  // Common thumbnail
        { width: 480, height: 270 },  // Common preview
    ],

    // Metadata keywords
    metaKeywords: new Set([
        "adult content", "mature content", "18+", "21+", "nsfw",
        "explicit content", "age restricted", "adults only",
        "parental advisory", "not safe for work"
    ])
};

// Export for use in other modules
if (typeof window !== "undefined") {
    window.AdultKeywords = AdultKeywords;
}
