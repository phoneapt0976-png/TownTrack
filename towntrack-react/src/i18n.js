import { useSyncExternalStore } from 'react';

const KEY = 'towntrack-language-v1';
const listeners = new Set();
let language = (() => {
  const fromUrl = new URLSearchParams(window.location.search).get('lang');
  if (fromUrl === 'en' || fromUrl === 'th') return fromUrl;
  try { return localStorage.getItem(KEY) === 'en' ? 'en' : 'th'; } catch { return 'th'; }
})();

export function getLanguage() { return language; }
export function setLanguage(next) {
  const value = next === 'en' ? 'en' : 'th';
  if (language === value) {
    try { localStorage.setItem(KEY, value); } catch { /* Keep the in-memory selection. */ }
    return;
  }
  language = value;
  document.documentElement.lang = value;
  try { localStorage.setItem(KEY, value); } catch { /* Language still works this visit. */ }
  listeners.forEach((listener) => listener());
}
export function useLanguage() {
  return useSyncExternalStore(
    (listener) => { listeners.add(listener); return () => listeners.delete(listener); },
    getLanguage,
    getLanguage,
  );
}
export const tr = (th, en) => language === 'en' ? en : th;
document.documentElement.lang = language;

// Exact UI phrases only. Issue descriptions and citizen input remain as entered.
const translations = {
  'ขนาดข้อความ': 'Text size', 'ปกติ': 'Normal', 'ใหญ่': 'Large', 'ใหญ่พิเศษ': 'Extra large',
  'เพิ่มความชัดเจนของข้อความ': 'Increase contrast', 'คืนค่าเริ่มต้น': 'Reset display',
  'วิธีใช้คีย์บอร์ดและการขยายหน้า': 'Keyboard and zoom help',
  'ข้อมูลและเครื่องมือช่วยใช้งาน': 'Information and accessibility tools',
  'TownTrack · บริการชุมชน': 'TownTrack · Community service',
  'แจ้งปัญหา ติดตามความคืบหน้า': 'Report issues and follow progress',
  'และร่วมดูแลชุมชนของเรา': 'Together, care for our community',
  'ต้นแบบสาธิต · คำร้องและไฟล์แนบเก็บในเบราว์เซอร์': 'Demo · reports and files are stored in this browser',
  'TownTrack · ข้อมูลสาธิตไม่ใช่ผลการดำเนินงานจริงของหน่วยงาน': 'TownTrack · demo data is not an agency record',
  'ประชาชน': 'Citizen', 'เจ้าหน้าที่รับเรื่อง': 'Intake staff', 'หัวหน้าทีมภาคสนาม': 'Field supervisor',
  'เจ้าหน้าที่ภาคสนาม': 'Field worker', 'ผู้บริหาร / ผู้อนุมัติ': 'Approver', 'ผู้บริหารและผู้อนุมัติ': 'Approver',
  'คู่มือ': 'Guide', 'การแสดงผล': 'Display', 'เลือกบทบาท': 'Select role', 'บัญชีทดลอง': 'Demo account',
  'ออกจากระบบ': 'Sign out', 'กลับหน้าหลัก': 'Back to home', 'ข้ามไปยังเนื้อหาหลัก': 'Skip to main content',
  'ระบบดูแลปัญหาชุมชน': 'Community issue service', 'บริการและความช่วยเหลือ': 'Services and help',
  'บริการประชาชน': 'Citizen services', 'ขั้นตอนและคู่มือบริการ': 'Service steps and guide',
  'ติดต่อ / เสนอแนะ': 'Contact / feedback', 'แผนผังเว็บไซต์': 'Site map',
  'นโยบายและการเข้าถึง': 'Policies and accessibility', 'การคุ้มครองข้อมูลส่วนบุคคล': 'Privacy',
  'นโยบายเว็บไซต์และลิขสิทธิ์': 'Website policy and copyright', 'ความมั่นคงปลอดภัย': 'Security',
  'การเข้าถึงเว็บไซต์': 'Accessibility', 'หน่วยงานผู้ให้บริการ': 'Service provider',
  'เว็บไซต์หน่วยงาน': 'Agency website', 'รายละเอียดการติดต่อ': 'Contact details',
  'ยังไม่ได้ระบุหน่วยงานผู้ให้บริการจริง': 'Agency not configured',
  'หน้าหลัก': 'Home', 'แจ้งปัญหา': 'Report issue', 'แจ้งปัญหาใหม่': 'Report a new issue',
  'ติดตาม': 'Tracking', 'ติดตามสถานะ': 'Track status', 'ติดตามสถานะปัญหา': 'Track issue status',
  'เบอร์ช่วยเหลือ': 'Help contacts', 'ปัญหาใกล้ฉัน': 'Issues near me',
  'สำรวจปัญหาพื้นที่': 'Explore local issues', 'ค้นหาปัญหา': 'Search issues',
  'รายการปัญหา': 'Issue list', 'ตำแหน่งปัญหา': 'Issue locations', 'สรุปภาพรวม': 'Overview',
  'ดูรายละเอียด': 'View details', 'ดูเรื่องเพิ่ม': 'Show more', 'ย่อรายการ': 'Show less',
  'กดโหวต (+1)': 'Vote (+1)', 'โหวตแล้ว': 'Voted', 'ติดตามปัญหานี้': 'Follow this issue',
  'ติดตามแล้ว': 'Following', 'ประเมินแล้ว': 'Rated', 'รอประเมิน': 'Awaiting rating',
  'เรื่องที่ฉันแจ้ง': 'My reports', 'เรื่องที่ติดตาม': 'Following', 'ทั้งหมด': 'All',
  'กำลังดำเนินการ': 'In progress', 'ปิดเรื่องแล้ว': 'Closed', 'รอพิจารณา': 'Pending approval',
  'รอรับเรื่อง / ข้อมูล': 'Awaiting review / information',
  'กรองสถานะ': 'Filter status', 'สถานะ': 'Status', 'เรียงลำดับ': 'Sort by',
  'โหวตเยอะสุด': 'Most votes', 'โหวตน้อยสุด': 'Fewest votes', 'ล่าสุด': 'Newest', 'เก่าสุด': 'Oldest',
  'กลุ่ม': 'Clusters', 'หมุด': 'Pins', 'ความหนาแน่น': 'Density',
  'คำร้องทั้งหมด': 'Total reports', 'ยังไม่ปิด': 'Open', 'เสียงสนับสนุน': 'Votes',
  'รวมทุกคำร้อง': 'Across all reports', 'รอดำเนินการ': 'Pending',
  'ศูนย์รับเรื่อง': 'Intake desk', 'งานภาคสนาม': 'Field work', 'งานที่ได้รับมอบหมาย': 'Assigned tasks',
  'ภาพรวมเพื่อการตัดสินใจ': 'Decision overview', 'วางแผนงาน ดูแลทีม': 'Plan work and support the team',
  'รับเรื่องและส่งต่อได้ครบ': 'Review and assign reports',
  'ตรวจข้อมูล แล้วส่งต่อให้ทีมที่เหมาะสม': 'Review details and assign the right team',
  'จัดทีมและทรัพยากร พร้อมติดตามคุณภาพงาน': 'Assign the team and review work quality',
  'ดูนัดหมาย ลงพื้นที่ และส่งผลพร้อมหลักฐาน': 'View schedules, work on site and submit evidence',
  'พิจารณางบประมาณ คำสั่ง และความคืบหน้า': 'Review budgets, orders and progress',
  'ภาพรวมเทศบาล': 'Municipal overview', 'ข้อมูลตัวอย่าง อัปเดตตามการทำงานของทุกบทบาท': 'Sample data updates as each role acts',
  'สัดส่วนคำร้องที่ปิดแล้ว': 'Share of reports closed', 'วงเงินเสนอรวม · ไม่ใช่ยอดเบิกจ่าย': 'Total proposed budget · not disbursed',
  'งบประมาณ': 'Budget', 'ข้อกฎหมาย': 'Legal matters', 'ดูงาน': 'View task',
  'กลับไปยังรายการ': 'Back to list', 'กลับไปรายการ': 'Back to list', 'ประวัติการดำเนินงาน': 'Activity history',
  'ผลโหวต': 'Votes', 'รายละเอียดปัญหา': 'Issue details', 'ประเภทปัญหา': 'Issue category',
  'สถานที่': 'Place', 'รายละเอียด': 'Details', 'หลักฐาน': 'Evidence', 'หลักฐานผู้แจ้ง': 'Reporter evidence',
  'ภาพตัวอย่าง': 'Sample image', 'แนบหลักฐาน': 'Attach evidence', 'ชื่อผู้แจ้ง': 'Reporter name',
  'เบอร์ติดต่อ': 'Contact number', 'พิกัด': 'Coordinates', 'แผนที่': 'Map',
  'ใช้ตำแหน่งของฉัน': 'Use my location', 'กำลังหาตำแหน่ง…': 'Finding location…',
  'ส่งข้อมูล': 'Submit', 'ยกเลิก': 'Cancel', 'บันทึก': 'Save', 'ยืนยัน': 'Confirm',
  'ปิด': 'Close', 'กลับ': 'Back', 'เลือก': 'Select', 'ค้นหา': 'Search', 'ล้างตัวกรอง': 'Clear filters',
  'ประเมินความเร่งด่วนและมอบหมายหัวหน้าทีม': 'Assess urgency and assign supervisor',
  'ผลประเมินความเร่งด่วน': 'Urgency assessment', 'เหตุผล': 'Reason', 'ผลตรวจ': 'Review result',
  'สิ่งที่ต้องเพิ่มเติม': 'Additional information needed', 'หัวหน้าทีมรับผิดชอบ': 'Responsible supervisor',
  'วันที่นัดลงพื้นที่': 'Scheduled site visit', 'ขอบเขตงาน / แผนเส้นทาง': 'Scope / route plan',
  'คำเตือนและข้อควรระวัง': 'Warnings and precautions', 'จัดทำข้อเสนองบ': 'Prepare budget proposal',
  'มอบหมายผู้ลงพื้นที่': 'Assign field worker', 'รับงาน': 'Accept task', 'ปฏิเสธงาน': 'Decline task',
  'เริ่มปฏิบัติงาน': 'Start work', 'ขอใช้ทรัพยากรเพิ่ม': 'Request more resources',
  'ตรวจคำขอทรัพยากร': 'Review resource request', 'ส่งเจ้าหน้าที่รับเรื่อง': 'Send to intake staff',
  'ส่งผู้อนุมัติพิจารณา': 'Send to approver', 'ส่งรายงานผล': 'Submit work report',
  'ตรวจรายงาน': 'Review report', 'ส่งกลับแก้ไข': 'Return for changes', 'ปิดเรื่อง': 'Close report',
  'อนุมัติ': 'Approve', 'ไม่อนุมัติ': 'Decline', 'ขอข้อมูลเพิ่มเติม': 'Request more information',
  'ประเมินความพึงพอใจ': 'Rate satisfaction', 'ข้อเสนอแนะเพิ่มเติม': 'Additional feedback',
  'ไว้ทีหลัง': 'Maybe later', 'ส่งแบบประเมิน': 'Submit rating', 'กำลังส่ง…': 'Submitting…',
  'ติดต่อขอความช่วยเหลือ': 'Get help', 'สายด่วน': 'Hotline', 'เปิดแผนที่': 'Open map',
  'ข้อมูลสถานที่': 'Place details', 'โรงพยาบาล ตำรวจ และกู้ภัยใกล้พิกัด': 'Nearby hospitals, police and rescue',
  'กำลังค้นหาเบอร์ฉุกเฉินใกล้คุณ…': 'Finding nearby emergency contacts…',
  'ได้รับตำแหน่ง GPS แล้ว': 'GPS location available', 'ไม่ได้อนุญาตให้ใช้ตำแหน่ง': 'Location access denied',
  'ยังไม่สามารถระบุตำแหน่งได้': 'Location unavailable',
};

