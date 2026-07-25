export const SWING_STOCKS = [
  { id: "ROBO", name: "RoboTek A.Ş.", sector: "Teknoloji", beta: 2.2, tone: "text-blue-400" },
  { id: "BIO", name: "BioGrup", sector: "Sağlık", beta: 1.8, tone: "text-green-400" },
  { id: "AMDN", name: "Anadolu Maden", sector: "Emtia", beta: 0.8, tone: "text-orange-400" },
  { id: "KRYP", name: "KriptoKoin", sector: "Spekülatif", beta: 3.5, tone: "text-purple-400" },
  { id: "SLR", name: "Solarİst", sector: "Enerji", beta: 1.4, tone: "text-yellow-400" },
  { id: "MEGA", name: "Megaİnşaat", sector: "Gayrimenkul", beta: 0.9, tone: "text-red-400" },
  { id: "BNK", name: "BankaTürk", sector: "Finans", beta: 1.1, tone: "text-indigo-400" },
  { id: "AGRI", name: "AgriTarım", sector: "Gıda", beta: 1.0, tone: "text-lime-400" },
  { id: "UZG", name: "UzayYolu Gıda", sector: "Perakende", beta: 0.5, tone: "text-teal-400" },
  { id: "AERO", name: "AeroSavunma", sector: "Savunma", beta: 1.5, tone: "text-slate-400" }
];

export function getRandomSwingStock(currentYear) {
  const stock = SWING_STOCKS[Math.floor(Math.random() * SWING_STOCKS.length)];
  // Rastgele bir başlangıç fiyatı (100 ile 500 arası)
  const basePrice = Math.floor(Math.random() * 400) + 100;
  
  return {
    ...stock,
    instanceId: `${stock.id}_${currentYear}_${Date.now()}`,
    basePrice,
    year: currentYear
  };
}
