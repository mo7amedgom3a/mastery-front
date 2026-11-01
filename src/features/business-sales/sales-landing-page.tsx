import { ArrowLeft, Check } from "lucide-react";
import Image from "next/image";
import type { ReactNode } from "react";

import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { AppLink } from "@/components/ui/app-link";
import { routes } from "@/config/routes";

import { SalesLandingMotion } from "./components/sales-landing-motion";
import { salesLanding as copy } from "./content/sales-landing";

const BOOK_HREF = "#book";

const pad = (index: number) => String(index + 1).padStart(2, "0");

/** Dark full-bleed band. Photo placeholders until the shoot: the design only specifies their slots. */
function Cinema({
  id,
  labelledBy,
  className,
  parallax,
  scrim,
  children,
}: {
  id?: string;
  labelledBy: string;
  className: string;
  parallax: string;
  scrim: "hero" | "band";
  children: ReactNode;
}) {
  return (
    <section id={id} aria-labelledby={labelledBy} className={`cinema grain ${className}`}>
      <div className="layer-bg ph" data-parallax={parallax} />
      <span className={`layer-scrim scrim-${scrim}`} aria-hidden="true" />
      {children}
    </section>
  );
}

function SectionIntro({
  id,
  eyebrow,
  title,
  lead,
  action,
}: {
  id: string;
  eyebrow: string;
  title: string;
  lead?: string;
  action?: ReactNode;
}) {
  return (
    <div className="sec-head" data-reveal="">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h2 id={id}>{title}</h2>
        {lead ? <p className="sec-sub">{lead}</p> : null}
      </div>
      {action}
    </div>
  );
}

function SectionLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a className="sec-link" href={href}>
      {children}
      <ArrowLeft aria-hidden="true" />
    </a>
  );
}

function Person({ initial, name, role }: { initial: string; name: string; role: string }) {
  return (
    <div className="q-who">
      <span className="q-av" aria-hidden="true">
        {initial}
      </span>
      <span>
        <span className="q-name">{name}</span>
        <span className="q-role">{role}</span>
      </span>
    </div>
  );
}

function Quote({ item }: { item: { quote: string; name: string; role: string } }) {
  return (
    <li>
      <blockquote>{item.quote}</blockquote>
      <Person initial={item.name[0]} name={item.name} role={item.role} />
    </li>
  );
}

