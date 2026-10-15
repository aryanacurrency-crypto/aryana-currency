/* ═══════════════════════════════════════
   ARYANA CURRENCY — Home (Live & Animated)
   ═══════════════════════════════════════ */

const FIRST_NAMES_M = [
  'Ahmad', 'Mohammad', 'Ali', 'Hussain', 'Omar', 'Hassan', 'Yousuf', 'Ibrahim',
  'Ismail', 'Rahim', 'Karim', 'Najib', 'Wahid', 'Farid', 'Saeed', 'Masoud',
  'Javid', 'Basir', 'Nasser', 'Zaher', 'Ramin', 'Soheil', 'Fawad', 'Burhan',
  'Shafiq', 'Aman', 'Wali', 'Niaz', 'Gul Mohammad', 'Abdullah', 'Nasrullah', 'Zabih',
  'Nasir', 'Hikmat', 'Aziz', 'Nabi', 'Dawoud', 'Yasin', 'Idris', 'Zakaria'
];

const LAST_NAMES = [
  'Rezaei', 'Ahmadi', 'Karimi', 'Hussaini', 'Mohammadi', 'Sadeqi', 'Nouri', 'Rahimi',
  'Jafari', 'Mousavi', 'Hashemi', 'Amini', 'Ghafouri', 'Farhadi', 'Sediqi', 'Yousufi',
  'Hakimi', 'Qaderi', 'Nazari', 'Kazemi', 'Baqeri', 'Abbasi', 'Zamani', 'Qasemi',
  'Sharifi', 'Moradi', 'Sultani', 'Azizi', 'Salehi', 'Faraji', 'Bahrami', 'Khaleqi',
  'Rohani', 'Naderi', 'Qureshi', 'Taheri', 'Akbari', 'Fazeli', 'Mirzaei', 'Panahi'
];

const CITIES = [
  'Kabul', 'Herat', 'Mazar-i-Sharif', 'Kandahar', 'Jalalabad', 'Kunduz',
  'Ghazni', 'Bamyan', 'Faryab', 'Nangarhar', 'Paktia', 'Logar', 'Parwan'
];

const NETWORKS = ['TRC20', 'BEP20', 'ERC20'];

const AVATAR_GRADIENTS = [
  ['#1E40AF', '#0F1E3D'],
  ['#1E3A8A', '#1E40AF'],
  ['#2563EB', '#1E40AF'],
  ['#7C3AED', '#6D28D9'],
  ['#10B981', '#059669'],
  ['#0F766E', '#115E59'],
  ['#F59E0B', '#D97706'],
  ['#DC2626', '#991B1B'],
];

