import { COLOR_TOKENS, GRADIENT_TOKENS } from "../model/color-tokens";
import { TYPE_STYLES } from "../model/type-styles";

type PanelTheme = "light" | "dark";

const SAMPLE_TEXT = "نموذج نص عربي — Sample 123 · Aa Bb";

/**
 * One self-contained specimen panel. `data-ds="study"` turns the extracted tokens on locally, so
 * this page works even when the global test switch is off; the explicit `data-theme` shows both
 * palettes side by side.
 */
function SpecimenPanel({ theme }: { theme: PanelTheme }) {
  const label = theme === "light" ? "المظهر الفاتح" : "المظهر الداكن";

  return (
    <section
      data-ds="study"
      data-theme={theme}
      className="mt-10 rounded-panel border border-line bg-surface p-4 text-fg sm:p-6"
    >
      <header className="border-b border-line pb-6">
        <p className="ma-tag ma-tag--soft m-0">{label}</p>
        <h2 className="mt-3">{label}</h2>
        <p>
          نفس الرموز في سياق {theme === "light" ? "سطح فاتح" : "سطح داكن"}. الحدود والمساحات تبقى من
          طقم ماستري؛ الألوان والخطوط من التصدير.
        </p>
      </header>

      <div className="mt-8">
        <h2>اللوحة اللونية ({COLOR_TOKENS.length} لوناً)</h2>
        <p>كل لون من التصدير، بالاسم بعد إزالة بادئة ‎--ds-‎ وبقيمته الأصلية.</p>
        <ul className="mt-4 grid list-none grid-cols-[repeat(auto-fill,minmax(8.5rem,1fr))] gap-3 p-0">
          {COLOR_TOKENS.map((token) => (
            <li key={token.name} className="rounded-chip border border-line bg-surface p-2">
              <div
                className="h-12 rounded-chip border border-line"
                style={{ background: `var(${token.name})` }}
              />
              <code className="mt-2 block break-all text-[11px] leading-4 text-fg" dir="ltr">
                {token.name.replace("--ds-", "")}
              </code>
              <code className="block text-[11px] leading-4 text-fg-muted" dir="ltr">
                {token.value}
              </code>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-10">
        <h2>التدرّجات ({GRADIENT_TOKENS.length})</h2>
        <ul className="mt-4 grid list-none gap-3 p-0 sm:grid-cols-2 lg:grid-cols-3">
          {GRADIENT_TOKENS.map((token) => (
            <li key={token.name} className="rounded-chip border border-line bg-surface p-2">
              <div className="h-16 rounded-chip" style={{ background: `var(${token.name})` }} />
              <code className="mt-2 block break-all text-[11px] leading-4 text-fg" dir="ltr">
                {token.name.replace("--ds-", "")}
              </code>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-10">
        <h2>أنماط الطباعة ({TYPE_STYLES.length} نمطاً)</h2>
        <p>
          39 تعريفاً في التصدير، منها 5 أسماء مكرّرة؛ هنا التعريف الفعّال (الأخير) لكل اسم. الأسماء
          بالإنجليزية والقياسات بالبكسل.
        </p>
        <div className="mt-4">
          {TYPE_STYLES.map((style) => (
            <div key={style.className} className="border-b border-line py-4 last:border-b-0">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <code className="text-xs text-fg" dir="ltr">
                  .{style.className}
                </code>
                <span className="text-xs text-fg-muted" dir="ltr">
                  {style.spec}
                </span>
              </div>
              <div className="pt-2">
                <p className={style.className}>{SAMPLE_TEXT}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-10">
        <h2>العناصر الدلالية</h2>
        <p>
          كل عنصر بلا أصناف، حتى يظهر ما يطبّقه وضع الاختبار على مستوى الصفحة. العناصر التي تحمل
          أصنافاً في الموقع الحقيقي تحتفظ بأنماطها.
        </p>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <article className="rounded-chip border border-line bg-surface p-4">
            <h3>العناوين</h3>
            <h1>عنوان أول</h1>
            <h2>عنوان ثانٍ</h2>
            <h3>عنوان ثالث</h3>
            <h4>عنوان رابع</h4>
            <h5>عنوان خامس</h5>
            <h6>عنوان سادس</h6>
          </article>

          <article className="rounded-chip border border-line bg-surface p-4">
            <h3>النص المضمّن</h3>
            <p>
              فقرة عادية فيها <strong>نص عريض</strong> و<em>نص مائل</em> و<small>نص صغير</small>{" "}
              و<mark>نص مظلّل</mark> و<abbr title="اختصار">اختصار</abbr> و<code>code</code> و
              <kbd>Ctrl</kbd> و<samp>samp</samp>.
            </p>
            <pre>{`pre {
  white-space: pre;
}`}</pre>
            <p>
              <time dateTime="2026-11-12">12 نوفمبر 2026</time> — <cite>مصدر</cite> —{" "}
              <a href="#design-system-test">رابط نصي</a>
            </p>
            <p>
              <a href="#design-system-test">رابط نصي طويل نسبياً</a> داخل فقرة عادية.
            </p>
          </article>

          <article className="rounded-chip border border-line bg-surface p-4">
            <h3>الأزرار والروابط</h3>
            <div className="flex flex-wrap items-center gap-2">
              <button type="button">زر أساسي</button>
              <button type="button" disabled>
                زر معطّل
              </button>
            </div>
            <p>
              <a href="#design-system-test">رابط مستقل</a>
            </p>
          </article>

          <article className="rounded-chip border border-line bg-surface p-4">
            <h3>القوائم</h3>
            <ul>
              <li>عنصر أول</li>
              <li>عنصر ثانٍ</li>
            </ul>
            <ol>
              <li>الخطوة الأولى</li>
              <li>الخطوة الثانية</li>
            </ol>
            <dl>
              <dt>مصطلح</dt>
              <dd>تعريف المصطلح في سطر أو سطرين.</dd>
            </dl>
          </article>

          <article className="rounded-chip border border-line bg-surface p-4 md:col-span-2">
            <h3>الاقتباس والوسائط</h3>
            <blockquote>
              «الاقتباس يستخدم نمط النص الكبير من التصدير.»
              <cite>— مصدر الاقتباس</cite>
            </blockquote>
            <figure>
              <div className="h-24 rounded-chip" style={{ background: "var(--ds-gradient-linear)" }} />
              <figcaption>تسمية الشكل — figcaption</figcaption>
            </figure>
            <hr />
          </article>

          <article className="rounded-chip border border-line bg-surface p-4 md:col-span-2">
            <h3>الجدول</h3>
            <table>
              <caption>تسمية الجدول</caption>
              <thead>
                <tr>
                  <th scope="col">العمود</th>
                  <th scope="col">القيمة</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>المتصفح</td>
                  <td>Chromium</td>
                </tr>
                <tr>
                  <td>الوضع</td>
                  <td>{theme}</td>
                </tr>
              </tbody>
            </table>
          </article>

          <article className="rounded-chip border border-line bg-surface p-4 md:col-span-2">
            <h3>النماذج</h3>
            <form>
              <fieldset>
                <legend>بيانات تجريبية</legend>
                <p>
                  <label htmlFor={`${theme}-name`}>الاسم</label>
                  <input id={`${theme}-name`} type="text" defaultValue="ماستري أكاديمي" />
                </p>
                <p>
                  <label htmlFor={`${theme}-email`}>البريد الإلكتروني</label>
                  <input id={`${theme}-email`} type="email" defaultValue="name@example.com" />
                </p>
                <p>
                  <label htmlFor={`${theme}-search`}>بحث</label>
                  <input id={`${theme}-search`} type="search" defaultValue="تسويق" />
                </p>
                <p>
                  <label htmlFor={`${theme}-number`}>رقم</label>
                  <input id={`${theme}-number`} type="number" defaultValue={12} />
                </p>
                <p>
                  <label htmlFor={`${theme}-date`}>تاريخ</label>
                  <input id={`${theme}-date`} type="date" defaultValue="2026-11-12" />
                </p>
                <p>
                  <label htmlFor={`${theme}-color`}>لون</label>
                  <input id={`${theme}-color`} type="color" defaultValue="#ff6555" />
                </p>
                <p>
                  <label htmlFor={`${theme}-range`}>نطاق</label>
                  <input id={`${theme}-range`} type="range" defaultValue={60} />
                </p>
                <p>
                  <label htmlFor={`${theme}-file`}>ملف</label>
                  <input id={`${theme}-file`} type="file" />
                </p>
                <p>
                  <input id={`${theme}-check`} type="checkbox" defaultChecked />
                  <label htmlFor={`${theme}-check`}>خيار</label>
                </p>
                <p>
                  <input id={`${theme}-radio-a`} type="radio" name={`${theme}-radio`} defaultChecked />
                  <label htmlFor={`${theme}-radio-a`}>خيار أول</label>
                  <input id={`${theme}-radio-b`} type="radio" name={`${theme}-radio`} />
                  <label htmlFor={`${theme}-radio-b`}>خيار ثانٍ</label>
                </p>
                <p>
                  <label htmlFor={`${theme}-select`}>قائمة</label>
                  <select id={`${theme}-select`} defaultValue="b">
                    <option value="a">الخيار أ</option>
                    <option value="b">الخيار ب</option>
                  </select>
                </p>
                <p>
                  <label htmlFor={`${theme}-notes`}>ملاحظات</label>
                  <textarea id={`${theme}-notes`} defaultValue="نص تجريبي في منطقة نص." />
                </p>
                <p>
                  <label htmlFor={`${theme}-output`}>الناتج</label>
                  <output id={`${theme}-output`}>٦٠</output>
                </p>
              </fieldset>
            </form>
            <p>
              <progress value={60} max={100}>
                60%
              </progress>{" "}
              <meter value={0.6} min={0} max={1}>
                60%
              </meter>
            </p>
            <details open>
              <summary>تفاصيل قابلة للفتح</summary>
              <p>محتوى التفاصيل.</p>
            </details>
          </article>
        </div>
      </div>
    </section>
  );
}

/**
 * The /preview/design-system page body: an introduction, then the extracted token system in both
 * palettes. Server-rendered; the tokens are applied locally to the specimen panels, and the app
 * itself always uses the current Mastery kit.
 */
export function DesignSystemSpecimen() {
  return (
    <div id="design-system-test" className="ma-container py-10">
      <header className="max-w-3xl">
        <p className="ma-tag ma-tag--soft m-0">اختبار</p>
        <h1 className="t-section mt-3">اختبار نظام تصميم بوابة الطلاب</h1>
        <p className="t-lead mt-4">
          الألوان والتدرّجات وأنماط الطباعة المصدّرة من بوابة الطلاب، مطبّقة على العناصر الدلالية في
          الواجهة. الهدف هو الحكم على الرموز قبل تبنيها، لا تغيير التصميم الحالي.
        </p>
        <div className="mt-6 space-y-2 text-sm text-fg-muted">
          <p className="m-0">
            <strong>العينة محصورة:</strong> هذه الصفحة وحدها تعرض رموز التصدير (<code dir="ltr">data-ds=&quot;study&quot;</code>{" "}
            على لوحات العينة)؛ التطبيق يستخدم طقم ماستري الحالي ولا يتأثر بها.
          </p>
          <p className="m-0">
            <strong>الخطوط:</strong> DINNextLTArabic وRoboto غير مضمّنين، لذا استُبدلا بـ IBM Plex
            Sans Arabic وRaleway؛ القياسات والأوزان من التصدير كما هي.
          </p>
          <p className="m-0">
            <strong>المظهر الداكن:</strong> التصدير لوحة فاتحة فقط؛ الداكنة مشتقة من درجات الرمادي
            الداكنة فيه.
          </p>
        </div>
      </header>

      <SpecimenPanel theme="light" />
      <SpecimenPanel theme="dark" />
    </div>
  );
}
