import { companySchema, type Company, type CompanyInput } from './schema';

/**
 * The authored company guides (D7).
 *
 * **Every claim below was sourced before it was written**, which is the inverted
 * order the first attempt got wrong. The source hunt produced this, and the
 * shape of it is why the guides look the way they do:
 *
 * | Company | Openable first-party source | Notes |
 * |---|---|---|
 * | Amazon | `amazon.jobs` how-we-hire and interview-loop; `aboutamazon.com` Bar Raiser | All render without JS. None carry a publish date |
 * | Google | `blog.google` engineer interview tips, 2022-03-17 | Careers pages are JS shells; the re:Work guides now 404 |
 * | Meta | `metacareers.com` SWE interview blog, 2022-10-06 | Renders fully, and is unusually specific about timings |
 *
 * Two things that did *not* survive the hunt, and are now marked rather than
 * asserted: Google's hiring committee, which no openable Google page describes,
 * and Amazon's online assessment format, which its own pages mention without
 * detailing.
 *
 * Both Google's and Meta's sources are from 2022. That is recorded on the page
 * rather than smoothed over — a four-year-old post about a process that changes
 * every year or two is a staleness risk even when nothing else is wrong with it.
 */
const RAW_COMPANIES: readonly CompanyInput[] = [
  {
    slug: 'amazon',
    name: 'Amazon',
    summary:
      'A loop built around Leadership Principles, with one interviewer deliberately from outside the hiring team.',
    reviewed: '2026-08-31',
    rounds: [
      {
        name: 'Online application, then assessments',
        assesses: {
          status: 'confirmed',
          text: 'Amazon lists its hiring as four stages: online application, assessments, phone screening, and the interview loop. It also says the process "differs from role to role", so the assessment you get depends on what you applied for.',
          sources: [
            {
              label: 'Amazon Jobs — How we hire',
              url: 'https://www.amazon.jobs/content/en/how-we-hire',
              openable: true,
              firstParty: true,
              published: null,
            },
          ],
        },
        practice: { label: 'Practice problems', href: '/problems' },
      },
      {
        name: 'The interview loop',
        assesses: {
          status: 'confirmed',
          text: 'Amazon describes it directly: "you\'ll meet individually with current employees in what we call the \'interview loop.\' Each person will assess different aspects of your skills and experience." So the rounds are deliberately not redundant — each interviewer is covering different ground.',
          sources: [
            {
              label: 'Amazon Jobs — The interview loop',
              url: 'https://www.amazon.jobs/content/en/how-we-hire/interview-loop',
              openable: true,
              firstParty: true,
              published: null,
            },
          ],
        },
      },
      {
        name: 'The Bar Raiser, sitting in on it',
        assesses: {
          status: 'confirmed',
          text: 'One interviewer is a Bar Raiser — "objective third-party advisers during the interview process", and in their own words "not involved in the day-to-day interaction with the interviewee, so we\'re completely focused on making hiring decisions for Amazon, not for a specific team or role." They help construct the loop and identify which Leadership Principles it needs to address, and they train on all sixteen.',
          sources: [
            {
              label: 'About Amazon — What is an Amazon Bar Raiser?',
              url: 'https://www.aboutamazon.com/news/workplace/amazon-bar-raiser',
              openable: true,
              firstParty: true,
              published: null,
            },
          ],
        },
      },
    ],
    notes: [
      {
        status: 'confirmed',
        text: 'The Leadership Principles are interview criteria, not a culture page. Amazon says Bar Raisers "identify which Leadership Principles need to be addressed" when building a loop — so preparing specific past situations against them is preparing for the assessment itself.',
        sources: [
          {
            label: 'About Amazon — What is an Amazon Bar Raiser?',
            url: 'https://www.aboutamazon.com/news/workplace/amazon-bar-raiser',
            openable: true,
            firstParty: true,
            published: null,
          },
        ],
      },
      {
        status: 'commonly-reported',
        text: 'The online assessment is often described as two timed algorithm problems with hidden tests.',
        caveat:
          'Amazon lists role-specific assessments but does not publish their format anywhere we could open. Treat the specifics as hearsay and the existence of an assessment as fact.',
      },
    ],
  },

  {
    slug: 'google',
    name: 'Google',
    summary: 'Where how you got there is assessed as deliberately as where you got.',
    reviewed: '2026-08-31',
    rounds: [
      {
        name: 'Technical interviews',
        assesses: {
          status: 'confirmed',
          text: 'A Google engineer writing on Google\'s own blog puts the goal plainly: "Your main goal is to show the interviewer how you think and that you are capable of solving challenging problems." The advice that follows is to practise speaking out loud while solving — "especially if you typically work them out in your head."',
          sources: [
            {
              label: 'Google blog — A Google engineer shares her technical interview tips',
              url: 'https://blog.google/company-news/inside-google/life-at-google/google-engineer-shares-her-technical-interview-tips/',
              openable: true,
              firstParty: true,
              published: '2022-03-17',
            },
          ],
        },
        practice: { label: 'Practice problems', href: '/problems' },
      },
    ],
    notes: [
      {
        status: 'commonly-reported',
        text: 'A hiring committee that never met you makes the decision from written interviewer feedback, which is why detailed notes and audible reasoning matter more here than in a loop where your interviewer decides.',
        caveat:
          'No Google page we could open says this. The careers site describes the process but renders nothing without JavaScript, and the re:Work guides that used to cover hiring committees now 404. Widely reported, not confirmed.',
      },
      {
        status: 'commonly-reported',
        text: 'Questions are general algorithms and data structures rather than Google-specific technology.',
        caveat: 'Consistent with the published interview tips, but not stated on any page we could open.',
      },
    ],
  },

  {
    slug: 'meta',
    name: 'Meta',
    summary: 'The most precisely documented timings of the three — and the tightest.',
    reviewed: '2026-08-31',
    rounds: [
      {
        name: 'Technical screen',
        assesses: {
          status: 'confirmed',
          text: 'Meta publishes the breakdown: roughly 40 minutes, as 5 minutes of introductions, 35 minutes of coding, and 5 minutes of questions — with **two problems** inside that 35. That is the fact worth preparing around, because it makes fluency matter more than cleverness.',
          sources: [
            {
              label: 'Meta Careers — Preparing for your software engineering interview at Meta',
              url: 'https://www.metacareers.com/blog/preparing-for-your-software-engineering-interview-at-meta/',
              openable: true,
              firstParty: true,
              published: '2022-10-06',
            },
          ],
        },
        practice: { label: 'Practice problems', href: '/problems' },
      },
      {
        name: 'Full loop',
        assesses: {
          status: 'confirmed',
          text: 'Three parts: coding, design, and behavioural. The coding round runs 45 minutes with the same shape — 5 minutes of introductions, 35 of coding, 5 of questions.',
          sources: [
            {
              label: 'Meta Careers — Preparing for your software engineering interview at Meta',
              url: 'https://www.metacareers.com/blog/preparing-for-your-software-engineering-interview-at-meta/',
              openable: true,
              firstParty: true,
              published: '2022-10-06',
            },
          ],
        },
        practice: { label: 'System Design labs', href: '/learn/system-design/labs' },
      },
    ],
    notes: [
      {
        status: 'confirmed',
        text: 'Meta asks for the reasoning explicitly: "Think out loud. We pay a lot of attention to the way you solve problems, which can be as important as having the right answer." It also tells you to ask — "If you are stuck, ask questions. Usually, the interviewer knows the question well enough to provide information that may help you move forward."',
        sources: [
          {
            label: 'Meta Careers — Preparing for your software engineering interview at Meta',
            url: 'https://www.metacareers.com/blog/preparing-for-your-software-engineering-interview-at-meta/',
            openable: true,
            firstParty: true,
            published: '2022-10-06',
          },
        ],
      },
    ],
  },
];

let cache: readonly Company[] | undefined;

export function getCompanies(): readonly Company[] {
  cache ??= RAW_COMPANIES.map((c) => {
    const parsed = companySchema.safeParse(c);
    if (!parsed.success) {
      const detail = parsed.error.issues
        .map((i) => `${i.path.join('.') || '(root)'}: ${i.message}`)
        .join('; ');
      throw new Error(`Invalid company "${c.slug}" — ${detail}. Run \`pnpm content:check\`.`);
    }
    return parsed.data;
  }).sort((a, b) => a.name.localeCompare(b.name));
  return cache;
}

export function findCompany(slug: string): Company | undefined {
  return getCompanies().find((c) => c.slug === slug);
}

export { RAW_COMPANIES };
export type { Company, CompanyInput };
export { sourcesOf } from './schema';
