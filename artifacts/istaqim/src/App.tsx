import { createContext, useContext, useEffect, useMemo, useState, type Dispatch, type ReactNode, type SetStateAction } from 'react';
import { Link, Route, Router as WouterRouter, Switch, useLocation, useRoute } from 'wouter';
import {
  ArrowLeft, ArrowUpRight, Bell, BookMarked, BookOpen, Check, CheckCheck, Compass,
  Flame, Headphones, Heart, Home, Library, ListFilter, MapPin, Menu, Moon,
  Plus, Search, Settings, ShieldCheck, Sparkles, Sunrise, Sun, Volume2, X, RotateCcw,
} from 'lucide-react';
import {
  calculateDamanhourPrayerTimes,
  calculateQiblaBearing,
  DAMANHOUR,
  formatDegrees,
  getLocalDateLabel,
  type PrayerName,
} from '@/lib/islamic-calculations';
import { startReminderTimer } from '@/lib/reminders';

type Area = { id: string; title: string; short: string; group: string; icon: string; detail: string; state: 'local' | 'source' | 'provider' };
const areas: Area[] = [
  { id:'quran', title:'القرآن الكريم والاستماع', short:'تلاوة، تفسير، وأسباب النزول', group:'القرآن', icon:'۞', detail:'القرآن الكريم، استماع لعشرة قرّاء ومنهم الشيخ محمد صديق المنشاوي، وتفاسير وأسباب نزول.', state:'source' },
  { id:'hadith', title:'أحاديث صحيحة بأسانيدها', short:'بحث في السنة النبوية', group:'القرآن والسنة', icon:'ح', detail:'مساحة للأحاديث مع الأسانيد والتخريج. لا تتوفر قاعدة نصوص موثقة ضمن هذه النسخة.', state:'source' },
  { id:'bukhari', title:'صحيح البخاري', short:'المتن الكامل مع التخريج', group:'القرآن والسنة', icon:'ب', detail:'المتن الكامل لصحيح البخاري يحتاج إلى مصدر رقمي موثوق وربط للمراجعة.', state:'source' },
  { id:'muslim', title:'صحيح مسلم', short:'المتن الكامل مع التخريج', group:'القرآن والسنة', icon:'م', detail:'المتن الكامل لصحيح مسلم يحتاج إلى مصدر رقمي موثوق وربط للمراجعة.', state:'source' },
  { id:'adhan', title:'أصوات الأذان', short:'استمع واختر صوتك', group:'الصلاة والذكر', icon:'♫', detail:'مكتبة أصوات الأذان ستتاح عند إضافة التسجيلات المرخّصة.', state:'provider' },
  { id:'prayer-times', title:'مواقيت الصلاة — دمنهور', short:'مواقيت محلية حسب موقعك', group:'الصلاة والذكر', icon:'☼', detail:'تحتاج المواقيت الدقيقة إلى مصدر حساب معتمد وموقع محدث. لا نعرض أوقاتاً تقديرية على أنها صحيحة.', state:'provider' },
  { id:'qibla', title:'اتجاه القبلة', short:'اعرف اتجاه القبلة', group:'الصلاة والذكر', icon:'⌖', detail:'تحديد القبلة بدقة يتطلب صلاحية الموقع وبوصلة الجهاز. تحقّق من اتجاهك في المكان قبل الاعتماد عليه.', state:'provider' },
  { id:'salah', title:'الصلاة وأحكامها', short:'تعلم أحكام الصلاة', group:'الصلاة والذكر', icon:'ص', detail:'دليل تعليمي للصلاة وأحكامها. يلزم إعداد محتوى فقهي موثوق ومراجع قبل النشر.', state:'source' },
  { id:'reminders', title:'تذكير كل ١٥ دقيقة', short:'صلاة على النبي، تسبيح، وذكر', group:'الصلاة والذكر', icon:'◷', detail:'اختر تذكيراً لطيفاً يتناوب بين الصلاة على النبي والتسبيح والذكر. يتطلب إرسال إشعارات إذناً من جهازك.', state:'local' },
  { id:'seerah', title:'السيرة النبوية', short:'حياة الرسول، أهل البيت، والسرايا', group:'المعرفة', icon:'س', detail:'أقسام منفصلة لحياة الرسول ﷺ، وأمهات المؤمنين وآل البيت، والغزوات والسرايا. المحتوى الكامل يحتاج مصادر موثقة.', state:'source' },
  { id:'madhahib', title:'جامع المذاهب الأربعة', short:'مسائل الفقه المقارن', group:'المعرفة', icon:'٤', detail:'مرجع فقهي مقارن للمذاهب الأربعة. لا تعرض هذه النسخة فتاوى أو أحكاماً غير موثقة.', state:'source' },
  { id:'salawat', title:'صلوات على النبي', short:'٥٠٠ صيغة مع عدّاد', group:'الصلاة والذكر', icon:'♡', detail:'عداد شخصي للصلاة على النبي. مجموعة الصيغ تحتاج مراجعة مصادرها قبل عرضها.', state:'local' },
  { id:'dua', title:'أدعية من القرآن والسنة', short:'أدعية مأثورة موثقة', group:'الصلاة والذكر', icon:'د', detail:'تُضاف الأدعية بعد التحقق من ورودها في القرآن الكريم أو السنة الصحيحة. لا توجد نصوص تجريبية هنا.', state:'source' },
  { id:'azkar', title:'أذكار الصباح والمساء', short:'أذكار، تسابيح، وأدعية', group:'الصلاة والذكر', icon:'☾', detail:'أذكار الصباح والمساء والتسابيح مع توثيق كل نص. المكتبة الموثقة غير مضافة بعد.', state:'source' },
  { id:'tasbeeh', title:'المسبحة الإلكترونية', short:'عداد ذكر يحفظ تقدمك', group:'أدوات يومية', icon:'◉', detail:'عداد ذكر شخصي يعمل دون اتصال ويحفظ تقدّمك على هذا الجهاز.', state:'local' },
  { id:'ibadat-guide', title:'فقه الصيام والزكاة والحج', short:'عبادات وأحكامها', group:'المعرفة', icon:'هـ', detail:'دليل تعليمي للصيام والزكاة والحج؛ يحتاج محتوى موثقاً ومراجعة علمية قبل الإتاحة.', state:'source' },
  { id:'names', title:'أسماء الله الحسنى', short:'معانٍ وتدبر', group:'المعرفة', icon:'٩٩', detail:'عرض تفصيلي للأسماء ومعانيها يحتاج إعداداً ومراجعة لمصادر الشرح.', state:'source' },
  { id:'fatwas', title:'الفتاوى الإسلامية', short:'ابحث في إجابات موثوقة', group:'المعرفة', icon:'؟', detail:'لا تُعرض الفتاوى إلا مع مصدر موثوق ومرجع واضح. يرجى سؤال أهل العلم في المسائل الخاصة.', state:'source' },
  { id:'memorizer', title:'مساعد حفظ القرآن', short:'تدريب على التلاوة والحفظ', group:'أدوات يومية', icon:'⌁', detail:'التعرّف على التلاوة ومساعد الحفظ بالذكاء الاصطناعي يحتاجان إلى مزود خدمة ونموذج مراجَع.', state:'provider' },
  { id:'community', title:'المجتمع وختمات القرآن', short:'ختمة جماعية ومتابعة', group:'المجتمع', icon:'◎', detail:'المزامنة ومشاركة الختمات تتطلب حسابات وخادماً مجتمعياً آمناً. لا يوجد اتصال مجتمعي في هذه النسخة.', state:'provider' },
  { id:'dreams', title:'تعبير الرؤى', short:'إرشادات ومصادر موثوقة', group:'المعرفة', icon:'☾', detail:'تعبير الرؤى ظني وليس حكماً شرعياً. لا نقدم تفسيرات؛ يجب إضافة مصادر موثوقة ومراجعة متخصصة.', state:'source' },
  { id:'tracker', title:'متابعة العبادات', short:'خطواتك اليومية في مكان واحد', group:'أدوات يومية', icon:'✓', detail:'سجل شخصي محلي لمتابعة العبادات اليومية. بياناتك محفوظة على هذا الجهاز فقط.', state:'local' },
  { id:'kids', title:'قصص الأطفال والسيرة', short:'قصص كرتونية هادفة', group:'العائلة', icon:'✧', detail:'القصص المصورة والرسوم المتحركة تحتاج إلى محتوى أصلي ومراجعة ومزود تشغيل.', state:'provider' },
  { id:'women', title:'فقه المرأة المسلمة', short:'موضوعات تراعي احتياجات المرأة', group:'المعرفة', icon:'ن', detail:'محتوى فقهي للمرأة يحتاج مصادر موثوقة ومراجعة علمية متخصصة قبل النشر.', state:'source' },
  { id:'teacher', title:'معلّم الصلاة والوضوء', short:'خطوات عملية للتعلم', group:'أدوات يومية', icon:'↗', detail:'معلّم تفاعلي للصلاة والوضوء. المواد التعليمية تحتاج إعداداً ومراجعة قبل الإتاحة.', state:'source' },
  { id:'sunan', title:'العبادات والسنن', short:'كيفيات العبادات والسنن', group:'المعرفة', icon:'✦', detail:'دليل شامل للعبادات والسنن، لا يُنشر قبل توثيق كل مادة ومراجعتها.', state:'source' },
  { id:'library', title:'المكتبة الإسلامية', short:'كتب ومراجع نافعة', group:'المعرفة', icon:'▤', detail:'المكتبة تحتاج إضافة كتب مرخصة ومراجع موثوقة. لا توجد ملفات كتب مرفقة حالياً.', state:'source' },
  { id:'nasheed', title:'أناشيد', short:'استمع إلى مكتبة صوتية', group:'الصوتيات', icon:'♫', detail:'المكتبة الصوتية تحتاج تسجيلات مرخصة ومزود بث أو ملفات معتمدة.', state:'provider' },
  { id:'live', title:'بث مكة والمدينة', short:'قنوات مباشرة على مدار الساعة', group:'الصوتيات', icon:'◉', detail:'البث المباشر من مكة والمدينة يحتاج إلى مزودي بث رسميين وروابط معتمدة.', state:'provider' },
];

