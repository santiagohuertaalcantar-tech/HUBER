const TOKEN = "8861060345:AAHq-2nCxmq3J_pQ1OGRWGU_2k7PhbOTBuw";
const CHAT_ID = "8676890506";
const INTERVAL_MIN = 10;

const DEMAND = {
  norte:    [1,1,1,1,1,1,3,4,8,5,2,3,4,2,2,2,3,6,9,8,6,5,4,3],
  centro:   [1,1,1,1,1,1,2,3,7,4,3,4,6,4,3,3,4,5,7,6,5,4,3,2],
  sur:      [1,1,1,1,1,1,1,2,5,3,2,2,4,2,2,2,2,4,6,5,4,3,2,1],
  poniente: [1,1,1,1,1,1,2,3,6,4,2,3,5,3,2,2,3,5,7,6,5,4,3,2],
  oriente:  [1,1,1,1,1,1,1,2,4,3,2,2,3,2,1,1,2,3,5,4,3,2,2,1],
  itzimna:  [1,1,1,1,1,1,2,3,6,4,3,3,4,3,2,2,3,4,6,5,4,3,2,2],
};

function calcZones() {
  const h = new Date().getHours();
  const weekend = [5, 6].includes(new Date().getDay());
  const out = {};
  Object.keys(DEMAND).forEach(z => {
    let d = DEMAND[z][h] + (Math.random() - 0.5) * 1.5;
    if (weekend) d += 1;
    d = Math.max(1, Math.min(10, d));
    const surge = 1 + (d / 10) * 0.6;
    let score = d;
    if (surge > 1.35) score += 2;
    if (h >= 7 && h <= 9) score += 1;
    if (h >= 17 && h <= 20) score += 1.5;
    score = Math.min(10, score);
    out[z] = {
      score: +score.toFixed(1),
      surge: Math.round(surge * 100),
      drivers: Math.max(1, Math.floor(25 - d * 2)),
      good: score >= 6,
    };
  });
  return out;
}

async function sendTelegram(msg) {
  const url = `https://api.telegram.org/bot${TOKEN}/sendMessage`;
  await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: CHAT_ID, text: msg, parse_mode: "HTML" }),
  });
}

async function check() {
  const zones = calcZones();
  const hora = new Date().toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" });

  // Siempre manda resumen
  const lines = Object.entries(zones)
    .sort((a, b) => a[0] === "norte" ? -1 : b[0] === "norte" ? 1 : b[1].score - a[1].score)
    .map(([z, d]) => {
      const ico = d.good ? "🟢" : "🔴";
      const star = z === "norte" ? "⭐" : "  ";
      return `${star}${ico} <b>${z}</b>: ${d.score}/10 · surge ${d.surge}%`;
    }).join("\n");

  const msg = `🚗 <b>Mérida ${hora}</b>\n\n${lines}`;
  await sendTelegram(msg);

  // Alerta especial si norte está bueno
  if (zones.norte.good) {
    await sendTelegram(
      `🔥 <b>ZONA NORTE ACTIVA</b>\nScore: ${zones.norte.score}/10\nSurge: ${zones.norte.surge}%\nDrivers: ${zones.norte.drivers}`
    );
  }

  console.log(`[${hora}] Enviado. Norte: ${zones.norte.score}/10`);
}

console.log("Bot arrancado. Checando cada", INTERVAL_MIN, "min...");
check();
setInterval(check, INTERVAL_MIN * 60 * 1000);
