export type MemeTemplateId =
  | "disappointed-guy"
  | "distracted-click"
  | "expanding-brain"
  | "two-buttons"
  | "change-my-mind"
  | "boardroom-pitch"
  | "founder-panic"
  | "brainrot-chart"
  | "guru-scream"
  | "ai-slop"
  | "low-cpm"
  | "doomscroll-phone"
  | "newsletter-lie"
  | "adsense-prayer";

export type MemeTemplate = {
  id: MemeTemplateId;
  name: string;
  description: string;
};

export const MEME_TEMPLATES: MemeTemplate[] = [
  {
    id: "disappointed-guy",
    name: "Disappointed Guy-ish",
    description: "Excited then let down"
  },
  {
    id: "distracted-click",
    name: "Distracted Click",
    description: "Ignoring the sensible option"
  },
  {
    id: "expanding-brain",
    name: "Expanding Brain",
    description: "Escalating bad ideas"
  },
  {
    id: "two-buttons",
    name: "Two Buttons",
    description: "Impossible choice panic"
  },
  {
    id: "change-my-mind",
    name: "Change My Mind",
    description: "Hot take at the table"
  },
  {
    id: "boardroom-pitch",
    name: "Boardroom Pitch",
    description: "The obvious answer loses"
  },
  {
    id: "founder-panic",
    name: "Founder Panic",
    description: "Chart betrayal energy"
  },
  {
    id: "brainrot-chart",
    name: "Brainrot Chart",
    description: "Numbers that should not go up"
  },
  {
    id: "guru-scream",
    name: "Guru Scream",
    description: "Course bro intensity"
  },
  {
    id: "ai-slop",
    name: "AI Slop Machine",
    description: "Automation gone feral"
  },
  {
    id: "low-cpm",
    name: "Low CPM Goblin",
    description: "AdSense despair"
  },
  {
    id: "doomscroll-phone",
    name: "Doomscroll Phone",
    description: "Feed forever"
  },
  {
    id: "newsletter-lie",
    name: "Newsletter Lie",
    description: "Fake open rate propaganda"
  },
  {
    id: "adsense-prayer",
    name: "AdSense Prayer",
    description: "Please RPM gods"
  }
];

export const CANVAS_SIZE = 1080;

export function drawMemeTemplate(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  templateId: MemeTemplateId
) {
  switch (templateId) {
    case "disappointed-guy":
      drawDisappointedGuy(ctx, width, height);
      break;
    case "distracted-click":
      drawDistractedClick(ctx, width, height);
      break;
    case "expanding-brain":
      drawExpandingBrain(ctx, width, height);
      break;
    case "two-buttons":
      drawTwoButtons(ctx, width, height);
      break;
    case "change-my-mind":
      drawChangeMyMind(ctx, width, height);
      break;
    case "boardroom-pitch":
      drawBoardroomPitch(ctx, width, height);
      break;
    case "founder-panic":
      drawFounderPanic(ctx, width, height);
      break;
    case "brainrot-chart":
      drawBrainrotChart(ctx, width, height);
      break;
    case "guru-scream":
      drawGuruScream(ctx, width, height);
      break;
    case "ai-slop":
      drawAiSlop(ctx, width, height);
      break;
    case "low-cpm":
      drawLowCpm(ctx, width, height);
      break;
    case "doomscroll-phone":
      drawDoomscrollPhone(ctx, width, height);
      break;
    case "newsletter-lie":
      drawNewsletterLie(ctx, width, height);
      break;
    case "adsense-prayer":
      drawAdsensePrayer(ctx, width, height);
      break;
  }
}