const stateLabel = (state: Area['state']) => state === 'local' ? 'يعمل على هذا الجهاز' : state === 'provider' ? 'يحتاج إلى مزود خدمة' : 'بانتظار مصدر موثوق';
const prayers = ['الفجر','الشروق','الظهر','العصر','المغرب','العشاء'];
const worship = ['صلاة الفجر','صلاة الظهر','صلاة العصر','صلاة المغرب','صلاة العشاء','أذكار الصباح','أذكار المساء','ورد القرآن'];
const seerahTopics = [
  { id: 'life', title: 'حياة الرسول ﷺ', description: 'نشأته وبعثته وهجرته وحياته في المدينة.' },
  { id: 'family', title: 'زوجات الرسول ﷺ وآل بيته', description: 'أمهات المؤمنين وأهل بيت النبي ﷺ.' },
  { id: 'campaigns', title: 'الغزوات والسرايا', description: 'أحداث السيرة مرتبة مع إحالات إلى المصادر.' },
] as const;
const ReminderContext = createContext<{
  enabled: boolean;
  setEnabled: Dispatch<SetStateAction<boolean>>;
} | null>(null);
function readStore<T>(key: string, fallback: T): T {
  try { const value = localStorage.getItem(`istaqim:${key}`); return value ? JSON.parse(value) as T : fallback; } catch { return fallback; }
}
function useSaved<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => readStore(key, initial));
  useEffect(() => { try { localStorage.setItem(`istaqim:${key}`, JSON.stringify(value)); } catch { /* storage may be unavailable */ } }, [key, value]);
  return [value, setValue] as const;
}

