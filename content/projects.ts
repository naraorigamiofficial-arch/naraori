import type { StudioProject } from "@/lib/content-types";

/**
 * IN THE STUDIO: long-running design projects, in the artist's own words.
 * Text migrated verbatim from the artist's earlier project notes.
 * Journal entries (content/journal/*.md) can point at a project with `project: <slug>`.
 */
export const projects: StudioProject[] = [
  {
    slug: "vajrabhairava",
    state: "published",
    title: "Vajrabhairava",
    status: "In development",
    startedOn: "2025-10-12",
    tags: ["Mega-project", "Complex", "Colour change"],
    summary: [
      "Vajrabhairava is one of the most complex projects I’ll be working on. It has 34 hands, 9 heads, 16 legs, and a lot of structural details. This design was suggested to me by Kareshi, a fellow member and origami artist from the Origami Dan Discord server.",
      "This is basically the beginning of my mega-projects. I tried folding Vajrabhairava last year, in 2025, using a 112-grid, but I had to compromise on some structural details. This time, I’m going for a design with no compromises, even if it takes many months to complete.",
    ],
    sections: [
      {
        heading: "Concept",
        body: [
          "As I mentioned, this is one of the most complex projects I’ve ever attempted. Not only does it have multiple repetitions, but it also comes with some challenges that I’ll have to figure out, especially the transitions, which I kind of struggle with. I’ll also try to incorporate color changes into the model because, well, why not?",
        ],
      },
      {
        heading: "Design notes",
        body: [
          "The initial idea is pretty simple. Since it has so many hands, I’ll have to find a structure that can effectively accommodate all of them, with something in each hand. I’ll keep the structure of all the hands the same and handle the other details while shaping. However, only 32 of the hands will have the same structure; the remaining two will be holding larger flaps because they need to hold larger objects.",
          "For the legs, I won’t fold them from the corners because I can use the edges for color changes on the objects being held. Also, using the edges would result in very few layers in the legs, which would make the model unable to stand on its own.",
        ],
      },
    ],
    image: null,
  },
  {
    slug: "chhatrapati-shivaji-maharaj-redesign",
    state: "published",
    title: "Chhatrapati Shivaji Maharaj: V1 re-design",
    status: "Active",
    startedOn: "2026-08-25",
    tags: ["Re-design", "Rectangle", "Horse and rider"],
    summary: [
      "Shivaji Maharaj is a design I feel deeply connected to on an emotional level. I’ve grown up hearing and reading stories about him, and those stories have stayed with me ever since. His character, his journey, and everything I’ve learned about him made me want to represent him through something I’ve dedicated so much of myself to.. origami. Creating him in paper feels like more than just designing a model, it’s my way of expressing that connection and bringing a figure who has inspired me since childhood into my art.",
    ],
    sections: [
      {
        heading: "Concept",
        body: [
          "In general, folding a horse and rider from a square is quite challenging, though certainly not impossible. For this model, however, I’m choosing to work with a rectangle because the original version was also folded from one. A 1:2 rectangle gives me more usable space in both the vertical and horizontal directions, which makes it much more suitable for the structure I’m aiming for.",
        ],
      },
      { heading: "Design notes", body: ["I am going to use 1m x 2m paper for it, with a 56 x 112 grid."] },
    ],
    image: {
      src: "/media/turntable/1280/001.webp",
      width: 1280,
      height: 720,
      alt: "The Chhatrapati Shivaji Maharaj re-design in progress: a white origami horse and rider on a dark studio table",
      caption: "Still from the studio turntable video. Scroll the homepage to see it turn.",
    },
  },
  {
    slug: "instinct-vs-honour-redesign",
    state: "published",
    title: "Instinct vs Honour: V1 re-design",
    status: "Idea",
    startedOn: "2026-08-25",
    tags: ["Re-design", "Rectangle", "Signature Series"],
    summary: [
      "I want to redesign IVH because it’s my favorite design from the old Signature Series. It was folded and designed in just two days, which is why it’s a bit imperfect. It’s something I really want to improve because I genuinely love the idea behind it.",
    ],
    sections: [],
    image: null,
  },
];

export const publishedProjects = () => projects.filter((p) => p.state === "published");
export const getProject = (slug: string) => publishedProjects().find((p) => p.slug === slug);
