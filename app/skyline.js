'use strict';

// Original dusk scene drawn once, with a fixed seed for the skyline and water.
(() => {
  const canvas = document.getElementById('skyline');
  const brush = canvas.getContext('2d');
  if (!brush) return;
  const width = canvas.width;
  const height = canvas.height;
  let seed = 626;
  const random = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };

  function polygon(points, color) {
    brush.fillStyle = color;
    brush.beginPath();
    points.forEach(([x, y], index) => index ? brush.lineTo(x, y) : brush.moveTo(x, y));
    brush.closePath();
    brush.fill();
  }

  const sky = brush.createLinearGradient(0, 0, 0, height);
  sky.addColorStop(0, '#251035');
  sky.addColorStop(.51, '#632353');
  sky.addColorStop(.76, '#e56865');
  sky.addColorStop(1, '#25132c');
  brush.fillStyle = sky;
  brush.fillRect(0, 0, width, height);

  const sunGlow = brush.createRadialGradient(490, 146, 45, 490, 146, 272);
  sunGlow.addColorStop(0, '#fb804a88');
  sunGlow.addColorStop(1, '#b53d6200');
  brush.fillStyle = sunGlow;
  brush.fillRect(0, 0, width, height);

  brush.save();
  brush.beginPath();
  brush.arc(490, 145, 103, 0, Math.PI * 2);
  brush.clip();
  const sun = brush.createLinearGradient(0, 42, 0, 250);
  sun.addColorStop(0, '#ffdb8e');
  sun.addColorStop(.44, '#ffab69');
  sun.addColorStop(1, '#f8686e');
  brush.fillStyle = sun;
  brush.fillRect(380, 40, 220, 112);
  for (let y = 156; y < 250; y += 12) brush.fillRect(380, y, 220, 8);
  brush.restore();

  for (let i = 0; i < 25; i++) {
    const x = random() * width;
    const y = 20 + random() * 207;
    if (Math.hypot(x - 490, y - 145) < 107) continue;
    brush.fillStyle = i % 4 ? '#ffd5bd4d' : '#ffddc388';
    brush.fillRect(x, y, 1 + random() * 2, 1);
  }

  for (let i = 0; i < 24; i++) {
    const x = 52 + i * 32;
    const roof = 215 - random() * 43;
    brush.fillStyle = i % 2 ? '#511d40' : '#652244';
    brush.fillRect(x, roof, 9 + random() * 25, 54);
  }
  const buildings = [
    [150, 214, 42], [189, 190, 32], [221, 213, 30], [254, 182, 48],
    [309, 208, 21], [331, 164, 31], [370, 190, 40], [413, 151, 23],
    [437, 184, 35], [478, 139, 24], [503, 172, 41], [546, 199, 26],
    [575, 132, 34], [611, 166, 26], [640, 208, 41], [682, 167, 31],
    [716, 190, 28], [742, 210, 38]
  ];
  for (const [x, roof, span] of buildings) {
    const roofLip = 3 + Math.floor(random() * 6);
    polygon([[x, 254], [x, roof + roofLip], [x + 5, roof + roofLip], [x + 5, roof],
      [x + span - 8, roof], [x + span - 8, roof + roofLip], [x + span, roof + roofLip], [x + span, 254]], '#1d142b');
    brush.fillStyle = '#401f3a';
    brush.fillRect(x + span - 7, roof + roofLip, 7, 250 - roof);
    if (span > 29 && roof < 200) {
      brush.fillStyle = '#ff887974';
      brush.fillRect(x + 5, roof, span - 13, 2);
    }
    if (span < 36 && roof < 163) {
      brush.fillStyle = '#37223d';
      brush.fillRect(x + span / 2, roof - 17, 1.5, 17);
      brush.fillStyle = '#ff8d80';
      brush.fillRect(x + span / 2, roof - 17, 2, 2);
    }
    for (let wx = x + 5; wx < x + span - 8; wx += 6) {
      for (let wy = roof + 12; wy < 244; wy += 8) {
        if (random() > .55) {
          brush.fillStyle = random() > .69 ? '#ffae818a' : '#e56ca04f';
          brush.fillRect(wx, wy, 2, 2);
        }
      }
    }
  }

  const water = brush.createLinearGradient(0, 246, 0, height);
  water.addColorStop(0, '#501d43');
  water.addColorStop(1, '#1b142e');
  brush.fillStyle = water;
  brush.fillRect(0, 246, width, height - 246);
  for (let i = 0; i < 155; i++) {
    const y = 247 + random() * 57;
    const x = 188 + random() * 610;
    brush.fillStyle = i % 4 === 0 ? '#ed8d7466' : '#c964a24c';
    brush.fillRect(x, y, 3 + random() * (y - 236), .7);
  }

  function palm(x, y, scale, lean) {
    brush.save();
    brush.translate(x, y);
    brush.scale(scale * lean, scale);
    const trunk = '#180f25';
    brush.fillStyle = trunk;
    brush.beginPath();
    brush.moveTo(-5, 126);
    brush.quadraticCurveTo(7, 60, -2, 0);
    brush.quadraticCurveTo(14, 46, 5, 126);
    brush.fill();
    const fronds = [
      [-67, 10, -36, -18], [-58, 35, -27, -3], [-38, 42, -17, 4],
      [-52, -23, -23, -24], [-19, -39, -9, -20], [12, -44, 9, -23],
      [48, -30, 24, -24], [73, 2, 39, -18], [62, 23, 35, 0], [33, 41, 21, 6]
    ];
    for (const [endX, endY, curveX, curveY] of fronds) {
      brush.beginPath();
      brush.moveTo(1, 4);
      brush.quadraticCurveTo(curveX * .7, curveY - 10, endX, endY);
      brush.quadraticCurveTo(curveX, curveY + 8, 0, 8);
      brush.fill();
    }
    brush.restore();
  }

  palm(730, 111, 1.57, 1);
  palm(654, 173, 1.15, -1);
  palm(320, 208, .64, 1);
  polygon([[0, 300], [335, 290], [462, 299], [570, 294], [780, 283], [780, 310], [0, 310]], '#170f25');
})();