// ═══ 50 Testimonials ═══
const TESTIMONIALS = [
  { name: 'احمد رضایی', city: 'کابل، افغانستان', rating: 5, lang: 'fa', text: 'قبلاً از نفرهای نامعلوم داخل تلگرام آنلاین خرید می‌کردم. بعد از اینکه پول می‌فرستادم، بلاکم می‌کردند. حالا جای خوشی است که این صرافی مشکل ما تریدرهای کوچک را حل کرده. از وقتی که تترهای خود را در صرافی آریانا نقد می‌کنم، نه هر روز در گروپ‌ها پشت صراف می‌گردم، نه کمیشن زیاد می‌دهم.' },
  { name: 'نصرالله قادری', city: 'فاریاب، افغانستان', rating: 5, lang: 'fa', text: 'تا حساب دو طرف خریدار و فروشنده به هم نرسیده و تسویه نشده، کسی نمی‌تواند با رسید فیک و تتر فیک فریب‌کاری کند. این خیلی مهم است برای ما که سرمایه زیاد نداریم.' },
  { name: 'علی نوری', city: 'جلال‌آباد، افغانستان', rating: 5, lang: 'fa', text: 'ما که سرمایه زیاد نداریم، از بازار چند دالر سود می‌کنیم. دفه اول که اومدم، کمی گیج شدم ولی حالا راحتم. از وقتی که اینجا کار می‌کنم، دیگه لازم نیست هر روز پشت صراف بگردم.' },
  { name: 'حسین جعفری', city: 'غزنی، افغانستان', rating: 5, lang: 'fa', text: 'قبلاً فقط از گروپ‌های تلگرام تتر می‌خریدم. یک بار پول فرستادم، بلاکم کرد. حالا اینجا مشخص است کی فروشنده‌ست و صرافی خودش واسطه‌ست.' },
  { name: 'نجیب الله صادقی', city: 'مزار شریف، افغانستان', rating: 5, lang: 'fa', text: 'رفقام را دعوت کردم به این صرافی. هر دفه که یک نفر از زیرمجموعه‌هام معامله می‌کنه، یک تیکت به من می‌رسه. تا حالا دوتا ۱۰۰ افغانی و یکی ۵۰ افغانی برنده شدم.' },
  { name: 'فرید صادقی', city: 'هرات، افغانستان', rating: 5, lang: 'fa', text: 'قبلاً برای زیرمجموعه گرفتن چیزی نمی‌دادن. اینجا هم ۱۵ افغانی می‌دن، هم تیکت بخت‌آزمایی. من ۸ نفر آوردم و از دایره شانس هم ۲۰۰ افغانی گرفتم.' },
  { name: 'عزیز الرحمن', city: 'غزنی، افغانستان', rating: 5, lang: 'fa', text: 'من ۱۵ نفر زیرمجموعه دارم. با هر بار معاملات آنها یک تیکت بخت‌آزمایی دریافت می‌کنم. همین دیروز ۱۰۰۰ افغانی در دایره شانس برنده شدم.' },
  { name: 'حکمت الله رحیمی', city: 'غزنی، افغانستان', rating: 5, lang: 'fa', text: 'هر وقت که زیرمجموعه‌هام معامله می‌کنن، برام یک تیکت میاد. هفته پیش دوتا ۵۰ افغانی و یک تیکت رایگان برنده شدم.' },
  { name: 'یوسف اکبری', city: 'پروان، افغانستان', rating: 5, lang: 'fa', text: '۵ نفر زیرمجموعه دارم. هر معامله‌ای که می‌کنن، ۱۵ افغانی به حساب قفل‌شده‌ام میاد و یک تیکت هم می‌گیرم. هفته پیش ۱۰۰ افغانی از دایره شانس برنده شدم.' },
  { name: 'نصیر احمد', city: 'کابل، افغانستان', rating: 5, lang: 'fa', text: 'قبلاً چند بار از نفرهای نامعلوم داخل تلگرام تتر خریدم. یک بار پول فرستادم، بلاکم کرد. حالا اینجا راحتم. صرافی خودش ضامن است.' },
  { name: 'عبدالله نوری', city: 'مزار شریف، افغانستان', rating: 5, lang: 'fa', text: 'کارشون خوبه. پول سریع می‌رسه. تازه از دایره شانس هم چیزهای خوبی برنده شدم.' },
  { name: 'حبیب الله صادقی', city: 'جلال‌آباد، افغانستان', rating: 5, lang: 'fa', text: 'دفه اول یه کم استرس داشتم ولی حالا دیگه کاملاً راحتم. چند بار معامله کردم و همه‌شون درست بود.' },
  { name: 'شفیع الله نوری', city: 'کابل، افغانستان', rating: 5, lang: 'fa', text: 'من تریدر کوچک هستم. قبلاً از بازار چند دالر سود می‌کردم ولی نقد کردنش سخت بود. حالا اینجا خیلی راحت‌تره.' },
  { name: 'محمد احمدی', city: 'مزار شریف، افغانستان', rating: 5, lang: 'fa', text: 'P2P اینجا خیلی خوبه. فروشنده‌ها مشخص است، امتیاز دارن. اگه مشکلی شود، صرافی پیگیری می‌کنه.' },
  { name: 'وحید کریمی', city: 'کابل، افغانستان', rating: 4, lang: 'fa', text: 'کارشون خوبه. فقط بعضی وقت‌ها کمی صبر می‌خواد تا فروشنده مناسب پیدا شود.' },
  { name: 'عبدالله کریمی', city: 'مزار شریف، افغانستان', rating: 3, lang: 'fa', text: 'من دفه اول کمی گیج شدم. راهنما باید واضح‌تر باشد. حالا دیگه یاد گرفتم ولی دفه اول سخت بود.' },
  { name: 'رامین نظری', city: 'هرات، افغانستان', rating: 5, lang: 'fa', text: 'از وقتی که اینجا حساب باز کردم، دیگه از تلگرام خرید نمی‌کنم. امنیتش خیلی بهتره.' },
  { name: 'سهیل کاظمی', city: 'کابل، افغانستان', rating: 5, lang: 'fa', text: 'چند بار معامله کردم. هر بار درست بود. نرخ‌ها هم منصفانه است.' },
  { name: 'فواد باقری', city: 'قندهار، افغانستان', rating: 4, lang: 'fa', text: 'خوب کار می‌کنه. فقط کاش تعداد فروشنده‌ها زیادتر بود تا بیشتر انتخاب داشته باشیم.' },
  { name: 'مسعود عباسی', city: 'هرات، افغانستان', rating: 5, lang: 'fa', text: 'قبلاً از یک جای مشخص تتر می‌خریدم، سه چهار فیصد کمیسیون می‌گرفت. حالا اینجا کمتر حساب می‌کنه و خودم می‌تونم نرخ را ببینم.' },
  { name: 'جاوید زمانی', city: 'هرات، افغانستان', rating: 5, lang: 'fa', text: 'کمیشن اینجا از جایی که قبلاً کار می‌کردم کمتره. از وقتی که اینجا هستم، دیگه لازم نیست کمیشن زیاد بدم.' },
  { name: 'بصیر قاسمی', city: 'قندهار، افغانستان', rating: 4, lang: 'fa', text: 'نرخ‌ها خوبه. پول سریع می‌رسه. فقط بعضی وقت‌ها باید کمی صبر کنم.' },
  { name: 'ظاهر شریفی', city: 'مزار شریف، افغانستان', rating: 4, lang: 'fa', text: 'کارشون خوبه. کمیسیون هم منصفانه است. راضی یم.' },
  { name: 'ناصر مرادی', city: 'کابل، افغانستان', rating: 4, lang: 'fa', text: 'خدمتشون خوبه. فقط کاش پشتیبانی یه کم سریع‌تر جواب می‌داد.' },
  { name: 'رامین سلطانی', city: 'کابل، افغانستان', rating: 5, lang: 'fa', text: 'برای تریدرهای کوچک مثل من خیلی خوبه. نرخ‌ها شفافه و کمیشن کمه.' },
  { name: 'داوود عزیزی', city: 'کابل، افغانستان', rating: 3, lang: 'fa', text: 'کار می‌کند ولی پشتیبانی کمی دیر جواب می‌ده. شاید بهتر شود بعداً.' },
  { name: 'یاسین صالحی', city: 'هرات، افغانستان', rating: 3, lang: 'fa', text: 'خوب است ولی کاش شبکه‌های USDT زیادتر بود. من فقط با TRC20 کار می‌کنم.' },
  { name: 'ادریس فرجی', city: 'قندهار، افغانستان', rating: 3, lang: 'fa', text: 'کارشون خوبه ولی کاش یه راهنمای واضح‌تر برای تازه‌کارها داشت.' },
  { name: 'زکریا بهرامی', city: 'مزار شریف، افغانستان', rating: 3, lang: 'fa', text: 'خوبه. فقط بعضی وقت‌ها نرخ‌ها کمی بالا و پایین می‌شه.' },
  { name: 'نبی خالقی', city: 'کابل، افغانستان', rating: 2, lang: 'fa', text: 'دفه اول یه کم سخت بود. حالا دیگه یاد گرفتم ولی اولش گیج شدم.' },
  { name: 'ولی روحانی', city: 'هرات، افغانستان', rating: 2, lang: 'fa', text: 'کار می‌کنه ولی چیز خاصی نداره که منو جذب کنه.' },
  { name: 'نیاز نادری', city: 'کابل، افغانستان', rating: 1, lang: 'fa', text: 'من تازه عضو شدم و راستش خیلی استرس دارم. نمی‌دانم باید چطور شروع کنم. کاشکی یک راهنما برای تازه‌کارها بود.' },
  { name: 'گل محمد قریشی', city: 'مزار شریف، افغانستان', rating: 1, lang: 'fa', text: 'بار اولمه اینجا معامله می‌کنم. کمی می‌ترسم. اگه یک راهنما برای تازه‌کارها بود، خیلی کمک می‌کرد.' },
  { name: 'زهرا حسینی', city: 'قندهار، افغانستان', rating: 5, lang: 'fa', text: 'من از خونه معامله می‌کنم. فروشنده‌ها تأیید شده‌ن و من از کسی می‌خرم که امتیازش بالاست. خیلی راحت‌تر از تلگرامه.' },
  { name: 'فاطمه کریمی', city: 'هرات، افغانستان', rating: 5, lang: 'fa', text: 'چند بار از تلگرام خرید کردم و ضرر کردم. حالا که اینجا هستم، راحت‌تر شدم. دفه اول کمی سخت بود ولی حالا یاد گرفتم.' },
  { name: 'مریم صادقی', city: 'کندز، افغانستان', rating: 4, lang: 'fa', text: 'خوب شده که این امکان رو گذاشتن. قبلاً کمیسیون‌ها بالا بود، حالا خودم انتخاب می‌کنم از کی بخرم.' },
  { name: 'شکیبا نوری', city: 'لوگر، افغانستان', rating: 5, lang: 'fa', text: 'برای من که تازه‌کار هستم، این صرافی خیلی کمک کرده. حساب پی من سریع پر می‌شه و دیگه نگران نیستم.' },
  { name: 'نجیبه رحیمی', city: 'ننگرهار، افغانستان', rating: 5, lang: 'fa', text: 'فروشنده‌های اینجا رتبه و امتیاز دارن. من از کسی می‌خرم که امتیازش بالاست و معامله‌های قبلی‌اش موفق بوده.' },
  { name: 'نصیر احمد', city: 'کابل، افغانستان', rating: 5, lang: 'ps', text: 'پخوا مې د تلګرام له نامعلومو خلکو تتر اخیست. یو ځل مې پیسې ولېږلې، بیا یې بلاک کړم. حالا چې دلته یم، زما زړه ارام دی.' },
  { name: 'شفیقه کریمی', city: 'هرات، افغانستان', rating: 5, lang: 'ps', text: 'موږ کوچني سوداګر وو. د تلګرام له لارې به مو تتر اخیست. کله کله به دوکه کېدل. اوس چې دې صرافي دا ستونزه حل کړې، ډېر خوشحاله یو.' },
  { name: 'مرسل جعفری', city: 'کندز، افغانستان', rating: 4, lang: 'ps', text: 'زما میړه او زه دواړه له دې پلیټفارم کار اخلو. پخوا مو له نامعلومو خلکو سره معامله کوله او ډار و. اوس ډاډه یو.' },
  { name: 'عبدالله نوری', city: 'مزار شریف، افغانستان', rating: 5, lang: 'ps', text: 'زما ۱۰ ملګري رابلل. هر ځل چې دوی معامله کوي، زه یو ټکټ اخلم. پرون مې ۱۰۰ افغانۍ وګټلې.' },
  { name: 'حبیب الله صادقی', city: 'جلال‌آباد، افغانستان', rating: 5, lang: 'ps', text: 'د تلګرام له نامعلومو خلکو سره مو معامله کوله. یو ځل مو پیسې ورکړې او بلاک شوو. اوس چې آریانا ده، ډاډه یو.' },
  { name: 'زلیخا احمدی', city: 'قندهار، افغانستان', rating: 5, lang: 'ps', text: 'زه کور ته ناسته یم او معامله کوم. پیسې هم ژر رسېږي. د ښځو لپاره ډېر اسان دی.' },
  { name: 'عزیز الرحمن', city: 'غزنی، افغانستان', rating: 4, lang: 'ps', text: 'ښه کار کوي. یوازې کله کله د مناسب پیرودونکي پیدا کول وخت نیسي.' },
  { name: 'پریسا حسینی', city: 'بامیان، افغانستان', rating: 5, lang: 'ps', text: 'پخوا مو له بهرنیو خلکو معامله کوله او ډار و. اوس چې پوهیږو صرافي ضامنه ده، ډاډه یو.' },
  { name: 'حکمت الله رحیمی', city: 'غزنی، افغانستان', rating: 5, lang: 'ps', text: 'د پخوا په پرتله ډېر ښه دی. کمیسیون کم دی او د مرستې ټیم ژر ځواب وایي.' },
  { name: 'نصرالله قادری', city: 'فاریاب، افغانستان', rating: 5, lang: 'ps', text: 'هر ځل چې زما ماشومان معامله کوي، زه ټکټ اخلم. دې دوی ته ښه انګیزه ورکړې ده.' },
  { name: 'Sarah K.', city: 'Dubai, UAE', rating: 5, lang: 'en', text: 'Been using Aryana for a few months. The P2P option is really helpful — the platform holds the funds until both sides confirm. Used to get scammed on Telegram groups before.' },
  { name: 'Michael R.', city: 'Frankfurt, Germany', rating: 4, lang: 'en', text: 'Simple platform, works well. I mostly use P2P. KYC took a day but that\'s normal.' },
  { name: 'Zahra A.', city: 'Hamburg, Germany', rating: 5, lang: 'en', text: 'I use Aryana mostly to send money to my family back in Afghanistan. The P2P is simple and the funds are safe. My brother received his money in a few hours.' },
  { name: 'David A.', city: 'Istanbul, Turkey', rating: 5, lang: 'en', text: 'Used to buy USDT from random Telegram sellers and got scammed once. With Aryana\'s P2P, funds are held safely until both sides confirm. Much better.' },
  { name: 'Kaveh S.', city: 'Toronto, Canada', rating: 5, lang: 'en', text: 'Good experience. P2P works smoothly and fees are lower than elsewhere. Recommended for small traders.' },
];