Object.assign(translations, {
  'รับคำร้องแล้ว': 'Report received', 'รอประชาชนส่งข้อมูล': 'Waiting for citizen details',
  'รอการจัดสรรงบประมาณ': 'Awaiting budget approval', 'รอข้อมูลข้อเสนอเพิ่มเติม': 'Awaiting proposal details',
  'อนุมัติงบประมาณแล้ว': 'Budget approved', 'รอหัวหน้าจัดทีม': 'Waiting for team assignment',
  'รอหัวหน้าตรวจคำขอทรัพยากร': 'Supervisor reviewing resource request',
  'รอเจ้าหน้าที่ส่งคำขอทรัพยากร': 'Intake staff forwarding resource request',
  'มอบหมายผู้ลงพื้นที่แล้ว': 'Field worker assigned', 'รับงานแล้ว': 'Task accepted',
  'เจ้าหน้าที่กำลังลงพื้นที่': 'Field work underway', 'รอหัวหน้าตรวจรายงาน': 'Supervisor reviewing work report',
  'รอเทศบาลตรวจปิด': 'Awaiting final closure review', 'รอแก้ไขเพิ่มเติม': 'Awaiting corrections',
  'รอผู้มีอำนาจพิจารณาคำสั่ง': 'Awaiting order decision', 'รอเอกสารคำสั่งเพิ่มเติม': 'Awaiting order documents',
  'ออกคำสั่งแล้ว รอติดตาม': 'Order issued · follow-up pending', 'ปิดเรื่องเรียบร้อย': 'Issue closed',
  'ไฟฟ้าส่องสว่าง': 'Street lighting', 'ถนนชำรุด': 'Damaged road', 'ขยะมูลฝอย': 'Waste',
  'ท่อระบายน้ำ': 'Drainage', 'กิ่งไม้/ความปลอดภัย': 'Trees / safety',
  'ถนนพัง / ฝาท่อ': 'Road / manhole', 'น้ำขัง / น้ำท่วม': 'Flooding / standing water',
  'ขยะ / สิ่งสกปรก': 'Waste / litter', 'ไฟดับ / ไฟส่องทาง': 'Power / street lighting',
  'ต้นไม้ล้ม / กิ่งไม้': 'Fallen tree / branches',
  'อื่นๆ': 'Other',
  'ทุกปัญหา มีความคืบหน้า': 'Every issue can move forward',
  '5 ปัญหาที่ชุมชนสนใจมากที่สุด': 'Top 5 most-voted community issues',
  'สำรวจปัญหาในพื้นที่': 'Explore local issues', 'ความคืบหน้าเรื่อง': 'Issue progress',
  'แจ้งล่าสุด': 'Most recently reported', 'ทุกประเภท': 'All categories', 'ทุกสถานะ': 'All statuses',
  'โหวตมากที่สุด': 'Most votes', 'โหวตน้อยที่สุด': 'Fewest votes',
  'ค้นหาเลขเรื่อง ปัญหา หรือสถานที่': 'Search issue ID, issue or place',
  'ค้นหาชื่อเรื่องหรือเลขคำร้อง': 'Search title or report ID',
  'ค้นหาเลขเรื่อง ชื่อ หรือสถานที่': 'Search ID, title or place',
  'ค้นหาคำร้อง': 'Search reports', 'ล้างคำค้น': 'Clear search', 'กรองประเภทปัญหา': 'Filter category',
  'เรียงรายการปัญหา': 'Sort issues', 'เรียงรายการคำร้อง': 'Sort reports',
  'รูปแบบหมุดแผนที่': 'Map marker mode', 'แผนที่ปัญหา': 'Issue map',
  'การแสดงรายการปัญหา': 'Issue list display', 'หน้ารายการติดตาม': 'Tracking pages',
  'ดูเรื่องที่ติดตาม': 'View followed issues', 'เมนูประชาชน': 'Citizen menu',
  'ปิดเมนูประชาชน': 'Close citizen menu', 'แสดงเมนูประชาชน': 'Open citizen menu',
  'ซ่อนเมนูประชาชน': 'Close citizen menu', 'ขั้นตอนแจ้งและติดตามปัญหา': 'Reporting and tracking steps',
  'ตรวจปัญหาใกล้จุดเกิดเหตุ': 'Check nearby issues',
  'ขอบคุณที่ช่วยดูแลชุมชน': 'Thank you for helping the community',
  'กรองสถานะเรื่องที่ติดตาม': 'Filter tracked issues', 'ความคืบหน้า': 'Progress',
  'ความพึงพอใจต่อเรื่องนี้': 'Satisfaction with this issue',
  'เจ้าหน้าที่ขอข้อมูลเพิ่มเติม': 'Staff requested more information',
  'แก้ไขคำร้อง': 'Correct report', 'แก้ไขและส่งข้อมูลเพิ่มเติม': 'Edit and send more information',
  'ประเมินความพึงพอใจ': 'Rate satisfaction', 'ให้คะแนนความพึงพอใจ': 'Satisfaction rating',
  'เลือกดาว 1–5 ดวง': 'Choose 1–5 stars', 'ควรปรับปรุงมาก': 'Very dissatisfied',
  'ควรปรับปรุง': 'Dissatisfied', 'ปานกลาง': 'Neutral', 'พึงพอใจ': 'Satisfied',
  'พึงพอใจมาก': 'Very satisfied', 'ทั่วไป': 'Normal', 'เร่งด่วน': 'Urgent', 'ฉุกเฉิน': 'Emergency',
  'ดำเนินการขั้นถัดไป': 'Next action', 'ดูเพิ่ม 10 เรื่อง': 'Show 10 more',
  'แผนลงพื้นที่': 'Site visit plan', 'แผนและขอบเขตงาน': 'Plan and scope',
  'เรื่องที่ต้องตัดสินใจ': 'Decisions needed', 'ภารกิจของฉัน': 'My tasks',
  'ภาพรวมงาน': 'Task overview', 'เรื่องเร่งด่วน': 'Urgent issue',
  'แจ้งเตือนคำขอทรัพยากร': 'Resource request alert', 'เปิดเรื่องแรก': 'Open first issue',
  'เปิดคำขอ': 'Open request', 'มุมมองงาน': 'Task view', 'กรองตามความเร่งด่วน': 'Filter by urgency',
  'คำร้อง': 'Reports', 'ประวัติ': 'History', 'รายการงาน': 'Task list',
  'จำนวน / ปริมาณ': 'Quantity', 'ระยะเวลา / วันที่ต้องใช้': 'When needed',
  'หมายเหตุประกอบการส่ง': 'Forwarding note', 'ผู้อนุมัติรับพิจารณา': 'Assigned approver',
  'เลขเอกสารส่งพิจารณา': 'Proposal reference number',
  'กำลังตรวจสอบตำแหน่งของอุปกรณ์…': 'Checking device location…',
  'ยังโหลดเบอร์ใกล้ตัวไม่ได้': 'Could not load nearby contacts',
  'กำลังค้นหาหน่วยงานในรัศมี 20 กิโลเมตร': 'Finding services within 20 km',
  'กำลังตรวจตำแหน่งเพื่อค้นหาหน่วยงานในเขตบริการ': 'Checking location for nearby services',
  'เรียงจากหน่วยงานที่อยู่ใกล้ตำแหน่ง GPS มากที่สุด': 'Sorted by distance from your GPS location',
  'กดโทรเพื่อขอความช่วยเหลือ หรือดูหน่วยงานใกล้ตำแหน่งของคุณ': 'Tap a number to call, or see services near your location',
  'ใช้เบอร์ส่วนกลางได้ตามปกติ การค้นหาหน่วยงานใกล้ตัวต้องได้รับอนุญาตและพิกัดจากอุปกรณ์': 'National numbers remain available. Nearby services need location permission and GPS.',
});