function App() {
  return <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}><Shell /></WouterRouter>;
}

function Shell() {
  const [location] = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [dark, setDark] = useSaved('dark', true);
  const [remindersEnabled, setRemindersEnabled] = useSaved('reminders-enabled', false);
  const filtered = useMemo(() => areas.filter(a => `${a.title} ${a.short} ${a.group}`.includes(query.trim())), [query]);
  useEffect(() => { document.documentElement.classList.toggle('dark', dark); }, [dark]);
  useEffect(() => { setMenuOpen(false); setSearchOpen(false); setQuery(''); window.scrollTo({ top: 0, behavior: 'smooth' }); }, [location]);
  const active = areas.find(a => location === `/areas/${a.id}`);
  useEffect(() => {
    const syncTheme = () => setDark(readStore('dark', false));
    window.addEventListener('istaqim-theme', syncTheme);
    return () => window.removeEventListener('istaqim-theme', syncTheme);
  }, [setDark]);
  useEffect(() => {
    if (!remindersEnabled) return;
    return startReminderTimer(() => undefined);
  }, [remindersEnabled]);
  const seerahTopic = seerahTopics.find(topic => location === `/areas/seerah/${topic.id}`);
  const currentAreaTitle = active?.title ?? seerahTopic?.title;
  return <div className={`app-frame ${dark ? 'night-mode' : ''}`} dir="rtl">
    <aside className={`sidebar ${menuOpen ? 'sidebar-open' : ''}`}>
      <div className="brand-lockup">
        <div className="logo-slot"><img className="brand-logo-image" src="/istaqim-icon-512.png" alt="استقم — طريقك إلى الله"/></div>
        <div><div className="brand-name">استقم <span>ISTAQIM</span></div><div className="brand-tag">طريقك إلى الله</div></div>
        <button className="icon-button close-menu" aria-label="إغلاق القائمة" onClick={() => setMenuOpen(false)}><X size={18}/></button>
      </div>
      <div className="sidebar-caption">مساحتك اليومية</div>
      <nav className="side-nav" aria-label="التنقل الرئيسي">
        <Link href="/" className={`nav-link ${location === '/' ? 'nav-active' : ''}`} data-testid="link-home"><Home size={18}/><span>الرئيسية</span></Link>
        <Link href="/areas" className={`nav-link ${location === '/areas' ? 'nav-active' : ''}`} data-testid="link-all-areas"><Library size={18}/><span>كل الأقسام</span><span className="nav-count">٢٩</span></Link>
        <Link href="/areas/tracker" className={`nav-link ${location === '/areas/tracker' ? 'nav-active' : ''}`} data-testid="link-tracker"><CheckCheck size={18}/><span>متابعة العبادات</span></Link>
        <Link href="/areas/tasbeeh" className={`nav-link ${location === '/areas/tasbeeh' ? 'nav-active' : ''}`} data-testid="link-tasbeeh"><RotateCcw size={18}/><span>المسبحة</span></Link>
        <div className="sidebar-caption nav-section-caption">استكشف</div>
        {areas.slice(0, 7).map(area => <Link key={area.id} href={`/areas/${area.id}`} className={`nav-link nav-sub ${location === `/areas/${area.id}` ? 'nav-active' : ''}`} data-testid={`link-area-${area.id}`}><span className="nav-glyph">{area.icon}</span><span>{area.title.split(' ')[0]}</span></Link>)}
      </nav>
      <div className="sidebar-bottom">
        <div className="offline-note"><span className="online-dot"/><span>نسخة أولية · البيانات محلية</span></div>
        <Link href="/settings" className={`nav-link ${location === '/settings' ? 'nav-active' : ''}`} data-testid="link-settings"><Settings size={18}/><span>الإعدادات</span></Link>
        <div className="prepared"><span>إعداد وتطوير</span><strong>م. محمد علي المنشاوي</strong></div>
      </div>
    </aside>
    {menuOpen && <button className="scrim" aria-label="إغلاق القائمة" onClick={() => setMenuOpen(false)}/>}
    <main className="main-column">
      <header className="topbar">
        <button className="icon-button mobile-menu" aria-label="فتح القائمة" onClick={() => setMenuOpen(true)}><Menu size={21}/></button>
        <div className="crumbs"><span>استقم</span><span className="crumb-slash">/</span><span>{currentAreaTitle ?? (location === '/' ? 'الرئيسية' : location === '/areas' ? 'كل الأقسام' : location === '/settings' ? 'الإعدادات' : 'مساحتك اليومية')}</span></div>
        <div className="top-actions">
          <div className={`search-wrap ${searchOpen ? 'search-expanded' : ''}`} onClick={() => setSearchOpen(true)}>
            <Search size={17}/>
            <input aria-label="ابحث في الأقسام" data-testid="input-search-areas" placeholder="ابحث في استقم..." value={query} onFocus={() => setSearchOpen(true)} onChange={e => { setQuery(e.target.value); setSearchOpen(true); }} onKeyDown={e => { if (e.key === 'Escape') { setSearchOpen(false); setQuery(''); } }} />
            {query && <button aria-label="مسح البحث" className="search-clear" onClick={() => setQuery('')}><X size={14}/></button>}
            {searchOpen && query && <div className="search-results">{filtered.length ? filtered.slice(0, 7).map(a => <Link href={`/areas/${a.id}`} key={a.id} className="search-result"><span className="mini-glyph">{a.icon}</span><span>{a.title}</span><ArrowLeft size={14}/></Link>) : <div className="search-empty">لا توجد أقسام بهذا الاسم</div>}</div>}
          </div>
          <button className={`icon-button theme-toggle ${dark ? 'theme-on' : ''}`} aria-label={dark ? 'تفعيل المظهر الفاتح' : 'تفعيل المظهر الداكن'} onClick={() => setDark(!dark)}><Moon size={18}/></button>
          <Link className="avatar-mark" href="/settings" aria-label="الإعدادات">م</Link>
        </div>
      </header>
      <div className="content-area" onClick={() => searchOpen && !query && setSearchOpen(false)}>
        <ReminderContext.Provider value={{ enabled: remindersEnabled, setEnabled: setRemindersEnabled }}>
          <Switch>
            <Route path="/" component={HomePage}/>
            <Route path="/areas" component={CatalogPage}/>
            <Route path="/areas/seerah/:topic" component={SeerahTopicPage}/>
            <Route path="/areas/:id" component={AreaPage}/>
            <Route path="/settings" component={SettingsPage}/>
            <Route component={NotFound}/>
          </Switch>
        </ReminderContext.Provider>
      </div>
      <footer className="site-footer"><span>استقم — استعن بالله، وخذ طريقك خطوة بخطوة.</span><span>المحتوى الديني لا يُنشر قبل التحقق من مصادره.</span></footer>
    </main>
    <nav className="mobile-tabs" aria-label="التنقل السريع">
      <Link href="/" className={location === '/' ? 'tab-active' : ''} data-testid="tab-home"><Home size={19}/><span>الرئيسية</span></Link>
      <Link href="/areas" className={location.startsWith('/areas') ? 'tab-active' : ''} data-testid="tab-areas"><Library size={19}/><span>الأقسام</span></Link>
      <Link href="/areas/tracker" className={location === '/areas/tracker' ? 'tab-active' : ''} data-testid="tab-tracker"><CheckCheck size={19}/><span>متابعتي</span></Link>
      <Link href="/settings" className={location === '/settings' ? 'tab-active' : ''} data-testid="tab-settings"><Settings size={19}/><span>الإعدادات</span></Link>
    </nav>
  </div>;
}