// ═══ FAQ ═══
const FAQ_DATA = [
  { icon: 'user', q: 'How do I sign up?', a: 'Click the "Register" button, enter your email and phone number, add a referral code if you have one, and create your account. After registration, you\'ll need to complete KYC verification to enable trading.' },
  { icon: 'shield', q: 'Why is KYC required?', a: 'KYC (Know Your Customer) is a legal requirement for all financial platforms. By verifying your identity, we ensure account security and prevent fraud. Once verified, all platform features are unlocked for you.' },
  { icon: 'dollar', q: 'What is the minimum trade amount?', a: 'The minimum amount per trade is 10 USDT. For AFN withdrawals, the minimum is 500 AFN, and for USDT withdrawals, the minimum is 10 USDT.' },
  { icon: 'percent', q: 'What are the platform fees?', a: 'Our base fee is 1.5% of each trade amount. VIP users get lower rates. The exact fee is always shown before you confirm a trade.' },
  { icon: 'buy', q: 'How do I buy USDT?', a: 'Log into your account, select "Buy USDT", enter the amount, review the rate, and confirm. Then transfer the AFN to our account and submit the receipt. Our team verifies the payment and sends USDT to your wallet.' },
  { icon: 'sell', q: 'How do I sell USDT?', a: 'In your account, select "Sell USDT", enter the USDT amount, and review the rate. Your USDT is locked in the platform, and after verification, AFN is sent to your Hesab Pay or bank account.' },
  { icon: 'p2p', q: 'What is P2P and how does it work?', a: 'P2P (Peer to Peer) means a direct trade between you and another user, with Aryana acting as the trusted middleman. Both sides\' funds stay locked until both confirm. This ensures trade security and prevents fraud.' },
  { icon: 'network', q: 'Which USDT network is best?', a: 'TRC20 (Tron) is the fastest and cheapest option, and most users prefer it. BEP20 (BNB Chain) is also a good choice. For large transfers, ERC20 (Ethereum) is the global standard but has higher fees.' },
  { icon: 'time', q: 'How long does a trade take?', a: 'Most trades are completed in under 15 minutes. If a payment requires manual review, it may take a bit longer. For P2P, timing depends on the counterparty, but our team follows up.' },
  { icon: 'gift', q: 'What is the Referral Program?', a: 'Every successful referral earns you 15 AFN in your locked balance. Once your friend completes KYC and their first trade, the amount is released. You also earn a percentage of VIP referral commissions.' },
  { icon: 'wheel', q: 'What is the Rewards Wheel?', a: 'The Rewards Wheel is a game with cash prizes. You earn free tickets by signing up, completing trades, or inviting friends. Spin the wheel to win up to 1,000 AFN. You can also buy extra tickets for 50 AFN each.' },
  { icon: 'support', q: 'How do I contact support?', a: 'You can reach our support team via Telegram, WhatsApp, or email. Our typical response time is under 5 minutes. Contact links are in the footer and on the Contact page.' },
];