Object.assign(translations, {
  'ใช้งานต่อได้โดยไม่เปิดตำแหน่ง': 'You can continue without location access',
  'ภาพรวมชุมชน': 'Community overview', 'เรื่องที่แจ้งทั้งหมด': 'Reports submitted',
  'เสียงสนับสนุนจากชุมชน': 'Community votes', 'แก้ไขและปิดเรื่องแล้ว': 'Resolved and closed',
  'สัดส่วนปิดเรื่อง': 'Closure rate', 'ทุกเสียงช่วยยืนยันปัญหา': 'Every vote helps confirm an issue',
  'ค้นหาเรื่องใกล้ตัว แล้วดูตำแหน่งและความคืบหน้าได้ในที่เดียว': 'Find local issues, locations and progress in one place',
  'แผนที่ชุมชน': 'Community map', 'แตะหมุดเพื่อดูรายละเอียด': 'Tap a marker for details',
  'เลือกสถานะเพื่อกรองทั้งแผนที่และรายการด้านล่าง': 'Choose a status to filter the map and list below',
  'ผลการค้นหา': 'Search results', 'ดาวน์โหลดรายการ': 'Download list',
  'เรียงตาม': 'Sort by', 'เรียงตามวันที่แจ้ง': 'Sort by report date',
  'โหวต': 'Votes', 'เสียง': 'Votes', 'อันดับ': 'Rank', 'ยืนยันปัญหา': 'Confirm issue',
  'ดูเรื่อง': 'View issue', 'ดำเนินการเสร็จแล้ว': 'Work completed',
  'กำลังแก้ไขในพื้นที่': 'Being resolved on site', 'อยู่ระหว่างพิจารณา': 'Under review',
  'ลำดับงาน': 'Workflow', 'โต๊ะรับเรื่อง': 'Intake desk', 'โต๊ะพิจารณา': 'Approval desk',
  'รับเรื่อง': 'Receive report', 'ประเมินและมอบหมาย': 'Assess and assign',
  'ส่งข้อเสนอ / ทรัพยากร': 'Send proposal / resources',
  'รับแผน': 'Receive plan', 'จัดทีม / ตรวจทรัพยากร': 'Assign team / review resources',
  'ตรวจคุณภาพ': 'Review quality', 'ลงพื้นที่ / ขอทรัพยากร': 'Site work / resources',
  'ส่งหลักฐาน': 'Submit evidence', 'ตรวจข้อเสนอ': 'Review proposal',
  'พิจารณา': 'Decide', 'บันทึกผล': 'Record decision',
  'วันนี้': 'Today', 'นัดวันนี้': 'Scheduled today', 'รอรับงาน': 'Awaiting acceptance',
  'รอจัดทีม': 'Awaiting team assignment', 'รอตรวจงาน': 'Awaiting work review',
  'กำลังทำ': 'In progress', 'ต้องดูแล': 'Needs attention',
  'รอประเมินและมอบหมาย': 'Awaiting assessment and assignment',
  'คำขอทรัพยากรรอตรวจ': 'Resource requests to review',
  'คำขอทรัพยากรรอส่ง': 'Resource requests to forward',
  'คำร้องเข้ามาใหม่': 'New reports', 'งานที่ต้องจัดทีม': 'Tasks awaiting assignment',
  'ข้อเสนอที่รอพิจารณา': 'Proposals awaiting decision',
  'เส้นทางและงานวันนี้': 'Today’s route and tasks',
  'แยกตามความเร่งด่วน': 'Filter by urgency', 'รวมเรื่อง': 'All issues',
  'วันนัดหมาย': 'Appointment date', 'เรียงรายการตาม': 'Sort list by',
  'ดูรายละเอียดผู้แจ้ง สถานที่ และหลักฐานก่อนรับเรื่อง': 'Review reporter, place and evidence before accepting',
  'ตรวจความเร่งด่วนและคำขอทรัพยากรก่อนมอบหมายงาน': 'Review urgency and resource requests before assigning work',
  'ตรวจจุดเกิดเหตุ คำแนะนำ และวันนัดก่อนออกปฏิบัติงาน': 'Check the issue location, guidance and date before site work',
  'ตรวจวงเงิน เหตุผล และเอกสารอ้างอิงก่อนบันทึกผล': 'Review amount, reasons and documents before deciding',
  'เปิดคำร้องเพื่อตรวจข้อมูล': 'Open a report to review details',
  'เลือกข้อเสนอเพื่อพิจารณา': 'Select a proposal to review',
  'เลือกงานเพื่อจัดทีม': 'Select a task to assign',
  'เลือกงานเพื่อดูเส้นทาง': 'Select a task to view its route',
  'เลือกรายการจากคิวงาน': 'Select an item from the queue',
  'เมนูหลัก': 'Main menu', 'เรื่องใหม่หรือรอข้อมูลจากผู้แจ้ง': 'New reports or awaiting citizen details',
  'พร้อมทำงาน': 'Ready for work', 'จุด': 'Locations', 'เรื่อง': 'Issues',
  'แสดง': 'Showing', 'จาก': 'of', 'แจ้งเมื่อ': 'Reported on',
  'ข้อมูลสาธิต · ยังไม่เชื่อมต่อการสั่งทีมจริงหรือเอกสารราชการ': 'Demo data · not connected to live work orders or official documents',
  '· ข้อมูลตัวอย่าง': '· Sample data',
  'TownTrack · เมืองที่ดี เริ่มจากการรับฟัง ·': 'TownTrack · Better communities begin by listening ·',
});