function HomePage() {
  const date = getLocalDateLabel();
  const prayerTimes = calculateDamanhourPrayerTimes();
  const [worshipDone, setWorshipDone] = useSaved<Record<string, boolean>>(`worship-${new Date().toLocaleDateString('en-CA', { timeZone: DAMANHOUR.timeZone })}`, {});
  const doneCount = worship.filter(item => worshipDone[item]).length;
  const [adVisible] = useState(() => { try { if (sessionStorage.getItem('istaqim-ad-shown')) return false; sessionStorage.setItem('istaqim-ad-shown', '1'); return true; } catch { return true; } });
  return <div className="page-stack">
    <div className="welcome-row"><div><div className="eyebrow"><span className="eyebrow-line"/> {date} <span className="eyebrow-city"><MapPin size={13}/> دمنهور، مصر</span></div><h1>السلام عليك، <em>رفيق الطريق.</em></h1><p className="welcome-copy">اجعل يومك أقرب إلى الله، خطوةً يسيرة في كل مرة.</p></div><img className="welcome-brand-logo" src="/istaqim-icon-512.png" alt="استقم — طريقك إلى الله"/></div>
    <section className="hero-panel">
      <div className="hero-copy"><span className="panel-kicker"><Sparkles size={14}/> مساحتك اليوم</span><h2>قليلٌ دائم،<br/>خيرٌ من كثيرٍ منقطع.</h2><p>ابدأ بما تستطيع، واترك لبقية اليوم أن يتشكل بهدوء.</p><Link href="/areas/tracker" className="gold-button" data-testid="button-start-tracker">ابدأ متابعة يومك <ArrowLeft size={16}/></Link></div>
      <div className="hero-progress">
        <div className="progress-caption"><span>ورد العبادات</span><span>{doneCount} من {worship.length}</span></div>
        <div className="progress-track"><span style={{width:`${doneCount / worship.length * 100}%`}}/></div>
        <div className="prayer-mini-label"><Sunrise size={15}/> مواقيت الصلاة · دمنهور</div>
         <div className="prayer-mini-grid">{['الفجر','الظهر','العصر','المغرب'].map(p => <div className="prayer-mini" key={p}><span>{p}</span><b>{prayerTimes[p as PrayerName]}</b></div>)}</div>
         <div className="honest-hint"><ShieldCheck size={14}/> حساب مصري تقريبي دون تعديلات محلية؛ راجع أذان المسجد.</div>
      </div>
    </section>
    <section className="section-block">
      <div className="section-heading"><div><span className="section-overline">بداية طيبة</span><h2>خذ لحظة لنفسك</h2></div><Link href="/areas" className="text-link">اكتشف كل الأقسام <ArrowLeft size={15}/></Link></div>
      <div className="quick-grid">
        <QuickCard href="/areas/quran" icon={<BookOpen size={21}/>} eyebrow="تلاوة وتدبر" title="القرآن الكريم" copy="استمع وتدبّر، قريباً بمصادر موثوقة" test="quick-quran"/>
        <QuickCard href="/areas/tasbeeh" icon={<RotateCcw size={21}/>} eyebrow="ذكر يسير" title="المسبحة الإلكترونية" copy="عدادك الشخصي يبقى محفوظاً هنا" test="quick-tasbeeh"/>
        <QuickCard href="/areas/prayer-times" icon={<Sun size={21}/>} eyebrow="دمنهور، مصر" title="مواقيت الصلاة" copy="إعداد مصدر المواقيت مطلوب" test="quick-prayer"/>
      </div>
    </section>
    <section className="section-block tracker-preview">
      <div className="section-heading"><div><span className="section-overline">على مهل</span><h2>مساحة عبادات اليوم</h2></div><Link href="/areas/tracker" className="text-link">عرض المتابعة <ArrowLeft size={15}/></Link></div>
      <div className="worship-strip">{worship.slice(0,5).map(item => <button key={item} className={`worship-chip ${worshipDone[item] ? 'chip-done' : ''}`} onClick={() => setWorshipDone({...worshipDone, [item]:!worshipDone[item]})} data-testid={`toggle-worship-${item}`}><span className="chip-check">{worshipDone[item] ? <Check size={13}/> : <Plus size={13}/>}</span>{item}</button>)}</div>
    </section>
    <section className="section-block discover-block">
      <div className="section-heading"><div><span className="section-overline">رحلتك على مقاسك</span><h2>من أين تحب أن تبدأ؟</h2></div><Link href="/areas" className="text-link">الأقسام الـ٢٩ <ArrowLeft size={15}/></Link></div>
      <div className="discover-grid">{areas.slice(0,6).map(area => <AreaCard key={area.id} area={area}/>)}</div>
    </section>
    {adVisible && <div className="ad-placeholder" aria-label="مساحة إعلانية تجريبية"><span>مساحة إعلانية</span><small>مكان تجريبي فقط · لا توجد شبكة إعلانات متصلة</small></div>}
    <div className="prepared-banner"><div className="prepared-seal">م</div><div><span>تطبيق استقم</span><strong>إعداد وتطوير م. محمد علي المنشاوي</strong></div><span className="prepared-ar">استقم</span></div>
  </div>;
}