function drawSimpleFace(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  mood: "happy" | "sad" | "panic" | "sideEye",
  color = "#f8d7b0"
) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#111827";
  ctx.beginPath();
  ctx.arc(x - radius * 0.35, y - radius * 0.18, radius * 0.08, 0, Math.PI * 2);
  ctx.arc(x + radius * 0.35, y - radius * 0.18, radius * 0.08, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "#111827";
  ctx.lineWidth = Math.max(5, radius * 0.08);
  ctx.beginPath();
  if (mood === "happy") {
    ctx.arc(x, y + radius * 0.04, radius * 0.42, 0.15, Math.PI - 0.15);
  } else if (mood === "sad") {
    ctx.arc(x, y + radius * 0.52, radius * 0.4, Math.PI + 0.15, Math.PI * 2 - 0.15);
  } else if (mood === "panic") {
    ctx.ellipse(x, y + radius * 0.28, radius * 0.22, radius * 0.34, 0, 0, Math.PI * 2);
  } else {
    ctx.moveTo(x - radius * 0.35, y + radius * 0.28);
    ctx.lineTo(x + radius * 0.35, y + radius * 0.2);
  }
  ctx.stroke();
}

function drawDisappointedGuy(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
) {
  ctx.fillStyle = "#e5e7eb";
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(40, 150, width / 2 - 60, height - 300);
  ctx.fillRect(width / 2 + 20, 150, width / 2 - 60, height - 300);
  ctx.fillStyle = "#111827";
  ctx.fillRect(width / 2 - 8, 120, 16, height - 240);

  ctx.fillStyle = "#bfdbfe";
  ctx.fillRect(130, 260, 300, 130);
  ctx.fillStyle = "#dbeafe";
  ctx.fillRect(width / 2 + 110, 260, 300, 130);
  drawSimpleFace(ctx, 280, 610, 105, "happy");
  drawSimpleFace(ctx, width / 2 + 260, 610, 105, "sad");

  ctx.fillStyle = "#111827";
  ctx.font = "bold 54px Arial, Helvetica, sans-serif";
  ctx.fillText("EXPECTATION", 110, 245);
  ctx.fillText("REALITY", width / 2 + 145, 245);
}

function drawDistractedClick(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
) {
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, "#fef3c7");
  gradient.addColorStop(1, "#60a5fa");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = "#111827";
  ctx.fillRect(0, 760, width, 320);
  ctx.fillStyle = "#f9fafb";
  ctx.fillRect(90, 250, 280, 150);
  ctx.fillRect(710, 250, 280, 150);

  drawSimpleFace(ctx, 500, 630, 90, "sideEye");
  drawSimpleFace(ctx, 225, 530, 80, "sad", "#f4c7ab");
  drawSimpleFace(ctx, 850, 530, 80, "happy", "#ffd6a5");

  ctx.strokeStyle = "#ef4444";
  ctx.lineWidth = 12;
  ctx.beginPath();
  ctx.moveTo(540, 580);
  ctx.quadraticCurveTo(680, 480, 800, 500);
  ctx.stroke();

  ctx.fillStyle = "#111827";
  ctx.font = "bold 44px Arial, Helvetica, sans-serif";
  ctx.fillText("GOOD IDEA", 112, 340);
  ctx.fillText("BAD CLICK", 735, 340);
}