Object.assign(translations, {
  'กรุณากรอกรายละเอียดปัญหา': 'Please describe the issue',
  'กรุณาเลือกอนุญาตในข้อความของอุปกรณ์ เพื่อใช้ตำแหน่งปัจจุบันและค้นหาเบอร์ช่วยเหลือใกล้ตัว': 'Allow location access in the device prompt to use your position and find nearby help',
  'กรุณาแนบรูปหลักฐานหรือวิดีโออย่างน้อย 1 ไฟล์': 'Attach at least one photo or video',
  'กำลังขอใช้ตำแหน่งของคุณ': 'Requesting your location',
  'ขอบคุณที่ประเมินความพึงพอใจ': 'Thank you for your rating',
  'คุณสามารถแจ้งคำร้องใหม่ได้': 'You can submit another report',
  'จุดสังเกตหรือสถานที่': 'Landmark or place',
  'จุดอ้างอิงเทศบาล · ยังไม่ได้ใช้ GPS': 'Municipal reference point · GPS not used',
  'จุดเกิดเหตุที่เลือกบนแผนที่': 'Issue location selected on the map',
  'ชื่อเรื่อง': 'Title', 'ชื่อ–นามสกุล': 'Full name', 'ติดตาม/แก้ไข': 'Track / correct',
  'ปิดเรื่องแล้ว · แตะเพื่อประเมินความพึงพอใจ': 'Closed · tap to rate satisfaction',
  'พิกัดจาก GPS ของคุณ': 'Your GPS coordinates', 'ยังไม่พบตำแหน่งของคุณ': 'Your location is not available',
  'ยังไม่พบปัญหาใกล้จุดนี้': 'No nearby issues found', 'ยังไม่มีเรื่องที่คุณแจ้ง': 'You have not reported an issue yet',
  'ยังไม่ได้ติดตามปัญหา': 'You are not following any issues',
  'ยืนยันตัวตนแล้ว': 'Identity confirmed', 'ยืนยันส่งข้อมูล': 'Confirm submission',
  'ลองจิจูด': 'Longitude', 'ละติจูด': 'Latitude', 'สถานที่เกิดเหตุ': 'Issue location',
  'ลองเลือกสถานะทั้งหมด หรือเปลี่ยนคำค้นหา': 'Try all statuses or change the search',
  'ส่งข้อมูลเพิ่มเติมแล้ว เจ้าหน้าที่จะตรวจคำร้องอีกครั้ง': 'Additional information sent. Staff will review the report again.',
  'ส่งข้อมูลให้เจ้าหน้าที่': 'Send to staff', 'ส่งคำร้องสำเร็จ': 'Report submitted',
  'หน้าก่อนหน้า': 'Previous page', 'หน้าถัดไป': 'Next page', 'หมดเขตแล้ว': 'Deadline passed',
  'เกิดอะไรขึ้น และกระทบคนในพื้นที่อย่างไร': 'What happened, and how does it affect local people?',
  'เช็กเรื่องซ้ำ': 'Check for duplicates', 'เช่น การแจ้งความคืบหน้า หรือคุณภาพงาน': 'For example, progress updates or work quality',
  'เช่น ซอย 3 หน้าโรงเรียน': 'For example, Lane 3 near the school',
  'เช่น ไฟส่องสว่างดับท้ายซอย': 'For example, streetlight out at the end of the lane',
  'เบอร์โทรศัพท์': 'Phone number', 'เพิ่มรูปหรือวิดีโอประกอบ': 'Add a photo or video',
  'เริ่มจากหน้าหลัก หรือเลือกติดตามปัญหาที่พบ': 'Start from Home or follow an issue you found',
  'เรื่องปิดแล้ว ช่วยบอกความเห็นเพื่อปรับปรุงบริการ': 'This issue is closed. Share feedback to help improve the service.',
  'แนบรูปหรือวิดีโออย่างน้อย 1 ไฟล์': 'Attach at least one photo or video',
  'โปรดตรวจสอบและเติมข้อมูลให้ครบถ้วน': 'Please check and complete the required information',
  'ใช้ GPS ของฉัน': 'Use my GPS', 'ใช้พิกัด GPS ของอุปกรณ์แล้ว': 'Device GPS coordinates selected',
  'ไม่บังคับ': 'Optional', 'ไม่บังคับ · สำหรับติดต่อกลับ': 'Optional · for follow-up contact',
  'ไม่บังคับ · เว้นว่างได้': 'Optional · may be left blank',
  'ไม่บังคับ · ไม่เกิน 300 ตัวอักษร': 'Optional · up to 300 characters',
  'ไม่พบเรื่องตามเงื่อนไขที่เลือก': 'No issues match these filters',
  'กำลังบันทึก…': 'Saving…', 'ขอข้อมูลเพิ่ม': 'Request more details',
  'ขอให้ทีมแก้ไขเพิ่มเติม': 'Ask the team to make corrections',
  'ข้อมูลหรือเอกสารที่ต้องเพิ่มเติม': 'Missing information or documents',
  'ข้อเสนอขอใช้งบประมาณ': 'Budget proposal',
  'ข้อเสนอขอใช้งบประมาณ / ทรัพยากร': 'Budget / resource proposal',
  'ข้อเสนอคำสั่งตามกฎหมาย': 'Legal order proposal',
  'งบประมาณและคำสั่ง': 'Budget and orders', 'งานที่เสร็จแล้ว': 'Completed tasks',
  'จัดทีมและมอบหมายงาน': 'Assign team and tasks',
  'ฐานกฎหมายและข้อเสนอคำสั่ง': 'Legal basis and proposed order',
  'ดำเนินงานอะไร ผลเป็นอย่างไร และตรวจความปลอดภัยแล้วหรือไม่': 'What work was done, what was the result, and was safety checked?',
  'ตรวจผลสุดท้ายและปิดเรื่อง': 'Final review and closure',
  'ติดตามการปฏิบัติตามคำสั่ง': 'Follow up on the order',
  'ทั้งหมดในเขตเทศบาล': 'Across the municipality',
  'ทีมภาคสนามส่งคำขอทรัพยากร': 'Field team submitted a resource request',
  'บันทึกผลแล้ว': 'Result recorded', 'บันทึกและส่งหัวหน้าทีม': 'Save and send to supervisor',
  'ประวัติคำร้อง': 'Report history', 'ประวัติงานทีม': 'Team work history',
  'ประเมินและมอบหมายหัวหน้าทีม': 'Assess and assign a supervisor',
  'ประเมินและมอบหมายหัวหน้าทีมแล้ว': 'Supervisor assessed and assigned',
  'ผลการพิจารณา': 'Decision result',
  'ผลตรวจและคำอธิบายการแก้ไข': 'Review result and correction details',
  'ผลตรวจและเหตุผลอนุมัติ': 'Review result and approval reason',
  'ผลที่พบ / การดำเนินงาน / ความปลอดภัย': 'Findings / work / safety',
  'ผู้มีอำนาจรับพิจารณา': 'Assigned approver', 'ผู้ลงพื้นที่': 'Field worker',
  'ผ่าน · ส่งให้เทศบาลตรวจปิด': 'Passed · send for final closure review',
  'มอบหมายทีมลงพื้นที่แล้ว': 'Field team assigned',
  'ยังไม่กำหนดวันลงพื้นที่': 'Site visit date not set',
  'ยังไม่มีรายละเอียดแผนงาน': 'No work plan details yet',
  'ยืนยันทรัพยากรและขั้นตอนพร้อม': 'Confirm resources and steps are ready',
  'ยืนยันปิดเรื่อง': 'Confirm closure', 'ยืนยันผลตรวจคุณภาพ': 'Confirm quality review',
  'ยืนยันผลและปิดเรื่อง': 'Confirm result and close', 'ยืนยันออกคำสั่ง': 'Confirm order',
  'ยืนยันและส่งกลับหัวหน้าทีม': 'Confirm and return to supervisor',
  'ย้อนหลัง': 'History', 'ระบุข้อมูลให้ผู้รับผิดชอบขั้นถัดไปเข้าใจ': 'Explain the details for the next person responsible',
  'ระบุคำชี้แจงเพิ่มเติม หากผู้อนุมัติขอข้อมูล': 'Add an explanation if the approver needs more information',
  'ระยะเวลา / กำหนดดำเนินงาน': 'Duration / completion date',
  'รายการทรัพยากร / ขอบเขตงาน': 'Resources / work scope',
  'รายการทรัพยากรที่ต้องการ': 'Resources requested',
  'รายงานผลการปฏิบัติงาน': 'Work report',
  'ลองเปลี่ยนตัวกรอง หรือเปิดดูประวัติ': 'Try another filter or view history',
  'ลำดับงานตามบทบาท': 'Role workflow', 'วงเงินประมาณการ (บาท)': 'Estimated amount (THB)',
  'สรุปงาน': 'Task summary', 'สรุปผลตรวจและเหตุผลประกอบการมอบหมาย': 'Summarize findings and assignment reason',
  'สำรวจจุดเกิดเหตุ กั้นพื้นที่ และดำเนินการตามแผน': 'Inspect the site, secure the area and follow the plan',
  'สิ่งที่ต้องแก้ไข / เพิ่มเติม': 'Corrections / additional information',
  'ส่งกลับให้ทีมทำงานต่อ': 'Return for further work',
  'ส่งกลับให้ทีมแก้ไข': 'Return for team corrections',
  'ส่งข้อเสนอให้ผู้มีอำนาจแล้ว': 'Proposal sent to approver',
  'ส่งคำขอทรัพยากรให้ผู้อนุมัติ': 'Send resource request to approver',
  'ส่งคำขอให้ผู้อนุมัติแล้ว': 'Request sent to approver',
  'ส่งคำขอให้หัวหน้าทีมแล้ว': 'Request sent to supervisor',
  'ส่งคำขอให้เจ้าหน้าที่รับเรื่องแล้ว': 'Request sent to intake staff',
  'ส่งพิจารณา': 'Submit for decision', 'ส่งรายงาน': 'Submit report',
  'ส่งรายงานให้หัวหน้าตรวจแล้ว': 'Report sent to supervisor',
  'ส่งให้หัวหน้าตรวจ': 'Send to supervisor for review',
  'หลักฐานก่อนดำเนินการ': 'Before-work evidence',
  'หลักฐานหรือเลขเอกสารอ้างอิง': 'Evidence or document reference',
  'หลักฐานหลังดำเนินการ': 'After-work evidence',
  'หัวหน้าทีมส่งคำขอทรัพยากรให้ตรวจ': 'Supervisor submitted a resource request for review',
  'อนุมัติข้อเสนองบประมาณ': 'Approve budget proposal',
  'อนุมัติข้อเสนอแล้ว เจ้าหน้าที่จะเตรียมทรัพยากรก่อนเริ่มงาน': 'Proposal approved. Staff will prepare resources before work starts.',
  'อนุมัติและส่งเจ้าหน้าที่': 'Approve and send to staff',
  'ออกคำสั่งแจ้งคู่กรณี': 'Issue order and notify affected party',
  'ออกคำสั่งและแจ้งคู่กรณี': 'Issue order and notify affected party',
  'อ้างอิงเอกสารคำสั่งและการแจ้งคู่กรณีจริง ปุ่มนี้เป็นการจำลองผลพิจารณา': 'Reference the actual order and notification documents. This button simulates a decision.',
  'เก็บประวัติครบถ้วน': 'History recorded',
  'เก็บแบบร่างแล้ว ยังไม่ส่งผู้มีอำนาจ': 'Draft saved; not sent to approver',
  'เก็บแบบร่างไม่ได้': 'Could not save draft',
  'เช่น 2 ชุด': 'For example, 2 sets',
  'เช่น 3 วันหลังทรัพยากรพร้อม': 'For example, 3 days after resources are ready',
  'เช่น ทรัพยากร TT-001/2569': 'For example, Resources TT-001/2026',
  'เช่น ฝาท่อคอนกรีตและอุปกรณ์ติดตั้ง': 'For example, a concrete drain cover and installation tools',
  'เช่น ภายใน 3 วัน': 'For example, within 3 days',
  'เช่น อนุมัติ ช.015/2569': 'For example, approval ref. 015/2026',
  'เมื่อมีข้อเสนอส่งถึงคุณ รายการจะแสดงที่นี่': 'Proposals assigned to you will appear here',
  'เริ่มปฏิบัติงานแล้ว': 'Work started',
  'เลขเอกสาร / หลักฐานอ้างอิง': 'Document number / evidence reference',
  'เสนอคำสั่งตามกฎหมาย / ข้อพิพาท': 'Propose a legal order / dispute action',
  'เหตุผล / ผลตรวจ / สิ่งที่ต้องเพิ่มเติม': 'Reason / findings / missing information',
  'เหตุผลปฏิเสธเพื่อให้หัวหน้าจัดทีมใหม่': 'Reason for declining so the supervisor can reassign',
  'เหตุผลและความจำเป็น': 'Reason and necessity',
  'เหตุผลและแนวทางที่ใช้ทรัพยากรเดิม': 'Reason and plan using existing resources',
  'แนบหลักฐานประกอบข้อเสนอ': 'Attach proposal evidence',
  'แหล่งงบ / ทรัพยากร': 'Budget source / resources',
  'ให้ทีมดำเนินงานด้วยทรัพยากรเดิม': 'Continue using existing resources',
  'ไม่พบงานในรายการนี้': 'No tasks in this list',
  'ไม่อนุมัติข้อเสนอ': 'Decline proposal',
  'ไม่ออกคำสั่ง · ยุติเรื่อง': 'Do not issue an order · end the matter',
  'ไม่ออกคำสั่งและยุติเรื่อง': 'Do not issue an order and end the matter',
});