function QuickCard({href,icon,eyebrow,title,copy,test}:{href:string;icon:ReactNode;eyebrow:string;title:string;copy:string;test:string}) {
  return <Link href={href} className="quick-card" data-testid={test}><span className="quick-icon">{icon}</span><span className="quick-eyebrow">{eyebrow}</span><strong>{title}</strong><small>{copy}</small><ArrowUpRight className="quick-arrow" size={16}/></Link>;
}
function AreaCard({area}:{area:Area}) { return <Link href={`/areas/${area.id}`} className="area-card" data-testid={`card-area-${area.id}`}><span className="area-icon">{area.icon}</span><span className="area-meta">{area.group}</span><strong>{area.title}</strong><small>{area.short}</small><ArrowLeft className="area-arrow" size={15}/></Link>; }

function CatalogPage() {
  const [group, setGroup] = useState('الكل');
  const groups = ['الكل', ...Array.from(new Set(areas.map(a => a.group)))];
  const visible = group === 'الكل' ? areas : areas.filter(a => a.group === group);
  return <div className="page-stack"><PageIntro eyebrow="دليلك" title="كل ما تحتاجه، في مكان واحد." copy="٢٩ مساحة للعناية بيومك. المحتوى الذي يحتاج مصدراً موثقاً موضح بوضوح."/>
    <div className="catalog-tools"><div className="catalog-count"><ListFilter size={17}/> <strong>{visible.length}</strong> قسم</div><div className="filter-chips">{groups.map(g => <button key={g} onClick={() => setGroup(g)} className={`filter-chip ${group===g?'filter-active':''}`} data-testid={`filter-${g}`}>{g}</button>)}</div></div>
    <div className="catalog-grid">{visible.map(area => <AreaCard key={area.id} area={area}/>)}</div>
    <p className="catalog-footnote"><ShieldCheck size={15}/> لم نضمّن نصوصاً قرآنية أو أحاديث أو فتاوى غير موثقة. الأقسام قيد الإعداد ظاهرة بحالتها الحالية.</p>
  </div>;
}

function PageIntro({eyebrow,title,copy}:{eyebrow:string;title:string;copy:string}) { return <div className="page-intro"><div className="section-overline">{eyebrow}</div><h1>{title}</h1><p>{copy}</p></div>; }

function AreaPage() {
  const [, params] = useRoute('/areas/:id');
  const area = areas.find(a => a.id === params?.id);
  if (!area) return <NotFound/>;
  return <div className="page-stack"><Link href="/areas" className="back-link"><ArrowLeft size={15}/> العودة إلى الأقسام</Link><div className="area-page-head"><span className="area-page-icon">{area.icon}</span><div><div className="section-overline">{area.group}</div><h1>{area.title}</h1><p>{area.short}</p></div></div>
     {area.id === 'tasbeeh' ? <Tasbeeh/> : area.id === 'tracker' ? <Tracker/> : area.id === 'reminders' ? <Reminders/> : area.id === 'prayer-times' ? <PrayerTimes/> : area.id === 'qibla' ? <Qibla/> : area.id === 'salawat' ? <Salawat/> : area.id === 'seerah' ? <SeerahIndex/> : <ProviderPanel area={area}/>}
  </div>;
}

function SeerahIndex() {
  return <section className="setup-panel">
    <div className="setup-top"><span className="setup-icon"><BookOpen size={23}/></span><span className="status-pill source">المصادر قيد الإعداد</span></div>
    <h2>ثلاثة أبواب مستقلة في السيرة.</h2>
    <p>اختر باباً للانتقال إلى مساحته. لن نضيف روايات أو أحداثاً قبل توثيقها من مراجع موثوقة.</p>
    <div className="seerah-topic-grid">{seerahTopics.map(topic => <Link key={topic.id} href={`/areas/seerah/${topic.id}`} className="seerah-topic"><strong>{topic.title}</strong><span>{topic.description}</span><small>بانتظار مصدر موثوق <ArrowLeft size={13}/></small></Link>)}</div>
  </section>;
}

function SeerahTopicPage() {
  const [, params] = useRoute('/areas/seerah/:topic');
  const topic = seerahTopics.find(item => item.id === params?.topic);
  if (!topic) return <NotFound/>;
  return <div className="page-stack">
    <Link href="/areas/seerah" className="back-link"><ArrowLeft size={15}/> العودة إلى أبواب السيرة</Link>
    <div className="area-page-head"><span className="area-page-icon">س</span><div><div className="section-overline">السيرة النبوية · قسم مستقل</div><h1>{topic.title}</h1><p>{topic.description}</p></div></div>
    <section className="setup-panel"><div className="setup-top"><span className="setup-icon"><BookMarked size={23}/></span><span className="status-pill source">بانتظار مصدر موثوق</span></div><h2>هذا الباب مستقل عن بقية أبواب السيرة.</h2><p>نحتاج إلى مصدر تاريخي موثق ومراجعة قبل عرض أحداث أو روايات هنا. لا توجد مادة تجريبية منسوبة إلى السيرة في هذه النسخة.</p><div className="setup-checklist"><div><ShieldCheck size={15}/><span>سيُذكر المرجع بجوار كل مادة.</span></div><div><Check size={15}/><span>لن تُعرض روايات غير متحققة على أنها صحيحة.</span></div></div></section>
  </div>;
}

