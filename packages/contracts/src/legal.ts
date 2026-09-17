/**
 * The legal documents shown by every Scriptune client. One source, so the
 * web pages and the app screens never drift apart. Plain text sections,
 * rendered by each client in its own typography.
 */

import { LEGAL_CONTACT } from "./contact";
import { CREDITS, rightsLabel, TAKEDOWN_POLICY, type Credit } from "./credits";

export { LEGAL_CONTACT };

export type LegalSlug = "terms" | "privacy" | "licenses" | "copyright";

export interface LegalSection {
  heading: string;
  paragraphs: string[];
  bullets?: string[];
}

export interface LegalDocument {
  slug: LegalSlug;
  title: string;
  summary: string;
  /** ISO date of the last substantive change. */
  updatedAt: string;
  sections: LegalSection[];
}


export const LEGAL_SLUGS: readonly LegalSlug[] = ["terms", "privacy", "licenses", "copyright"];

const terms: LegalDocument = {
  slug: "terms",
  title: "Terms of Service",
  summary: "The agreement between you and Scriptune when you use the website or the app.",
  updatedAt: "2026-09-13",
  sections: [
    { heading: "What Scriptune is", paragraphs: [
      "Scriptune identifies Christian hymns and Bible passages from a few seconds of audio or from words you type, and lets you read the words, search the corpus, and keep what you find. The service is provided by " + LEGAL_CONTACT.operator + " (\"we\", \"us\").",
      "By using the website or the app you agree to these terms and to the Privacy Policy. If you do not agree, please do not use the service.",
    ] },
    { heading: "Using the service", paragraphs: [
      "You may use Scriptune without an account. An account is only needed to keep saved items, collections, notes and history across devices.",
      "You must be at least 13 years old, or the age of digital consent where you live if that is higher, to create an account.",
      "You are responsible for keeping your password safe and for what happens under your account. Tell us if you believe it has been used without your permission.",
    ] },
    { heading: "Acceptable use", paragraphs: ["You agree not to:"], bullets: [
      "interfere with the service, probe it for weaknesses, or send it automated traffic beyond ordinary personal use;",
      "use the service to record people without their consent where the law requires it;",
      "upload content that is unlawful, or that you do not have the right to share;",
      "copy the service or resell access to it.",
    ] },
    { heading: "Scripture, hymns and your content", paragraphs: [
      "The scripture and hymn texts in Scriptune are in the public domain, or used under licences listed on the Licences page. We do not claim ownership of them.",
      "Notes, collections and other content you create remain yours. You give us permission to store and display them to you so the service can work.",
      "If you believe content in Scriptune infringes a right you hold, write to " + LEGAL_CONTACT.email + " with the details and we will look into it promptly.",
    ] },
    { heading: "Recognition results", paragraphs: [
      "Identification is automatic and can be wrong. Results show a confidence figure, and you should check the words yourself before relying on them, for example in an order of service.",
    ] },
    { heading: "Availability and changes", paragraphs: [
      "We work to keep the service available but do not promise uninterrupted operation. We may change, suspend or discontinue features, and we will give reasonable notice of changes that matter to you where we can.",
    ] },
    { heading: "Disclaimer and limitation of liability", paragraphs: [
      "The service is provided \"as is\" and \"as available\", without warranties of any kind, express or implied, to the fullest extent permitted by law.",
      "To the fullest extent permitted by law, we are not liable for indirect, incidental, special or consequential loss, or for loss of data, arising from your use of the service. Nothing in these terms limits liability that cannot be limited by law.",
    ] },
    { heading: "Ending the agreement", paragraphs: [
      "You can delete your account at any time from Account on the web or Library in the app. This removes your account and everything stored under it.",
      "We may suspend or close accounts that break these terms.",
    ] },
    { heading: "Changes to these terms", paragraphs: [
      "When we change these terms we update the date at the top and, for significant changes, tell you in the service. Continuing to use Scriptune after a change means you accept the new terms.",
    ] },
    { heading: "Contact", paragraphs: ["Questions about these terms: " + LEGAL_CONTACT.email + "."] },
  ],
};