Object.assign(translations, {
  'ไม่สามารถใช้ตำแหน่งของฉันหรือค้นหาเบอร์ฉุกเฉินใกล้ฉันได้ คุณยังแจ้งและติดตามปัญหาได้ โดยระบุจุดเกิดเหตุเอง': 'Your location and nearby emergency contacts are unavailable. You can still report and track issues by entering the location yourself.',
  'หากต้องการเปิดใช้ภายหลัง ให้เปลี่ยนสิทธิ์ตำแหน่งในการตั้งค่าของเบราว์เซอร์หรือ LINE แล้วเปิดหน้านี้ใหม่': 'To enable it later, allow location access in your browser or LINE settings, then reopen this page.',
  'กรุณาส่งภายใน 7 วัน · ปิดเรื่องอัตโนมัติเมื่อพ้นกำหนด': 'Please respond within 7 days · the issue closes automatically after the deadline.',
  'การแก้ไขปัญหาเรื่องนี้ตรงกับความคาดหวังของคุณแค่ไหน': 'How well did the result meet your expectations?',
  'ความคิดเห็นส่งให้เจ้าหน้าที่ประกอบการปรับปรุงบริการ ไม่แสดงในรายการปัญหาสาธารณะ': 'Your feedback helps staff improve the service and is not shown in the public issue list.',
  'บอกข้อมูลให้ครบ เพื่อให้เจ้าหน้าที่ช่วยได้เร็วขึ้น': 'Provide complete details so staff can help sooner.',
  'เลือก “ปิดเรื่องแล้ว” แล้วกดเรื่องเพื่อประเมินความพึงพอใจ เรื่องที่ให้คะแนนแล้วดูได้ใน “ประเมินแล้ว”': 'Choose “Closed” and open an issue to rate it. Previously rated issues appear under “Rated”.',
  'แนบหลักฐานครบ 5 ไฟล์แล้ว · รายละเอียดเดิมจะยังคงอยู่': 'Five files are already attached · existing details will be kept.',
  'งานภาคสนามส่งคำขอทรัพยากร · กรุณาตรวจรายละเอียด': 'A field worker requested resources · please review the details.',
  'ปิดเรื่องแล้ว · ดูย้อนหลังได้ แก้ไขไม่ได้': 'This issue is closed · you can view its history but cannot edit it.',
  'ส่งคำขอทรัพยากรแล้ว · รอการตรวจและอนุมัติก่อนเริ่มงาน': 'Resource request sent · await review and approval before starting work.',
  'หัวหน้าทีมตรวจคำขอแล้ว · โปรดตรวจรายละเอียดก่อนส่งผู้อนุมัติ': 'The supervisor reviewed the request · check the details before forwarding it to the approver.',
  'อนุมัติแล้ว ต้องบันทึกหลักฐานพร้อมก่อนส่งทีมเริ่มงาน': 'Approved · record proof that resources are ready before the team starts.',
  'ค้นหาจากข้อมูล OpenStreetMap ในรัศมี 20 กิโลเมตร': 'Searching OpenStreetMap data within 20 km.',
  'หากไม่อนุญาตตำแหน่ง ระบบจะไม่ค้นหาหรือแสดงโรงพยาบาล ตำรวจ และกู้ภัยใกล้ตัว คุณยังแจ้งเรื่อง ติดตาม และใช้เบอร์ส่วนกลางได้': 'Without location permission, nearby hospitals, police and rescue services cannot be shown. Reporting, tracking and national numbers remain available.',
  'ไม่พบหน่วยงานที่มีข้อมูลในรัศมี 20 กิโลเมตร': 'No listed services found within 20 km.',
  'ข้อมูลจำลอง · รูปตัวอย่างจากอินเทอร์เน็ต ไม่ใช่เหตุการณ์จริงในเทศบาล': 'Sample data · online illustration, not a real municipal incident.',
  'ภาพจำลองเพื่อทดสอบ · ไม่ใช่แผนที่หรือขอบเขตทางราชการ': 'Test illustration · not an official map or boundary.',
  'ข้อมูลเดิมยังอยู่ในเบราว์เซอร์ ลองโหลดหน้าอีกครั้ง': 'Your data remains in this browser. Try reloading the page.',
  'ตรวจข้อมูลส่วนบุคคลก่อนส่ง': 'Check personal information before submitting',
  'ใช้รายละเอียด พิกัด และหลักฐานเพื่อดำเนินการตามคำร้อง ชื่อและเบอร์ติดต่อใช้สำหรับติดต่อกลับ กรุณาหลีกเลี่ยงภาพบัตรประชาชน ใบหน้า หรือข้อมูลของผู้อื่นที่ไม่จำเป็น ต้นแบบนี้เก็บข้อมูลในเบราว์เซอร์ของคุณ': 'Details, coordinates and evidence are used to process your report. Name and phone are used for follow-up. Avoid unnecessary ID cards, faces or other people’s personal information. This prototype stores data in your browser.',
  'อ่านรายละเอียดการใช้ข้อมูล (เปิดแท็บใหม่)': 'Read how your data is used (opens a new tab)',
});

