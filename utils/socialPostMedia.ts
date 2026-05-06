export const getPostImageSource = (post: { image?: string | null; imageUrl?: string | null }) =>
  post.image || post.imageUrl || null;
