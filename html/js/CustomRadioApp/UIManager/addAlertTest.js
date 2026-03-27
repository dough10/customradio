import post_options from "../utils/post_options";

export default async function addAlretTest(id, title, paragraphs) {
  const res = await fetch('/addAlert', post_options({ id, title, paragraphs }));
  if (!res.ok) console.error('post failed');
}