function drawExpandingBrain(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
) {
  ctx.fillStyle = "#020617";
  ctx.fillRect(0, 0, width, height);

  const colors = ["#334155", "#2563eb", "#a855f7", "#facc15"];
  for (let index = 0; index < 4; index += 1) {
    const y = 80 + index * 230;
    ctx.fillStyle = index % 2 === 0 ? "#f8fafc" : "#e0f2fe";
    ctx.fillRect(70, y, 520, 180);
    ctx.fillStyle = colors[index];
    ctx.beginPath();
    ctx.arc(810, y + 90, 80 + index * 18, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.75)";
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.arc(810, y + 90, 105 + index * 25, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.fillStyle = "#111827";
  ctx.font = "bold 46px Arial, Helvetica, sans-serif";
  ctx.fillText("POST ONCE", 120, 170);
  ctx.fillText("SCHEDULE THREADS", 120, 400);
  ctx.fillText("MAKE A TOOL", 120, 630);
  ctx.fillText("CALL IT MEDIA", 120, 860);
}

function drawTwoButtons(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
) {
  ctx.fillStyle = "#1f2937";
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = "#f3f4f6";
  ctx.fillRect(120, 170, 840, 420);

  ctx.fillStyle = "#ef4444";
  ctx.beginPath();
  ctx.arc(350, 340, 105, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#3b82f6";
  ctx.beginPath();
  ctx.arc(730, 340, 105, 0, Math.PI * 2);
  ctx.fill();

  drawSimpleFace(ctx, 540, 790, 105, "panic", "#f8d7b0");
  ctx.strokeStyle = "#f8d7b0";
  ctx.lineWidth = 34;
  ctx.beginPath();
  ctx.moveTo(490, 700);
  ctx.lineTo(380, 500);
  ctx.moveTo(590, 700);
  ctx.lineTo(710, 500);
  ctx.stroke();

  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 40px Arial, Helvetica, sans-serif";
  ctx.fillText("SHIP", 300, 355);
  ctx.fillText("TWEAK", 670, 355);
}

function drawChangeMyMind(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
) {
  ctx.fillStyle = "#93c5fd";
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = "#14532d";
  ctx.fillRect(0, 720, width, 360);
  ctx.fillStyle = "#92400e";
  ctx.fillRect(170, 570, 740, 120);
  ctx.fillStyle = "#f8fafc";
  ctx.fillRect(210, 360, 660, 240);
  ctx.strokeStyle = "#111827";
  ctx.lineWidth = 8;
  ctx.strokeRect(210, 360, 660, 240);

  drawSimpleFace(ctx, 220, 790, 88, "sideEye");
  ctx.fillStyle = "#111827";
  ctx.font = "bold 46px Arial, Helvetica, sans-serif";
  ctx.fillText("HOT TAKE", 380, 460);
  ctx.fillText("CHANGE MY MIND", 300, 540);
}

function drawBoardroomPitch(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
) {
  ctx.fillStyle = "#e0f2fe";
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = "#7c2d12";
  ctx.fillRect(90, 600, 900, 190);
  ctx.fillStyle = "#451a03";
  ctx.fillRect(160, 770, 70, 260);
  ctx.fillRect(850, 770, 70, 260);

  const seats = [
    { x: 230, y: 520, mood: "happy" as const },
    { x: 420, y: 500, mood: "sideEye" as const },
    { x: 650, y: 500, mood: "panic" as const },
    { x: 850, y: 520, mood: "sad" as const }
  ];

  seats.forEach((seat) => {
    drawSimpleFace(ctx, seat.x, seat.y, 72, seat.mood);
    ctx.fillStyle = "#1f2937";
    ctx.fillRect(seat.x - 55, seat.y + 70, 110, 110);
  });

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(290, 190, 500, 190);
  ctx.strokeStyle = "#111827";
  ctx.lineWidth = 8;
  ctx.strokeRect(290, 190, 500, 190);
  ctx.fillStyle = "#111827";
  ctx.font = "bold 48px Arial, Helvetica, sans-serif";
  ctx.fillText("OBVIOUS", 430, 275);
  ctx.fillText("ANSWER", 435, 340);
}

function drawFounderPanic(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
) {
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, "#7f1d1d");
  gradient.addColorStop(1, "#111827");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  ctx.strokeStyle = "#fca5a5";
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.moveTo(120, height - 180);
  ctx.lineTo(280, height - 420);
  ctx.lineTo(460, height - 300);
  ctx.lineTo(620, height - 760);
  ctx.lineTo(900, height - 220);
  ctx.stroke();

  ctx.fillStyle = "rgba(255,255,255,0.15)";
  ctx.fillRect(80, 120, width - 160, 140);
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 56px Arial, Helvetica, sans-serif";
  ctx.fillText("RUNWAY", 120, 190);
  ctx.fillText("DOWN BAD", 120, 250);
}

function drawBrainrotChart(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
) {
  ctx.fillStyle = "#0f172a";
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = "#22c55e";
  for (let index = 0; index < 8; index += 1) {
    const barHeight = 80 + index * 55;
    ctx.fillRect(140 + index * 90, height - barHeight - 120, 60, barHeight);
  }

  ctx.strokeStyle = "#facc15";
  ctx.lineWidth = 10;
  ctx.beginPath();
  ctx.moveTo(120, height - 220);
  ctx.quadraticCurveTo(420, height - 700, 760, height - 180);
  ctx.quadraticCurveTo(900, height - 120, 980, height - 80);
  ctx.stroke();

  ctx.fillStyle = "#facc15";
  ctx.font = "bold 72px Arial, Helvetica, sans-serif";
  ctx.fillText("CPM", 860, height - 760);
}

function drawGuruScream(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
) {
  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, "#f59e0b");
  gradient.addColorStop(1, "#7c2d12");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = "#111827";
  ctx.beginPath();
  ctx.ellipse(width / 2, height / 2 + 40, 220, 280, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(width / 2 - 70, height / 2 - 40, 28, 0, Math.PI * 2);
  ctx.arc(width / 2 + 70, height / 2 - 40, 28, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#ef4444";
  ctx.fillRect(width / 2 - 90, height / 2 + 20, 180, 24);

  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 64px Arial, Helvetica, sans-serif";
  ctx.fillText("$997", width / 2 - 110, height - 120);
  ctx.fillText("COURSE", width / 2 - 130, height - 50);
}

function drawAiSlop(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
) {
  ctx.fillStyle = "#1e293b";
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = "#38bdf8";
  ctx.fillRect(120, 180, width - 240, height - 360);

  ctx.fillStyle = "#0f172a";
  ctx.fillRect(220, 280, 180, 120);
  ctx.fillRect(680, 280, 180, 120);

  ctx.fillStyle = "#22d3ee";
  for (let row = 0; row < 4; row += 1) {
    for (let col = 0; col < 6; col += 1) {
      if ((row + col) % 2 === 0) {
        ctx.fillRect(260 + col * 70, 430 + row * 50, 50, 30);
      }
    }
  }

  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 58px Arial, Helvetica, sans-serif";
  ctx.fillText("AI SLOP", 420, 160);
  ctx.fillText("FACTORY", 390, 230);
}

function drawLowCpm(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
) {
  ctx.fillStyle = "#14532d";
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = "#86efac";
  ctx.beginPath();
  ctx.arc(width / 2, height / 2, 180, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#052e16";
  ctx.beginPath();
  ctx.arc(width / 2 - 50, height / 2 - 30, 18, 0, Math.PI * 2);
  ctx.arc(width / 2 + 50, height / 2 - 30, 18, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 72px Arial, Helvetica, sans-serif";
  ctx.fillText("LOW CPM", width / 2 - 170, height - 80);
}

function drawDoomscrollPhone(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
) {
  ctx.fillStyle = "#111827";
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = "#1f2937";
  ctx.fillRect(width / 2 - 180, 120, 360, height - 240);

  ctx.fillStyle = "#374151";
  for (let index = 0; index < 5; index += 1) {
    ctx.fillRect(width / 2 - 150, 180 + index * 110, 300, 80);
  }

  ctx.fillStyle = "#60a5fa";
  ctx.fillRect(width / 2 - 150, 180, 300, 18);

  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 54px Arial, Helvetica, sans-serif";
  ctx.fillText("DOOMSCROLL", width / 2 - 180, height - 80);
}

function drawNewsletterLie(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
) {
  ctx.fillStyle = "#312e81";
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(120, 220, width - 240, height - 440);

  ctx.fillStyle = "#4f46e5";
  ctx.font = "bold 120px Arial, Helvetica, sans-serif";
  ctx.fillText("99%", 300, 360);
  ctx.font = "bold 52px Arial, Helvetica, sans-serif";
  ctx.fillText("OPEN RATE", 250, 500);
}

function drawAdsensePrayer(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
) {
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, "#fef3c7");
  gradient.addColorStop(1, "#f59e0b");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = "#111827";
  ctx.beginPath();
  ctx.ellipse(width / 2, height / 2 + 80, 120, 200, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(width / 2 - 90, height / 2 - 40, 50, 120, -0.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(width / 2 + 90, height / 2 - 40, 50, 120, 0.4, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#111827";
  ctx.font = "bold 64px Arial, Helvetica, sans-serif";
  ctx.fillText("PLEASE", width / 2 - 120, height - 120);
  ctx.fillText("RPM", width / 2 - 60, height - 50);
}