function ProviderPanel({area}:{area:Area}) {
  return <section className="setup-panel"><div className="setup-top"><span className="setup-icon">{area.state === 'provider' ? <Volume2 size={23}/> : <BookMarked size={23}/>}</span><span className={`status-pill ${area.state}`}>{stateLabel(area.state)}</span></div><h2>{area.state === 'provider' ? 'هذه المساحة تنتظر اتصالها.' : 'المحتوى الموثوق قيد الإعداد.'}</h2><p>{area.detail}</p>
    <div className="setup-checklist"><div><Check size={15}/><span>لا نعرض نصوصاً أو أحكاماً غير متحققة.</span></div><div><Check size={15}/><span>سيظهر المصدر بوضوح عند توفره.</span></div></div>
    {(area.id === 'quran' || area.id === 'adhan' || area.id === 'nasheed') && <div className="service-preview"><div className="service-preview-icon"><Headphones size={19}/></div><div><strong>{area.id === 'quran' ? 'القارئ المفضّل' : area.id === 'adhan' ? 'مكتبة الأذان' : 'المكتبة الصوتية'}</strong><span>{area.id === 'quran' ? 'الشيخ محمد صديق المنشاوي ضمن القراء المطلوبين' : 'لا توجد تسجيلات متصلة بعد'}</span></div><span className="soon-badge">قريباً</span></div>}
    {area.id === 'seerah' && <div className="subtopic-list">{['حياة الرسول ﷺ','أمهات المؤمنين وآل البيت','الغزوات والسرايا'].map(s => <div key={s}><span>{s}</span><span>مصادر قيد الإعداد</span></div>)}</div>}
    {area.id === 'memorizer' && <div className="provider-warning"><Sparkles size={17}/> التلاوة بالذكاء الاصطناعي غير متصلة. لا يتم تحليل صوتك أو حفظه.</div>}
    {area.id === 'community' && <div className="provider-warning"><ShieldCheck size={17}/> المزامنة وختمات المجتمع تحتاج خادماً وحسابات آمنة.</div>}
  </section>;
}

function Tasbeeh() {
  const [count, setCount] = useSaved('tasbeeh-count', 0);
  const [target, setTarget] = useSaved('tasbeeh-target', 33);
  const pct = Math.min(100, Math.round(count / Math.max(1,target) * 100));
  return <div className="tool-layout"><section className="tasbeeh-panel"><span className="section-overline">عدادك الشخصي</span><h2>سبّح على مهل.</h2><p>يُحفظ العدد على هذا الجهاز فقط.</p><button className="tasbeeh-counter" onClick={() => setCount(count+1)} aria-label="زيادة عداد التسبيح" data-testid="button-increment-tasbeeh"><span className="counter-rings"/><strong>{count.toLocaleString('ar-EG')}</strong><small>اضغط للتسبيح</small></button><div className="counter-controls"><button className="outline-button" onClick={() => setCount(0)} data-testid="button-reset-tasbeeh"><RotateCcw size={15}/> إعادة العداد</button><label>الهدف <select value={target} onChange={e => setTarget(Number(e.target.value))} data-testid="select-tasbeeh-target"><option value={33}>٣٣</option><option value={100}>١٠٠</option><option value={99}>٩٩</option></select></label></div></section><aside className="side-stat"><div className="stat-icon"><Flame size={19}/></div><div className="section-overline">تقدم جلستك</div><strong>{pct}<small>٪</small></strong><div className="progress-track"><span style={{width:`${pct}%`}}/></div><p>من هدف {target.toLocaleString('ar-EG')} تسبيحة</p><div className="soft-divider"/><span className="local-tag"><Check size={14}/> محفوظ محلياً</span></aside></div>;
}

function Tracker() {
  const today = new Date().toLocaleDateString('en-CA', { timeZone: DAMANHOUR.timeZone });
  const [checked, setChecked] = useSaved<Record<string,boolean>>(`worship-${today}`, {});
  const count = worship.filter(x => checked[x]).length;
  const groups = [{name:'الصلوات',items:worship.slice(0,5)},{name:'ورد وذكر',items:worship.slice(5)}];
  return <section className="tracker-panel"><div className="tracker-summary"><div><span className="section-overline">سجل خاص بك</span><h2>يومك، كما تحب أن تعيشه.</h2><p>لا تُرسل هذه البيانات إلى أي مكان؛ تبقى على جهازك.</p></div><div className="tracker-circle" style={{'--progress':`${count/worship.length*100}%`} as React.CSSProperties}><strong>{count}<small>/{worship.length}</small></strong><span>أُنجزت</span></div></div>
  {groups.map(group => <div className="tracker-group" key={group.name}><h3>{group.name}</h3>{group.items.map(item => <label key={item} className={`tracker-row ${checked[item]?'tracker-checked':''}`}><input type="checkbox" checked={!!checked[item]} onChange={() => setChecked({...checked,[item]:!checked[item]})} data-testid={`checkbox-${item}`}/><span className="custom-check">{checked[item] && <Check size={14}/>}</span><span>{item}</span><span className="row-note">{checked[item]?'أحسنت':'تذكير لطيف'}</span></label>)}</div>)}
  <button className="text-reset" onClick={() => setChecked({})} data-testid="button-reset-tracker"><RotateCcw size={14}/> إعادة ضبط متابعة اليوم</button></section>;
}