// ═══ State ═══
let currentRate = { buy: 70.50, sell: 70.20, high: 70.80, low: 70.10, change: 0.45, liquidity: 45250 };

// ═══ INIT ═══
document.addEventListener('DOMContentLoaded', async () => {
  const initialLang = I18N.detectInitialLang();
  await I18N.load(initialLang);
  I18N.apply();

  startTypewriter();
  await loadLiveRates();
  updateSparkline();
  startLiveTimestamp();
  await initTicker();
  initActivityFeed();
  startActivityUpdates();
  startOnlineCounter();
  initCalculator();
  initTestimonials();
  initFAQ();
  initScrollReveal();

  setInterval(loadLiveRates, 15000);
  setInterval(updateSparkline, 8000);
  setInterval(initTicker, 60000);
  setInterval(updateStats, 5000);
});

// ═══ Typewriter ═══
function startTypewriter() {
  const el = document.getElementById('typewriterText');
  if (!el) return;
  const phrases = ['at the best rate.', 'in seconds.', 'with trust.', '24/7 always.'];
  let phraseIndex = 0, charIndex = 0, isDeleting = false;
  function type() {
    const current = phrases[phraseIndex];
    if (isDeleting) { el.textContent = current.substring(0, charIndex - 1); charIndex--; }
    else { el.textContent = current.substring(0, charIndex + 1); charIndex++; }
    let speed = isDeleting ? 50 : 100;
    if (!isDeleting && charIndex === current.length) { speed = 2500; isDeleting = true; }
    else if (isDeleting && charIndex === 0) { isDeleting = false; phraseIndex = (phraseIndex + 1) % phrases.length; speed = 300; }
    setTimeout(type, speed);
  }
  type();
}

