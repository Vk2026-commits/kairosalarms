export const PRIVACY_UPDATED = "November 5, 2026";
export const PRIVACY_CONTACT = "inquiry@kairossecurity.com";

export const PRIVACY_SECTIONS: {
  id: string;
  title: string;
  paragraphs: string[];
}[] = [
  {
    id: "scope",
    title: "1. What this policy covers",
    paragraphs: [
      "This policy describes information handled through the Kairos Security Total Home Protection Plan website and its security-options request form. It does not describe alarm-monitoring data, camera footage or recordings, or information handled through separate security services.",
    ],
  },
  {
    id: "information-collected",
    title: "2. Information collected on this website",
    paragraphs: [
      "When you submit the form, we receive your first and last name, mobile phone number, email address, ZIP code, property type, exterior-door count, security interests and contact-permission selection. A submission identifier is used for email retry handling and Meta event deduplication. Lead records also include submission information, and the follow-up team can add status, assignment, follow-up dates and notes.",
      "The site captures campaign information when available: utm_source, utm_medium, utm_campaign, utm_content, utm_term, the Meta click identifier fbclid, and the Meta identifiers fbp and fbc from cookies or the click identifier. This attribution is attached to submitted leads. Browser-side funnel events also record interactions, question selections, attribution and timestamps.",
    ],
  },
  {
    id: "uses-and-contact",
    title: "3. How information is used and how we contact you",
    paragraphs: [
      "Your submitted information is used to receive your request, provide security-options follow-up, send a confirmation email, and organize the team's follow-up work. Campaign attribution and website events help identify how visitors reached the site and moved through the request process.",
      "The form asks for permission to call and text you about security options. Its submission disclosure also covers email and says automated technology may be used, consent is not a condition of purchase, and message and data rates may apply. Contact permission is separate from optional Meta tracking. You can ask to stop outreach by emailing inquiry@kairossecurity.com or calling +18885247678.",
    ],
  },
  {
    id: "sharing-and-providers",
    title: "4. Who receives information",
    paragraphs: [
      "Submitted leads are saved in a Supabase database. Resend processes notification emails and your confirmation email. Notifications containing submitted contact details, property answers and the contact-permission record go to authorized follow-up recipients, including a Kairos Security team contact and a Vektiss contact.",
      "Meta receives the website events described below when optional tracking is enabled. The website also requests stylesheets and font files from Google Fonts; these requests can disclose your IP address and browser/request information to Google.",
      "For troubleshooting, website errors can be forwarded to available Lovable reporting hooks with the error, stack trace and current route. This includes runtime-error reporting in the editor preview when its reporting hook is present.",
    ],
  },
  {
    id: "cookies-and-meta",
    title: "5. Cookies, browser storage and Meta tracking",
    paragraphs: [
      "The site uses session storage to preserve campaign attribution during your browsing session. Local storage remembers your optional Meta tracking choice and recent submission identifiers to avoid duplicate Meta lead events. Administrator sign-in uses a session cookie. Meta can use cookies, including _fbp and _fbc, when its Pixel is enabled.",
      "On the production site, the Meta Pixel sends PageView events and a Lead event after the submission succeeds. The site's explicit event payloads do not include your name, phone, email, ZIP code or other form answers; the Lead event includes a submission identifier. This does not make Meta tracking anonymous: Meta can also receive IP address, browser, cookie and page information through its Pixel.",
    ],
  },
  {
    id: "tracking-choices",
    title: "6. Your optional Meta tracking choice",
    paragraphs: [
      "Use the optional Meta tracking control on this page to turn off future site-controlled Meta events. The choice is saved locally for this browser and device. The site also respects Global Privacy Control (GPC), when your browser provides that signal, by disabling its Meta Pixel.",
      "If the Pixel has already loaded, reload the page after turning off optional tracking so the loaded Pixel is no longer present. This choice does not erase information already sent to Meta, stop necessary delivery of your submitted lead or confirmation email, turn off first-party campaign attribution, or withdraw your permission for phone, text or email follow-up.",
      "Set the choice separately in other browsers or devices. Clearing local storage can remove the saved choice. Your browser's cookie and storage settings provide additional controls, but clearing browser data does not delete saved leads or information already received by providers.",
    ],
  },
  {
    id: "privacy-requests",
    title: "7. Privacy questions and contact requests",
    paragraphs: [
      "Email inquiry@kairossecurity.com or call +18885247678 with privacy questions or requests concerning access, correction, deletion, retention or stopping outreach. Explain your request and provide enough information to identify the submission you are asking about; do not send sensitive documents unless requested.",
      "Your privacy rights depend on where you live and the laws that apply. Contact us with your request or questions about your information; additional information may be needed to identify the relevant inquiry.",
    ],
  },
  {
    id: "storage-and-security",
    title: "8. Storage and security",
    paragraphs: [
      "Lead records and follow-up information are stored in the Supabase database, and notification and confirmation messages are also handled through email systems. Contact us to ask how long your information is retained or to request deletion of a submitted inquiry, including relevant email copies.",
      "Website administration uses authenticated sessions and an HTTP-only session cookie. Supabase and Resend credentials are kept on the server rather than in the browser. These measures do not guarantee absolute security for information transmitted or stored online.",
    ],
  },
];
