# Cary Reyes, portfolio

A static, single-page portfolio with case-study pages. Plain HTML, CSS and JavaScript, with no framework and no build step. Motion comes from GSAP (with ScrollTrigger and SplitText) and Lenis, loaded free from the jsDelivr CDN.

```
index.html                 Home page (all sections)
work/*.html                One page per case study
css/style.css              All styles (colours and type sizes are tokens at the top)
js/main.js                 Motion and interaction (SETTINGS block at the top)
assets/images/             Photos, favicon, social preview image
assets/cv/                 Your CV (PDF)
sequence/                  Optional scroll-scrubbed hero frames
404.html                   "Page not found" page
_headers                   Caching headers (Netlify and Cloudflare Pages)
.nojekyll                  Tells GitHub Pages to serve the files as they are
```


## 1. Before you publish: replace the placeholders

Search the project for these and swap them for the real thing:

| Find | Where | Replace with |
| --- | --- | --- |
| `your.email@example.com` | `index.html` and every file in `work/` | Your email address (it appears twice per file: the link and the visible text) |
| `assets/cv/cary-reyes-cv.pdf` | the file itself | Your CV, saved under the same name |
| `Year` | Selected Work cards and case pages | The real years |
| `2024` (Breakthrough Global) | card and case page | Check this is the right year |
| `Client 03` to `Client 06` | Clients & Brands marquee | Real client names or logos |
| `CRM / Email case study` | cards 3 and 4, and `work/crm-email-case-study-01.html`, `-02.html` | Your CRM case studies |
| Text in `[square brackets]` | case pages | Your own copy (these paragraphs are styled grey so you can spot them) |
| Stats (`+30%`, `FTSE 100`, `5+`) | top of `index.html` | Your numbers |
| All images in `assets/images/` | everywhere | Your photography (see section 3) |


## 2. Editing content

All content lives in the HTML. Every editable block starts with a comment that begins `EDIT:`, so you can search for that word. You don't need to touch `js/main.js` to change words, images or case studies.

- **Headlines.** `<em>` sets the italic word, for example `Selected <em>work</em>`.
- **Hero headline.** Each line is its own `<span class="hero__line">`. Keep the second line to one short word: it sits beside the image on desktop.
- **Stats.** `data-countup` makes a number count up from zero. Remove it to keep the text static.
- **Add a case study.**
  1. Duplicate a file in `work/`, rename it, and edit its text.
  2. In `index.html`, copy a `<li class="work__item">` in Selected Work and point its `href` at the new file.
  3. Update the "Case study 0X / 0Y" labels and the "Next case study" link at the bottom of each case page.
