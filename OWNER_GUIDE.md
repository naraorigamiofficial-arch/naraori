# Managing your website

A plain-English guide. Everything here can be done from a web browser.

**Two places you will use:**

- **GitHub** (github.com, your `naraori` repository) for words and pictures: artworks, projects, lessons, journal entries. Open a file, click the pencil icon, edit, then *Commit changes*. The site updates by itself in about two minutes.
- **The studio dashboard** (naraori.in/studio) for business: order requests, enquiries, prices, minimum quantities, availability.

---

## Order requests

1. A customer fills in the order sheet. You get an email ("New order request NO-2611-XXXXX"), and they get a confirmation that says nothing is charged yet.
2. Reply **from your email** (just press Reply on the studio email: it goes to the customer) with availability, the final total including shipping, and how to pay.
3. In `/studio`, open the request and set the status as things progress:
   *Requested → Being reviewed → Waiting for the customer → Accepted → Awaiting payment → Paid → Being prepared → Shipped → Completed* (or *Cancelled*).
   Changing a status does **not** email the customer; it is your record. Add internal notes for yourself.
4. *Export CSV* downloads every request for your accounts.

If an email failed to send, `/studio` shows a yellow box. The request itself is safe. Press **Retry**, or simply write to the customer.

## Prices, minimums and availability

`/studio` → **Catalogue & prices**. For each size you can change the price (₹), the minimum and maximum quantity, and availability (*Made to order*, *In stock*, *By enquiry*, *Unavailable*). Press **Save** on that row. The shop updates within about five minutes. Requests already made keep their original price.

**Hide** removes a whole size from the shop.

To add a brand-new size or change product descriptions, edit `content/catalogue.ts` on GitHub (copy an existing line and change the numbers), or ask a developer.

## Add a new artwork

1. Upload the photograph to `public/media/artworks/` on GitHub (*Add file → Upload files*). Use a name like `chhatrapati-shivaji-maharaj.webp`. A cut-out photo on a transparent background looks best on the dark mounts.
2. Open `content/artworks.ts`. Copy one whole entry (from `{` to `},`) and paste it below.
3. Change: `slug` (the web address, lowercase-with-dashes), `title`, `alternateTitle`, `catalogueNo`, `year`, `intro`, the `image` (file name, the image's width and height in pixels, and a sentence describing it for blind visitors), and the `technical` facts.
4. Anything you don't know yet: write `null`. The page will say "Not yet documented".
5. `field` is the colour of the dark mount behind the sculpture. Pick a dark colour that suits the paper.
6. Keep `state: "draft"` while you work on it; change to `"published"` when it's ready.

Three drafts are already waiting for photos and details: the beetle study, Chhatrapati Shivaji Maharaj (V1) and Maharana Pratap.

## Write the story of a work ("Unfold the story")

In the artwork's `story` list, each layer has a `key`, a `title` and `body` paragraphs. The order on the page is always: `sculpture` (the finished work), `concept`, `prototypes`, `structure`, `materials`. Add only the layers you have something to say about.

## Add a lesson (Learn) or a journal entry

1. In `content/learn/` (or `content/journal/`) click *Add file → Create new file*, named like `understanding-box-pleating.md`.
2. Start it with the header block, copying an existing file. The important lines: `title`, `description` (one or two sentences for Google), `section`, `published` date, and `state: "draft"` or `"published"`.
3. Write below it. `## A heading` makes a section (and an entry in the contents list). `**bold**`, `*italic*`, `> a quote` work. Pictures: `![What the picture shows](/media/process/your-photo.jpg "Caption")`.
4. A journal entry can belong to a studio project: add `project: vajrabhairava`.

## Studio projects (work in progress)

`content/projects.ts`. Change the `status` (*Idea, In development, Active, Paused, Completed*), add sections, or a new project. When a project is finished, add it to the artworks as well.

## Your name, links and email

`content/identity.ts`. Add your Instagram, YouTube and other **official** profiles in `profiles`, and the SIOA website in `sioa.url`. These also tell Google that these profiles are you.

## Things to avoid

- Don't put passwords or keys into any file on GitHub. They live only in Vercel's settings.
- Don't publish facts you're not sure of; leave them `null`.
- Avoid deleting an artwork page that Google already knows; set it to draft instead, or ask for a redirect.