/** `/business/sales`: the sales-team training landing page, static with mock content for now. */
export function SalesLandingPage() {
  const { hero, method, deliverables, trust, experts, steps, audience, cta, voices, faq, closing } = copy;

  return (
    <>
      <SiteHeader brand="business" />
      <main id="main" tabIndex={-1} className="outline-none">
        <SalesLandingMotion>
          <Cinema labelledBy="hero-title" className="hero" parallax="hero" scrim="hero">
            <div className="container layer-body hero-body">
              <p className="eyebrow">{hero.eyebrow}</p>
              <h1 id="hero-title">
                <span className="ln">
                  <span>{hero.title}</span>
                </span>{" "}
                <span className="ln dim">
                  <span>{hero.titleDim}</span>
                </span>
              </h1>
              <p className="lead">{hero.lead}</p>
              <div className="hero-ctas">
                <a className="btn btn-accent" href={BOOK_HREF}>
                  {hero.primary}
                </a>
                <a className="btn btn-ghost" href="#method">
                  {hero.secondary}
                  <ArrowLeft aria-hidden="true" />
                </a>
              </div>
              <ul className="stats" aria-label="أرقام السوق">
                {hero.stats.map((stat) => (
                  <li key={stat.value} className="stat">
                    <div className="stat-num">
                      <span data-count={stat.value}>{stat.value}</span>%
                    </div>
                    <p>{stat.body}</p>
                  </li>
                ))}
              </ul>
            </div>
          </Cinema>

          <section id="method" aria-labelledby="method-title" className="section">
            <div className="container">
              <SectionIntro id="method-title" eyebrow={method.eyebrow} title={method.title} lead={method.lead} />
              <ol className="feats" data-stagger="">
                {method.items.map((item, index) => (
                  <li key={item.title} className="feat">
                    <span className="feat-num" aria-hidden="true">
                      {pad(index)}
                    </span>
                    <div>
                      <h3>{item.title}</h3>
                      <p>{item.body}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </section>

          <section id="get" aria-labelledby="get-title" className="section soft">
            <div className="container">
              <SectionIntro
                id="get-title"
                eyebrow={deliverables.eyebrow}
                title={deliverables.title}
                action={<SectionLink href={BOOK_HREF}>{deliverables.action}</SectionLink>}
              />
              <ul className="get-grid" data-stagger="">
                {deliverables.items.map((item, index) => (
                  <li key={item.title} className="get">
                    <span className="get-line" aria-hidden="true" />
                    <div className="get-top">
                      <span className="get-idx">{pad(index)}</span>
                      <item.icon aria-hidden="true" />
                    </div>
                    <h3>{item.title}</h3>
                    <p>{item.body}</p>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <Cinema labelledBy="trust-title" className="band" parallax="band" scrim="band">
            <div className="container layer-body band-in">
              <div className="big-num" aria-hidden="true">
                <span data-count={trust.value}>{trust.value}</span>%
              </div>
              <div data-reveal="">
                <p className="eyebrow">{trust.eyebrow}</p>
                <h2 id="trust-title">{trust.title}</h2>
                <p className="lead">{trust.lead}</p>
              </div>
            </div>
          </Cinema>

          <section id="experts" aria-labelledby="experts-title" className="section">
            <div className="container">
              <SectionIntro
                id="experts-title"
                eyebrow={experts.eyebrow}
                title={experts.title}
                action={<SectionLink href={routes.experts}>{experts.action}</SectionLink>}
              />
              <div className="exp-wrap">
                <ul className="exp-grid">
                  {experts.people.map((person) => (
                    <li key={person.name}>
                      <AppLink className="exp-card" href={routes.experts}>
                        <Image
                          src={`/business/sales/experts/${person.image}`}
                          alt={person.name}
                          fill
                          sizes="(max-width: 640px) 50vw, (max-width: 960px) 33vw, 220px"
                        />
                        <span className="layer-scrim scrim-card" aria-hidden="true" />
                        <div className="exp-info">
                          <h3>{person.name}</h3>
                          <p className="exp-field">{person.field}</p>
                        </div>
                      </AppLink>
                    </li>
                  ))}
                </ul>
                <ul className="vals" data-stagger="">
                  {experts.values.map((value) => (
                    <li key={value.title}>
                      <h3>{value.title}</h3>
                      <p>{value.body}</p>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>

          <section id="start" aria-labelledby="start-title" className="section soft">
            <div className="container">
              <SectionIntro id="start-title" eyebrow={steps.eyebrow} title={steps.title} lead={steps.lead} />
              <div className="steps-wrap">
                <span className="draw-line" aria-hidden="true" />
                <ol className="steps3">
                  {steps.items.map((step, index) => (
                    <li key={step.title} className="step">
                      <span className="feat-num" aria-hidden="true">
                        {pad(index)}
                      </span>
                      <h3>{step.title}</h3>
                      <p>{step.body}</p>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </section>

          <section id="who" aria-labelledby="who-title" className="section">
            <div className="container aud-wrap">
              <div data-reveal="">
                <p className="eyebrow">{audience.eyebrow}</p>
                <h2 id="who-title">{audience.title}</h2>
              </div>
              <ul className="checklist" data-stagger="">
                {audience.items.map((item) => (
                  <li key={item}>
                    <Check aria-hidden="true" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <Cinema labelledBy="cta-title" className="band" parallax="cta" scrim="band">
            <div className="container layer-body" data-reveal="">
              <h2 id="cta-title" className="cta-title">
                {cta.title}
              </h2>
              <p className="lead">{cta.lead}</p>
              <div className="hero-ctas">
                <a className="btn btn-accent" href={BOOK_HREF}>
                  {cta.action}
                </a>
              </div>
            </div>
          </Cinema>

          <section id="voices" aria-labelledby="voices-title" className="section">
            <div className="container">
              <SectionIntro id="voices-title" eyebrow={voices.eyebrow} title={voices.title} />
              <div className="q-wrap">
                <figure className="q-feature" data-reveal="">
                  <span className="q-mark" aria-hidden="true">
                    <svg viewBox="0 0 24 24">
                      <path d="M16 3a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2 1 1 0 0 1 1 1v1a2 2 0 0 1-2 2 1 1 0 0 0-1 1v2a1 1 0 0 0 1 1 6 6 0 0 0 6-6V5a2 2 0 0 0-2-2z" />
                      <path d="M5 3a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2 1 1 0 0 1 1 1v1a2 2 0 0 1-2 2 1 1 0 0 0-1 1v2a1 1 0 0 0 1 1 6 6 0 0 0 6-6V5a2 2 0 0 0-2-2z" />
                    </svg>
                  </span>
                  <blockquote>{voices.feature.quote}</blockquote>
                  <figcaption>
                    <Person initial={voices.feature.name[0]} name={voices.feature.name} role={voices.feature.role} />
                  </figcaption>
                </figure>
                <ul className="q-side" data-stagger="">
                  {voices.side.map((item) => (
                    <Quote key={item.name} item={item} />
                  ))}
                </ul>
              </div>
              <ul className="q-row" data-stagger="">
                {voices.row.map((item) => (
                  <Quote key={item.name} item={item} />
                ))}
              </ul>
            </div>
          </section>

          <section id="faq" aria-labelledby="faq-title" className="section soft">
            <div className="container faq-wrap">
              <div data-reveal="">
                <p className="eyebrow">{faq.eyebrow}</p>
                <h2 id="faq-title">{faq.title}</h2>
                <p className="sec-sub">{faq.lead}</p>
              </div>
              <div className="faq" data-stagger="">
                {faq.items.map((item, index) => (
                  <details key={item.question} open={index === 0}>
                    <summary>
                      <span>{item.question}</span>
                      <span className="fx" aria-hidden="true" />
                    </summary>
                    <p className="faq-body">{item.answer}</p>
                  </details>
                ))}
              </div>
            </div>
          </section>

          <Cinema id="book" labelledBy="book-title" className="section" parallax="close" scrim="hero">
            <div className="container layer-body close-in">
              <div data-reveal="">
                <p className="eyebrow">{closing.eyebrow}</p>
                <h2 id="book-title">{closing.title}</h2>
                <p className="lead">{closing.lead}</p>
              </div>
              {/* Static for now: the fields have no `name`, so nothing is sent or put in the URL, and
                  submitting opens the real company request flow. */}
              <form className="form" action={routes.businessRequest()} aria-label="طلب استشارة مجانية" data-reveal="">
                <div className="field">
                  <label htmlFor="f-company">اسم الشركة</label>
                  <input id="f-company" type="text" placeholder="اسم المنشأة" autoComplete="organization" />
                </div>
                <div className="field">
                  <label htmlFor="f-name">الاسم الكامل للمسؤول</label>
                  <input id="f-name" type="text" placeholder="الاسم الكامل" autoComplete="name" />
                </div>
                <div className="field">
                  <label htmlFor="f-email">البريد الإلكتروني للعمل</label>
                  <input id="f-email" type="email" placeholder="name@company.com" dir="ltr" autoComplete="email" />
                </div>
                <div className="field">
                  <label htmlFor="f-size">عدد الموظفين</label>
                  <select id="f-size">
                    {closing.sizes.map((size) => (
                      <option key={size}>{size}</option>
                    ))}
                  </select>
                </div>
                <button className="btn btn-accent form-full" type="submit">
                  {closing.submit}
                </button>
                <p className="form-note form-full">{closing.note}</p>
              </form>
            </div>
          </Cinema>
        </SalesLandingMotion>
      </main>
      <SiteFooter />
    </>
  );
}
