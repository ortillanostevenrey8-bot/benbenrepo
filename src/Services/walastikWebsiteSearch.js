const sources = {
  home: "https://walastik.bfdenterprises.com/",
  about: "https://walastik.bfdenterprises.com/about",
  branches: "https://walastik.bfdenterprises.com/branches",
  troubleshooting: "https://walastik.bfdenterprises.com/troubleshoot",
};

const websiteEntries = [
  {
    title: "Company overview",
    keywords: ["company", "about", "walastik", "isp", "internet service provider", "fiber", "wireless", "broadband", "residential", "commercial", "philippines"],
    details:
      "Walastik Internet describes itself as a Philippine Internet Service Provider registered as a Value-Added Service Provider under the National Telecommunications Commission. Its About page says it provides fiber and wireless broadband for residential and commercial clients and is working to expand coverage.",
    sourceUrls: [sources.about],
  },
  {
    title: "Founder and leadership",
    keywords: ["founder", "founders", "owner", "owns", "ownership", "ceo", "chief executive", "bernard", "domingo", "leadership"],
    details:
      "The official About page identifies Mr. Bernard Follosco Domingo as the Founder and Chief Executive Officer of BF Domingo Enterprises and BFD Corporation. It does not explicitly identify the owner of Walastik Internet, so ownership of the ISP cannot be confirmed from that page.",
    sourceUrls: [sources.about],
  },
  {
    title: "Customer support contact",
    keywords: ["contact", "support", "customer service", "email", "phone", "telephone", "call", "help"],
    details:
      "The official website lists support@bfdenterprises.com and publishes customer-service phone lines on its home page. Check the home page for the current phone numbers.",
    sourceUrls: [sources.home],
  },
  {
    title: "Service areas and branches",
    keywords: ["coverage", "available", "availability", "service area", "branch", "branches", "location", "locations", "address", "areas", "camarin", "maligaya", "tala", "batia", "clemente", "malaria", "gaya-gaya", "muzon", "sapang palay", "igay", "norhomes", "pandi", "san mateo", "payatas", "pleasant", "minuyan", "novaliches"],
    details:
      "The official site has a branch directory listing locations including Tala, Camarin, Maligaya, Batia, Clemente, Malaria, Gaya-Gaya, Muzon, Sapang Palay, Igay-Kaypian, Norhomes, Pandi, San Mateo, Payatas, Pleasant, Minuyan, and Novaliches. A listed branch does not guarantee service at a particular address; confirm availability with customer support.",
    sourceUrls: [sources.branches, sources.home],
  },
  {
    title: "Wi-Fi name or password guides",
    keywords: ["wifi", "wi-fi", "wireless", "router", "modem", "name", "password", "zte", "huawei", "skyworth", "xpon", "change"],
    details:
      "The official troubleshooting page lists Wi-Fi name/password guides for ZTE Router Versions 1 and 2, Huawei Router 5v5, and Skyworth modems, plus a Wi-Fi settings guide for XPON modems. Open the page to follow the instructions for your modem model.",
    sourceUrls: [sources.troubleshooting],
  },
  {
    title: "Internet speed test guide",
    keywords: ["speed", "slow", "slowly", "speedtest", "test", "internet", "connection", "connection speed"],
    details:
      "The official troubleshooting page includes a guide for checking internet speed with Speedtest.net. Open the page for the guide.",
    sourceUrls: [sources.troubleshooting],
  },
  {
    title: "Cignal Play activation guide",
    keywords: ["cignal", "play", "activation", "activate", "account", "tv"],
    details:
      "The official troubleshooting page lists a guide for manually activating a Cignal Play account. Open the page for the steps.",
    sourceUrls: [sources.troubleshooting],
  },
];

const stopWords = new Set([
  "a", "an", "and", "are", "as", "at", "be", "can", "do", "does", "for",
  "from", "how", "i", "in", "is", "it", "me", "of", "on", "or", "please",
  "internet", "walastik", "company", "website", "information", "tell",
  "the", "their", "them", "there", "this", "to", "what", "when",
  "where", "which", "who", "with", "you", "your",
]);

const normalizeWord = (word) => {
  if (["owner", "owners", "owns", "ownership", "owned", "ceo", "runs", "boss"].includes(word)) {
    return "founder";
  }
  if (["contact", "email", "phone", "telephone", "call", "help"].includes(word)) {
    return "support";
  }
  if (["available", "availability", "location", "locations", "area", "areas"].includes(word)) {
    return "coverage";
  }
  if (["modems", "routers"].includes(word)) {
    return "modem";
  }
  if (["plans", "prices", "pricing", "rates", "packages", "fees"].includes(word)) {
    return "plan";
  }
  return word;
};

const getKeywords = (value) =>
  String(value || "")
    .toLowerCase()
    .match(/[a-z0-9]+(?:-[a-z0-9]+)*/g)
    ?.map(normalizeWord)
    .filter((word) => word.length > 1 && !stopWords.has(word)) || [];

export const searchWalastikWebsite = (question) => {
  const queryKeywords = [...new Set(getKeywords(question))];
  if (queryKeywords.length === 0) {
    return /\b(walastik|company|isp)\b/i.test(question)
      ? [websiteEntries[0]]
      : [];
  }

  return websiteEntries
    .map((entry) => {
      const entryKeywords = new Set(getKeywords(entry.keywords.join(" ")));
      const matchedKeywords = queryKeywords.filter((word) => entryKeywords.has(word));
      return { ...entry, score: matchedKeywords.length };
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map(({ score, ...entry }) => entry);
};