const privacy: LegalDocument = {
  slug: "privacy",
  title: "Privacy Policy",
  summary: "What Scriptune collects, why, where it goes, and the choices you have.",
  updatedAt: "2026-09-17",
  sections: [
    { heading: "The short version", paragraphs: [
      "Scriptune listens only when you tap the listening button. Audio is sent to our server, turned into words there by speech recognition that we run ourselves, and then discarded. With offline listening switched on in the app, the audio never leaves your phone. We store the words and the matches so you can see your history. We do not run advertising or sell personal data.",
    ] },
    { heading: "What we collect", paragraphs: ["Depending on how you use Scriptune:"], bullets: [
      "Audio you record for identification: up to fifteen seconds at a time, processed and then discarded. The transcript and the matched results are kept as a recognition attempt.",
      "Words you type to identify or search.",
      "Account details if you sign up: email address, name, and a password stored only as a salted hash. With Google sign-in we receive your Google account id, email, name and profile picture.",
      "Session details for security: the time of sign-in, your device or browser type, and your IP address.",
      "Your library: saved hymns and verses, collections, notes, and history of what you identified.",
      "Technical logs: request ids, timing and error information, used to keep the service working. Rate limiting counts requests per IP address.",
    ] },
    { heading: "What stays on your device", paragraphs: [
      "The app and website keep some data locally: your appearance preference, guest history if you are not signed in, downloaded translations and hymnals, recently opened items for offline reading, and your sign-in tokens (in the device keychain on mobile). You can clear these by deleting the app or your browser data, and removing downloads from the Offline screen.",
    ] },
    { heading: "Why we use it", paragraphs: [], bullets: [
      "To identify what you heard and show you the words.",
      "To keep your library and history in step across devices when you are signed in.",
      "To secure accounts and prevent abuse.",
      "To fix problems and improve how well matching works. We look at transcripts and results in aggregate for this.",
    ] },
    { heading: "Who else processes data", paragraphs: ["We use a small number of providers to run the service:"], bullets: [
      "No outside company receives your recordings. Speech recognition runs on our own server using the open-source Whisper model, or on your phone when offline listening is switched on.",
      "Google, if you choose to sign in with Google.",
      "Hosting providers for the API, database and website. Data may be stored or processed outside your country, including in the United States.",
    ] },
    { heading: "How long we keep it", paragraphs: [
      "Account data and your library are kept while your account exists. History is capped at the most recent five hundred entries. Recognition attempts made as a guest are not linked to a person. Technical logs are kept briefly for operations.",
    ] },
    { heading: "Your choices and rights", paragraphs: [], bullets: [
      "Use Scriptune without an account.",
      "Deny microphone access; typing the words still works.",
      "Delete individual saved items, notes, collections and history from your library.",
      "Delete your account in the app or on the web. This permanently removes your account, library and linked sign-in details.",
      "Depending on where you live you may also have rights to access, correct, export or restrict processing of your data. Write to " + LEGAL_CONTACT.email + " and we will respond within a reasonable time.",
    ] },
    { heading: "Children", paragraphs: ["Scriptune is not directed at children under 13 and we do not knowingly collect their personal data. If you believe a child has created an account, contact us and we will remove it."] },
    { heading: "Changes", paragraphs: ["We update the date at the top whenever this policy changes, and tell you in the service about significant changes."] },
    { heading: "Contact", paragraphs: ["Privacy questions or requests: " + LEGAL_CONTACT.email + "."] },
  ],
};

const licenses: LegalDocument = {
  slug: "licenses",
  title: "Licences and attribution",
  summary: "Where the words come from, and the open-source work Scriptune is built on.",
  updatedAt: "2026-09-17",
  sections: [
    { heading: "Scripture", paragraphs: ["Every translation in Scriptune is in the public domain:"], bullets: [
      "King James Version (1769 text): public domain in most of the world; in the United Kingdom it remains under Crown letters patent. American King James Version (1999, Michael Peter Engelbrite): released to the public domain. Both come from the scrollmapper/bible_databases project on GitHub.",
      "American Standard Version (1901): text from scrollmapper/bible_databases.",
      "Douay-Rheims Bible, Challoner Revision (1752): text from scrollmapper/bible_databases.",
      "World English Bible and World English Bible Catholic Edition: text from eBible.org, dedicated to the public domain by its editors.",
    ] },
    { heading: "Hymns", paragraphs: [
      "The words of Sacred Songs and Solos (Ira D. Sankey, 1200-piece edition) are in the public domain. The digitised text used by Scriptune is derived from the techoveride/Sacred_Songs_and_Solos repository on GitHub, whose code is released under the MIT licence. Two modern anthems appended to some editions are not included because their words remain in copyright.",
      "Each hymn page states the rights status of its text. Tell us if you believe a text is wrongly marked as public domain.",
    ] },
    { heading: "Speech recognition", paragraphs: ["Speech-to-text uses OpenAI Whisper, an open-source model released under the MIT licence, run on Scriptune's own server and, for offline listening, on your device."] },
    { heading: "Typefaces", paragraphs: ["DM Serif Display and Geist are used under the SIL Open Font License."] },
    { heading: "Open source", paragraphs: [
      "Scriptune is built with Zudojs, Next.js, React, Expo, React Native, Prisma, PostgreSQL, SQLite, Tailwind CSS and TanStack Query, among other open-source projects. Their licences are included in the source distributions of each package.",
    ] },
  ],
};

function creditLine(credit: Credit): string {
  const rights = rightsLabel(credit.status);
  return `${credit.work} — ${credit.holder}. ${rights}. ${credit.detail}`;
}

const copyright: LegalDocument = {
  slug: "copyright",
  title: "Copyright and credits",
  summary: "Where every text comes from, who holds the rights, and how to ask us to stop using it.",
  updatedAt: "2026-09-17",
  sections: [
    { heading: "How we use these texts", paragraphs: [
      "Scriptune shows scripture and hymn texts so people can find and read them. Some are public domain; others are used with the permission of the organisations that hold their rights. Those organisations keep every right to their work.",
    ] },
    { heading: "Your right to ask us to stop", paragraphs: [TAKEDOWN_POLICY] },
    { heading: "Scripture", paragraphs: ["The Bible translations in Scriptune:"], bullets: CREDITS.scripture.map(creditLine) },
    { heading: "Hymns", paragraphs: ["The hymn collections in Scriptune:"], bullets: CREDITS.hymns.map(creditLine) },
    { heading: "Software and services", paragraphs: ["Scriptune is built on the work of others:"], bullets: CREDITS.software.map(creditLine) },
    { heading: "Contact", paragraphs: [`Rights questions and removal requests: ${LEGAL_CONTACT.email}.`] },
  ],
};

export const LEGAL_DOCUMENTS: Readonly<Record<LegalSlug, LegalDocument>> = { terms, privacy, licenses, copyright };

export function isLegalSlug(value: string): value is LegalSlug {
  return (LEGAL_SLUGS as readonly string[]).includes(value);
}