// ═══ Live Rates ═══
async function loadLiveRates() {
  try {
    const rate = await API.getCurrentRate();
    currentRate.buy = Number(rate.sell_price_afn);
    currentRate.sell = Number(rate.buy_price_afn);
  } catch (err) {
    currentRate.buy = 70.50 + (Math.random() - 0.5) * 0.4;
    currentRate.sell = 70.20 + (Math.random() - 0.5) * 0.4;
  }
  currentRate.buy = Math.round(currentRate.buy * 100) / 100;
  currentRate.sell = Math.round(currentRate.sell * 100) / 100;
  currentRate.high = Math.max(currentRate.high, currentRate.buy);
  currentRate.low = Math.min(currentRate.low, currentRate.buy);
  currentRate.change = ((currentRate.buy - 70) / 70 * 100);
  updateRateUI();
}

function updateRateUI() {
  const fmt = (n) => Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const priceEl = document.getElementById('lrcPrice');
  const changeEl = document.getElementById('lrcChange');
  const highEl = document.getElementById('lrcHigh');
  const lowEl = document.getElementById('lrcLow');
  const spreadEl = document.getElementById('lrcSpread');
  const buyEl = document.getElementById('lrcBuyPrice');
  const sellEl = document.getElementById('lrcSellPrice');
  const liqEl = document.getElementById('lrcLiquidity');

  if (priceEl) {
    const oldPrice = parseFloat(priceEl.dataset.price || 0);
    const newPrice = currentRate.buy;
    priceEl.textContent = fmt(newPrice);
    priceEl.dataset.price = newPrice;
    if (oldPrice > 0) {
      priceEl.classList.add(newPrice > oldPrice ? 'flash-up' : 'flash-down');
      setTimeout(() => priceEl.classList.remove('flash-up', 'flash-down'), 600);
    }
  }
  if (changeEl) {
    const svg = currentRate.change >= 0 ? '<polyline points="18 15 12 9 6 15"/>' : '<polyline points="6 9 12 15 18 9"/>';
    changeEl.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">${svg}</svg><span>${currentRate.change >= 0 ? '+' : ''}${currentRate.change.toFixed(2)}%</span><span class="lrc-change-period">today</span>`;
    changeEl.style.background = currentRate.change >= 0 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)';
    changeEl.style.color = currentRate.change >= 0 ? '#10B981' : '#EF4444';
  }
  if (highEl) highEl.textContent = fmt(currentRate.high);
  if (lowEl) lowEl.textContent = fmt(currentRate.low);
  if (spreadEl) spreadEl.textContent = fmt(currentRate.buy - currentRate.sell);
  if (buyEl) buyEl.textContent = fmt(currentRate.buy);
  if (sellEl) sellEl.textContent = fmt(currentRate.sell);
  if (liqEl) liqEl.textContent = currentRate.liquidity.toLocaleString('en-US');

  const bc = document.getElementById('buyCardPrice');
  const sc = document.getElementById('sellCardPrice');
  const be = document.getElementById('buyCardExample');
  const se = document.getElementById('sellCardExample');
  if (bc) bc.textContent = `${fmt(currentRate.buy)} AFN`;
  if (sc) sc.textContent = `${fmt(currentRate.sell)} AFN`;
  if (be) be.textContent = `${fmt(currentRate.buy * 100)} AFN`;
  if (se) se.textContent = `${fmt(currentRate.sell * 100)} AFN`;
  updateCalculator();
}