Object.assign(translations, {
  'เครดิตภาพตัวอย่าง': 'Sample image credit',
  'ดูเรื่องเพิ่ม (': 'Show more (', 'เรื่อง)': ' issues)', 'เรื่อง · หน้า': 'issues · page',
  'พบ': 'Found', 'เรื่อง · ประเมินและมอบหมายหัวหน้าทีม': 'issues · assess and assign a supervisor',
  'มีเรื่องเร่งด่วนรอประเมิน': 'Urgent issues are awaiting assessment',
  'วางแผนและจัดทีม': 'Plan and assign the team',
  'ก่อนแจ้งปัญหา': 'Before reporting', 'ดูเรื่องในระยะ 100 เมตร': 'View issues within 100 metres',
  'เพื่อช่วยลดการแจ้งซ้ำ': 'Help avoid duplicate reports',
  'แตะบนแผนที่เพื่อเลือกจุดเกิดเหตุ': 'Tap the map to select the issue location',
  'ปัญหาใกล้คุณ': 'Issues near you', 'ภายใน 100 เมตร': 'Within 100 metres',
  'เมตร': 'metres', 'ไม่พบเรื่องนี้? แจ้งปัญหาใหม่': 'Issue not listed? Report a new one',
  'กลับไปที่รายการ': 'Back to list', 'ตรวจข้อมูลและดำเนินการ': 'Review details and take action',
  'ไปที่ปุ่มดำเนินการ ↓': 'Go to actions ↓', 'เปิดพิกัดบนแผนที่': 'Open location on map',
  'ข้อมูลติดต่อผู้แจ้ง': 'Reporter contact', 'ไม่ได้ระบุเบอร์โทร': 'No phone number provided',
  'ภาพตัวอย่างประกอบข้อมูลจำลอง': 'Illustration for sample data',
  'เลือกขั้นดำเนินการสำหรับคำร้องนี้': 'Choose the next step for this report',
  'ประวัติรายการ': 'Issue history', 'ขั้นตอน': 'Steps',
  'แจ้งเรื่อง': 'Reported', 'รับคำร้อง': 'Received', 'กำลังแก้ไข': 'In progress',
  'ตรวจสอบ': 'Review', 'ข้อมูลจำลองสำหรับทดสอบ · ไฟส่องสว่างดับ': 'Sample data for testing · streetlight out',
  'ระบบตัวอย่าง': 'Demo system', 'รอผู้รับผิดชอบขั้นถัดไป ·': 'Awaiting the next responsible person ·',
  'ส่งรายงานพร้อมภาพก่อน / หลัง': 'Submit report with before / after photos',
  'ฉบับ': 'Version', 'วงเงินประมาณการ': 'Estimated amount',
  'รายการ / ขอบเขต': 'Items / scope', 'ระยะเวลา': 'Duration', 'แหล่งงบ': 'Budget source',
  'ส่งโดย': 'Submitted by', 'ไม่มีไฟล์แนบ': 'No attachments',
  'สถานะปัจจุบันของข้อมูลตัวอย่าง': 'Current status of sample data',
  'เทศบาล': 'Municipality', 'รับเรื่องตัวอย่างในระบบ': 'Sample report received in system',
  'ระบบ': 'System', 'กลับไปดูปัญหาใกล้ตัว': 'Back to nearby issues',
  'คำร้องใหม่': 'New report', '(จำเป็น)': '(required)',
  'JPG, PNG, WebP, MP4, WebM, MOV · น้อยกว่า 10 MB/ไฟล์': 'JPG, PNG, WebP, MP4, WebM, MOV · under 10 MB per file',
  'ทุกเรื่องมีความคืบหน้า': 'Follow every issue',
  'เรื่องที่ฉันแจ้งเอง': 'Issues I reported',
  'เหตุด่วนเหตุร้าย': 'Emergency assistance', 'ตำรวจ · ทั่วประเทศ': 'Police · nationwide',
  'แพทย์ฉุกเฉิน': 'Emergency medical service',
  'อุบัติเหตุหรือเจ็บป่วยฉุกเฉิน · ทั่วประเทศ': 'Accidents or medical emergencies · nationwide',
  'แจ้งเหตุเพลิงไหม้': 'Fire emergency hotline', 'ดับเพลิงและกู้ภัย': 'Fire and rescue',
  'ตำรวจท่องเที่ยว': 'Tourist police', 'ช่วยเหลือนักท่องเที่ยว': 'Tourist assistance',
  'ยังไม่เปิดใช้บริการใกล้ตำแหน่งของคุณ': 'Nearby services are unavailable without your location',
  'ภาพและหลักฐาน': 'Photos and evidence', 'สถานที่เกิดเหตุ': 'Issue location',
  'งานที่อัปเดตล่าสุดสูงสุด 10 เรื่อง · แตะรายการเพื่อดูรายละเอียด': 'Up to 10 recently updated issues · tap one to view details',
  'เรียงตามวันที่อัปเดตใหม่สุด': 'Sorted by most recent update',
  'เรื่องล่าสุดที่ต้องตรวจ': 'Latest issues to review', 'งานทีมล่าสุด': 'Latest team tasks',
  'งานภาคสนามล่าสุด': 'Latest field tasks', 'ข้อเสนอล่าสุด': 'Latest proposals',
  'งานที่ต้องดูแล': 'Issues to handle',
});

