// Run once in the TownTrack wireframe file from Figma > Plugins > Development.
// The script is idempotent: it finds frames by their screen code before creating them.
(async () => {
  const page = figma.currentPage;
  const font = { family: "Noto Sans Thai", style: "Regular" };
  const bold = { family: "Noto Sans Thai", style: "Bold" };
  await Promise.all([figma.loadFontAsync(font), figma.loadFontAsync(bold)]);

  const gray = (value) => ({ type: "SOLID", color: { r: value, g: value, b: value } });
  const mintBase = { type: "SOLID", color: { r: 0, g: 0.784, b: 0.702 } };
  const mintVariable = (await figma.variables.getLocalVariablesAsync("COLOR"))
    .find((variable) => variable.name === "Accents/Mint");
  const mint = mintVariable
    ? figma.variables.setBoundVariableForPaint(mintBase, "color", mintVariable)
    : mintBase;
  const ink = gray(0.12);
  const frameByCode = (code) => page.children.find((node) =>
    node.type === "FRAME" && node.name.startsWith(code + " · "));
  const component = page.children.find((node) =>
    node.type === "COMPONENT" && node.name === "Wire / Button");
  if (!component) throw new Error("ไม่พบ Wire / Button ในไฟล์ TownTrack");
  const pendingLinks = [];
  page.children.filter((node) => node.type === "COMPONENT" && node.name.startsWith("Wire / "))
    .forEach((node, index) => { node.x = 3400; node.y = 80 + index * 110; });

  function text(value, size = 12, isBold = false, width = 360) {
    const node = figma.createText();
    node.fontName = isBold ? bold : font;
    node.characters = value;
    node.fontSize = size;
    node.fills = [ink];
    node.textAutoResize = "HEIGHT";
    node.resize(width, Math.max(18, size * 1.6));
    return node;
  }

  function action(label, destination) {
    const node = component.createInstance();
    node.name = "Wire / Button · " + label;
    node.resize(370, 30);
    node.paddingTop = 4;
    node.paddingBottom = 4;
    const labelNode = node.findOne((child) => child.type === "TEXT");
    if (labelNode) {
      labelNode.characters = label;
      labelNode.fontSize = 11;
    }
    if (destination) {
      pendingLinks.push([node, destination]);
    }
    return node;
  }

  function card(title, body, buttons = []) {
    const node = figma.createFrame();
    node.name = "Card / " + title;
    node.layoutMode = "VERTICAL";
    node.resize(400, 40);
    node.primaryAxisSizingMode = "AUTO";
    node.counterAxisSizingMode = "FIXED";
    node.paddingLeft = 8;
    node.paddingRight = 8;
    node.paddingTop = 6;
    node.paddingBottom = 6;
    node.itemSpacing = 3;
    node.cornerRadius = 8;
    node.fills = [gray(1)];
    node.strokes = [gray(0.74)];
    node.strokeWeight = 1;
    node.appendChild(text(title, 13, true));
    if (body) node.appendChild(text(body, 11));
    buttons.forEach((button) => node.appendChild(action(button.label, button.to && frameByCode(button.to))));
    return node;
  }

  function makeScreen(code, role, title, subtitle, row, cards) {
    const existing = frameByCode(code);
    if (existing) return existing;
    const screen = figma.createFrame();
    screen.name = code + " · " + title + " · " + role;
    screen.layoutMode = "VERTICAL";
    screen.primaryAxisSizingMode = "FIXED";
    screen.counterAxisSizingMode = "FIXED";
    screen.resize(440, 956);
    screen.x = 2600;
    screen.y = row * 1100 + 52;
    screen.clipsContent = true;
    screen.overflowDirection = "VERTICAL";
    screen.fills = [gray(1)];
    screen.strokes = [gray(0.5)];
    screen.strokeWeight = 1;
    page.appendChild(screen);

    const safeTop = figma.createFrame();
    safeTop.name = "Safe area / Dynamic Island";
    safeTop.resize(440, 54);
    safeTop.fills = [gray(1)];
    screen.appendChild(safeTop);
    const time = text("9:41", 13, true, 50);
    safeTop.appendChild(time);
    time.x = 24;
    time.y = 18;
    const island = figma.createRectangle();
    island.name = "Dynamic Island";
    island.resize(126, 32);
    island.cornerRadius = 16;
    island.fills = [gray(0.08)];
    safeTop.appendChild(island);
    island.x = 157;
    island.y = 7;
    const signal = text("●  ▰", 12, true, 50);
    safeTop.appendChild(signal);
    signal.x = 371;
    signal.y = 18;

    const header = figma.createFrame();
    header.name = "Header / navigation";
    header.layoutMode = "HORIZONTAL";
    header.resize(440, 62);
    header.paddingLeft = 20;
    header.paddingRight = 20;
    header.paddingTop = 10;
    header.paddingBottom = 10;
    header.itemSpacing = 10;
    header.counterAxisAlignItems = "CENTER";
    header.fills = [gray(0.97)];
    header.appendChild(text(role === "ประชาชน" ? "☰" : "‹", 22, true, 35));
    header.appendChild(text("TownTrack", 20, true, 180));
    header.appendChild(text(role, 12, false, 130));
    screen.appendChild(header);

    const content = figma.createFrame();
    content.name = "Scrollable content";
    content.layoutMode = "VERTICAL";
    content.resize(440, 100);
    content.primaryAxisSizingMode = "AUTO";
    content.counterAxisSizingMode = "FIXED";
    content.paddingLeft = 20;
    content.paddingRight = 20;
    content.paddingTop = 8;
    content.paddingBottom = 8;
    content.itemSpacing = 6;
    content.fills = [gray(0.98)];
    content.appendChild(text(title, 18, true, 400));
    content.appendChild(text(subtitle, 11, false, 400));
    cards.forEach((entry) => content.appendChild(card(entry.title, entry.body, entry.buttons || [])));
    screen.appendChild(content);
    const safeBottom = figma.createFrame();
    safeBottom.name = "Bottom safe area";
    safeBottom.resize(440, 34);
    safeBottom.fills = [gray(1)];
    screen.appendChild(safeBottom);
    return screen;
  }

  // First compact the 24 existing presentation screens.
  const existingScreens = page.children.filter((node) =>
    node.type === "FRAME" && /^[CSTWA]\d\d · /.test(node.name) &&
    node.width === 440 && node.height === 956);
  for (const screen of existingScreens) {
    const content = screen.children.find((node) => node.name === "Scrollable content");
    if (!content) continue;
    content.paddingTop = 8;
    content.paddingBottom = 8;
    content.itemSpacing = 6;
    for (const item of content.children) {
      if (item.type === "TEXT") {
        item.fontSize = item.characters === screen.name.split(" · ")[1] ? 18 : 11;
      } else if (item.type === "FRAME" && /^(Card|Field|Actions|Modal) \/ /.test(item.name)) {
        item.paddingTop = 6;
        item.paddingBottom = 6;
        item.paddingLeft = 8;
        item.paddingRight = 8;
        item.itemSpacing = 3;
        const texts = item.findAll((node) => node.type === "TEXT");
        texts.forEach((node, index) => { node.fontSize = index === 0 ? 13 : 11; });
        item.findAll((node) => node.name === "Editable map placeholder")
          .forEach((node) => node.resize(370, 80));
      }
    }
    screen.findAll((node) => node.type === "INSTANCE" && node.mainComponent?.id === component.id)
      .forEach((button) => {
        button.resize(370, 30);
        button.paddingTop = 4;
        button.paddingBottom = 4;
        const labelNode = button.findOne((node) => node.type === "TEXT");
        if (labelNode) labelNode.fontSize = 11;
      });
  }
  component.resize(400, 30);
  component.paddingTop = 4;
  component.paddingBottom = 4;

  // Add one source-based state to each role; the approver needs two to reach six.
  makeScreen("C11", "ประชาชน", "เบอร์ช่วยเหลือ",
    "สายด่วนส่วนกลาง และหน่วยงานใกล้พิกัดเมื่ออนุญาต GPS", 0, [
      { title: "ตำแหน่งของฉัน", body: "ใช้ตำแหน่งของฉัน · เมื่อไม่อนุญาต GPS ยังใช้เบอร์ส่วนกลางได้" },
      { title: "สายด่วนส่วนกลาง", body: "เหตุด่วนเหตุร้าย 191 · แพทย์ฉุกเฉิน 1669 · แจ้งเหตุเพลิงไหม้ 199 · ตำรวจท่องเที่ยว 1155" },
      { title: "หน่วยงานใกล้พิกัด", body: "โรงพยาบาล · ตำรวจ · กู้ภัย · ระยะทาง · แผนที่ · เบอร์โทร (แสดงเมื่ออนุญาต GPS)" }
    ]);
  makeScreen("S01", "เจ้าหน้าที่รับเรื่อง", "เข้าสู่ระบบ OIDC",
    "ยืนยันตัวตนอย่างปลอดภัย", 1, [
      { title: "เข้าสู่ระบบเจ้าหน้าที่รับเรื่อง", body: "ใช้บัญชีองค์กรตามสิทธิ์ของคุณ",
        buttons: [{ label: "เข้าสู่ระบบด้วยบัญชีองค์กร", to: "S02" }] },
      { title: "ทางกลับ", body: "กลับไปเลือกบทบาท" }
    ]);
  makeScreen("T07", "หัวหน้าทีมภาคสนาม", "ยืนยันใช้ทรัพยากรเดิม",
    "กรณีทีมขอทรัพยากรเพิ่ม แต่ยังดำเนินงานต่อได้", 2, [
      { title: "งานที่ได้รับ", body: "เลขเรื่อง · ชื่อเรื่อง · รายการที่ทีมขอ" },
      { title: "แนวทางดำเนินงาน", body: "ใช้ทรัพยากรที่มีอยู่ · เหตุผลและข้อควรระวัง" },
      { title: "บันทึกผล", body: "", buttons: [{ label: "ยกเลิก" }, { label: "ยืนยันให้ทีมทำงานต่อ", to: "T03" }] }
    ]);
  makeScreen("W06", "เจ้าหน้าที่ภาคสนาม", "งานที่เสร็จแล้ว",
    "แท็บประวัติในเส้นทางและงานวันนี้", 3, [
      { title: "ค้นหาและกรอง", body: "เลขเรื่อง · สถานะ · วันที่นัด · เรียงตามโหวตหรือวัน" },
      { title: "บัตรงานที่เสร็จแล้ว", body: "เลขเรื่อง · ชื่อ · สถานที่ · สถานะ · 👍 โหวต · วันนัด",
        buttons: [{ label: "เปิดใบงาน", to: "W03" }] }
    ]);
  makeScreen("A05", "ผู้บริหาร / ผู้อนุมัติ", "พิจารณาคำสั่งตามกฎหมาย",
    "รายละเอียดข้อเสนอคำสั่งและข้อพิพาท", 4, [
      { title: "ข้อมูลคำร้อง", body: "เลขเรื่อง · ระดับ · สถานะ · ผู้แจ้ง · หลักฐาน" },
      { title: "ฐานกฎหมายและข้อเสนอ", body: "เหตุผล · ระยะเวลา · หลักฐานอ้างอิง · ผู้เสนอ" },
      { title: "บันทึกผล", body: "", buttons: [
        { label: "ออกคำสั่งแจ้งคู่กรณี", to: "A04" },
        { label: "ไม่ออกคำสั่ง · ยุติเรื่อง", to: "A04" }
      ] }
    ]);
  makeScreen("A06", "ผู้บริหาร / ผู้อนุมัติ", "ผลการพิจารณา",
    "แท็บประวัติในคิวพิจารณา", 4, [
      { title: "ค้นหาและกรอง", body: "เลขเรื่อง · สถานะ · เรียงตามโหวตหรือวัน" },
      { title: "ผลการพิจารณา", body: "เลขเรื่อง · ประเภทข้อเสนอ · ผลพิจารณา · เหตุผล · วันที่",
        buttons: [{ label: "เปิดรายละเอียดข้อเสนอ", to: "A03" }] }
    ]);
  // Give the approver's sixth screen its own position after the fifth.
  const approverHistory = frameByCode("A06");
  if (approverHistory) approverHistory.x = 3120;

  // Link source controls to the newly visible presentation states.
  const routes = [
    ["C02", "เบอร์ช่วยเหลือ", "C11"],
    ["T03", "ให้ทีมทำงานต่อ", "T07"],
    ["W02", "งานที่เสร็จแล้ว", "W06"],
    ["A02", "ผลการพิจารณา", "A06"],
    ["A03", "ออกคำสั่งแจ้งคู่กรณี", "A05"]
  ];
  for (const [from, label, to] of routes) {
    const source = frameByCode(from);
    const target = frameByCode(to);
    const content = source?.children.find((node) => node.name === "Scrollable content");
    if (!source || !target || !content) continue;
    let button = source.findAll((node) => node.type === "INSTANCE" &&
      node.findOne((child) => child.type === "TEXT")?.characters === label)[0];
    if (!button) {
      const routeCard = card("ทางไปยังหน้าถัดไป", "", []);
      button = action(label);
      routeCard.appendChild(button);
      content.appendChild(routeCard);
    }
    await button.setReactionsAsync([{
      trigger: { type: "ON_CLICK" },
      actions: [{ type: "NODE", destinationId: target.id, navigation: "NAVIGATE", transition: null }]
    }]);
  }
  for (const [button, destination] of pendingLinks) {
    await button.setReactionsAsync([{
      trigger: { type: "ON_CLICK" },
      actions: [{ type: "NODE", destinationId: destination.id, navigation: "NAVIGATE", transition: null }]
    }]);
  }

  // Resource request route for the prototype:
  // citizen -> intake -> supervisor -> worker -> supervisor -> intake -> approver.
  // Rebuild only the affected presentation screens. The remaining screens and
  // their editable layers stay in place.
  const resourceLinkStart = pendingLinks.length;
  function rebuildScreen(code, title, subtitle, entries) {
    const screen = frameByCode(code);
    if (!screen) throw new Error("ไม่พบหน้าจอ " + code);
    const role = screen.name.split(" · ").at(-1);
    screen.name = code + " · " + title + " · " + role;
    const content = screen.children.find((node) => node.name === "Scrollable content");
    if (!content) throw new Error("ไม่พบเนื้อหาหน้าจอ " + code);
    for (const child of [...content.children]) child.remove();
    content.appendChild(text(title, 18, true, 400));
    content.appendChild(text(subtitle, 11, false, 400));
    for (const entry of entries) content.appendChild(card(entry.title, entry.body, entry.buttons || []));
    return screen;
  }
  rebuildScreen("S03", "รายละเอียดคำร้อง", "เลือกดำเนินการตามสถานะของเรื่อง", [
    { title: "ข้อมูลคำร้อง", body: "เลขเรื่อง · ผู้แจ้ง · ประเภท · จุดเกิดเหตุ · รูปหลักฐาน · โหวต" },
    { title: "คำร้องใหม่", body: "เจ้าหน้าที่รับเรื่องและเลือกขั้นตอนหลัก", buttons: [
      { label: "ประเมินความเร่งด่วนและมอบหมายหัวหน้าทีม", to: "S04" },
      { label: "จัดทำข้อเสนองบ", to: "S05" }
    ] },
    { title: "แจ้งเตือนคำขอทรัพยากร", body: "แสดงเมื่อหัวหน้าทีมตรวจคำขอจากภาคสนามและส่งต่อมา", buttons: [
      { label: "ตรวจคำขอทรัพยากร", to: "S06" }
    ] }
  ]);
  rebuildScreen("S02", "ภาพรวมและคิวรับเรื่อง", "คำร้องใหม่และคำขอทรัพยากรที่ต้องดำเนินการ", [
    { title: "คิวคำร้องประชาชน", body: "เลขเรื่อง · ชื่อเรื่อง · สถานะ · โหวต · วันที่แจ้ง", buttons: [
      { label: "เปิดรายละเอียดคำร้อง", to: "S03" }
    ] },
    { title: "แจ้งเตือนคำขอจากหัวหน้าทีม", body: "แสดงจำนวนคำขอทรัพยากรที่รอเจ้าหน้าที่รับเรื่อง", buttons: [
      { label: "เปิดคำขอทรัพยากร", to: "S06" }
    ] }
  ]);
  rebuildScreen("S04", "ประเมินและมอบหมายหัวหน้าทีม", "บันทึกข้อมูลชุดเดียว แล้วส่งให้หัวหน้าทีมภาคสนาม", [
    { title: "ผลประเมิน", body: "ผลประเมินความเร่งด่วน · เหตุผล / ผลตรวจ / สิ่งที่ต้องเพิ่มเติม" },
    { title: "แผนมอบหมาย", body: "หัวหน้าทีมรับผิดชอบ · วันที่นัดลงพื้นที่ · ขอบเขตงาน / แผนเส้นทาง · คำเตือนและข้อควรระวัง" },
    { title: "ดำเนินการ", body: "", buttons: [
      { label: "ยกเลิก", to: "S03" },
      { label: "บันทึกและส่งหัวหน้าทีม", to: "T02" }
    ] }
  ]);
  rebuildScreen("S06", "ตรวจและส่งคำขอทรัพยากร", "คำขอที่หัวหน้าทีมภาคสนามส่งให้เจ้าหน้าที่รับเรื่อง", [
    { title: "ข้อมูลคำขอจากภาคสนาม", body: "เลขเรื่อง · รายการทรัพยากร · จำนวน · วงเงินประมาณการ · เหตุผล · เวลาที่ต้องใช้" },
    { title: "ผลตรวจหัวหน้าทีม", body: "ผู้ตรวจ · ผลตรวจ · เหตุผลอนุมัติ · วันที่ส่งต่อ" },
    { title: "ส่งผู้อนุมัติ", body: "หมายเหตุประกอบ · ผู้อนุมัติรับพิจารณา · เลขเอกสารส่งเรื่อง", buttons: [
      { label: "กลับรายละเอียด", to: "S03" },
      { label: "ส่งเรื่องให้ผู้อนุมัติ", to: "A02" }
    ] }
  ]);
  rebuildScreen("T03", "รายละเอียดแผนงาน", "หัวหน้าทีมจัดทีมและรับแจ้งคำขอทรัพยากร", [
    { title: "ข้อมูลและแผนงาน", body: "เลขเรื่อง · สถานที่ · ผลประเมิน · นัดลงพื้นที่ · ขอบเขตงาน · ข้อควรระวัง" },
    { title: "มอบหมายงาน", body: "เลือกทีมภาคสนามและวันนัด", buttons: [
      { label: "จัดทีมและมอบหมายงาน", to: "T04" }
    ] },
    { title: "แจ้งเตือนจากงานภาคสนาม", body: "แสดงเมื่อทีมยื่นคำขอเบิกทรัพยากร พร้อมรายการและเหตุผล", buttons: [
      { label: "ตรวจคำขอทรัพยากร", to: "T05" }
    ] }
  ]);
  rebuildScreen("T02", "ภาพรวมและคิวงานทีม", "งานที่รับจากเจ้าหน้าที่และคำขอจากภาคสนาม", [
    { title: "งานที่ต้องจัดทีม", body: "เลขเรื่อง · ระดับความเร่งด่วน · สถานที่ · วันนัด", buttons: [
      { label: "เปิดรายละเอียดแผนงาน", to: "T03" }
    ] },
    { title: "แจ้งเตือนคำขอทรัพยากร", body: "ทีมภาคสนามส่งรายการ จำนวน และเหตุผลเข้ามา", buttons: [
      { label: "เปิดคำขอทรัพยากร", to: "T05" }
    ] }
  ]);
  rebuildScreen("T05", "ตรวจคำขอทรัพยากร", "หัวหน้าทีมตรวจข้อมูลที่งานภาคสนามยื่นมา", [
    { title: "คำขอจากงานภาคสนาม", body: "เลขเรื่อง · รายการทรัพยากร · จำนวน · วงเงินประมาณการ · เหตุผล · เวลาที่ต้องใช้" },
    { title: "ผลตรวจหัวหน้าทีม", body: "ระบุผลตรวจและเหตุผลอนุมัติ ก่อนส่งต่อเจ้าหน้าที่รับเรื่อง" },
    { title: "ส่งต่อ", body: "", buttons: [
      { label: "กลับรายละเอียดงาน", to: "T03" },
      { label: "รับเรื่องและยื่นขอเบิกทรัพยากร", to: "S06" }
    ] }
  ]);
  rebuildScreen("T04", "จัดทีมและมอบหมายงาน", "หัวหน้าทีมเลือกผู้ลงพื้นที่และกำหนดวันนัด", [
    { title: "ข้อมูลแผนงาน", body: "เลขเรื่อง · สถานที่ · ขอบเขตงาน · คำเตือนและข้อควรระวัง" },
    { title: "มอบหมายทีม", body: "ผู้ลงพื้นที่ · วันที่นัดลงพื้นที่" },
    { title: "ยืนยัน", body: "", buttons: [
      { label: "กลับรายละเอียด", to: "T03" },
      { label: "ยืนยันทีมและกำหนดงาน", to: "W02" }
    ] }
  ]);
  rebuildScreen("T07", "ผลพิจารณาทรัพยากร", "กรณีผู้อนุมัติไม่อนุมัติ ให้หัวหน้าทีมรับทราบ", [
    { title: "ผลไม่อนุมัติ", body: "เลขเรื่อง · รายการที่ขอ · เหตุผลผู้อนุมัติ · เลขเอกสารผลพิจารณา" },
    { title: "กลับไปดูงาน", body: "คำร้องของประชาชนยังไม่ถูกปิด", buttons: [
      { label: "กลับรายละเอียดงาน", to: "T03" }
    ] }
  ]);
  rebuildScreen("W02", "งานภาคสนามและเส้นทางวันนี้", "งานที่หัวหน้าทีมภาคสนามมอบหมาย", [
    { title: "งานที่รอรับ", body: "เลขเรื่อง · สถานที่ · วันนัด · สถานะมอบหมายแล้ว" },
    { title: "เปิดใบงาน", body: "", buttons: [{ label: "เปิดรายละเอียดใบงาน", to: "W03" }] }
  ]);
  rebuildScreen("W03", "รายละเอียดใบงานภาคสนาม", "ตรวจแผนงานและกดรับงาน", [
    { title: "ใบงานที่ได้รับมอบหมาย", body: "เลขเรื่อง · สถานที่ · วันนัด · แผนเส้นทาง · ขอบเขตงาน · ข้อควรระวัง" },
    { title: "สถานะมอบหมายแล้ว", body: "หัวหน้าทีมจัดงานให้แล้ว", buttons: [
      { label: "กดรับงาน", to: "W06" }
    ] }
  ]);
  rebuildScreen("W06", "รับงานแล้ว", "เลือกเริ่มปฏิบัติงานหรือยื่นคำขอทรัพยากร", [
    { title: "ใบงานที่รับแล้ว", body: "เลขเรื่อง · สถานที่ · แผนลงพื้นที่ · วันนัด" },
    { title: "ดำเนินงาน", body: "", buttons: [
      { label: "เริ่มปฏิบัติงาน", to: "W05" },
      { label: "ขอใช้ทรัพยากรเพิ่ม", to: "W04" }
    ] }
  ]);
  rebuildScreen("W04", "ยื่นคำขอทรัพยากร", "กรอกข้อมูลให้ครบแล้วส่งหัวหน้าทีมภาคสนาม", [
    { title: "รายการทรัพยากร", body: "รายการที่ต้องการ · จำนวน / ปริมาณ · วงเงินประมาณการ (บาท)" },
    { title: "ความจำเป็น", body: "เหตุผลและความจำเป็น · ระยะเวลา / วันที่ต้องใช้" },
    { title: "ส่งคำขอ", body: "หลังส่ง งานจะรอหัวหน้าทีมตรวจ", buttons: [
      { label: "ยกเลิก", to: "W03" },
      { label: "ส่งคำขอให้หัวหน้าทีม", to: "T03" }
    ] }
  ]);
  rebuildScreen("A03", "รายละเอียดคำขอทรัพยากร", "พิจารณาเอกสารที่ส่งผ่านเจ้าหน้าที่รับเรื่อง", [
    { title: "ข้อมูลคำร้อง", body: "เลขเรื่อง · ผู้แจ้ง · สถานที่ · สถานะ" },
    { title: "คำขอเบิกทรัพยากร", body: "รายการ · จำนวน · วงเงิน · เหตุผล · เวลา · ผลตรวจหัวหน้า · เลขเอกสารเจ้าหน้าที่" },
    { title: "ตัดสินใจ", body: "", buttons: [
      { label: "อนุมัติ", to: "A04" },
      { label: "ไม่อนุมัติ", to: "A04" }
    ] }
  ]);
  rebuildScreen("A02", "ภาพรวมและคิวพิจารณา", "คำขอทรัพยากรที่เจ้าหน้าที่ส่งให้ตัดสินใจ", [
    { title: "รอพิจารณา", body: "เลขเรื่อง · รายการทรัพยากร · วงเงิน · วันที่ส่งเรื่อง", buttons: [
      { label: "เปิดรายละเอียดคำขอ", to: "A03" }
    ] }
  ]);
  rebuildScreen("A04", "บันทึกผลพิจารณา", "ผู้อนุมัติเลือกรับหรือไม่อนุมัติคำขอทรัพยากร", [
    { title: "ผลการพิจารณา", body: "เลือก อนุมัติ / ไม่อนุมัติ · เหตุผลประกอบ · เลขเอกสารผลพิจารณา" },
    { title: "ยืนยันผล", body: "อนุมัติ: แจ้งเจ้าหน้าที่เตรียมทรัพยากร · ไม่อนุมัติ: แจ้งหัวหน้าทีมทบทวน", buttons: [
      { label: "กลับคำขอ", to: "A03" },
      { label: "ยืนยันผลอนุมัติ", to: "A05" },
      { label: "ยืนยันผลไม่อนุมัติ", to: "A06" }
    ] }
  ]);
  rebuildScreen("A05", "ผลอนุมัติทรัพยากร", "บันทึกผลและแจ้งเจ้าหน้าที่ให้เตรียมทรัพยากร", [
    { title: "ผลพิจารณา", body: "อนุมัติ · เหตุผล · เลขเอกสารผลพิจารณา" },
    { title: "แจ้งเจ้าหน้าที่รับเรื่อง", body: "เจ้าหน้าที่รับผลเพื่อเตรียมทรัพยากรก่อนทีมเริ่มงาน", buttons: [
      { label: "เปิดเรื่องที่เจ้าหน้าที่", to: "S03" }
    ] }
  ]);
  rebuildScreen("A06", "ผลไม่อนุมัติทรัพยากร", "บันทึกเหตุผลและแจ้งหัวหน้าทีมภาคสนาม", [
    { title: "ผลพิจารณา", body: "ไม่อนุมัติ · เหตุผล · เลขเอกสารผลพิจารณา" },
    { title: "แจ้งหัวหน้าทีม", body: "ส่งผลกลับให้หัวหน้าทีมทบทวน โดยคำร้องประชาชนยังไม่ถูกปิด", buttons: [
      { label: "เปิดผลที่หัวหน้าทีม", to: "T07" }
    ] }
  ]);
  for (const [button, destination] of pendingLinks.slice(resourceLinkStart)) {
    if (!destination) continue;
    await button.setReactionsAsync([{
      trigger: { type: "ON_CLICK" },
      actions: [{ type: "NODE", destinationId: destination.id, navigation: "NAVIGATE", transition: null }]
    }]);
  }

  // Mint is reserved for buttons that actually navigate to another Figma screen.
  for (const screen of page.children.filter((node) =>
    node.type === "FRAME" && /^[CSTWA]\d\d · /.test(node.name))) {
    for (const button of screen.findAll((node) =>
      node.type === "INSTANCE" && node.mainComponent?.id === component.id)) {
      const linked = button.reactions.some((reaction) =>
        (reaction.actions || []).some((entry) => entry.type === "NODE" && entry.navigation === "NAVIGATE"));
      button.fills = [linked ? mint : gray(0.965)];
    }
  }
  const headings = page.children.filter((node) =>
    node.type === "TEXT" && /\/ [45] หน้าจอ/.test(node.characters));
  headings.forEach((node) => { node.characters = node.characters.replace(/\/ [45] หน้าจอ/, "/ 6 หน้าจอ"); });
  figma.closePlugin("TownTrack: ปรับโฟลวคำขอทรัพยากรและปุ่มนำทางแล้ว");
})().catch((error) => figma.closePlugin("TownTrack update error: " + error.message));
