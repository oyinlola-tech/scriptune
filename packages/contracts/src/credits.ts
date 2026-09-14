/**
 * Attribution for every body of text Scriptune serves, and the takedown
 * promise. Shared so the web page and the app screen credit each rights
 * holder identically. Copyrighted works appear here only with permission,
 * and their owners can ask us to stop using them at any time.
 */
import { LEGAL_CONTACT } from "./contact";

export type RightsStatus = "public-domain" | "used-by-permission";

export interface Credit {
  /** The work as people know it. */
  work: string;
  /** Who holds the rights or produced the text. */
  holder: string;
  status: RightsStatus;
  /** One line on the source or the terms. */
  detail: string;
  /** A link to the source or the rights holder, when there is one. */
  url?: string;
}

/** Scripture and hymn texts, grouped for the copyright page. */
export const CREDITS: { scripture: Credit[]; hymns: Credit[]; software: Credit[] } = {
  scripture: [
    { work: "King James Version (1769)", holder: "Public domain", status: "public-domain", detail: "Public domain worldwide except the United Kingdom, where it is under Crown letters patent. Text from scrollmapper/bible_databases.", url: "https://github.com/scrollmapper/bible_databases" },
    { work: "American King James Version", holder: "Michael Peter Engelbrite", status: "public-domain", detail: "Released into the public domain by its author (1999)." },
    { work: "American Standard Version (1901)", holder: "Public domain", status: "public-domain", detail: "Text from scrollmapper/bible_databases." },
    { work: "Douay-Rheims (Challoner Revision)", holder: "Public domain", status: "public-domain", detail: "1752 revision, public domain. Text from scrollmapper/bible_databases." },
    { work: "World English Bible and Catholic Edition", holder: "eBible.org", status: "public-domain", detail: "Dedicated to the public domain by its editors.", url: "https://ebible.org" },
  ],
  hymns: [
    { work: "Sacred Songs and Solos", holder: "Ira D. Sankey", status: "public-domain", detail: "The 1200-piece edition is public domain. Digitised text from techoveride/Sacred_Songs_and_Solos.", url: "https://github.com/techoveride/Sacred_Songs_and_Solos" },
    { work: "Celestial Church of Christ Hymnal", holder: "Celestial Church of Christ", status: "used-by-permission", detail: "Used with the permission of the Celestial Church of Christ, which retains all rights to these hymns." },
    { work: "Christ Apostolic Church Hymnal", holder: "Christ Apostolic Church", status: "used-by-permission", detail: "Used with the permission of the Christ Apostolic Church, which retains all rights to these hymns." },
  ],
  software: [
    { work: "Speech recognition", holder: "Deepgram", status: "used-by-permission", detail: "Converts recorded audio to text on Scriptune's behalf.", url: "https://deepgram.com" },
    { work: "Typefaces", holder: "DM Serif Display and Geist", status: "public-domain", detail: "Used under the SIL Open Font License." },
  ],
};

/** The removal promise every credited organisation can rely on. */
export const TAKEDOWN_POLICY = `If your organisation holds rights to a text used in Scriptune and you would like it credited differently or removed, write to ${LEGAL_CONTACT.email}. We will remove it promptly on request, no reason needed.`;