Object.assign(translations, {
  'เปิดเรื่อง': 'View issues',
  'เลือกเรื่องที่ต้องการดูรายละเอียดและดำเนินการ': 'Choose an issue to review and take action.',
  'ค้นหาเรื่องในรายการ': 'Search issues in this list',
  'ดูรายละเอียดและดำเนินการ': 'View details and take action',
  'เรื่องเร่งด่วนรอประเมิน': 'Urgent issues awaiting assessment',
  'คำขอทรัพยากรรอดำเนินการ': 'Resource requests awaiting action',
  'งานที่รอรับ': 'Tasks awaiting acceptance',
  'มีงานรอรับมอบหมาย': 'Tasks are awaiting acceptance',
  'มีข้อเสนอรอพิจารณา': 'Proposals are awaiting review',
  'เรื่อง · เลือกเรื่องเพื่อดำเนินการ': 'issues · choose an issue to take action',
  'ลองเปลี่ยนคำค้นหา': 'Try a different search term',
  'ข้อมูลตัวอย่าง': 'Sample data',
  'ภาพประกอบ': 'Supporting image',
});

function translateValue(source) {
  if (translations[source]) return translations[source];
  let match;
  if ((match = /^พบ ([\d,]+) เรื่อง$/.exec(source))) return `${match[1]} issues found`;
  if ((match = /^([\d,]+) เรื่อง$/.exec(source))) return `${match[1]} issues`;
  if ((match = /^([\d,]+) โหวต$/.exec(source))) return `${match[1]} votes`;
  if ((match = /^👍 ([\d,]+) โหวต$/.exec(source))) return `👍 ${match[1]} votes`;
  if ((match = /^แจ้งเมื่อ (.+)$/.exec(source))) return `Reported ${match[1]}`;
  if ((match = /^อัปเดต (.+)$/.exec(source))) return `Updated ${match[1]}`;
  if ((match = /^([\d,]+) เรื่อง · ประเมินและมอบหมายหัวหน้าทีม$/.exec(source))) return `${match[1]} issues · assess and assign a supervisor`;
  if ((match = /^แสดง ([\d,]+) จาก ([\d,]+) เรื่อง$/.exec(source))) return `Showing ${match[1]} of ${match[2]} issues`;
  if ((match = /^แสดง ([\d,]+) จาก$/.exec(source))) return `Showing ${match[1]} of`;
  if ((match = /^ดูเรื่องเพิ่ม \(([\d,]+) เรื่อง\)$/.exec(source))) return `Show ${match[1]} more issues`;
  if ((match = /^หน้า ([\d,]+)$/.exec(source))) return `Page ${match[1]}`;
  if ((match = /^([1-5]) คะแนน: (.+)$/.exec(source))) return `${match[1]} stars: ${translations[match[2]] || match[2]}`;
  if ((match = /^โหวต ([A-Z]{1,4}-[\w-]+)$/.exec(source))) return `Vote for ${match[1]}`;
  if ((match = /^ติดตาม ([A-Z]{1,4}-[\w-]+)$/.exec(source))) return `Follow ${match[1]}`;
  if ((match = /^ดูรายละเอียดและภาพประกอบ ([A-Z]{1,4}-[\w-]+)$/.exec(source))) return `View details and image for ${match[1]}`;
  return null;
}