// ═══ Timestamp ═══
function startLiveTimestamp() {
  const el = document.getElementById('lrcTimestamp');
  if (!el) return;
  let seconds = 0;
  setInterval(() => {
    seconds++;
    if (seconds < 5) el.textContent = 'just now';
    else if (seconds < 60) el.textContent = `${seconds}s ago`;
    else el.textContent = `${Math.floor(seconds / 60)}m ago`;
  }, 1000);
}

// ═══ Sparkline ═══
let sparklinePoints = [];
function updateSparkline() {
  const pathEl = document.getElementById('lrcSparklinePath');
  const areaEl = document.getElementById('lrcSparklineArea');
  if (!pathEl || !areaEl) return;
  if (sparklinePoints.length === 0) {
    for (let i = 0; i < 40; i++) sparklinePoints.push(70 + (Math.random() - 0.5) * 0.8);
  }
  sparklinePoints.shift();
  sparklinePoints.push(currentRate.buy);
  const min = Math.min(...sparklinePoints);
  const max = Math.max(...sparklinePoints);
  const range = max - min || 1;
  const width = 400, height = 80, padding = 4;
  const points = sparklinePoints.map((price, i) => ({
    x: (i / (sparklinePoints.length - 1)) * width,
    y: padding + (1 - (price - min) / range) * (height - padding * 2),
  }));
  let pathD = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) pathD += ` L ${points[i].x} ${points[i].y}`;
  const areaD = pathD + ` L ${width} ${height} L 0 ${height} Z`;
  pathEl.setAttribute('d', pathD);
  areaEl.setAttribute('d', areaD);
}

// ═══ Ticker ═══
async function initTicker() {
  const track = document.getElementById('tickerTrack');
  if (!track) return;
  const fmt = (n) => Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const items = [
    { symbol: 'USDT/AFN', price: fmt(currentRate.buy), change: '+0.45%', up: true },
    { symbol: 'USD/AFN',  price: fmt(currentRate.buy), change: '+0.12%', up: true },
    { symbol: 'EUR/AFN',  price: '76.50', change: '+0.18%', up: true },
    { symbol: 'GBP/AFN',  price: '89.20', change: '−0.09%', up: false },
    { symbol: 'AED/AFN',  price: '19.20', change: '+0.09%', up: true },
    { symbol: 'IRT/AFN',  price: '0.0011', change: '+0.05%', up: true },
    { symbol: 'PKR/AFN',  price: '0.245', change: '−0.15%', up: false },
    { symbol: 'CHF/AFN',  price: '81.30', change: '+0.22%', up: true },
    { symbol: 'AUD/AFN',  price: '45.80', change: '−0.07%', up: false },
    { symbol: 'USDT/IRR', price: '0.00097', change: '+0.31%', up: true },
  ];
  const buildItem = (item) => `
    <div class="ticker-item">
      <span class="symbol">${item.symbol}</span>
      <span class="price">${item.price}</span>
      <span class="change ${item.up ? 'up' : 'down'}">${item.up ? '▲' : '▼'} ${item.change}</span>
    </div>
  `;
  const html = items.map(buildItem).join('');
  track.innerHTML = html + html;
}