function Reminders() {
  const reminderContext = useContext(ReminderContext);
  const enabled = reminderContext?.enabled ?? false;
  const setEnabled = reminderContext?.setEnabled ?? (() => undefined);
  const [permission,setPermission] = useState(typeof Notification === 'undefined' ? 'unsupported' : Notification.permission);
  async function askPermission() { if (typeof Notification === 'undefined') { setPermission('unsupported'); return; } const result = await Notification.requestPermission(); setPermission(result); if (result === 'granted') setEnabled(true); }
  return <section className="setup-panel"><div className="reminder-head"><span className="setup-icon"><Bell size={23}/></span><span className={`status-pill ${enabled?'local':''}`}>{enabled?'مفعّل على هذا الجهاز':'متوقف'}</span></div><h2>ذكرٌ يرافق يومك، بلطف.</h2><p>تذكير كل ١٥ دقيقة بالتناوب بين الصلاة على النبي، والتسبيح، والذكر. لا نرسل إشعارات إلا بعد موافقتك.</p><div className="reminder-switch-row"><div><strong>تفعيل التذكيرات</strong><small>{permission === 'granted' ? 'إذن الإشعارات متاح' : permission === 'denied' ? 'الإشعارات محظورة من إعدادات المتصفح' : 'يتطلب إذناً من المتصفح'}</small></div><button className={`switch ${enabled?'switch-on':''}`} aria-label="تبديل التذكيرات" aria-pressed={enabled} onClick={() => enabled ? setEnabled(false) : askPermission()} data-testid="toggle-reminders"><span/></button></div>{permission === 'unsupported' && <div className="provider-warning">متصفحك لا يدعم إشعارات الويب في هذه الصفحة.</div>}<div className="rotation-row">{['صلاة على النبي','تسبيح','ذكر'].map((x,i)=><div key={x}><span className="rotation-number">٠{i+1}</span>{x}<span className="rotation-time">بعد ١٥ دقيقة</span></div>)}</div><div className="honest-hint"><ShieldCheck size={14}/> يعمل التذكير بينما التطبيق مفتوح؛ إشعارات الخلفية تحتاج إلى خدمة دفع متصلة.</div></section>;
}