const originals = new WeakMap();
function translateText(node, lang) {
  if (!node?.parentElement || node.parentElement.closest('script,style,textarea,[contenteditable="true"],.information-main,.information-header')) return;
  let source = originals.get(node);
  const expectedEnglish = source === undefined ? undefined : source.replace(source.trim(), translateValue(source.trim()) || source.trim());
  if (source === undefined || (node.nodeValue !== source && node.nodeValue !== expectedEnglish)) {
    source = node.nodeValue;
    originals.set(node, source);
  }
  const trimmed = source.trim();
  const replacement = lang === 'en' ? translateValue(trimmed) : undefined;
  if (!trimmed || !translateValue(trimmed)) return;
  const next = replacement ? source.replace(trimmed, replacement) : source;
  if (node.nodeValue !== next) node.nodeValue = next;
}
function translateElement(element, lang) {
  if (element.nodeType === Node.TEXT_NODE) { translateText(element, lang); return; }
  if (element.nodeType !== Node.ELEMENT_NODE) return;
  if (element.matches('script,style')) return;
  for (const attr of ['placeholder', 'title', 'aria-label']) {
    const sourceKey = `ttOriginal${attr.replace('-', '')}`;
    const current = element.getAttribute(attr);
    if (current === null) continue;
    const source = element.dataset[sourceKey] || current;
    if (translateValue(source)) {
      element.dataset[sourceKey] = source;
      const next = lang === 'en' ? translateValue(source) : source;
      if (current !== next) element.setAttribute(attr, next);
    }
  }
  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
  let textNode;
  while ((textNode = walker.nextNode())) translateText(textNode, lang);
  element.querySelectorAll('*').forEach((child) => {
    for (const attr of ['placeholder', 'title', 'aria-label']) {
      const sourceKey = `ttOriginal${attr.replace('-', '')}`;
      const current = child.getAttribute(attr);
      if (current === null) continue;
      const source = child.dataset[sourceKey] || current;
      if (translateValue(source)) {
        child.dataset[sourceKey] = source;
        const next = lang === 'en' ? translateValue(source) : source;
        if (current !== next) child.setAttribute(attr, next);
      }
    }
  });
}
export function installInterfaceTranslation() {
  const root = document.getElementById('root');
  if (!root) return () => {};
  let scheduled = false;
  const apply = () => {
    scheduled = false;
    translateElement(root, language);
  };
  const schedule = () => { if (!scheduled) { scheduled = true; queueMicrotask(apply); } };
  const observer = new MutationObserver(schedule);
  observer.observe(root, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ['placeholder', 'title', 'aria-label'] });
  listeners.add(schedule);
  schedule();
  return () => { observer.disconnect(); listeners.delete(schedule); };
}