// ═══ Activity ═══
function randomFrom(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function randomNumber(min, max) { return Math.floor(Math.random() * (max - min) + min); }
function getRandomTime() {
  const times = ['2s', '5s', '8s', '12s', '22s', '30s', '45s', '1m', '2m'];
  return randomFrom(times) + ' ago';
}
function generateActivityItem() {
  const firstName = randomFrom(FIRST_NAMES_M);
  const lastName = randomFrom(LAST_NAMES);
  const city = randomFrom(CITIES);
  const network = randomFrom(NETWORKS);
  const type = Math.random() > 0.4 ? 'buy' : 'sell';
  let amount;
  if (Math.random() > 0.7) amount = randomNumber(1000, 2500);
  else if (Math.random() > 0.4) amount = randomNumber(100, 999);
  else amount = randomNumber(10, 99);
  return {
    name: `${firstName} ${lastName}`,
    location: city, network, type,
    amount: amount.toLocaleString('en-US'),
    initials: firstName.charAt(0),
    gradient: randomFrom(AVATAR_GRADIENTS),
    time: getRandomTime(),
  };
}
function createActivityItem(data, isNew = false) {
  const typeLabel = data.type === 'buy'
    ? '<span class="activity-type buy">▲ Buy</span>'
    : '<span class="activity-type sell">▼ Sell</span>';
  return `
    <div class="activity-item ${isNew ? 'new' : ''}">
      <div class="activity-avatar" style="background: linear-gradient(135deg, ${data.gradient[0]}, ${data.gradient[1]});">${data.initials}</div>
      <div class="activity-info">
        <div class="activity-name">${data.name}<span class="activity-location">· ${data.location}</span></div>
        <div class="activity-meta">${typeLabel}<span class="activity-network-badge">${data.network}</span></div>
      </div>
      <div class="activity-amount">
        <div class="activity-amount-value">${data.amount} USDT</div>
        <div class="activity-time">${data.time}</div>
      </div>
    </div>
  `;
}
function initActivityFeed() {
  const feed = document.getElementById('activityFeed');
  if (!feed) return;
  feed.innerHTML = '';
  for (let i = 0; i < 7; i++) feed.insertAdjacentHTML('beforeend', createActivityItem(generateActivityItem(), false));
}
function startActivityUpdates() {
  const feed = document.getElementById('activityFeed');
  if (!feed) return;
  function addNewItem() {
    feed.insertAdjacentHTML('afterbegin', createActivityItem(generateActivityItem(), true));
    const items = feed.querySelectorAll('.activity-item');
    if (items.length > 7) items[items.length - 1].remove();
    setTimeout(addNewItem, 3000 + Math.random() * 3000);
  }
  setTimeout(addNewItem, 3000);
}
function startOnlineCounter() {
  const el = document.getElementById('activityOnlineCount');
  if (!el) return;
  let count = 2847;
  setInterval(() => {
    count += Math.floor(Math.random() * 9) - 4;
    if (count < 2800) count = 2800;
    if (count > 2950) count = 2950;
    el.textContent = count.toLocaleString('en-US');
  }, 4000);
}
function updateStats() {
  const t = document.getElementById('statTrades');
  const v = document.getElementById('statVolume');
  const s = document.getElementById('statSuccess');
  if (t) {
    let c = parseInt(t.textContent.replace(/,/g, '')) || 1847;
    t.textContent = (c + Math.floor(Math.random() * 5) + 1).toLocaleString('en-US');
  }
  if (v) {
    let c = parseInt(v.textContent.replace(/,/g, '')) || 47250;
    v.textContent = (c + Math.floor(Math.random() * 100) + 20).toLocaleString('en-US');
  }
  if (s) s.textContent = (99.8 + (Math.random() - 0.5) * 0.1).toFixed(1);
}

// ═══ Calculator ═══
function initCalculator() {
  const input = document.getElementById('calcAmount');
  const btn = document.getElementById('calcBtn');
  if (input) input.addEventListener('input', updateCalculator);
  if (btn) btn.addEventListener('click', () => {
    updateCalculator();
    btn.style.transform = 'scale(0.95)';
    setTimeout(() => btn.style.transform = '', 150);
  });
  updateCalculator();
}
function updateCalculator() {
  const input = document.getElementById('calcAmount');
  const result = document.getElementById('calcResult');
  if (!input || !result) return;
  const amount = parseFloat(input.value) || 0;
  const total = amount * currentRate.buy;
  result.textContent = total.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

// ═══════════════════════════════════════
//   Testimonials — JS Infinite Scroll
// ═══════════════════════════════════════

function generateStars(rating) {
  let stars = '';
  for (let i = 1; i <= 5; i++) {
    if (i <= rating) stars += `<svg viewBox="0 0 24 24" fill="currentColor" class="star-filled"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`;
    else stars += `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="star-empty"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`;
  }
  return stars;
}

function randomDate() {
  const daysAgo = Math.floor(Math.random() * 30) + 1;
  const hours = String(Math.floor(Math.random() * 24)).padStart(2, '0');
  const minutes = String(Math.floor(Math.random() * 60)).padStart(2, '0');

  let dateText;
  if (daysAgo === 1) dateText = 'Yesterday';
  else if (daysAgo < 7) dateText = `${daysAgo} days ago`;
  else if (daysAgo < 30) {
    const weeks = Math.floor(daysAgo / 7);
    dateText = `${weeks} week${weeks > 1 ? 's' : ''} ago`;
  }
  else dateText = '1 month ago';

  return { date: dateText, time: `${hours}:${minutes}` };
}

function createTestimonialCard(t) {
  const gradient = randomFrom(AVATAR_GRADIENTS);
  const dir = t.lang === 'en' ? 'ltr' : 'rtl';
  const { date, time } = randomDate();

  return `
    <div class="testimonial-card">
      <div class="tc-head">
        <div class="tc-avatar" lang="${t.lang}" style="background: linear-gradient(135deg, ${gradient[0]}, ${gradient[1]});">
          ${t.name.charAt(0)}
        </div>
        <div class="tc-meta">
          <div class="tc-name" dir="${dir}" lang="${t.lang}">${t.name}</div>
          <div class="tc-location" dir="${dir}" lang="${t.lang}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
            <span>${t.city}</span>
          </div>
        </div>
        <div class="tc-date">
          <div class="tc-date-text">${date}</div>
          <div class="tc-time-text">${time}</div>
        </div>
      </div>

      <div class="tc-stars">${generateStars(t.rating)}</div>

      <div class="tc-text" dir="${dir}" lang="${t.lang}">${t.text}</div>
    </div>
  `;
}

function initTestimonials() {
  const scroll = document.getElementById('testimonialsScroll');
  if (!scroll) return;

  const shuffled = [...TESTIMONIALS].sort(() => Math.random() - 0.5);
  const cardsHtml = shuffled.map(createTestimonialCard).join('');

  // First render
  scroll.innerHTML = cardsHtml;

  // Wait for layout then duplicate + start animation
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      scroll.innerHTML += cardsHtml;
      startTestimonialAnimation(scroll);
    });
  });
}

