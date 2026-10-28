import React, { useEffect, useRef, useState } from 'react';
import { ArrowRight, BookOpen, Building2, Check, ChevronRight, Eye, MapPinned, Menu, Printer, Search, Settings2, X } from 'lucide-react';
import { agency, informationUrl, officialPolicies, policyUrl } from './site-info';
import { lineEntryUrl, lineOfficialAccountUrl } from './line-liff';
import { CITIZEN_EDIT_WINDOW_DAYS } from './model';
import { getLanguage, setLanguage, useLanguage } from './i18n';

const sections = {
  guide: ['คู่มือบริการ', 'Service guide'],
  contact: ['ติดต่อหน่วยงาน', 'Contact'],
  privacy: ['ข้อมูลส่วนบุคคล', 'Privacy'],
  terms: ['นโยบายเว็บไซต์', 'Website policy'],
  security: ['ความมั่นคงปลอดภัย', 'Security'],
  accessibility: ['การเข้าถึงเว็บไซต์', 'Accessibility'],
  sitemap: ['แผนผังเว็บไซต์', 'Site map'],
};
const guideRoles = [
  ['citizen', 'ประชาชน', 'Citizen'], ['staff', 'เจ้าหน้าที่รับเรื่อง', 'Intake staff'],
  ['supervisor', 'หัวหน้าทีมภาคสนาม', 'Field supervisor'],
  ['worker', 'เจ้าหน้าที่ภาคสนาม', 'Field worker'], ['authority', 'ผู้อนุมัติ', 'Approver'],
];
const guideUrl = (role = 'citizen', lang = getLanguage()) => `${informationUrl('guide', lang)}&role=${encodeURIComponent(role)}`;
const roleGuides = {
  citizen: [
    ['สำรวจเรื่องในชุมชน', 'Explore community issues', 'จากหน้าหลักดู 5 เรื่องที่ได้รับโหวตมากที่สุด แล้วใช้ค้นหา ตัวกรอง แผนที่ และรายการปัญหาเพื่อดูเรื่องใกล้ตัว', 'From Home, review the five most-voted issues. Use search, filters, the map and the issue list to find local reports.'],
    ['โหวตหรือติดตามเรื่องเดิม', 'Vote for or follow an existing issue', 'เปิดการ์ดเรื่องที่ตรงกัน กดโหวตได้หนึ่งครั้งต่อเรื่อง และกดติดตามเพื่อดูความคืบหน้าโดยไม่ต้องแจ้งซ้ำ', 'Open a matching issue. Vote once per issue, or follow it for updates without filing a duplicate report.'],
    ['แจ้งปัญหาใหม่', 'Report a new issue', 'เลือกประเภท กรอกรายละเอียดและสถานที่ ระบุตำแหน่งด้วย GPS หรือพิกัดเอง แนบรูปหรือวิดีโอ แล้วตรวจข้อมูลก่อนกดส่ง', 'Choose a category, add details and place, locate it with GPS or manual coordinates, attach a photo or video, then review and submit.'],
    ['ติดตามและแก้ข้อมูล', 'Track and correct', 'หน้าติดตามแยกเรื่องที่ฉันแจ้งกับเรื่องที่ติดตาม หากเจ้าหน้าที่ขอข้อมูลเพิ่ม ให้เปิดเรื่องและส่งข้อมูลภายในกำหนด', 'Tracking separates your own reports from followed issues. If staff request more information, open the issue and submit it by the deadline.'],
    ['ประเมินหลังปิดเรื่อง', 'Rate a closed issue', 'เปิดเรื่องที่มีสถานะปิดเรื่องแล้วจากหน้าติดตาม จึงจะเห็นแบบประเมิน 1–5 ดาว พร้อมช่องข้อเสนอแนะ', 'Open a closed issue from Tracking to rate it from 1 to 5 stars and optionally leave feedback.'],
  ],
  staff: [
    ['ตรวจคิวคำร้อง', 'Review the intake queue', 'ใช้รายการงาน ค้นหา กรองสถานะ และเรียงตามคะแนนโหวตหรือวันที่ แล้วเปิดรายละเอียดเพื่อดูหลักฐานและตำแหน่ง', 'Search, filter and sort the intake queue by votes or date. Open a report to review its location and evidence.'],
    ['ประเมินและมอบหมาย', 'Assess and assign', 'กดประเมินความเร่งด่วนและมอบหมายหัวหน้าทีม กรอกผลตรวจ เหตุผล สิ่งที่ต้องเพิ่มเติม วันนัด ขอบเขตงาน และข้อควรระวัง', 'Use the urgency and assignment action. Record findings, reasons, missing information, a supervisor, site date, scope and precautions.'],
    ['ขอข้อมูลเพิ่มเติม', 'Request more information', 'หากข้อมูลคำร้องยังไม่ครบ ให้ระบุสิ่งที่ขาดเพื่อส่งกลับให้ประชาชนแก้ไขภายใน 7 วันตามกติกาต้นแบบ', 'If a report is incomplete, specify what is missing. The prototype gives the citizen seven days to correct it.'],
    ['ส่งคำขอทรัพยากร', 'Forward a resource request', 'เมื่อหัวหน้าทีมส่งคำขอจากภาคสนามมา ให้ตรวจรายการและหลักฐาน แล้วส่งข้อเสนอให้ผู้อนุมัติพิจารณา', 'Review resource requests and evidence forwarded by the supervisor, then submit a proposal to the approver.'],
    ['ตรวจผลและปิดเรื่อง', 'Review and close', 'ตรวจรายงานและหลักฐานที่หัวหน้าทีมรับรองแล้ว เลือกปิดเรื่องเมื่อครบถ้วน หรือส่งกลับให้แก้ไขพร้อมเหตุผล', 'Review the supervisor-approved work report. Close the issue when complete or return it with a reason.'],
  ],
  supervisor: [
    ['ดูงานของทีม', 'Review team tasks', 'เปิดคิวงานที่ได้รับมอบหมาย ดูวันนัด ความเร่งด่วน แผนงาน และข้อควรระวังของแต่ละเรื่อง', 'Open assigned tasks and review dates, urgency, plans and precautions.'],
    ['จัดทีมภาคสนาม', 'Assign field workers', 'เลือกผู้ลงพื้นที่และยืนยันแผน เมื่อกดมอบหมาย งานจะปรากฏในหน้าของเจ้าหน้าที่ภาคสนาม', 'Choose a field worker and confirm the plan. The assignment then appears in that worker’s queue.'],
    ['จัดการการปฏิเสธงาน', 'Handle a declined task', 'ถ้าผู้ลงพื้นที่ปฏิเสธพร้อมเหตุผล ให้กลับมาเลือกผู้รับผิดชอบใหม่', 'If a worker declines with a reason, assign another worker.'],
    ['ตรวจคำขอทรัพยากร', 'Review a resource request', 'ตรวจรายการ จำนวน เหตุผล และหลักฐานจากภาคสนาม ก่อนรับรองส่งเจ้าหน้าที่รับเรื่องเพื่อเสนอผู้อนุมัติ', 'Review items, quantities, reasons and evidence from the worker before forwarding to intake staff for approval.'],
    ['ตรวจคุณภาพรายงาน', 'Check work quality', 'ตรวจผลและภาพก่อน–หลัง ส่งต่อเจ้าหน้าที่รับเรื่องเมื่อผ่าน หรือส่งกลับให้ภาคสนามแก้ไข', 'Review results and before-and-after evidence. Forward accepted work to intake staff or return it for correction.'],
  ],
  worker: [
    ['เปิดงานที่ได้รับ', 'Open assigned work', 'ดูรายการงาน วันนัด ตำแหน่ง แผนและคำเตือนก่อนตัดสินใจรับงาน', 'Review the task list, dates, location, plan and warnings before accepting.'],
    ['รับหรือปฏิเสธงาน', 'Accept or decline', 'กดรับงานเพื่อเริ่มขั้นตอนภาคสนาม หรือปฏิเสธพร้อมเหตุผลเพื่อให้หัวหน้าทีมจัดงานใหม่', 'Accept to proceed, or decline with a reason so the supervisor can reassign the task.'],
    ['เริ่มปฏิบัติงาน', 'Start work', 'หลังรับงาน กดเริ่มปฏิบัติงานแล้วบันทึกความคืบหน้าและหลักฐานตามหน้างาน', 'After accepting, start work and record progress and evidence on site.'],
    ['ขอใช้ทรัพยากรเพิ่ม', 'Request more resources', 'ระบุรายการ จำนวน เหตุผล และหลักฐาน ส่งคำขอให้หัวหน้าทีมตรวจ ก่อนผ่านเจ้าหน้าที่รับเรื่องไปถึงผู้อนุมัติ', 'Enter items, quantities, reasons and evidence. The request goes through the supervisor and intake staff to the approver.'],
    ['ส่งรายงานผล', 'Submit a work report', 'สรุปผลพร้อมภาพหรือหลักฐานก่อนและหลังดำเนินงาน แล้วส่งให้หัวหน้าทีมตรวจ', 'Summarize the result, attach before-and-after evidence, and submit it to the supervisor.'],
  ],
  authority: [
    ['ดูข้อเสนอรอพิจารณา', 'Review pending proposals', 'เปิดรายการที่รอพิจารณา ใช้ตัวกรองและดูประวัติการตัดสินใจได้', 'Open pending proposals, use filters and review decision history.'],
    ['ตรวจข้อมูลประกอบ', 'Check supporting information', 'อ่านปัญหาต้นทาง เหตุผล รายการทรัพยากร วงเงิน และเอกสารที่เจ้าหน้าที่ส่งมา', 'Read the original issue, reasons, requested resources, budget and documents forwarded by intake staff.'],
    ['อนุมัติ', 'Approve', 'บันทึกผลและเหตุผล เมื่อข้อมูลครบและเห็นควรให้ดำเนินการตามข้อเสนอ', 'Record the decision and reason when the proposal is complete and acceptable.'],
    ['ไม่อนุมัติ', 'Decline', 'ระบุเหตุผลให้ผู้เกี่ยวข้องเห็นข้อจำกัดของคำขอ การไม่อนุมัติทรัพยากรไม่ปิดคำร้องประชาชนทันที', 'State the reason. Declining a resource request does not automatically close the citizen’s issue.'],
    ['ขอข้อมูลเพิ่มเติม', 'Request more information', 'ระบุข้อมูลหรือเอกสารที่ขาด แล้วส่งกลับผู้เกี่ยวข้องก่อนนำเรื่องกลับมาพิจารณา', 'Specify missing information or documents and return the proposal for another review.'],
  ],
};
const preferenceKey = 'towntrack-display-v1';
function readPreferences() {
  try {
    const value = JSON.parse(localStorage.getItem(preferenceKey));
    return { size: ['normal', 'large', 'largest'].includes(value?.size) ? value.size : 'normal', contrast: value?.contrast === true };
  } catch { return { size: 'normal', contrast: false }; }
}
export function SiteTools({ inline = false, role = null }) {
  const requestedRole = new URLSearchParams(location.search).get('role');
  const guideRole = role || (roleGuides[requestedRole] ? requestedRole : 'citizen');
  const lang = useLanguage();
  const en = lang === "en";
  const [prefs, setPrefs] = useState(readPreferences);
  const settingsRef = useRef(null);
  const positionSettings = () => {
    const details = settingsRef.current;
    if (!details?.open) return;
    const header = details.closest('.app-header');
    const top = header?.getBoundingClientRect().bottom ?? details.getBoundingClientRect().bottom;
    details.style.setProperty('--display-panel-top', `${Math.max(0, top + 6)}px`);
  };
  useEffect(() => {
    const update = () => positionSettings();
    window.addEventListener('resize', update);
    window.addEventListener('orientationchange', update);
    return () => { window.removeEventListener('resize', update); window.removeEventListener('orientationchange', update); };
  }, []);
  useEffect(() => {
    const dismiss = (event) => {
      const settings = settingsRef.current;
      if (settings?.open && !settings.contains(event.target)) settings.open = false;
    };
    document.addEventListener('pointerdown', dismiss);
    document.addEventListener('focusin', dismiss);
    return () => {
      document.removeEventListener('pointerdown', dismiss);
      document.removeEventListener('focusin', dismiss);
    };
  }, []);
  useEffect(() => {
    document.documentElement.dataset.textSize = prefs.size;
    document.documentElement.dataset.contrast = prefs.contrast ? 'high' : 'normal';
    try { localStorage.setItem(preferenceKey, JSON.stringify(prefs)); } catch { /* Preferences still work for this visit. */ }
  }, [prefs]);
  return <div className={`site-tools${inline ? ' site-tools-inline' : ''}`}>
    <a className="skip-link" href="#main-content" onClick={() => document.getElementById('main-content')?.focus()}>ข้ามไปยังเนื้อหาหลัก</a>
    {!inline && <span className="site-tools-name">TownTrack · บริการชุมชน</span>}
    <nav aria-label="ข้อมูลและเครื่องมือช่วยใช้งาน">
      <a href={guideUrl(guideRole, lang)} aria-label={en ? 'Service guide' : 'คู่มือบริการ'} title={en ? 'Service guide' : 'คู่มือบริการ'}><BookOpen size={18} aria-hidden="true" /><span className="tool-label">{en ? 'Guide' : 'คู่มือ'}</span></a>
      <button className="language-switch" type="button" lang={en ? 'th' : 'en'} aria-label={en ? 'เปลี่ยนภาษาเป็นไทย' : 'Change language to English'} title={en ? 'เปลี่ยนภาษาเป็นไทย' : 'Change language to English'} onClick={() => {
        const next = en ? 'th' : 'en';
        setLanguage(next);
        if (location.pathname.startsWith('/information')) {
          const target = new URL(location.href);
          target.searchParams.set('lang', next);
          location.assign(target.pathname + target.search);
        }
      }}>{en ? 'ไทย' : 'EN'}</button>
      <details ref={settingsRef} className="display-settings" onToggle={positionSettings} onKeyDown={(e) => { if (e.key === 'Escape') { e.currentTarget.open = false; e.currentTarget.querySelector('summary').focus(); } }}>
        <summary aria-label="การแสดงผล" title="การแสดงผล"><Settings2 size={18} aria-hidden="true" /><span className="tool-label">การแสดงผล</span></summary>
        <div className="display-settings-panel">
          <fieldset><legend>ขนาดข้อความ</legend>
            <div className="display-size-options">{[['normal', 'ปกติ'], ['large', 'ใหญ่'], ['largest', 'ใหญ่พิเศษ']].map(([size, label]) => <button type="button" key={size} aria-pressed={prefs.size === size} onClick={() => setPrefs({ ...prefs, size })}>{label}</button>)}</div>
          </fieldset>
          <label><input type="checkbox" checked={prefs.contrast} onChange={(e) => setPrefs({ ...prefs, contrast: e.target.checked })} />เพิ่มความชัดเจนของข้อความ</label>
          <button type="button" onClick={() => setPrefs({ size: 'normal', contrast: false })}>คืนค่าเริ่มต้น</button>
          <a href={informationUrl('accessibility', lang)}>วิธีใช้คีย์บอร์ดและการขยายหน้า</a>
        </div>
      </details>
    </nav>
  </div>;
}
export function GovernmentFooter({ homeHref = "/" }) {
  const en = useLanguage() === 'en';
  const lang = en ? 'en' : 'th';
  const t = (th, english) => en ? english : th;
  return <footer className="government-footer">
    <div className="government-footer-grid">
      <div><a className="government-brand" href={homeHref} aria-label="TownTrack · กลับหน้าหลัก"><MapPinned size={25} aria-hidden="true" />TownTrack</a><p>แจ้งปัญหา ติดตามความคืบหน้า<br />และร่วมดูแลชุมชนของเรา</p><small>ต้นแบบสาธิต · คำร้องและไฟล์แนบเก็บในเบราว์เซอร์</small></div>
      <nav aria-label="เมนูบริการท้ายเว็บไซต์"><h2>บริการและความช่วยเหลือ</h2><a href={lineEntryUrl}>บริการประชาชน</a><a href={guideUrl(homeHref.replace('/', '') || 'citizen', en ? 'en' : 'th')}>{t('ขั้นตอนและคู่มือบริการ', 'Service steps and guide')}</a><a href={informationUrl('contact', lang)}>ติดต่อ / เสนอแนะ</a><a href={informationUrl('sitemap', lang)}>แผนผังเว็บไซต์</a></nav>
      <nav aria-label="นโยบายและการเข้าถึง"><h2>นโยบายและการเข้าถึง</h2><a href={policyUrl('privacy', lang)}>การคุ้มครองข้อมูลส่วนบุคคล</a><a href={policyUrl('terms', lang)}>นโยบายเว็บไซต์และลิขสิทธิ์</a><a href={policyUrl('security', lang)}>ความมั่นคงปลอดภัย</a><a href={informationUrl('accessibility', lang)}>การเข้าถึงเว็บไซต์</a></nav>
      <div><h2>หน่วยงานผู้ให้บริการ</h2><p>{agency.name || 'ยังไม่ได้ระบุหน่วยงานผู้ให้บริการจริง'}</p>{agency.address && <p>{agency.address}</p>}{agency.phone && <a href={`tel:${agency.phone.replace(/[^+\d]/g, '')}`}>{agency.phone}</a>}{agency.email && <a href={`mailto:${agency.email}`}>{agency.email}</a>}{agency.website && <a href={agency.website}>เว็บไซต์หน่วยงาน</a>}<a href={informationUrl('contact', lang)}>รายละเอียดการติดต่อ <ChevronRight size={14} aria-hidden="true" /></a></div>
    </div>
    <div className="government-footer-note"><span>TownTrack · ข้อมูลสาธิตไม่ใช่ผลการดำเนินงานจริงของหน่วยงาน</span><a href={guideUrl(homeHref.replace('/', '') || 'citizen', en ? 'en' : 'th')}>{t('คู่มือบริการภาษาไทยและอังกฤษ', 'Thai and English service guide')}</a></div>
  </footer>;
}
export function PrivacyNotice() {
  const lang = useLanguage();
  return <aside className="report-privacy-note"><Eye size={21} aria-hidden="true" /><div><strong>ตรวจข้อมูลส่วนบุคคลก่อนส่ง</strong><p>ใช้รายละเอียด พิกัด และหลักฐานเพื่อดำเนินการตามคำร้อง ชื่อและเบอร์ติดต่อใช้สำหรับติดต่อกลับ กรุณาหลีกเลี่ยงภาพบัตรประชาชน ใบหน้า หรือข้อมูลของผู้อื่นที่ไม่จำเป็น ต้นแบบนี้เก็บข้อมูลในเบราว์เซอร์ของคุณ</p><a href={policyUrl('privacy', lang)} target="_blank" rel="noopener noreferrer">อ่านรายละเอียดการใช้ข้อมูล (เปิดแท็บใหม่)</a></div></aside>;
}
function content(en) {
  const t = (th, english) => en ? english : th;
  return {
    guide: [
      [t('เตรียมข้อมูลก่อนแจ้ง', 'Before submitting'), t('เตรียมประเภทปัญหา สถานที่ พิกัด รายละเอียด และรูปหรือวิดีโออย่างน้อย 1 ไฟล์ รองรับ JPG, PNG, WebP, MP4, WebM และ MOV ไม่เกิน 5 ไฟล์ต่อช่อง แต่ละไฟล์ต้องเล็กกว่า 10 MB ชื่อและเบอร์ติดต่อไม่บังคับ', 'Prepare the category, place, coordinates, description and at least one photo or video. Supported formats: JPG, PNG, WebP, MP4, WebM and MOV. Up to 5 files per upload field, each smaller than 10 MB. Name and phone number are optional.')],
      [t('1. เข้าสู่บริการประชาชน', '1. Open citizen services'), t('เปิด TownTrack จาก LINE OA ของหน่วยงาน เมื่อเชื่อมต่อ LIFF แล้วระบบจะใช้บัญชี LINE ยืนยันตัวตน ในโหมดสาธิตสามารถเปิดหน้าประชาชนโดยตรงได้', 'Open TownTrack from the agency’s LINE Official Account. When LIFF is configured, your LINE account identifies you. Demo mode also allows direct access to the citizen page.')],
      [t('2. ตรวจเรื่องใกล้เคียง', '2. Check nearby reports'), t('ค้นหาเรื่องเดิมก่อนแจ้ง หากพบปัญหาเดียวกันสามารถโหวตและติดตามได้ หากไม่พบจึงสร้างคำร้องใหม่ ระบุตำแหน่งด้วย GPS ปักหมุด หรือกรอกพิกัดเอง', 'Check existing reports first. Vote for and follow an existing report about the same issue, or create a new one. Use GPS, select a map location, or enter coordinates manually.')],
      [t('3. ส่งและติดตามคำร้อง', '3. Submit and track'), t('กรอกข้อมูลและแนบหลักฐาน ตรวจสอบก่อนส่ง แล้วจดเลขคำร้องไว้ เปิดเมนูติดตามเพื่อดูสถานะและประวัติการดำเนินการ ระบบไม่รับคำร้องไฟไหม้ และการส่งในเว็บไม่ได้เรียกหน่วยฉุกเฉิน', 'Complete the form, attach evidence and review before submitting. Keep the report ID and open Tracking to view progress. Fire reports are not supported. Submitting a web report does not dispatch emergency responders.')],
      [t('4. เจ้าหน้าที่ดำเนินการ', '4. Processing'), t('เจ้าหน้าที่รับเรื่องตรวจข้อมูล หัวหน้าทีมจัดสรรงาน เจ้าหน้าที่ภาคสนามดำเนินการ และผู้อนุมัติพิจารณากรณีที่ต้องใช้ทรัพยากร รายงานต้องผ่านการตรวจงานก่อนปิดเรื่อง', 'Intake staff review the report, team leaders assign work, field workers carry out tasks, and approvers review resource requests where needed. Work reports are reviewed before closure.')],
      [t('5. ประเมินหลังปิดเรื่อง', '5. Rate a closed report'), t('เมื่อเรื่องที่แจ้งเองหรือกำลังติดตามมีสถานะปิดเรื่องแล้ว เปิดหน้าติดตามเพื่อให้คะแนนความพึงพอใจ 1–5 คะแนน และเขียนข้อเสนอแนะได้หนึ่งครั้งต่อเรื่อง หากยังไม่สะดวกสามารถเลือกประเมินภายหลังได้', 'When a report you submitted or follow is closed, open Tracking to rate your satisfaction from 1 to 5 and optionally leave a comment. You can rate each report once, or choose to do it later.')],
      [t('ระยะเวลาและค่าธรรมเนียม', 'Timeframes and fees'), t(`ต้นแบบให้แก้ไขคำร้องที่ข้อมูลไม่ครบภายใน ${CITIZEN_EDIT_WINDOW_DAYS} วันตามกติกาปัจจุบัน ระยะเวลาบริการแต่ละขั้นตอนและค่าธรรมเนียมยังไม่ได้ประกาศจากหน่วยงาน โปรดสอบถามผู้ให้บริการก่อนใช้งานจริง`, `The prototype currently allows ${CITIZEN_EDIT_WINDOW_DAYS} days to correct incomplete reports. Official processing timeframes and fees have not been supplied by the agency. Contact the service provider before using the live service.`)],
      [t('คำถามที่พบบ่อย: ไม่อนุญาต GPS ได้ไหม', 'FAQ: Can I decline GPS access?'), t('ได้ คุณสามารถปักหมุดหรือกรอกพิกัดเอง หากไม่อนุญาต GPS จะไม่ค้นหาหรือแสดงโรงพยาบาล ตำรวจ และกู้ภัยใกล้ตัว', 'Yes. Choose a map location or enter coordinates. Without GPS permission, nearby hospitals, police and rescue services are neither requested nor displayed.')],
      [t('คำถามที่พบบ่อย: เหตุใดอีกเครื่องไม่เห็นคำร้อง', 'FAQ: Why are my demo reports missing on another device?'), t('ต้นแบบเก็บคำร้องและไฟล์แนบในเบราว์เซอร์เครื่องเดิม การเปลี่ยนอุปกรณ์หรือล้างข้อมูลเว็บไซต์อาจทำให้เข้าถึงข้อมูลเดิมไม่ได้ ยังไม่มีการส่งคำร้องจริงไปยังหน่วยงาน', 'The prototype stores reports and attachments in the original browser. Switching devices or clearing site data can make them unavailable. Reports are not yet submitted to a live agency backend.')],
    ],
    contact: [[t('ผู้ให้บริการ', 'Service provider'), agency.name || t('ยังไม่ได้ระบุชื่อหน่วยงานผู้รับผิดชอบบริการจริง', 'The live service provider has not been configured.')], [t('ที่อยู่', 'Address'), agency.address || t('ยังไม่ได้เผยแพร่ที่อยู่หน่วยงาน', 'An agency address has not been published.')], [t('เวลาทำการ', 'Service hours'), agency.hours || t('ยังไม่ได้ประกาศเวลาทำการ โปรดตรวจสอบกับหน่วยงาน', 'Service hours have not been published. Please check with the agency.')]],
    privacy: [
      [t('ข้อมูลที่ระบบใช้', 'Information used'), t('คำร้องประกอบด้วยรายละเอียดปัญหา พิกัด ภาพหรือวิดีโอ ประวัติการทำงาน การโหวต การติดตาม และคะแนนกับความคิดเห็นประเมินความพึงพอใจหลังปิดเรื่อง รวมถึงชื่อและเบอร์ที่ผู้ใช้เลือกให้ ความคิดเห็นประเมินแสดงเฉพาะเจ้าหน้าที่ ไม่แสดงในรายการปัญหาสาธารณะ เมื่อเปิดใช้ LINE LIFF ระบบอ่านรหัสผู้ใช้และชื่อแสดงผลจาก LINE', 'Reports contain descriptions, coordinates, media, workflow history, votes, follows, and satisfaction ratings and comments after closure, plus an optional name and phone number. Evaluation comments are visible to staff, not in public issue lists. With LINE LIFF enabled, the system reads the LINE user ID and display name.')],
      [t('วัตถุประสงค์และการแสดงผล', 'Purpose and visibility'), t('ใช้ข้อมูลเพื่อรับเรื่อง ประสานงาน และติดตามการแก้ปัญหา รายละเอียดปัญหา พิกัด และภาพหลักฐานอาจปรากฏในหน้ารายการสาธารณะ จึงควรหลีกเลี่ยงข้อมูลส่วนบุคคลที่ไม่จำเป็น ผู้ให้บริการจริงต้องตรวจและปกปิดข้อมูลก่อนเผยแพร่', 'Data supports reporting, coordination and progress tracking. Issue descriptions, locations and evidence may appear in public listings. Avoid unnecessary personal information. A live provider must review and redact content before publication.')],
      [t('พื้นที่จัดเก็บในต้นแบบ', 'Storage in this prototype'), t('คำร้อง บัญชี LINE สำหรับสาธิต และค่าการแสดงผลเก็บใน localStorage ไฟล์แนบเก็บใน IndexedDB ข้อมูลการเข้าสู่ระบบเว็บของเจ้าหน้าที่เก็บใน sessionStorage การล้างข้อมูลเว็บไซต์อาจลบข้อมูลเหล่านี้ ต้นแบบยังไม่มีระบบกำหนดอายุหรือลบข้อมูลส่วนบุคคลอัตโนมัติ', 'Reports, the demo LINE identity and display preferences use localStorage. Attachments use IndexedDB. Staff web authentication uses sessionStorage. Clearing site data may delete this information. Automated personal-data retention and erasure are not implemented.')],
      [t('บริการภายนอกและตำแหน่ง', 'External services and location'), t('แผนที่โหลดจาก OpenStreetMap การค้นหาหน่วยฉุกเฉินใกล้เคียงส่งพิกัดไปยังบริการ Overpass การยืนยันตัวตนอาจเชื่อมต่อ LINE หรือผู้ให้บริการ OIDC ตามการตั้งค่า บริการเหล่านี้มีนโยบายของตนเอง ปฏิเสธสิทธิ GPS ได้และระบุตำแหน่งเองได้', 'Maps load from OpenStreetMap. Nearby emergency-service searches send coordinates to Overpass. Authentication may connect to LINE or a configured OIDC provider. These providers have their own policies. You may decline GPS permission and choose a location manually.')],
      [t('ติดต่อเกี่ยวกับข้อมูลส่วนบุคคล', 'Privacy enquiries'), t('ใช้ช่องทางติดต่อหน่วยงานเพื่อสอบถามหรือขอใช้สิทธิ ผู้ควบคุมข้อมูล ฐานการประมวลผล ระยะเวลาเก็บข้อมูล ผู้รับข้อมูล และขั้นตอนใช้สิทธิต้องได้รับการกำหนดและอนุมัติก่อนเปิดบริการจริง หน้านี้ยังเป็นคำอธิบายต้นแบบ ไม่ใช่ประกาศที่หน่วยงานอนุมัติ', 'Use the agency contact channels for privacy enquiries. The controller, lawful basis, retention period, recipients and rights-handling procedures must be defined and approved before launch. This page describes the prototype and is not an agency-approved notice.')],
    ],
    terms: [[t('ขอบเขตบริการ', 'Service scope'), t('TownTrack ใช้แจ้งและติดตามปัญหาชุมชน ข้อมูลในโหมดสาธิตไม่ใช่ข้อมูลหรือผลปฏิบัติงานจริง การส่งข้อมูลไม่ใช่การแจ้งเหตุฉุกเฉินโดยตรง', 'TownTrack supports community reporting and tracking. Demo data does not represent real agency activity. Submitting a report does not directly notify emergency responders.')], [t('การใช้งานและความรับผิดชอบ', 'Use and responsibility'), t('กรอกข้อมูลตามจริงและใช้ไฟล์ที่คุณมีสิทธินำมาใช้ หลีกเลี่ยงข้อมูลที่ละเมิดสิทธิผู้อื่น ลิงก์ภายนอกอยู่ภายใต้นโยบายของผู้ให้บริการนั้น ข้อจำกัดความรับผิดที่ใช้จริงต้องได้รับการพิจารณาจากหน่วยงาน', 'Provide accurate information and use files you are entitled to share. Respect other people’s rights. External sites apply their own policies. The agency must approve the terms and applicable liability provisions for the live service.')], [t('ลิขสิทธิ์และการนำข้อมูลไปใช้', 'Copyright and reuse'), t('สิทธิในรูปภาพ เอกสาร และเนื้อหาเป็นของเจ้าของสิทธินั้น การเผยแพร่บนเว็บไม่เท่ากับอนุญาตให้นำไปใช้ได้ทุกกรณี หน่วยงานต้องกำหนดสิทธิการใช้ซ้ำของข้อมูลเปิดและเนื้อหาที่เผยแพร่', 'Images, documents and content remain subject to their owners’ rights. Publication does not automatically grant unrestricted reuse. The agency must specify reuse terms for published content and open data.')]],
    security: [[t('การเข้าสู่ระบบ', 'Signing in'), t('ประชาชนเข้าผ่าน LINE OA/LIFF เมื่อกำหนดค่าแล้ว เจ้าหน้าที่ใช้ผู้ให้บริการ OIDC ตามสิทธิของบัญชี โปรดออกจากระบบและปิดเบราว์เซอร์เมื่อใช้เครื่องร่วมกับผู้อื่น', 'Citizens use configured LINE OA/LIFF access. Staff use the configured OIDC provider and assigned roles. Sign out and close the browser when using a shared device.')], [t('ข้อมูลสาธิตและเครื่องที่ใช้ร่วมกัน', 'Demo data and shared devices'), t('ต้นแบบจัดเก็บข้อมูลในเบราว์เซอร์ ไม่ควรใช้ข้อมูลส่วนบุคคลจริงบนเครื่องสาธารณะ การจำกัดสิทธิในหน้าเว็บไม่ทดแทนการตรวจสิทธิที่ Backend', 'This prototype stores data in the browser. Avoid real personal data on public devices. UI role restrictions do not replace backend authorization.')], [t('แจ้งปัญหาความปลอดภัย', 'Reporting a security issue'), t('ติดต่อผู้ดูแลผ่านช่องทางหน่วยงาน โดยอธิบายปัญหาและขั้นตอนที่พบ หลีกเลี่ยงส่งรหัสผ่าน โทเคน หรือข้อมูลส่วนบุคคลลงในคำร้องสาธารณะ หน่วยงานต้องกำหนดช่องทางรับแจ้งและกระบวนการตอบสนองจริง', 'Contact the agency administrator with a description and reproduction steps. Do not place passwords, tokens or personal data in public reports. The agency must establish a live security-reporting and response process.')]],
    accessibility: [[t('ปรับการอ่าน', 'Reading options'), t('เปิดเมนูการแสดงผลเพื่อเพิ่มขนาดข้อความหรือความชัดเจน ใช้การซูมของเบราว์เซอร์ได้ และระบบลดการเคลื่อนไหวเมื่ออุปกรณ์ตั้งค่า Reduce Motion', 'Use Display settings to enlarge text or increase contrast. Browser zoom is supported. Animations are reduced when the device requests reduced motion.')], [t('ใช้คีย์บอร์ด', 'Keyboard navigation'), t('กด Tab เพื่อเลื่อนไปยังลิงก์และปุ่ม ใช้ Enter หรือ Space เพื่อทำงาน ใช้ลิงก์ข้ามไปยังเนื้อหาหลักเพื่อข้ามส่วนหัว และ Escape เพื่อปิดหน้าต่างหรือเมนูที่เปิดอยู่', 'Press Tab to move between links and controls, Enter or Space to activate them, and use the skip link to reach main content. Escape closes dialogs and the citizen menu.')], [t('แผนที่และแบบฟอร์ม', 'Maps and forms'), t('ดูปัญหาเป็นรายการข้อความได้ กรอกพิกัดด้วยช่องละติจูดและลองจิจูดได้โดยไม่ต้องปักหมุด ช่องที่มีเครื่องหมาย * จำเป็นต้องกรอก ฟอร์มแสดงข้อกำหนดการแนบไฟล์ก่อนส่ง', 'Issues are also available as text lists. Enter latitude and longitude without selecting a map point. Fields marked * are required. Upload requirements are shown before submission.')], [t('อุปกรณ์และภาษา', 'Devices and language'), t('ใช้เว็บผ่านเบราว์เซอร์บนคอมพิวเตอร์ iOS และ Android รวมถึง LINE LIFF คู่มือ เมนูหลัก ปุ่มหลัก และสถานะเลือกไทยหรืออังกฤษได้ ข้อความที่ผู้ใช้กรอกและข้อมูลตัวอย่างบางส่วนคงภาษาต้นฉบับ และยังต้องตรวจการเข้าถึงกับผู้ใช้จริงเพิ่มเติม', 'Use a desktop, iOS or Android browser, including LINE LIFF. Guides, main menus, core actions and statuses can be shown in Thai or English. User-entered content and some sample data retain their original language. Further accessibility evaluation with real users is still required.')]],
    sitemap: [],
  };
}
export default function PublicInformation() {
  const params = new URLSearchParams(location.search);
  const section = Object.hasOwn(sections, params.get('section')) ? params.get('section') : 'guide';
  const en = params.get('lang') === 'en';
  const guideRole = roleGuides[params.get('role')] ? params.get('role') : 'citizen';
  const lang = en ? 'en' : 'th';
  const title = sections[section][en ? 1 : 0];
  const [query, setQuery] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const headerRef = useRef(null);
  const t = (th, english) => en ? english : th;
  useEffect(() => { document.title = `${title} · TownTrack`; setLanguage(lang); }, [title, lang]);
  useEffect(() => {
    const header = headerRef.current;
    if (!header) return;
    const update = () => header.closest('.information-page')?.style.setProperty('--information-header-offset', `${Math.max(0, header.getBoundingClientRect().bottom)}px`);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(header);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    if (!menuOpen) return;
    const onKeyDown = (event) => {
      if (event.key === 'Escape') { setMenuOpen(false); headerRef.current?.querySelector('.information-menu-trigger')?.focus(); }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [menuOpen]);
  const items = section === 'guide' ? [...roleGuides[guideRole].map(([thTitle, enTitle, thText, enText]) => [en ? enTitle : thTitle, en ? enText : thText]), ...(guideRole === 'citizen' ? [content(en).guide[0], ...content(en).guide.slice(6)] : [])] : content(en)[section];
  const matches = items.filter((item) => item.join(' ').toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()));
  return <div className="information-page" lang={lang}>
    <header className="app-header information-app-header" ref={headerRef}>
      <button className="citizen-menu-trigger information-menu-trigger" type="button" aria-label={t(menuOpen ? 'ปิดเมนูคู่มือ' : 'เปิดเมนูคู่มือ', menuOpen ? 'Close guide menu' : 'Open guide menu')} aria-controls="information-nav" aria-expanded={menuOpen} onClick={() => setMenuOpen((open) => !open)}>
        {menuOpen ? <X size={21} aria-hidden="true" /> : <Menu size={21} aria-hidden="true" />}
      </button>
      <a className="brand-lockup" href={`/${guideRole}`} aria-label={t('TownTrack · กลับหน้าหลัก', 'TownTrack · Back to home')}>
        <span className="brand-mark"><MapPinned size={21} aria-hidden="true" /></span><span><strong>TownTrack</strong></span>
      </a>
      <div className="app-header-meta"><div className="header-utilities">
        <SiteTools inline role={guideRole} />
        <label className="header-role-picker"><span className="sr-only">{t('เลือกบทบาทคู่มือ', 'Choose guide role')}</span>
          <select aria-label={t('เลือกบทบาทคู่มือ', 'Choose guide role')} value={guideRole} onChange={(event) => location.assign(guideUrl(event.target.value, lang))}>
            {guideRoles.map(([id, th, english]) => <option key={id} value={id}>{en ? english : th}</option>)}
          </select>
        </label>
      </div></div>
    </header>
    {menuOpen && <button type="button" className="information-menu-scrim" aria-label={t('ปิดเมนูคู่มือ', 'Close guide menu')} onClick={() => setMenuOpen(false)} />}
    <main id="main-content" tabIndex={-1} className="information-main">
      <nav className="information-breadcrumb" aria-label={t('เส้นทางหน้าปัจจุบัน', 'Breadcrumb')}><a href={`/${guideRole}`}>{t('หน้าเริ่มต้น', 'Home')}</a><ChevronRight size={15} aria-hidden="true" /><span aria-current="page">{title}</span></nav>
      <section className="information-hero"><span className="information-kicker">TOWNTRACK / {t('ศูนย์ข้อมูลบริการ', 'SERVICE INFORMATION')}</span><h1>{title}</h1><p>{t('รู้ขั้นตอน เข้าใจสิทธิ และใช้งานบริการได้สะดวกขึ้น', 'Understand the process, your information and how to use the service.')}</p><a className="btn btn-primary" href={guideRole === 'citizen' ? lineEntryUrl : `/${guideRole}`}>{guideRole === 'citizen' ? t('เข้าสู่บริการประชาชน', 'Open citizen services') : t('เปิดหน้าทำงาน', 'Open workspace')}<ArrowRight size={18} aria-hidden="true" /></a></section>
      {section === 'guide' && <nav className="guide-role-nav" aria-label={t('เลือกคู่มือตามบทบาท', 'Choose a role guide')}>
        {guideRoles.map(([id, th, english]) => <a key={id} href={guideUrl(id, lang)} aria-current={guideRole === id ? 'page' : undefined}>{en ? english : th}</a>)}
      </nav>}
      <div className="information-layout"><nav id="information-nav" className={`information-nav${menuOpen ? ' is-open' : ''}`} aria-label={t('หัวข้อข้อมูลบริการ', 'Information topics')}>{Object.entries(sections).map(([id, labels]) => <a key={id} href={id === 'guide' ? guideUrl(guideRole, lang) : informationUrl(id, lang)} aria-current={id === section ? 'page' : undefined}>{labels[en ? 1 : 0]}<ChevronRight size={15} aria-hidden="true" /></a>)}</nav>
        <div className="information-content">
          {['privacy', 'terms', 'security'].includes(section) && <aside className="information-notice"><strong>{t('ข้อมูลประกอบการใช้ต้นแบบ', 'Prototype information')}</strong><p>{t('หน้านี้ยังไม่ใช่นโยบายที่ได้รับอนุมัติจากหน่วยงาน โปรดอ่านประกาศฉบับทางการเมื่อเปิดบริการจริง', 'This is not an agency-approved policy. Consult the official notice when the live service is available.')}</p>{officialPolicies[section] && <a href={officialPolicies[section]}>{t('อ่านประกาศทางการของหน่วยงาน', 'Read the agency’s official policy')}</a>}</aside>}
          {section === 'guide' && <div className="information-actions"><label><Search size={18} aria-hidden="true" /><input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t('ค้นหาในคู่มือ เช่น GPS', 'Search the guide, e.g. GPS')} aria-label={t('ค้นหาในคู่มือบริการ', 'Search the service guide')} /></label><button className="btn btn-secondary" type="button" onClick={() => window.print()}><Printer size={17} aria-hidden="true" />{t('พิมพ์ / บันทึก PDF', 'Print / Save PDF')}</button></div>}
          {section === 'guide' && <p className="information-result" role="status">{t(`พบ ${matches.length} หัวข้อ`, `${matches.length} topics found`)}</p>}
          {matches.map(([heading, text], i) => <section className="information-card" key={heading}><span className="information-card-number" aria-hidden="true">{String(i + 1).padStart(2, '0')}</span><div><h2>{heading}</h2><p>{text}</p></div></section>)}
          {section === 'guide' && !matches.length && <p>{t('ไม่พบหัวข้อ ลองใช้คำค้นอื่นหรือล้างคำค้น', 'No matching topics. Try another term or clear the search.')}</p>}
          {section === 'contact' && <section className="information-card"><Building2 aria-hidden="true" /><div><h2>{t('ช่องทางติดต่อและเสนอแนะ', 'Contact and feedback channels')}</h2><div className="information-contact-links">{agency.phone && <a href={`tel:${agency.phone.replace(/[^+\d]/g, '')}`}>{agency.phone}</a>}{agency.email && <a href={`mailto:${agency.email}`}>{agency.email}</a>}{agency.website && <a href={agency.website}>{t('เว็บไซต์หน่วยงาน', 'Agency website')}</a>}{lineOfficialAccountUrl && <a href={lineOfficialAccountUrl}>LINE OA</a>}{agency.feedback && <a href={agency.feedback}>{t('ส่งข้อเสนอแนะ / ประเมินบริการ', 'Feedback / Service evaluation')}</a>}{!agency.phone && !agency.email && !agency.website && !lineOfficialAccountUrl && !agency.feedback && <p>{t('ช่องทางติดต่อจริงยังไม่ได้รับการตั้งค่า จึงยังไม่สามารถส่งข้อเสนอแนะถึงหน่วยงานผ่านหน้านี้ได้', 'Live contact channels have not been configured. This page cannot yet deliver feedback to the agency.')}</p>}</div></div></section>}
          {section === 'sitemap' && <section className="information-card"><Check aria-hidden="true" /><div><h2>{t('พื้นที่บริการ', 'Service areas')}</h2><ul><li><a href={lineEntryUrl}>{t('ประชาชน: สำรวจปัญหา แจ้งเรื่อง ติดตาม และเบอร์ช่วยเหลือ', 'Citizens: explore, report, track and emergency contacts (Thai)')}</a></li>{[['staff', 'เจ้าหน้าที่รับเรื่อง', 'Intake staff'], ['supervisor', 'หัวหน้าทีมภาคสนาม', 'Field supervisors'], ['worker', 'เจ้าหน้าที่ภาคสนาม', 'Field workers'], ['authority', 'ผู้อนุมัติ', 'Approvers']].map(([id, th, english]) => <li key={id}><a href={`/${id}`}>{t(th, english)}</a></li>)}</ul><h2>{t('ข้อมูลบริการและนโยบาย', 'Information and policies')}</h2><ul>{Object.entries(sections).filter(([id]) => id !== 'sitemap').map(([id, labels]) => <li key={id}><a href={informationUrl(id, lang)}>{labels[en ? 1 : 0]}</a></li>)}</ul></div></section>}
        </div>
      </div>
    </main>
    <GovernmentFooter homeHref={`/${guideRole}`} />
  </div>;
}