function PrayerTimes() {
  const times = calculateDamanhourPrayerTimes();
  const now = new Intl.DateTimeFormat('en-GB', { timeZone: DAMANHOUR.timeZone, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(new Date());
  const nextPrayer = prayers.find(prayer => times[prayer as PrayerName] > now) ?? 'الفجر';
  return <section className="setup-panel prayer-setup"><span className="setup-icon"><Sunrise size={23}/></span><div className="location-badge"><MapPin size={14}/> دمنهور، البحيرة</div><h2>مواقيت اليوم في دمنهور</h2><p>{getLocalDateLabel()} · توقيت القاهرة</p><div className="prayer-list">{prayers.map((p,i)=><div key={p} className={p === nextPrayer ? 'next-prayer-row' : ''}><span className="prayer-order">{String(i+1).padStart(2,'0')}</span><span>{p}</span><strong className="prayer-time-value">{times[p as PrayerName]}</strong>{p === nextPrayer && <span className="next-prayer-tag">الصلاة القادمة</span>}</div>)}</div><div className="provider-warning"><ShieldCheck size={17}/> حساب فلكي تقريبي بالطريقة المصرية العامة دون ضبط محلي. يُرجى مطابقة الأوقات مع المسجد أو جهة أوقاف البحيرة.</div></section>;
}

function Qibla() {
  const bearing = calculateQiblaBearing();
  const [heading, setHeading] = useState<number | null>(null);
  const [message, setMessage] = useState('اتجاه القبلة محسوب من إحداثيات دمنهور، والاتجاه الظاهر نسبةً إلى الشمال.');
  const [permissionNeeded, setPermissionNeeded] = useState(false);
  useEffect(() => {
    const supported = typeof DeviceOrientationEvent !== 'undefined';
    if (!supported) return;
    const handler = (event: DeviceOrientationEvent) => {
      const compassHeading = (event as DeviceOrientationEvent & { webkitCompassHeading?: number }).webkitCompassHeading;
      const angle = compassHeading ?? (event.alpha === null ? null : (360 - event.alpha) % 360);
      if (angle !== null && Number.isFinite(angle)) {
        setHeading(angle);
        setMessage('اتجاه القبلة معروض نسبةً إلى اتجاه الشمال الذي تقيسه بوصلة الجهاز.');
      }
    };
    window.addEventListener('deviceorientation', handler, true);
    return () => window.removeEventListener('deviceorientation', handler, true);
  }, []);
  async function requestCompass() {
    const sensor = DeviceOrientationEvent as unknown as { requestPermission?: () => Promise<string> };
    if (sensor.requestPermission) {
      try {
        const result = await sensor.requestPermission();
        setPermissionNeeded(result !== 'granted');
        setMessage(result === 'granted' ? 'تم السماح بالبوصلة. حرّك الهاتف ببطء حتى تستقر القراءة.' : 'لم يُسمح باستخدام البوصلة.');
      } catch {
        setPermissionNeeded(true);
        setMessage('تعذر تشغيل البوصلة. يمكنك قراءة زاوية القبلة من الشمال.');
      }
    } else if (typeof DeviceOrientationEvent === 'undefined') {
      setPermissionNeeded(true);
      setMessage('هذا الجهاز لا يوفّر بوصلة متصفح. تظهر زاوية القبلة المحسوبة من دمنهور أدناه.');
    } else {
      setMessage('حرّك الهاتف ببطء لمعايرة البوصلة. إذا لم تتحرك القراءة، استخدم زاوية الشمال أدناه.');
    }
  }
  return <section className="setup-panel qibla-setup"><div className="qibla-compass"><span className="compass-n">شمال</span><Compass size={82} strokeWidth={1}/><span className="compass-needle" style={{ transform: `translate(-50%, -50%) rotate(${bearing - (heading ?? 0)}deg)` }} /></div><span className={`status-pill ${heading === null ? 'provider' : 'local'}`}>{heading === null ? 'اتجاه محسوب · بوصلة الجهاز غير متصلة' : 'البوصلة تعمل'}</span><h2>اتجاه القبلة من دمنهور</h2><p>{message}</p><div className="qibla-bearing">{formatDegrees(bearing)} <small>شرق الشمال</small></div><p className="qibla-coordinates">الإحداثيات: {DAMANHOUR.latitude.toFixed(2)}° شمالاً · {DAMANHOUR.longitude.toFixed(2)}° شرقاً</p><button className="gold-button qibla-permission" onClick={requestCompass}><Compass size={16}/>{heading === null ? 'تشغيل بوصلة الجهاز' : 'إعادة معايرة البوصلة'}</button>{permissionNeeded && <div className="provider-warning">تحقّق من إعدادات الأذونات في جهازك. زاوية القبلة ثابتة ويمكن استخدامها مع بوصلة يدوية.</div>}<div className="provider-warning">زاوية جغرافية محسوبة من الإحداثيات؛ اضبط بوصلة الجهاز وتحقق ميدانياً قبل الاعتماد عليها للصلاة.</div></section>;
}

function Salawat() {
  const [count,setCount]=useSaved('salawat-count',0);
  return <section className="setup-panel salawat-panel"><span className="setup-icon"><Heart size={22}/></span><div className="section-overline">عداد صلواتك</div><h2>اللهم صلِّ وسلم على نبينا محمد.</h2><p>هذه صيغة دعاء عامة، وليست من مجموعة الصيغ الموثقة المطلوبة. ستُضاف المجموعة بعد مراجعة مصادرها.</p><div className="salawat-count">{count.toLocaleString('ar-EG')}</div><div className="counter-controls"><button className="gold-button" onClick={() => setCount(count+1)} data-testid="button-increment-salawat"><Plus size={17}/> أضف صلاة</button><button className="outline-button" onClick={() => setCount(0)} data-testid="button-reset-salawat"><RotateCcw size={15}/> تصفير العداد</button></div><div className="honest-hint"><ShieldCheck size={14}/> العداد محفوظ على هذا الجهاز؛ لا تُعرض صيغ غير موثقة.</div></section>;
}

function SettingsPage() {
  const [dark,setDark]=useSaved('dark',true);
  const reminderContext = useContext(ReminderContext);
  const reminders = reminderContext?.enabled ?? false;
  const setReminders = reminderContext?.setEnabled ?? (() => undefined);
  const [saved,setSaved]=useState(false);
  function toggleTheme() {
    const next = !dark;
    setDark(next);
    try { localStorage.setItem('istaqim:dark', JSON.stringify(next)); } catch { /* storage may be unavailable */ }
    document.documentElement.classList.toggle('dark', next);
    window.dispatchEvent(new Event('istaqim-theme'));
  }
  return <div className="page-stack"><PageIntro eyebrow="مساحتك" title="إعدادات على راحتك." copy="تفضيلاتك الشخصية تحفظ محلياً على هذا الجهاز."/><section className="settings-panel">
    <div className="settings-section"><div className="settings-section-title"><Sun size={18}/><div><strong>المظهر والواجهة</strong><small>اختر ما يريح عينيك</small></div></div><div className="setting-line"><div><strong>المظهر الداكن</strong><small>ألوان أعمق للاستخدام مساءً</small></div><button className={`switch ${dark?'switch-on':''}`} aria-pressed={dark} onClick={toggleTheme} data-testid="toggle-dark-mode"><span/></button></div></div>
     <div className="settings-section"><div className="settings-section-title"><MapPin size={18}/><div><strong>موقع مواقيت الصلاة</strong><small>الإعداد الحالي لهذه النسخة</small></div></div><div className="setting-line"><div><strong>دمنهور، البحيرة</strong><small>توقيت القاهرة · حساب بالطريقة المصرية العامة</small></div><span className="status-pill local">موقع افتراضي</span></div><div className="setting-note">الأوقات تقديرية ولم تُعاير محلياً؛ يُرجى مطابقتها مع جهة موثوقة أو المسجد.</div></div>
    <div className="settings-section"><div className="settings-section-title"><Bell size={18}/><div><strong>التذكيرات</strong><small>احفظ اختيارك على هذا الجهاز</small></div></div><div className="setting-line"><div><strong>تذكير كل ١٥ دقيقة</strong><small>إشعارات المتصفح تحتاج إذناً وجدولة فعلية</small></div><button className={`switch ${reminders?'switch-on':''}`} aria-pressed={reminders} onClick={() => setReminders(!reminders)} data-testid="toggle-settings-reminders"><span/></button></div></div>
    <div className="settings-save-row"><span>{saved?'تم حفظ تفضيلاتك على هذا الجهاز.':'تُحفظ التغييرات تلقائياً.'}</span><button className="gold-button" onClick={() => setSaved(true)} data-testid="button-save-settings"><Check size={15}/> تم</button></div>
  </section><div className="about-card"><div className="logo-slot logo-small"><img className="brand-logo-image" src="/istaqim-icon-512.png" alt="شعار استقم"/></div><div><strong>استقم — طريقك إلى الله</strong><p>إعداد وتطوير م. محمد علي المنشاوي</p><small>نسخة أولية تعمل محلياً · لا يوجد حساب أو مزامنة</small></div></div></div>;
}
function NotFound() { return <div className="empty-state"><span className="empty-glyph">؟</span><h1>لم نجد هذه الصفحة.</h1><p>قد يكون الرابط تغيّر أو لم يعد متاحاً.</p><Link className="gold-button" href="/">العودة للرئيسية <ArrowLeft size={15}/></Link></div>; }

export default App;