function startTestimonialAnimation(scroll) {
  let scrollY = 0;
  const SPEED = 0.6; // px per frame ≈ 36px/s
  let paused = false;
  let halfHeight = 0;

  function measure() {
    halfHeight = scroll.scrollHeight / 2;
  }

  measure();
  window.addEventListener('resize', measure);

  function tick() {
    if (!paused && halfHeight > 0) {
      scrollY += SPEED;

      if (scrollY >= halfHeight) {
        scrollY = 0;
      }

      scroll.style.transform = `translate3d(0, ${-scrollY}px, 0)`;
    }
    requestAnimationFrame(tick);
  }

  requestAnimationFrame(tick);

  // Pause on hover
  const wrapper = scroll.closest('.testimonials-scroll-wrapper');
  if (wrapper) {
    wrapper.addEventListener('mouseenter', () => { paused = true; });
    wrapper.addEventListener('mouseleave', () => { paused = false; });
  }
}

// ═══════════════════════════════════════
//              FAQ
// ═══════════════════════════════════════

const FAQ_ICONS = {
  user: '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
  shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
  dollar: '<line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>',
  percent: '<line x1="19" y1="5" x2="5" y2="19"/><circle cx="6.5" cy="6.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/>',
  buy: '<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>',
  sell: '<line x1="5" y1="12" x2="19" y2="12"/>',
  p2p: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
  network: '<circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>',
  time: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
  gift: '<polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/>',
  wheel: '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4M5 5l2.5 2.5M16.5 16.5L19 19M19 5l-2.5 2.5M7.5 16.5L5 19"/>',
  support: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
};

function createFaqItem(item, index) {
  const icon = FAQ_ICONS[item.icon] || FAQ_ICONS.user;
  return `
    <div class="faq-item" data-index="${index}">
      <button class="faq-question" type="button">
        <div class="faq-question-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">${icon}</svg>
        </div>
        <div class="faq-question-text">${item.q}</div>
        <div class="faq-chevron">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </div>
      </button>
      <div class="faq-answer">
        <div class="faq-answer-inner">${item.a}</div>
      </div>
    </div>
  `;
}

function initFAQ() {
  const list = document.getElementById('faqList');
  if (!list) return;
  list.innerHTML = FAQ_DATA.map((item, i) => createFaqItem(item, i)).join('');

  list.querySelectorAll('.faq-item').forEach(item => {
    const btn = item.querySelector('.faq-question');
    btn.addEventListener('click', () => {
      const isOpen = item.classList.contains('open');
      list.querySelectorAll('.faq-item.open').forEach(o => o.classList.remove('open'));
      if (!isOpen) item.classList.add('open');
    });
  });

  const searchInput = document.getElementById('faqSearch');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const query = e.target.value.trim().toLowerCase();
      list.querySelectorAll('.faq-item').forEach(item => {
        const text = item.textContent.toLowerCase();
        item.style.display = (!query || text.includes(query)) ? '' : 'none';
      });
    });
  }
}

// ═══ Scroll Reveal ═══
function initScrollReveal() {
  const reveals = document.querySelectorAll('.reveal');
  if (reveals.length === 0) return;
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });
  reveals.forEach(el => observer.observe(el));
}