- **Add an article.** Copy an `<li>` in the Writing list (there's a commented template).
- **Use logos in the marquee.** Replace a name with `<li class="marquee__item"><img class="marquee__logo" src="assets/images/logos/brand.svg" alt="Brand"></li>`.
- **Pull quote.** One per page, inside `<figure class="pullquote">`. To credit someone, add `<figcaption class="label">Name, Role</figcaption>` after the `</blockquote>`.

### Motion settings

At the top of `js/main.js`:

```js
const SETTINGS = {
  lenisLerp: 0.08,       // smooth-scroll feel (lower = smoother)
  heroPinLength: 1.5,    // how long the hero stays pinned, in screen heights
  parallaxSpeed: 0.85,   // image parallax (1 = no parallax)
  heroSequence: { enabled: false, ... },
};
```

**Hero image sequence (optional).** For a scroll-scrubbed hero like a video, see `sequence/README.txt`. In short: export frames as `sequence/001.webp`, `002.webp` and so on, then set `enabled: true` and `frameCount`.

**Hero video instead of a photo.** In `index.html`, replace the hero `<img>` with:

```html
<video src="assets/video/hero.mp4" autoplay muted loop playsinline poster="assets/images/hero.webp"></video>
```


## 3. Images

The images included are quiet placeholder "light studies", there so you can see the layout with photography in place. Replace them with your own and update each `alt` text to describe the new image.

Keep the same file names and you won't need to edit the HTML. Each image has a full-size file and a smaller one (`-600`, `-800` or `-1200`). Phones load the small one, so keep both.

| File | Shape | Full / small width |
| --- | --- | --- |
| `hero.webp`, `hero-1200.webp` | 16:10 landscape | 2400 / 1200 |
| `portrait.webp`, `portrait-600.webp` | 3:4 portrait | 1200 / 600 |
| `work-breakthrough-global`, `work-crm-02` (+ `-800`) | 4:3 landscape | 1600 / 800 |
| `work-ooodles`, `work-crm-01` (+ `-600`) | 4:5 portrait | 1200 / 600 |
| `gallery-01`, `gallery-04` (+ `-1200`) | 16:9 wide | 2400 / 1200 |
| `gallery-02`, `-03`, `-05`, `-06` (+ `-600`) | 4:5 portrait | 1200 / 600 |
| `og-image.jpg` | social share preview | 1200 x 630 |

Convert photos to WebP for free at [squoosh.app](https://squoosh.app): resize, choose WebP, quality around 75, then download. AVIF works too if you change the file extensions in the HTML.

If you only have one size of an image, delete that image's `srcset` attribute and point `src` at your file.


## 4. Preview on your computer

Some browsers block parts of a site opened straight from the file system, so run a tiny local server from the project folder:

```bash
python3 -m http.server 8000
```

Then open http://localhost:8000. Alternatively, use the "Live Server" extension in VS Code.


## 5. Deploy for free

### Option A: Netlify (easiest)

1. Go to [app.netlify.com/drop](https://app.netlify.com/drop) and sign up (free).
2. Drag the whole project folder onto the page.
3. You get a live address like `random-name.netlify.app`. Rename it under **Site configuration > Change site name**.

To publish updates, drag the folder in again. Or connect a GitHub repository (**Add new site > Import an existing project**) so every change you push goes live automatically. Leave the build command empty and set the publish directory to `/`.

### Option B: GitHub Pages

1. Create a free account at [github.com](https://github.com) and a new **public** repository, for example `portfolio`.
2. Upload the project: **Add file > Upload files**, then drag in everything inside this folder, including `.nojekyll`. Click **Commit changes**.
3. Go to **Settings > Pages**. Under **Build and deployment**, choose **Deploy from a branch**, pick `main` and `/ (root)`, then click **Save**.
4. After a minute or two the site is live at `https://your-username.github.io/portfolio/`.

All links in the site are relative, so it works in a sub-folder like this.

### Option C: Cloudflare Pages

1. In the Cloudflare dashboard, go to **Workers & Pages > Create > Pages**.
2. Either connect your GitHub repository or choose **Upload assets** and drag in the folder.
3. Framework preset: **None**. Build command: empty. Output directory: `/`.


## 6. Connect a custom domain later

First buy a domain from any registrar (Cloudflare Registrar, Namecheap, Porkbun and so on). Then:

**Netlify**
1. Go to **Domain management > Add a domain** and enter your domain.
2. Either let Netlify manage your DNS (it gives you name servers to paste into your registrar), or add these records at your registrar:
   - `A` record for `@` pointing to `75.2.60.5`
   - `CNAME` record for `www` pointing to `your-site.netlify.app`
3. HTTPS is switched on automatically once DNS has updated.

**GitHub Pages**
1. Go to **Settings > Pages > Custom domain**, enter your domain and save. This adds a `CNAME` file to the repository.
2. At your registrar, add `A` records for `@` pointing to `185.199.108.153`, `185.199.109.153`, `185.199.110.153` and `185.199.111.153`. Add a `CNAME` record for `www` pointing to `your-username.github.io`.
3. Once the check passes, tick **Enforce HTTPS**.

**Cloudflare Pages**
1. Open your project and go to **Custom domains > Set up a custom domain**.
2. Follow the prompts. If the domain already uses Cloudflare DNS, the records are added for you.

DNS changes can take anywhere from a few minutes to 24 hours to take effect.

**Once you have a domain,** change the social preview image to a full URL, so LinkedIn and others can find it. In `index.html` (and the case pages):

```html
<meta property="og:image" content="https://yourdomain.com/assets/images/og-image.jpg">
```

It's also worth adding `<link rel="canonical" href="https://yourdomain.com/">` in the `<head>`.


## 7. Accessibility and performance notes

- **Reduced motion.** If a visitor has "reduce motion" turned on, smooth scrolling, pinning and parallax are switched off and the marquee stops; content fades in simply. The work section becomes a grid.
- **Mobile.** On screens under 900px wide the work section stacks vertically. The custom cursor only appears on devices with a mouse.
- **Keyboard.** Every link has a visible focus ring, and tabbing through the work cards scrolls each one into view. The marquee has a Pause button.
- **If the CDN is unavailable,** the site still renders and works, just without motion.
- **Lighthouse.** In testing, the home page scored 100 for performance, accessibility, best practices and SEO on desktop, and 92 for performance (100 for the rest) on mobile.
- **Image sizes.** Keep new images light: under about 300KB for the hero and under about 150KB for the others.


## Credits

- [GSAP](https://gsap.com) (including ScrollTrigger and SplitText): free to use under the GSAP standard licence.
- [Lenis](https://github.com/darkroomengineering/lenis): MIT licence.
- Fonts from Google Fonts under the SIL Open Font Licence: Instrument Serif, Inter and JetBrains Mono.
